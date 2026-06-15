"""
Movie analyst: identifies central theme, narrative structure, character roles,
and key plot points (inciting incident, act breaks, climax, resolution).

This runs BEFORE explainer scene selection and drives everything:
  - Which scenes are structurally mandatory (can't skip)
  - Which characters need formal introductions
  - What the chapter titles should be
  - What voice-over narration should emphasise
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional

from .data_models import Character, Scene
from .utils.logging_setup import logger


@dataclass
class Act:
    act_number: int
    title: str              # e.g. "The Setup", "The Unravelling", "The Reckoning"
    description: str        # 1-sentence summary of what this act is about
    scene_ids: list[int]    # scenes belonging to this act (chronological)
    must_include_scene_ids: list[int]  # scenes that cannot be skipped in explainer


@dataclass
class NarrativeStructure:
    central_theme: str          # e.g. "A wife's journey from blind trust to devastating truth"
    genre: str                  # "drama", "thriller", "romance", "action", etc.
    tone: str                   # "dark", "hopeful", "tense", "comedic", etc.
    logline: str                # 1-sentence movie summary (like IMDB logline)
    acts: list[Act]
    character_roles: dict[str, str]  # char_id → "protagonist|antagonist|supporting|mentor|comic_relief"
    inciting_incident_scene_id: Optional[int]
    midpoint_scene_id: Optional[int]
    climax_scene_id: Optional[int]
    key_turning_points: list[int]    # scene_ids of major plot turns
    opening_hook_scene_ids: list[int]
    resolution_scene_ids: list[int]


def _build_scene_summary_line(scene: Scene, char_names: dict[str, str]) -> str:
    """Compact 1-line scene summary for LLM context."""
    chars = [char_names.get(cid, cid) for cid in scene.character_ids]
    dialogue_hint = ""
    if scene.dialogue:
        first_line = scene.dialogue[0].text[:60].strip()
        dialogue_hint = f' Dialogue: "{first_line}..."'
    return (
        f"[scene_{scene.scene_id} @ {scene.start_time/60:.1f}min | {scene.duration:.0f}s | "
        f"mood={scene.dominant_emotion or 'neutral'} | "
        f"chars={', '.join(chars[:3]) or 'none'}] "
        f"{scene.caption or 'no caption'}{dialogue_hint}"
    )


def _build_analysis_prompt(
    scenes: list[Scene],
    characters: list[Character],
    char_names: dict[str, str],
    total_duration_min: float,
) -> str:
    """
    Build a compact but information-dense prompt for movie structure analysis.
    Sends full detail for first 5 / last 5 scenes + 1-line summaries for all others.
    """
    n = len(scenes)
    head_scenes = scenes[:5]
    tail_scenes = scenes[-5:]
    middle_scenes = scenes[5:-5] if n > 10 else []

    # Sample middle scenes evenly (max 40 lines to fit LLM context)
    max_middle = 40
    if len(middle_scenes) > max_middle:
        step = max(1, len(middle_scenes) // max_middle)
        middle_scenes = middle_scenes[::step]

    lines = [
        f"MOVIE DURATION: {total_duration_min:.0f} minutes",
        f"TOTAL SCENES: {n}",
        "",
        "MAIN CHARACTERS:",
    ]
    for char in characters[:8]:
        dl_count = len(char.dialogue_lines)
        lines.append(
            f"  {char.character_id} ({char.name or 'unnamed'}): "
            f"{char.total_screen_time/60:.1f} min screen time, {dl_count} dialogue lines"
        )

    lines += ["", "OPENING SCENES (full detail):"]
    for s in head_scenes:
        lines.append("  " + _build_scene_summary_line(s, char_names))
        if s.dialogue:
            for dl in s.dialogue[:3]:
                spk = char_names.get(dl.speaker_id or "", dl.speaker_id or "?")
                lines.append(f'    {spk}: "{dl.text[:80]}"')

    lines += ["", "MIDDLE SCENES (compressed):"]
    for s in middle_scenes:
        lines.append("  " + _build_scene_summary_line(s, char_names))

    lines += ["", "CLOSING SCENES (full detail):"]
    for s in tail_scenes:
        lines.append("  " + _build_scene_summary_line(s, char_names))
        if s.dialogue:
            for dl in s.dialogue[:3]:
                spk = char_names.get(dl.speaker_id or "", dl.speaker_id or "?")
                lines.append(f'    {spk}: "{dl.text[:80]}"')

    return "\n".join(lines)


def analyse_movie_structure(
    scenes: list[Scene],
    characters: list[Character],
    local_llm,
    total_duration_seconds: float,
) -> NarrativeStructure:
    """
    Use local LLM to identify the movie's central theme and full narrative structure.
    Falls back to heuristic structure if LLM is unavailable.
    """
    char_names: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    total_min = total_duration_seconds / 60

    if local_llm is None:
        logger.info("No LLM available — using heuristic narrative structure")
        return _heuristic_structure(scenes, characters, total_duration_seconds)

    logger.info("Analysing movie structure with local LLM...")
    movie_context = _build_analysis_prompt(scenes, characters, char_names, total_min)

    system = """You are an expert film analyst and story structure consultant.
