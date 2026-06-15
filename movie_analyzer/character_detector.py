from __future__ import annotations
import json
import re
import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np

from .config import Config
from .data_models import Character, DialogueLine, FaceEmbedding, Scene
from .utils.logging_setup import logger


def extract_face_embeddings(scenes: list[Scene], config: Config) -> list[FaceEmbedding]:
    """Extract DeepFace Facenet512 embeddings from scene keyframes."""
    try:
        from deepface import DeepFace
    except ImportError:
        raise ImportError("Install deepface: pip install deepface")

    embeddings: list[FaceEmbedding] = []

    def _process_scene(scene: Scene) -> list[FaceEmbedding]:
        scene_embs = []
        frames = scene.keyframe_paths[: config.FRAMES_PER_SCENE_FOR_FACES]
        for frame_path in frames:
            if not Path(frame_path).exists():
                continue
            try:
                results = DeepFace.represent(
                    img_path=frame_path,
                    model_name=config.FACE_MODEL,
                    enforce_detection=False,
                    detector_backend="opencv",
                )
                for res in results:
                    region = res.get("facial_area", {})
                    w = region.get("w", 0)
                    h = region.get("h", 0)
                    if w < config.MIN_FACE_SIZE or h < config.MIN_FACE_SIZE:
                        continue
                    scene_embs.append(FaceEmbedding(
                        character_id="",
                        embedding=res["embedding"],
                        source_frame=frame_path,
                        bbox=(region.get("x", 0), region.get("y", 0), w, h),
                        timestamp=scene.start_time + scene.duration / 2,
                    ))
            except Exception as e:
                logger.debug(f"Face extraction failed on {frame_path}: {e}")
        return scene_embs

    logger.info(f"Extracting face embeddings from {len(scenes)} scenes...")
    with ThreadPoolExecutor(max_workers=config.IO_WORKERS // 2) as pool:
        for result in pool.map(_process_scene, scenes):
            embeddings.extend(result)

    logger.info(f"Found {len(embeddings)} face detections")
    return embeddings


def cluster_faces_into_characters(
    embeddings: list[FaceEmbedding],
    config: Config,
) -> list[Character]:
    """DBSCAN clustering on face embeddings to identify unique characters."""
    if not embeddings:
        logger.warning("No face embeddings to cluster")
        return []

    from sklearn.cluster import DBSCAN
    from sklearn.preprocessing import normalize

    matrix = np.array([e.embedding for e in embeddings], dtype=np.float32)
    matrix = normalize(matrix, norm="l2")

    db = DBSCAN(
        eps=config.FACE_DISTANCE_THRESHOLD,
        min_samples=3,
        metric="cosine",
        n_jobs=-1,
    ).fit(matrix)

    labels = db.labels_
    unique_labels = set(labels) - {-1}
    logger.info(f"Clustered into {len(unique_labels)} characters ({np.sum(labels == -1)} noise faces)")

    characters: list[Character] = []
    for label in sorted(unique_labels):
        char_id = f"char_{label + 1:03d}"
        char_indices = [i for i, l in enumerate(labels) if l == label]
        char_embs = [embeddings[i] for i in char_indices]

        # Update character_id on embeddings
        for emb in char_embs:
            emb.character_id = char_id

        # Pick best representative face (largest bbox area)
        best_emb = max(char_embs, key=lambda e: e.bbox[2] * e.bbox[3])

        characters.append(Character(
            character_id=char_id,
            name=None,
            face_embeddings=char_embs,
            representative_face_path=best_emb.source_frame,
            total_screen_time=0.0,
            scenes_appeared=[],
            dialogue_lines=[],
        ))

    return characters


def infer_character_names(
    characters: list[Character],
    dialogue: list[DialogueLine],
) -> list[Character]:
    """
    Heuristic name inference: scan dialogue for vocative patterns near face timestamps.
    e.g. "Hello, Walter" or "Agent Smith" patterns.
    """
    vocative_pattern = re.compile(
        r"(?:^|[,!?]\s*)([A-Z][a-z]{2,15})(?:[,!?]|\s|$)"
    )
    # Collect all potential names from dialogue
    candidate_names: list[tuple[str, float]] = []
    for line in dialogue:
        for match in vocative_pattern.finditer(line.text):
            candidate_names.append((match.group(1), line.start_time))

    for char in characters:
        if not char.face_embeddings:
            continue
        timestamps = [e.timestamp for e in char.face_embeddings]
        name_counts: dict[str, int] = {}
        for name, ts in candidate_names:
            # Check if name appears within 30s of a face embedding
            if any(abs(ts - t) < 30.0 for t in timestamps):
                name_counts[name] = name_counts.get(name, 0) + 1
        if name_counts:
            char.name = max(name_counts, key=lambda n: name_counts[n])

    # Fallback: assign generic names to unnamed characters
    unnamed_idx = 1
    for char in characters:
        if not char.name:
            char.name = f"Character {unnamed_idx}"
            unnamed_idx += 1

    return characters


def assign_characters_to_scenes(
    scenes: list[Scene],
    characters: list[Character],
) -> tuple[list[Scene], list[Character]]:
    """Cross-reference face timestamps with scene windows."""
    char_by_id: dict[str, Character] = {c.character_id: c for c in characters}

    for scene in scenes:
        appearing_ids = set()
        for char in characters:
            for emb in char.face_embeddings:
                if scene.start_time <= emb.timestamp <= scene.end_time:
                    appearing_ids.add(char.character_id)
                    break
        scene.character_ids = list(appearing_ids)

    # Update character metadata
    for scene in scenes:
        for cid in scene.character_ids:
            if cid in char_by_id:
                char = char_by_id[cid]
                char.scenes_appeared.append(scene.scene_id)
                char.total_screen_time += scene.duration

    return scenes, characters


def assign_dialogue_speakers(
    characters: list[Character],
    dialogue: list[DialogueLine],
) -> list[DialogueLine]:
    """
    Assign speaker_id to each dialogue line based on nearest face embedding timestamp.
    """
    if not characters:
        return dialogue

    # Build sorted list of (timestamp, char_id) from all embeddings
    timeline: list[tuple[float, str]] = []
    for char in characters:
        for emb in char.face_embeddings:
            timeline.append((emb.timestamp, char.character_id))
    timeline.sort()

    if not timeline:
        return dialogue

    import bisect
    timestamps = [t for t, _ in timeline]

    for line in dialogue:
        idx = bisect.bisect_left(timestamps, line.start_time)
        idx = max(0, min(idx, len(timeline) - 1))
        line.speaker_id = timeline[idx][1]
        # Update character's dialogue_lines
        for char in characters:
            if char.character_id == line.speaker_id:
                char.dialogue_lines.append(line)
                break

    return dialogue


def save_character_profiles(characters: list[Character], output_dir: Path) -> None:
    """Save face images and JSON profiles to output/characters/."""
    output_dir.mkdir(parents=True, exist_ok=True)

    for char in characters:
        # Copy representative face
        face_dst = output_dir / f"{char.character_id}.jpg"
        if Path(char.representative_face_path).exists():
            shutil.copy2(char.representative_face_path, face_dst)

        # Save profile JSON
        profile = {
            "character_id": char.character_id,
            "name": char.name,
            "total_screen_time": round(char.total_screen_time, 1),
            "scenes_appeared": char.scenes_appeared,
            "dialogue_count": len(char.dialogue_lines),
            "personality": None,
        }
        if char.personality:
            profile["personality"] = {
                "big_five": char.personality.big_five,
                "dominant_traits": char.personality.dominant_traits,
                "emotion_distribution": char.personality.emotion_distribution,
                "summary": char.personality.summary,
                "evidence": char.personality.evidence,
            }

        (output_dir / f"{char.character_id}_profile.json").write_text(
            json.dumps(profile, indent=2)
        )

    logger.info(f"Saved {len(characters)} character profiles to {output_dir}")
