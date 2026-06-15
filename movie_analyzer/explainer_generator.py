"""
Movie explainer generator: compresses a 2-hour movie into 15-25 minutes.

Structure of the output:
  [INTRO CARD]         — movie title, logline, central theme
  [CHARACTER MONTAGE]  — brief intro clip + name card + role for each main character
  [ACT I]              — title card → selected scenes with per-scene TTS narration
  [ACT II]             — title card → selected scenes with per-scene TTS narration
  [ACT III]            — title card → selected scenes with per-scene TTS narration
  [ENDING CARD]        — brief summary of what the movie means

Scene selection is narrative-aware:
  - Mandatory: opening hook, inciting incident, turning points, climax, resolution
  - Fill:      highest-scoring scenes distributed proportionally across each act
  - Per-scene narration explains context/motivation, not just image description
"""
from __future__ import annotations
import math
from pathlib import Path
from typing import Optional

from .config import Config
from .data_models import Character, Scene
from .movie_analyst import (
    NarrativeStructure, Act,
    generate_character_intro_narration,
    generate_scene_narration,
)
from .text_overlay import (
    render_scene_description_overlay,
    render_lower_third,
    add_progress_bar,
    render_character_name_overlay,
)
from .voice_over import text_to_speech, mix_narration_with_video
from .utils.logging_setup import logger


# ─── Scene selection ──────────────────────────────────────────────────────────

def select_explainer_scenes(
    scenes: list[Scene],
    structure: NarrativeStructure,
    target_duration_seconds: float,
    total_movie_duration: float,
) -> list[Scene]:
    """
    Select scenes that together:
      1. Cover every structurally mandatory moment (mandatory set)
      2. Fill the remaining budget with the highest-scoring scenes from each act
      3. Stay within target_duration_seconds

    Mandatory scenes always win over score-based fills.
    """
    scene_by_id: dict[int, Scene] = {s.scene_id: s for s in scenes}

    # Collect mandatory scene IDs
    mandatory_ids: set[int] = set()
    mandatory_ids.update(structure.opening_hook_scene_ids)
    mandatory_ids.update(structure.resolution_scene_ids)
    mandatory_ids.update(structure.key_turning_points)
    if structure.inciting_incident_scene_id:
        mandatory_ids.add(structure.inciting_incident_scene_id)
    if structure.midpoint_scene_id:
        mandatory_ids.add(structure.midpoint_scene_id)
    if structure.climax_scene_id:
        mandatory_ids.add(structure.climax_scene_id)
    for act in structure.acts:
        mandatory_ids.update(act.must_include_scene_ids)

    # Filter to valid scene IDs
    mandatory_ids = {sid for sid in mandatory_ids if sid in scene_by_id}
    mandatory_duration = sum(scene_by_id[sid].duration for sid in mandatory_ids)

    # Remaining budget for fill scenes
    fill_budget = max(0.0, target_duration_seconds - mandatory_duration)
    logger.info(
        f"Mandatory scenes: {len(mandatory_ids)} ({mandatory_duration/60:.1f} min). "
        f"Fill budget: {fill_budget/60:.1f} min"
    )

    # Fill: per-act budget proportional to act length in the original movie
    selected: set[int] = set(mandatory_ids)
    total_act_duration = sum(
        sum(scene_by_id[sid].duration for sid in act.scene_ids if sid in scene_by_id)
        for act in structure.acts
    )
    if total_act_duration == 0:
        total_act_duration = total_movie_duration

    for act in structure.acts:
        act_scenes = [
            scene_by_id[sid]
            for sid in act.scene_ids
            if sid in scene_by_id and sid not in selected
        ]
        if not act_scenes:
            continue
        act_orig_duration = sum(s.duration for s in act_scenes)
        act_fill = fill_budget * (act_orig_duration / total_act_duration)

        # Sort by reel score, fill until act budget exhausted
        act_scenes.sort(key=lambda s: -(s.reel_score or 0.0))
        accumulated = 0.0
        for s in act_scenes:
            if accumulated >= act_fill:
                break
            selected.add(s.scene_id)
            accumulated += s.duration

    result = sorted(
        (scene_by_id[sid] for sid in selected),
        key=lambda s: s.start_time,
    )
    total_sel = sum(s.duration for s in result)
    logger.info(
        f"Selected {len(result)} scenes = {total_sel/60:.1f} min "
        f"(target {target_duration_seconds/60:.0f} min) "
        f"from {len(scenes)} total scenes"
    )
    return result