Analyse the provided movie scene data and return a precise JSON structure analysis.
Base your analysis ONLY on the scene data provided. Be specific about scene IDs.
Return ONLY valid JSON, no explanation."""

    schema = """{
  "central_theme": "string — the core emotional/thematic idea of the movie (1 sentence)",
  "genre": "string — primary genre",
  "tone": "string — overall tone (dark/hopeful/tense/comedic/bittersweet etc)",
  "logline": "string — 1-sentence movie summary with protagonist, conflict, stakes",
  "character_roles": {
    "<character_id>": "protagonist|antagonist|supporting|mentor|love_interest|comic_relief"
  },
  "inciting_incident_scene_id": "integer or null — scene that kicks off the main conflict",
  "midpoint_scene_id": "integer or null — scene where everything changes mid-movie",
  "climax_scene_id": "integer or null — scene of peak conflict/confrontation",
  "key_turning_points": ["integer scene_ids"],
  "opening_hook_scene_ids": ["integer scene_ids — first 2-3 scenes that establish the world"],
  "resolution_scene_ids": ["integer scene_ids — final scenes that resolve the story"],
  "acts": [
    {
      "act_number": 1,
      "title": "string — evocative chapter title (3-5 words)",
      "description": "string — 1 sentence about what this act is about",
      "scene_ids": ["integer scene_ids in this act"],
      "must_include_scene_ids": ["integer scene_ids — absolutely cannot be skipped"]
    }
  ]
}"""

    user = f"""Analyse this movie and return the narrative structure JSON.

{movie_context}

Identify:
1. The central theme (what is this movie REALLY about emotionally?)
2. The genre and tone
3. A compelling logline
4. Character roles for each character listed
5. The exact scene IDs for: inciting incident, midpoint, climax, resolution
6. 3-4 acts with titles, scene ranges, and the must-include scenes per act
7. Key turning points (scenes where the story direction changes)

