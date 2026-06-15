"""
Story arc detection: groups semantically related scenes into narrative threads
even when those scenes are spread across the full movie timeline.

Example: "wife suspects affair" thread might span scenes at min 8, 22, 45, 67 —
this module groups them and identifies setup / development / resolution phases
so we can cut a complete 1-minute arc reel.
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from .data_models import Character, Scene
from .utils.logging_setup import logger


@dataclass
class ArcPhases:
    setup: list[int]        # scene_ids (earliest ~20% of thread timeline)
    development: list[int]  # middle ~60%
    resolution: list[int]   # final ~20%


@dataclass
class NarrativeThread:
    thread_id: str
    topic: str              # LLM-generated label e.g. "wife discovers affair"
    scene_ids: list[int]    # in chronological order
    arc_phases: ArcPhases
    coherence_score: float  # mean intra-cluster cosine similarity
    time_span_minutes: float


def _build_scene_text(scene: Scene, char_names: dict[str, str]) -> str:
    """Combine scene caption + dialogue + character names into one searchable string."""
    parts = []
    if scene.caption:
        parts.append(scene.caption)
    chars = [char_names.get(cid, cid) for cid in scene.character_ids]
    if chars:
        parts.append("Characters: " + ", ".join(chars))
    dialogue_sample = " ".join(d.text for d in scene.dialogue[:6])[:300]
    if dialogue_sample:
        parts.append(dialogue_sample)
    if scene.dominant_emotion:
        parts.append(f"Mood: {scene.dominant_emotion}")
    return " ".join(parts) or f"Scene {scene.scene_id}"


def embed_scenes(scenes: list[Scene], char_names: dict[str, str]) -> np.ndarray:
    """
    Produce one 384-dim sentence embedding per scene using all-MiniLM-L6-v2.
    Model is ~90MB and downloads automatically on first use.
    """
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        raise ImportError("Install sentence-transformers: pip install sentence-transformers")

    logger.info("Loading sentence-transformers (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    texts = [_build_scene_text(s, char_names) for s in scenes]
    logger.info(f"Embedding {len(texts)} scenes...")
    embeddings = model.encode(texts, batch_size=64, show_progress_bar=True, normalize_embeddings=True)
    return embeddings  # shape: (n_scenes, 384)


def cluster_into_narrative_threads(
    scenes: list[Scene],
    embeddings: np.ndarray,
    distance_threshold: float = 0.45,
    min_thread_scenes: int = 3,
) -> list[NarrativeThread]:
    """
    Agglomerative clustering on scene embeddings to group semantically related scenes.
    Unlike contiguous sliding windows, this finds scenes that belong to the SAME STORY
    even if separated by hours of unrelated content.
    """
    from sklearn.cluster import AgglomerativeClustering
    from sklearn.metrics.pairwise import cosine_similarity

    if len(scenes) < min_thread_scenes:
        return []

    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=distance_threshold,
        metric="cosine",
        linkage="average",
    )
    labels = clustering.fit_predict(embeddings)

    scene_by_id: dict[int, Scene] = {s.scene_id: s for s in scenes}
    unique_labels = set(labels)
    threads: list[NarrativeThread] = []

    for label in unique_labels:
        indices = [i for i, l in enumerate(labels) if l == label]
        if len(indices) < min_thread_scenes:
            continue

        thread_scenes = [scenes[i] for i in indices]
        thread_scenes.sort(key=lambda s: s.start_time)
        thread_embs = embeddings[indices]

        # Intra-cluster coherence: mean pairwise cosine similarity
        sim_matrix = cosine_similarity(thread_embs)
        n = len(thread_embs)
        coherence = float((sim_matrix.sum() - n) / max(n * (n - 1), 1))

        time_span = (thread_scenes[-1].end_time - thread_scenes[0].start_time) / 60.0
        arc_phases = _detect_arc_phases(thread_scenes)

        threads.append(NarrativeThread(
            thread_id=f"thread_{label:03d}",
            topic="",  # filled by LLM labelling pass
            scene_ids=[s.scene_id for s in thread_scenes],
            arc_phases=arc_phases,
            coherence_score=round(coherence, 4),
            time_span_minutes=round(time_span, 1),
        ))

    # Sort: most coherent + longest-spanning threads first (best arc candidates)
    threads.sort(key=lambda t: -(t.coherence_score * math.log1p(t.time_span_minutes)))
    logger.info(
        f"Found {len(threads)} narrative threads "
        f"(from {len(unique_labels)} clusters, {len(scenes)} scenes)"
    )
    return threads


def _detect_arc_phases(thread_scenes: list[Scene]) -> ArcPhases:
    """
    Divide the chronological thread into setup / development / resolution.
    Uses 20% / 60% / 20% split by scene count with minimum 1 scene per phase.
    """
    n = len(thread_scenes)
    if n <= 3:
        return ArcPhases(
            setup=[thread_scenes[0].scene_id],
            development=[s.scene_id for s in thread_scenes[1:-1]],
            resolution=[thread_scenes[-1].scene_id],
        )

    setup_end = max(1, int(n * 0.20))
    resolution_start = min(n - 1, int(n * 0.80))

    return ArcPhases(
        setup=[s.scene_id for s in thread_scenes[:setup_end]],
        development=[s.scene_id for s in thread_scenes[setup_end:resolution_start]],
        resolution=[s.scene_id for s in thread_scenes[resolution_start:]],
    )


def label_threads(
    threads: list[NarrativeThread],
    scenes: list[Scene],
    char_names: dict[str, str],
    local_llm,
) -> list[NarrativeThread]:
    """Use local LLM to generate a short topic label for each thread."""
    if local_llm is None or not threads:
        for i, t in enumerate(threads):
            t.topic = f"Story thread {i + 1}"
        return threads

    scene_by_id: dict[int, Scene] = {s.scene_id: s for s in scenes}
    system = (
        "You label narrative threads in movies with concise 4-8 word descriptions. "
        "Examples: 'wife discovers husband's affair', 'heist planning goes wrong', "
        "'mentor trains reluctant hero'. Return only the label, no punctuation."
    )

    for thread in threads[:20]:  # cap at 20 to avoid excessive LLM calls
        thread_scenes = [scene_by_id[sid] for sid in thread.scene_ids if sid in scene_by_id]
        captions = [s.caption or "" for s in thread_scenes[:5]]
        chars = list({
            char_names.get(cid, cid)
            for s in thread_scenes for cid in s.character_ids
        })
        dialogue_samples = [
            d.text for s in thread_scenes[:3] for d in s.dialogue[:2]
        ][:8]

        user = (
            f"Movie thread spanning {thread.time_span_minutes:.0f} minutes, "
            f"{len(thread.scene_ids)} scenes.\n"
            f"Characters: {', '.join(chars[:5]) or 'unknown'}\n"
            f"Scene descriptions: {' | '.join(c for c in captions if c)}\n"
            f"Sample dialogue: {' | '.join(dialogue_samples)}\n\n"
            f"Label this narrative thread in 4-8 words:"
        )
        try:
            thread.topic = local_llm.generate(system, user, max_tokens=20).strip().strip('"\'')
        except Exception as e:
            logger.debug(f"Thread labelling failed: {e}")
            thread.topic = f"Story thread {thread.thread_id}"

    return threads


def select_arc_scenes_for_reel(
    thread: NarrativeThread,
    scenes: list[Scene],
    target_duration: float = 60.0,
) -> list[Scene]:
    """
    Pick representative scenes from each arc phase to fill ~target_duration seconds.
    Prioritises the resolution (payoff) and picks the highest-scoring scene from
    setup and development to establish context.

    Budget allocation:
      setup:       15% of target  → 1-2 scenes
      development: 25% of target  → 1-2 scenes
      resolution:  60% of target  → 2-3 scenes (the payoff gets the most screen time)
    """
    scene_by_id: dict[int, Scene] = {s.scene_id: s for s in scenes}
    budgets = {
        "setup": target_duration * 0.15,
        "development": target_duration * 0.25,
        "resolution": target_duration * 0.60,
    }

    selected: list[Scene] = []

    for phase_name, phase_ids in [
        ("setup", thread.arc_phases.setup),
        ("development", thread.arc_phases.development),
        ("resolution", thread.arc_phases.resolution),
    ]:
        phase_scenes = [scene_by_id[sid] for sid in phase_ids if sid in scene_by_id]
        if not phase_scenes:
            continue

        # Sort by reel score descending, pick until budget is filled
        phase_scenes.sort(key=lambda s: -(s.reel_score or 0.0))
        budget = budgets[phase_name]
        accumulated = 0.0

        for scene in phase_scenes:
            clip_duration = min(scene.duration, budget - accumulated)
            if clip_duration < 3.0:  # don't add scenes shorter than 3s
                break
            selected.append(scene)
            accumulated += scene.duration
            if accumulated >= budget:
                break

    # Re-sort chronologically so the reel tells the story in order
    selected.sort(key=lambda s: s.start_time)
    total_dur = sum(s.duration for s in selected)
    logger.info(
        f"Arc reel for '{thread.topic}': {len(selected)} scenes, "
        f"{total_dur:.0f}s total (target {target_duration:.0f}s)"
    )
    return selected


def find_best_arc_threads(
    scenes: list[Scene],
    characters: list[Character],
    local_llm,
    target_duration: float = 60.0,
    max_threads: int = 10,
    distance_threshold: float = 0.45,
) -> list[tuple[NarrativeThread, list[Scene]]]:
    """
    Full pipeline: embed → cluster → label → select arc scenes.
    Returns list of (thread, selected_scenes) pairs sorted by quality.
    """
    char_names: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}

    embeddings = embed_scenes(scenes, char_names)
    threads = cluster_into_narrative_threads(
        scenes, embeddings,
        distance_threshold=distance_threshold,
    )

    if not threads:
        logger.warning("No narrative threads found — try lowering distance_threshold")
        return []

    threads = label_threads(threads, scenes, char_names, local_llm)

    results: list[tuple[NarrativeThread, list[Scene]]] = []
    for thread in threads[:max_threads]:
        arc_scenes = select_arc_scenes_for_reel(thread, scenes, target_duration)
        if arc_scenes:
            results.append((thread, arc_scenes))

    return results
