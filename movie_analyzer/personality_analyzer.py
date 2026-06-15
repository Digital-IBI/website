from __future__ import annotations
import numpy as np

from .data_models import Character, PersonalityProfile, Scene
from .utils.logging_setup import logger

EMOTIONS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]


def compute_emotion_distribution(character: Character) -> dict[str, float]:
    """Average emotion scores across all character dialogue lines."""
    totals: dict[str, float] = {e: 0.0 for e in EMOTIONS}
    count = 0
    for line in character.dialogue_lines:
        if line.emotions:
            for e, s in line.emotions.items():
                if e in totals:
                    totals[e] += s
            count += 1
    if count == 0:
        return {e: 1.0 / len(EMOTIONS) for e in EMOTIONS}
    return {e: round(totals[e] / count, 4) for e in EMOTIONS}


def compute_big_five_from_emotions(emotion_dist: dict[str, float]) -> dict[str, float]:
    """
    Heuristic Big Five mapping from emotion distribution.
    Based on established correlations in affective psychology literature.
    """
    joy = emotion_dist.get("joy", 0.0)
    anger = emotion_dist.get("anger", 0.0)
    fear = emotion_dist.get("fear", 0.0)
    sadness = emotion_dist.get("sadness", 0.0)
    surprise = emotion_dist.get("surprise", 0.0)
    disgust = emotion_dist.get("disgust", 0.0)
    neutral = emotion_dist.get("neutral", 0.0)

    openness = round(float(np.clip(joy * 0.5 + surprise * 0.5, 0.1, 0.95)), 3)
    conscientiousness = round(float(np.clip(neutral * 0.6 + (1 - anger) * 0.4, 0.1, 0.95)), 3)
    extraversion = round(float(np.clip(joy * 0.6 + surprise * 0.3 - sadness * 0.2, 0.1, 0.95)), 3)
    agreeableness = round(float(np.clip(joy * 0.4 + (1 - anger) * 0.4 + (1 - disgust) * 0.2, 0.1, 0.95)), 3)
    neuroticism = round(float(np.clip(fear * 0.4 + anger * 0.3 + sadness * 0.3, 0.05, 0.95)), 3)

    return {
        "openness": openness,
        "conscientiousness": conscientiousness,
        "extraversion": extraversion,
        "agreeableness": agreeableness,
        "neuroticism": neuroticism,
    }


def derive_dominant_traits(
    big_five: dict[str, float],
    emotion_dist: dict[str, float],
) -> list[str]:
    """Map Big Five scores and emotion distribution to descriptive trait labels."""
    traits = []
    if big_five["openness"] > 0.65:
        traits.append("creative")
    if big_five["conscientiousness"] > 0.65:
        traits.append("methodical")
    if big_five["extraversion"] > 0.65:
        traits.append("outgoing")
    elif big_five["extraversion"] < 0.35:
        traits.append("reserved")
    if big_five["agreeableness"] > 0.65:
        traits.append("empathetic")
    elif big_five["agreeableness"] < 0.35:
        traits.append("confrontational")
    if big_five["neuroticism"] > 0.6:
        traits.append("anxious")
    elif big_five["neuroticism"] < 0.25:
        traits.append("emotionally stable")
    if emotion_dist.get("anger", 0) > 0.25:
        traits.append("intense")
    if emotion_dist.get("joy", 0) > 0.35:
        traits.append("optimistic")
    if emotion_dist.get("sadness", 0) > 0.25:
        traits.append("introspective")
    return traits[:5] if traits else ["complex"]


def generate_personality_summary(character: Character, local_llm) -> str:
    """Use local LLM to write a 2-3 sentence personality prose summary."""
    if local_llm is None:
        # Fallback: build a template summary
        name = character.name or character.character_id
        traits = (
            character.personality.dominant_traits
            if character.personality else ["complex"]
        )
        return f"{name} is a {', '.join(traits[:3])} character with notable emotional depth."

    name = character.name or character.character_id
    sample_lines = character.dialogue_lines[:20]
    dialogue_text = "\n".join(f'- "{l.text}"' for l in sample_lines)
    emotion_text = ", ".join(
        f"{k}: {v:.2f}"
        for k, v in sorted(
            (character.personality.emotion_distribution or {}).items(),
            key=lambda x: -x[1],
        )[:4]
    )

    system = (
        "You are a film critic and psychologist. Write concise, insightful character "
        "analyses in 2-3 sentences. Be specific about personality from the evidence given. "
        "Do not use generic phrases like 'complex character' or 'multidimensional'."
    )
    user = (
        f"CHARACTER: {name}\n"
        f"DOMINANT EMOTIONS in dialogue: {emotion_text}\n"
        f"SAMPLE DIALOGUE:\n{dialogue_text}\n\n"
        f"Write a 2-3 sentence personality summary for this character."
    )
    try:
        return local_llm.generate(system, user, max_tokens=200)
    except Exception as e:
        logger.warning(f"LLM personality summary failed for {name}: {e}")
        return f"{name} displays a {', '.join(character.personality.dominant_traits[:2])} personality."


def analyze_character(character: Character, local_llm) -> Character:
    """Build a full PersonalityProfile for one character."""
    emotion_dist = compute_emotion_distribution(character)
    big_five = compute_big_five_from_emotions(emotion_dist)
    traits = derive_dominant_traits(big_five, emotion_dist)

    # Collect evidence (dialogue lines with high non-neutral emotion)
    evidence = []
    for line in character.dialogue_lines:
        if line.emotions:
            non_neutral = sum(v for k, v in line.emotions.items() if k != "neutral")
            if non_neutral > 0.6 and line.text.strip():
                evidence.append(line.text.strip())
                if len(evidence) >= 4:
                    break

    character.personality = PersonalityProfile(
        big_five=big_five,
        dominant_traits=traits,
        emotion_distribution=emotion_dist,
        summary="",  # filled below
        evidence=evidence,
    )
    character.personality.summary = generate_personality_summary(character, local_llm)
    return character


def analyze_all_characters(
    characters: list[Character],
    local_llm,
    min_dialogue_lines: int = 5,
) -> list[Character]:
    """Analyze personality for characters with enough dialogue data."""
    eligible = [c for c in characters if len(c.dialogue_lines) >= min_dialogue_lines]
    logger.info(
        f"Analysing personality for {len(eligible)}/{len(characters)} characters "
        f"(min {min_dialogue_lines} dialogue lines)"
    )
    for char in eligible:
        logger.info(f"  → {char.name or char.character_id} ({len(char.dialogue_lines)} lines)")
        analyze_character(char, local_llm)
    return characters