# ─── Clip builders ────────────────────────────────────────────────────────────

def _make_title_card(
    text: str,
    sub_text: str = "",
    duration: float = 3.5,
    resolution: tuple[int, int] = (1920, 1080),
    bg_color: tuple = (10, 10, 20),
    accent_color: tuple = (220, 80, 60),
):
    """Full-screen title card with optional subtitle."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = resolution
    bg = ColorClip(size=(w, h), color=bg_color, duration=duration)

    try:
        accent_bar = ColorClip(size=(w, 5), color=accent_color).set_position(("left", h // 2 - 60))
        title_clip = (
            TextClip(text, fontsize=54, color="white", method="caption",
                     size=(w - 120, None), font="Liberation-Sans-Bold")
            .set_position("center")
            .set_duration(duration)
        )
        elements = [bg, accent_bar, title_clip]
        if sub_text:
            sub_clip = (
                TextClip(sub_text, fontsize=28, color="#aaaaaa", method="caption",
                         size=(w - 160, None))
                .set_position(("center", h // 2 + 60))
                .set_duration(duration)
            )
            elements.append(sub_clip)
        return CompositeVideoClip(elements).fadein(0.6).fadeout(0.6)
    except Exception as e:
        logger.debug(f"Title card text render failed: {e}")
        return bg.fadein(0.4).fadeout(0.4)


def _make_character_intro_card(
    character: Character,
    role: str,
    resolution: tuple[int, int],
    duration: float = 4.0,
):
    """
    Character introduction card: face image + name + role overlay.
    Used at the start of the explainer to introduce main characters.
    """
    from moviepy.editor import (
        ImageClip, TextClip, ColorClip, CompositeVideoClip,
    )
    from PIL import Image
    import numpy as np

    w, h = resolution
    bg = ColorClip(size=(w, h), color=(5, 5, 15), duration=duration)
    elements = [bg]

    # Face image (centred, 40% of frame height)
    face_path = character.representative_face_path
    if Path(face_path).exists():
        try:
            img = Image.open(face_path).convert("RGB")
            face_h = int(h * 0.40)
            face_w = int(face_h * img.width / img.height)
            img = img.resize((face_w, face_h), Image.LANCZOS)
            face_arr = np.array(img)
            face_clip = (
                ImageClip(face_arr)
                .set_position(("center", int(h * 0.12)))
                .set_duration(duration)
            )
            elements.append(face_clip)
        except Exception as e:
            logger.debug(f"Face image failed: {e}")

    # Name + role text
    name = character.name or character.character_id
    try:
        name_clip = (
            TextClip(name.upper(), fontsize=48, color="white",
                     font="Liberation-Sans-Bold", method="label")
            .set_position(("center", int(h * 0.62)))
            .set_duration(duration)
        )
        role_clip = (
            TextClip(role, fontsize=30, color="#e8a030", method="label")
            .set_position(("center", int(h * 0.72)))
            .set_duration(duration)
        )
        elements += [name_clip, role_clip]

        if character.personality:
            traits = " · ".join(character.personality.dominant_traits[:3])
            trait_clip = (
                TextClip(traits, fontsize=24, color="#888888", method="label")
                .set_position(("center", int(h * 0.80)))
                .set_duration(duration)
            )
            elements.append(trait_clip)
    except Exception as e:
        logger.debug(f"Character card text failed: {e}")

    return CompositeVideoClip(elements).fadein(0.5).fadeout(0.5)


def _make_act_title_card(
    act: Act,
    resolution: tuple[int, int],
    duration: float = 3.0,
):
    """Chapter/act title card shown before each act's scenes."""
    act_label = f"ACT {act.act_number}" if act.act_number else "CHAPTER"
    return _make_title_card(
        act.title.upper(),
        sub_text=act.description,
        duration=duration,
        resolution=resolution,
        accent_color=(60, 130, 220),
    )


def _make_skip_card(
    n_skipped: int,
    gap_minutes: float,
    resolution: tuple[int, int],
    duration: float = 1.8,
):
    """Brief card shown when scenes are omitted between selected clips."""
    text = f"{gap_minutes:.0f} minutes later..." if gap_minutes >= 2 else "moments later..."
    return _make_title_card(text, duration=duration, resolution=resolution,
                            bg_color=(0, 0, 0), accent_color=(80, 80, 80))


# ─── Narration engine ─────────────────────────────────────────────────────────

