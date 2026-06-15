from __future__ import annotations
import math
import numpy as np

from .config import Config
from .data_models import Character, ReelSegment, Scene
from .emotion_analyzer import compute_emotion_peaks
from .utils.logging_setup import logger


def _duration_score(duration: float, ideal: float = 60.0, sigma: float = 25.0) -> float:
    """Bell curve centered at ideal duration (seconds)."""
    return float(math.exp(-((duration - ideal) ** 2) / (2 * sigma ** 2)))


def compute_composite_reel_score(scene: Scene, emotion_peak: float) -> float:
    """Weighted combination of local signals."""
    energy = scene.audio_energy or 0.0
    dialogue_density = min((scene.speech_rate or 0.0) / 3.0, 1.0)
    dur_score = _duration_score(scene.duration)

    score = (
        0.35 * emotion_peak
        + 0.30 * energy
        + 0.20 * dialogue_density
        + 0.15 * dur_score
    )
    return float(np.clip(score, 0.0, 1.0))


def score_all_scenes(
    scenes: list[Scene],
    characters: list[Character],
    local_llm,
    config: Config,
) -> list[Scene]:
    """Score all scenes for reel potential."""
    emotion_peaks = compute_emotion_peaks(scenes)

    for scene, ep in zip(scenes, emotion_peaks):
        scene.reel_score = compute_composite_reel_score(scene, ep)

    # Use local LLM to re-rank top candidates and assign categories
    top_n = 30
    indexed = sorted(enumerate(scenes), key=lambda x: -(x[1].reel_score or 0.0))[:top_n]

    if local_llm is not None:
        _llm_rank_top_candidates(scenes, indexed, characters, local_llm)
    else:
        # Assign categories based on dominant emotion without LLM
        for _, scene in indexed:
            scene.reel_score_reason = _emotion_to_category(scene.dominant_emotion)

    return scenes


def _emotion_to_category(emotion: str | None) -> str:
    mapping = {
        "joy": "funny",
        "anger": "dramatic",
        "fear": "tense",
        "sadness": "emotional",
        "surprise": "reveal",
        "disgust": "dramatic",
        "neutral": "other",
    }
    return mapping.get(emotion or "neutral", "other")


def _llm_rank_top_candidates(
    scenes: list[Scene],
    indexed_top: list[tuple[int, Scene]],
    characters: list[Character],
    local_llm,
) -> None:
    """Ask local LLM to assign category + reason to top scenes."""
    char_by_id: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}

    scene_lines = []
    for _, scene in indexed_top:
        char_names = ", ".join(char_by_id.get(cid, cid) for cid in scene.character_ids) or "unknown"
        dialogue_preview = " ".join(d.text for d in scene.dialogue[:3])[:120]
        caption = (scene.caption or "")[:80]
        scene_lines.append(
            f"scene_id={scene.scene_id} [{scene.duration:.0f}s] "
            f"mood={scene.dominant_emotion or 'neutral'} "
            f"energy={scene.audio_energy or 0:.2f} "
            f"chars=[{char_names}] "
            f"caption=\"{caption}\" "
            f"dialogue=\"{dialogue_preview}\""
        )

    system = (
        "You are a viral video editor. Classify each movie scene for short-form reel potential. "
        "Return only valid JSON, no other text."
    )
    schema = '[{"scene_id": int, "category": "funny|dramatic|tense|emotional|action|romance|reveal|other", "reason": "one sentence"}]'
    user = (
        f"Classify these {len(indexed_top)} movie scenes:\n\n"
        + "\n".join(scene_lines)
        + f"\n\nReturn JSON array with {len(indexed_top)} objects."
    )

    try:
        result = local_llm.generate_json(system, user, schema_hint=schema)
        if isinstance(result, list):
            lookup = {item.get("scene_id"): item for item in result if isinstance(item, dict)}
            for _, scene in indexed_top:
                item = lookup.get(scene.scene_id)
                if item:
                    scene.reel_score_reason = (
                        f"[{item.get('category', 'other')}] {item.get('reason', '')}"
                    )
    except Exception as e:
        logger.warning(f"LLM reel ranking failed: {e}, using heuristic categories")
        for _, scene in indexed_top:
            scene.reel_score_reason = _emotion_to_category(scene.dominant_emotion)


def find_reel_segments(scenes: list[Scene], config: Config) -> list[ReelSegment]:
    """
    Build reel segments from contiguous scene groups targeting 30–90s duration.
    Uses a sliding window over sorted-by-score scenes.
    """
    min_dur = config.REEL_MIN_DURATION
    max_dur = config.REEL_MAX_DURATION

    segments: list[ReelSegment] = []
    n = len(scenes)

    for i in range(n):
        # Try extending a window from scene i
        window: list[Scene] = []
        total_dur = 0.0

        for j in range(i, n):
            if scenes[j].scene_id != (scenes[j - 1].scene_id + 1) and j > i:
                # Non-contiguous scene gap — break the window
                break
            window.append(scenes[j])
            total_dur += scenes[j].duration

            if min_dur <= total_dur <= max_dur:
                mean_score = float(np.mean([s.reel_score or 0.0 for s in window]))
                # Category from the highest-scoring scene in the window
                best = max(window, key=lambda s: s.reel_score or 0.0)
                reason_text = best.reel_score_reason or ""
                category = reason_text.split("]")[0].lstrip("[") if "[" in reason_text else "other"

                segments.append(ReelSegment(
                    segment_id=f"reel_{i:03d}_{j:03d}",
                    scene_ids=[s.scene_id for s in window],
                    start_time=window[0].start_time,
                    end_time=window[-1].end_time,
                    duration=total_dur,
                    score=mean_score,
                    category=category,
                    reason=reason_text,
                ))

            if total_dur > max_dur:
                break

    if not segments:
        logger.warning("No reel segments found — falling back to top scenes as individual reels")
        for scene in sorted(scenes, key=lambda s: -(s.reel_score or 0.0))[:config.TOP_REELS_COUNT]:
            segments.append(ReelSegment(
                segment_id=f"reel_single_{scene.scene_id:04d}",
                scene_ids=[scene.scene_id],
                start_time=scene.start_time,
                end_time=scene.end_time,
                duration=scene.duration,
                score=scene.reel_score or 0.0,
                category=_emotion_to_category(scene.dominant_emotion),
                reason=scene.reel_score_reason or "",
            ))

    # Deduplicate: remove overlapping segments (prefer higher score)
    segments.sort(key=lambda s: -s.score)
    kept: list[ReelSegment] = []
    used_scenes: set[int] = set()
    for seg in segments:
        if not any(sid in used_scenes for sid in seg.scene_ids):
            kept.append(seg)
            used_scenes.update(seg.scene_ids)
        if len(kept) >= config.TOP_REELS_COUNT:
            break

    logger.info(f"Selected {len(kept)} reel segments")
    return kept
