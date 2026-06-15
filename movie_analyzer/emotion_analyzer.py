from __future__ import annotations
import numpy as np

from .data_models import DialogueLine, Scene
from .utils.logging_setup import logger

EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"
EMOTIONS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]


def load_emotion_pipeline():
    """Load the emotion classification pipeline (downloads ~300MB on first run)."""
    try:
        from transformers import pipeline
    except ImportError:
        raise ImportError("Install transformers: pip install transformers")

    logger.info(f"Loading emotion model: {EMOTION_MODEL}")
    pipe = pipeline(
        "text-classification",
        model=EMOTION_MODEL,
        top_k=None,
        device=-1,  # CPU; set to 0 for first GPU
    )
    logger.info("Emotion model loaded")
    return pipe


def analyze_dialogue_emotions(
    dialogue: list[DialogueLine],
    pipe,
    batch_size: int = 32,
) -> list[DialogueLine]:
    """Batch-analyze emotions for all dialogue lines."""
    if not dialogue:
        return dialogue

    texts = [d.text[:512] for d in dialogue]
    logger.info(f"Analysing emotions for {len(texts)} dialogue lines...")

    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_results = pipe(batch)
        results.extend(batch_results)

    for line, label_scores in zip(dialogue, results):
        line.emotions = {item["label"]: round(float(item["score"]), 4) for item in label_scores}

    return dialogue


def get_scene_dominant_emotion(scene: Scene) -> str:
    """Aggregate emotion scores across all dialogue in the scene."""
    if not scene.dialogue:
        return "neutral"

    totals: dict[str, float] = {e: 0.0 for e in EMOTIONS}
    count = 0
    for line in scene.dialogue:
        if line.emotions:
            for emotion, score in line.emotions.items():
                if emotion in totals:
                    totals[emotion] += score
            count += 1

    if count == 0:
        return "neutral"
    return max(totals, key=lambda e: totals[e])


def compute_emotion_peaks(scenes: list[Scene]) -> list[float]:
    """
    Return 0–1 scores for emotional intensity per scene.
    High variance across emotions = more emotionally charged.
    """
    scores = []
    for scene in scenes:
        if not scene.dialogue:
            scores.append(0.0)
            continue
        totals: dict[str, float] = {e: 0.0 for e in EMOTIONS}
        count = 0
        for line in scene.dialogue:
            if line.emotions:
                for e, s in line.emotions.items():
                    if e in totals:
                        totals[e] += s
                count += 1
        if count == 0:
            scores.append(0.0)
            continue
        # Normalise and compute non-neutral intensity
        vals = np.array([totals[e] / count for e in EMOTIONS])
        neutral_idx = EMOTIONS.index("neutral")
        non_neutral = np.delete(vals, neutral_idx)
        # Peak = max non-neutral emotion - average non-neutral
        intensity = float(np.max(non_neutral) - np.mean(non_neutral))
        scores.append(float(np.clip(intensity * 2.0, 0.0, 1.0)))
    return scores


def analyze_all_dialogue(
    dialogue: list[DialogueLine],
    scenes: list[Scene],
    batch_size: int = 32,
) -> tuple[list[DialogueLine], list[Scene]]:
    """Full emotion pass: analyze dialogue then assign dominant emotion to each scene."""
    pipe = load_emotion_pipeline()
    dialogue = analyze_dialogue_emotions(dialogue, pipe, batch_size)

    for scene in scenes:
        scene.dominant_emotion = get_scene_dominant_emotion(scene)

    return dialogue, scenes