class NarrationEngine:
    """Manages per-scene narration generation and TTS synthesis."""

    def __init__(self, config: Config, local_llm, characters: list[Character],
                 structure: NarrativeStructure):
        self.config = config
        self.local_llm = local_llm
        self.characters = characters
        self.structure = structure
        self._story_so_far: list[str] = []
        config.TTS_DIR.mkdir(parents=True, exist_ok=True)

    def narrate_scene(self, scene: Scene, scene_index: int) -> Optional[str]:
        """
        Generate TTS narration for a single scene.
        Returns path to WAV file, or None on failure.
        """
        context = (
            " → ".join(self._story_so_far[-3:])
            if self._story_so_far else "Beginning of the story."
        )

        # Scale narration length by scene duration
        narration_secs = min(scene.duration * 0.4, 12.0)
        narration_text = generate_scene_narration(
            scene, context, self.characters, self.structure,
            self.local_llm, target_seconds=narration_secs,
        )
        if not narration_text.strip():
            return None

        # Update running story context
        brief = (scene.caption or narration_text)[:80]
        self._story_so_far.append(brief)

        tts_path = str(self.config.TTS_DIR / f"scene_{scene.scene_id:04d}_narration.wav")
        if Path(tts_path).exists():
            return tts_path

        try:
            text_to_speech(narration_text, tts_path, self.config)
            return tts_path
        except Exception as e:
            logger.warning(f"TTS failed for scene {scene.scene_id}: {e}")
            return None


# ─── Main explainer builder ───────────────────────────────────────────────────

