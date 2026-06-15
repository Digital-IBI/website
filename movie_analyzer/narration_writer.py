from __future__ import annotations
from .data_models import Character, Scene
from .utils.logging_setup import logger


def write_gap_narration(
    skipped_scenes: list[Scene],
    characters: list[Character],
    local_llm,
    target_words: int,
) -> str:
    """Write bridging narration for scenes skipped in the explainer."""
    if not skipped_scenes:
        return ""

    char_by_id: dict[str, str] = {
        c.character_id: (c.name or c.character_id) for c in characters
    }

    scene_summaries = []
    for s in skipped_scenes[:8]:
        chars = ", ".join(char_by_id.get(cid, cid) for cid in s.character_ids) or "unknown"
        scene_summaries.append(
            f"- Scene {s.scene_id} [{s.duration:.0f}s]: "
            f"{s.caption or 'no caption'} "
            f"(mood: {s.dominant_emotion or 'neutral'}, "
            f"chars: {chars})"
        )
    summary_text = "\n".join(scene_summaries)

    system = (
        "You are a documentary narrator writing for a movie explainer video. "
        "Your narration bridges skipped scenes for viewers who are watching a compressed version. "
        "Tone: like a prestige YouTube essay — clear, engaging, no spoilers beyond what's implied. "
        "Write short sentences (under 20 words each) for TTS clarity. "
        "Return only the spoken narration text, no labels or stage directions."
    )
    user = (
        f"Write approximately {target_words} words of bridging narration for these "
        f"skipped movie scenes:\n\n{summary_text}\n\n"
        f"The narration should tell viewers what happened in these scenes without "
        f"dwelling too long — just enough context to follow the story."
    )

    if local_llm is None:
        return _template_narration(skipped_scenes, char_by_id)

    try:
        return local_llm.generate(system, user, max_tokens=target_words * 3)
    except Exception as e:
        logger.warning(f"LLM narration failed: {e}")
        return _template_narration(skipped_scenes, char_by_id)


def _template_narration(scenes: list[Scene], char_names: dict[str, str]) -> str:
    """Fallback template narration when LLM is unavailable."""
    parts = []
    for s in scenes[:3]:
        caps = s.caption or "the scene unfolds"
        emotion = s.dominant_emotion or "neutral"
        parts.append(f"In a {emotion} moment, {caps.lower()}")
    return ". ".join(parts) + "." if parts else "The story continues."


def write_reel_title(segment, scenes: list[Scene], local_llm) -> str:
    """Generate a punchy 5-8 word reel title using local LLM."""
    scene_ids = set(segment.scene_ids)
    rel_scenes = [s for s in scenes if s.scene_id in scene_ids]
    caption = " ".join(s.caption or "" for s in rel_scenes[:2])[:150]
    emotion = rel_scenes[0].dominant_emotion if rel_scenes else "intense"

    if local_llm is None:
        return _template_title(segment.category, emotion)

    system = (
        "You write punchy, viral-ready titles for short video clips (5-8 words). "
        "Think YouTube thumbnail energy. No clickbait clichés. Return only the title."
    )
    user = (
        f"Write a 5-8 word title for this {segment.category} movie clip.\n"
        f"Scene description: {caption}\n"
        f"Mood: {emotion}"
    )
    try:
        title = local_llm.generate(system, user, max_tokens=30)
        return title.strip().strip('"').strip("'")
    except Exception as e:
        logger.warning(f"LLM reel title failed: {e}")
        return _template_title(segment.category, emotion)


def _template_title(category: str, emotion: str) -> str:
    templates = {
        "funny": "You Won't Stop Laughing At This",
        "dramatic": "The Scene That Changes Everything",
        "tense": "Hold Your Breath For This Moment",
        "emotional": "This Scene Will Move You",
        "action": "The Most Intense Scene in the Film",
        "romance": "The Most Beautiful Scene You'll See",
        "reveal": "The Twist Nobody Saw Coming",
    }
    return templates.get(category, f"A Truly {emotion.title()} Moment")