For must_include_scene_ids: be selective — choose only the 2-3 scenes per act
that are absolutely essential for a viewer to understand the story."""

    try:
        result = local_llm.generate_json(system, user, schema_hint=schema)
        return _parse_llm_structure(result, scenes, characters, total_duration_seconds)
    except Exception as e:
        logger.warning(f"LLM structure analysis failed: {e} — falling back to heuristic")
        return _heuristic_structure(scenes, characters, total_duration_seconds)


def _parse_llm_structure(
    data: dict,
    scenes: list[Scene],
    characters: list[Character],
    total_duration_seconds: float,
) -> NarrativeStructure:
    """Parse LLM JSON response into NarrativeStructure."""
    valid_ids = {s.scene_id for s in scenes}

    def _valid_id(v) -> Optional[int]:
        try:
            i = int(v)
            return i if i in valid_ids else None
        except (TypeError, ValueError):
            return None

    def _valid_ids(lst) -> list[int]:
        if not isinstance(lst, list):
            return []
        return [i for v in lst if (i := _valid_id(v)) is not None]

    acts = []
    for act_data in data.get("acts", []):
        acts.append(Act(
            act_number=int(act_data.get("act_number", len(acts) + 1)),
            title=str(act_data.get("title", f"Act {len(acts) + 1}")),
            description=str(act_data.get("description", "")),
            scene_ids=_valid_ids(act_data.get("scene_ids", [])),
            must_include_scene_ids=_valid_ids(act_data.get("must_include_scene_ids", [])),
        ))

    if not acts:
        acts = _heuristic_acts(scenes)

    return NarrativeStructure(
        central_theme=str(data.get("central_theme", "A story of conflict and resolution")),
        genre=str(data.get("genre", "drama")),
        tone=str(data.get("tone", "dramatic")),
        logline=str(data.get("logline", "")),
        acts=acts,
        character_roles={str(k): str(v) for k, v in data.get("character_roles", {}).items()},
        inciting_incident_scene_id=_valid_id(data.get("inciting_incident_scene_id")),
        midpoint_scene_id=_valid_id(data.get("midpoint_scene_id")),
        climax_scene_id=_valid_id(data.get("climax_scene_id")),
        key_turning_points=_valid_ids(data.get("key_turning_points", [])),
        opening_hook_scene_ids=_valid_ids(data.get("opening_hook_scene_ids", [])),
        resolution_scene_ids=_valid_ids(data.get("resolution_scene_ids", [])),
    )


def _heuristic_structure(
    scenes: list[Scene],
    characters: list[Character],
    total_duration_seconds: float,
) -> NarrativeStructure:
    """
    Rule-based fallback when no LLM is available.
    Uses scene positions and emotion peaks to approximate story structure.
    """
    n = len(scenes)
    if n == 0:
        return NarrativeStructure(
            central_theme="Story", genre="drama", tone="neutral", logline="",
            acts=[], character_roles={}, inciting_incident_scene_id=None,
            midpoint_scene_id=None, climax_scene_id=None, key_turning_points=[],
            opening_hook_scene_ids=[], resolution_scene_ids=[],
        )

    # Emotion-based turning point detection: find scenes where dominant emotion shifts
    turning_points = _find_emotional_turning_points(scenes)
    acts = _heuristic_acts(scenes)

    return NarrativeStructure(
        central_theme="A story of conflict and resolution",
        genre="drama",
        tone="dramatic",
        logline="",
        acts=acts,
        character_roles={c.character_id: "protagonist" if i == 0 else "supporting"
                        for i, c in enumerate(characters[:5])},
        inciting_incident_scene_id=scenes[n // 8].scene_id if n > 8 else scenes[0].scene_id,
        midpoint_scene_id=scenes[n // 2].scene_id,
        climax_scene_id=scenes[int(n * 0.88)].scene_id,
        key_turning_points=turning_points,
        opening_hook_scene_ids=[s.scene_id for s in scenes[:3]],
        resolution_scene_ids=[s.scene_id for s in scenes[-4:]],
    )


def _heuristic_acts(scenes: list[Scene]) -> list[Act]:
    """Split scenes into 3 acts by time position: 25% / 50% / 25%."""
    n = len(scenes)
    act1_end = n // 4
    act2_end = n * 3 // 4
    act_defs = [
        (1, "The Setup", scenes[:act1_end]),
        (2, "The Conflict", scenes[act1_end:act2_end]),
        (3, "The Resolution", scenes[act2_end:]),
    ]
    acts = []
    for num, title, act_scenes in act_defs:
        if not act_scenes:
            continue
        # Must-include: first, middle, last of each act
        must = list({
            act_scenes[0].scene_id,
            act_scenes[len(act_scenes) // 2].scene_id,
            act_scenes[-1].scene_id,
        })
        acts.append(Act(
            act_number=num,
            title=title,
            description="",
            scene_ids=[s.scene_id for s in act_scenes],
            must_include_scene_ids=must,
        ))
    return acts


def _find_emotional_turning_points(scenes: list[Scene], window: int = 5) -> list[int]:
    """Find scenes where the dominant emotion changes significantly."""
    EMOTION_ORDER = ["joy", "neutral", "surprise", "fear", "sadness", "anger", "disgust"]
    turning_points = []
    for i in range(window, len(scenes) - window):
        prev_emotions = [s.dominant_emotion for s in scenes[i - window:i] if s.dominant_emotion]
        next_emotions = [s.dominant_emotion for s in scenes[i:i + window] if s.dominant_emotion]
        if not prev_emotions or not next_emotions:
            continue
        from collections import Counter
        prev_dominant = Counter(prev_emotions).most_common(1)[0][0]
        next_dominant = Counter(next_emotions).most_common(1)[0][0]
        prev_idx = EMOTION_ORDER.index(prev_dominant) if prev_dominant in EMOTION_ORDER else 0
        next_idx = EMOTION_ORDER.index(next_dominant) if next_dominant in EMOTION_ORDER else 0
        if abs(prev_idx - next_idx) >= 2:
            turning_points.append(scenes[i].scene_id)
    return turning_points


def generate_character_intro_narration(
    character: Character,
    role: str,
    local_llm,
) -> str:
    """Generate a 1-2 sentence character introduction for TTS voice-over."""
    name = character.name or character.character_id
    screen_time_min = character.total_screen_time / 60

    if local_llm is None:
        return f"This is {name}, one of the key characters in our story."

    traits_text = ""
    if character.personality:
        traits = character.personality.dominant_traits[:3]
        traits_text = f"Known for being {', '.join(traits)}."

    dialogue_sample = ""
    if character.dialogue_lines:
        dialogue_sample = character.dialogue_lines[0].text[:80]

    system = (
        "You write punchy character introductions for movie explainer videos. "
        "2 sentences max. Introduce who they are and their role in the story. "
        "Avoid phrases like 'meets' or 'embarks on a journey'. Be specific."
    )
    user = (
        f"Introduce this character in 1-2 sentences for a movie explainer voice-over:\n"
        f"Name: {name}\nRole: {role}\nScreen time: {screen_time_min:.0f} minutes\n"
        f"{traits_text}\n"
        f"First dialogue: \"{dialogue_sample}\"\n"
    )
    try:
        return local_llm.generate(system, user, max_tokens=80)
    except Exception:
        return f"Meet {name} — {role} in this story."


def generate_scene_narration(
    scene: Scene,
    context_before: str,
    characters: list[Character],
    structure: NarrativeStructure,
    local_llm,
    target_seconds: float = 8.0,
) -> str:
    """
    Generate voice-over narration for a single scene in the explainer.
    The narration explains WHAT is happening and WHY it matters — not just describes the image.
    target_seconds controls approximate narration length (130 wpm → words = seconds * 2.2)
    """
    if local_llm is None:
        return scene.caption or ""

    target_words = max(15, int(target_seconds * 2.2))
    char_names: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    appearing = [char_names.get(cid, cid) for cid in scene.character_ids]
    dialogue_lines = "\n".join(
        f'  {char_names.get(d.speaker_id or "", "?")} : "{d.text}"'
        for d in scene.dialogue[:4]
    )

    is_turning_point = scene.scene_id in structure.key_turning_points
    is_climax = scene.scene_id == structure.climax_scene_id
    is_inciting = scene.scene_id == structure.inciting_incident_scene_id

    emphasis = ""
    if is_climax:
        emphasis = "This is the climax — emphasise the stakes and emotional peak."
    elif is_turning_point:
        emphasis = "This is a major turning point — explain how it changes everything."
    elif is_inciting:
        emphasis = "This is the inciting incident — explain how it kicks off the main conflict."

    system = (
        "You narrate movie explainer videos in the style of a prestige YouTube essay. "
        "Short sentences. Present tense. No spoilers beyond what's shown. "
        "Explain subtext and character motivation, not just what the camera shows. "
        "Return only the spoken narration, no stage directions."
    )
    user = (
        f"Write {target_words}-word narration for this scene (from a {structure.genre} film).\n\n"
        f"CENTRAL THEME: {structure.central_theme}\n"
        f"CHARACTERS IN SCENE: {', '.join(appearing) or 'none identified'}\n"
        f"SCENE DESCRIPTION: {scene.caption or 'no caption'}\n"
        f"MOOD: {scene.dominant_emotion or 'neutral'}\n"
        f"DIALOGUE:\n{dialogue_lines or '  (no dialogue)'}\n\n"
        f"STORY CONTEXT: {context_before}\n"
        f"{emphasis}\n\n"
        f"Write exactly {target_words} words of narration."
    )
    try:
        return local_llm.generate(system, user, max_tokens=target_words * 5)
    except Exception as e:
        logger.debug(f"Scene narration failed for scene {scene.scene_id}: {e}")
        return scene.caption or ""