def build_and_render_explainer(
    selected_scenes: list[Scene],
    all_scenes: list[Scene],
    characters: list[Character],
    structure: NarrativeStructure,
    movie_path: str,
    config: Config,
    output_path: str,
    total_movie_duration: float,
    add_character_intros: bool = True,
) -> str:
    """
    Full explainer assembly and render.

    Timeline layout:
      1. Intro title card (movie logline + central theme)
      2. Character montage (intro card + brief clip per main character)
      3. Per-act sections: act title card → clips with narration → skip cards
      4. End card
    """
    from moviepy.editor import (
        VideoFileClip, AudioFileClip, ColorClip,
        CompositeVideoClip, concatenate_videoclips,
    )

    clips = []
    scene_by_id: dict[int, Scene] = {s.scene_id: s for s in all_scenes}
    selected_ids: set[int] = {s.scene_id for s in selected_scenes}
    char_by_id: dict[str, Character] = {c.character_id: c for c in characters}
    char_names: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    narration_engine = NarrationEngine(config, None, characters, structure)

    logger.info("Building explainer timeline...")

    # ── 1. INTRO TITLE CARD ──
    intro_text = structure.logline or structure.central_theme or "A movie explainer"
    clips.append(_make_title_card(
        "THE STORY SO FAR",
        sub_text=intro_text,
        duration=4.0,
        resolution=config.OUTPUT_RESOLUTION,
    ))

    if structure.central_theme:
        clips.append(_make_title_card(
            structure.central_theme.upper(),
            duration=3.5,
            resolution=config.OUTPUT_RESOLUTION,
            accent_color=(200, 160, 40),
        ))

    # ── 2. CHARACTER MONTAGE ──
    if add_character_intros and characters:
        logger.info("Building character introduction montage...")
        clips.append(_make_title_card(
            "MEET THE CHARACTERS",
            duration=2.0,
            resolution=config.OUTPUT_RESOLUTION,
            accent_color=(40, 160, 100),
        ))
        main_chars = sorted(characters, key=lambda c: -c.total_screen_time)[:6]
        for char in main_chars:
            role = structure.character_roles.get(char.character_id, "supporting character")
            char_card = _make_character_intro_card(char, role, config.OUTPUT_RESOLUTION, duration=4.0)
            clips.append(char_card)
            # Brief appearance clip from their first scene
            if char.scenes_appeared:
                first_sid = min(char.scenes_appeared)
                first_scene = scene_by_id.get(first_sid)
                if first_scene:
                    try:
                        intro_clip = (
                            VideoFileClip(movie_path)
                            .subclip(first_scene.start_time,
                                     min(first_scene.start_time + 8.0, first_scene.end_time))
                            .fadein(0.3).fadeout(0.3)
                        )
                        intro_clip = render_lower_third(
                            intro_clip,
                            char.name or char.character_id,
                            role,
                        )
                        clips.append(intro_clip)
                    except Exception as e:
                        logger.debug(f"Character intro clip failed for {char.character_id}: {e}")

    # ── 3. ACT SECTIONS ──
    # Group selected scenes by act
    act_scene_groups: dict[int, list[Scene]] = {}
    for act in structure.acts:
        act_scene_groups[act.act_number] = [
            s for s in selected_scenes if s.scene_id in set(act.scene_ids)
        ]
    # Scenes not assigned to any act go into the last act
    assigned_ids = {sid for act in structure.acts for sid in act.scene_ids}
    unassigned = [s for s in selected_scenes if s.scene_id not in assigned_ids]
    if unassigned:
        last_act_num = max((a.act_number for a in structure.acts), default=1)
        act_scene_groups.setdefault(last_act_num, []).extend(unassigned)

    seen_character_ids: set[str] = set()  # track first appearances in explainer
    scene_index = 0

    for act in structure.acts:
        act_scenes = act_scene_groups.get(act.act_number, [])
        if not act_scenes:
            continue

        # Act title card
        clips.append(_make_act_title_card(act, config.OUTPUT_RESOLUTION))

        prev_end_time: Optional[float] = None

        for i, scene in enumerate(act_scenes):
            # Skip card between non-adjacent scenes
            if prev_end_time is not None:
                gap = scene.start_time - prev_end_time
                if gap > 60.0:
                    gap_minutes = gap / 60.0
                    clips.append(_make_skip_card(0, gap_minutes, config.OUTPUT_RESOLUTION))

            # Generate per-scene narration
            narration_path = narration_engine.narrate_scene(scene, scene_index)
            scene_index += 1

            # Load the actual movie clip
            try:
                clip = VideoFileClip(movie_path).subclip(scene.start_time, scene.end_time)

                # First-appearance character name overlays
                for cid in scene.character_ids:
                    if cid not in seen_character_ids:
                        char = char_by_id.get(cid)
                        if char:
                            clip = render_character_name_overlay(
                                clip,
                                f"{char.name or cid} — {structure.character_roles.get(cid, 'character')}",
                                appear_at=0.5,
                                duration=2.5,
                            )
                        seen_character_ids.add(cid)

                # Scene description overlay (caption as subtitle)
                if scene.caption:
                    clip = render_scene_description_overlay(clip, scene.caption, font_size=24)

                # Progress bar showing position in full 2-hour movie
                position_ratio = scene.start_time / max(total_movie_duration, 1.0)
                clip = add_progress_bar(clip, position_ratio)

                # Mix in TTS narration (duck original audio)
                if narration_path and Path(narration_path).exists():
                    clip = mix_narration_with_video(clip, narration_path, original_audio_volume=0.15)

                clips.append(clip.fadein(0.3).fadeout(0.3))
                prev_end_time = scene.end_time

            except Exception as e:
                logger.warning(f"Failed to render scene {scene.scene_id}: {e}")
                prev_end_time = scene.end_time

    # ── 4. END CARD ──
    clips.append(_make_title_card(
        "END",
        sub_text=structure.central_theme,
        duration=3.0,
        resolution=config.OUTPUT_RESOLUTION,
        accent_color=(80, 80, 80),
    ))

    # ── 5. CONCATENATE + RENDER ──
    if not clips:
        logger.error("No clips to render for explainer!")
        return output_path

    logger.info(f"Concatenating {len(clips)} clips for explainer...")
    final = concatenate_videoclips(clips, method="compose")
    total_min = final.duration / 60
    logger.info(f"Explainer duration: {total_min:.1f} min — rendering to {output_path}")

    final.write_videofile(
        output_path,
        codec=config.OUTPUT_CODEC,
        audio_codec=config.OUTPUT_AUDIO_CODEC,
        fps=config.OUTPUT_FPS,
        logger=None,
        ffmpeg_params=["-preset", "fast", "-crf", "22"],
    )
    final.close()
    for c in clips:
        try:
            c.close()
        except Exception:
            pass

    logger.info(f"Explainer saved: {output_path} ({total_min:.1f} min)")
    return output_path


# ─── Legacy compat shims (used by main.py run_explainer) ─────────────────────

def select_explainer_scenes_heuristic(
    scenes: list[Scene],
    target_duration_minutes: float,
    total_movie_duration: float,
) -> list[Scene]:
    """
    Fallback heuristic when no NarrativeStructure is available (checkpoint resume).
    """
    from .movie_analyst import _heuristic_structure
    structure = _heuristic_structure(scenes, [], total_movie_duration)
    return select_explainer_scenes(
        scenes, structure,
        target_duration_seconds=target_duration_minutes * 60,
        total_movie_duration=total_movie_duration,
    )
