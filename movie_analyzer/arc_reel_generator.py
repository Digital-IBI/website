"""
Arc reel generator: assembles non-contiguous scenes from the same narrative thread
into a single coherent reel, adding time-jump cards between segments to preserve
the sense of story continuity.

Example output:
  [Scene: wife looks worried, 8s]
  [TEXT CARD: "20 minutes later..."]
  [Scene: she follows husband, 12s]
  [TEXT CARD: "later that night..."]
  [Scene: confrontation & discovery, 25s]
  Total: ~45s — complete narrative arc
"""
from __future__ import annotations
import math
from pathlib import Path

from .config import Config
from .data_models import Character, ReelSegment, Scene
from .story_arc_detector import NarrativeThread
from .narration_writer import write_reel_title
from .text_overlay import render_lower_third, render_scene_description_overlay, add_progress_bar
from .voice_over import text_to_speech
from .utils.logging_setup import logger


_TIME_JUMP_PHRASES = [
    "moments later...",
    "later...",
    "meanwhile...",
    "the next day...",
    "hours later...",
    "that same night...",
    "sometime later...",
    "later that evening...",
]


def _format_time_gap(gap_seconds: float) -> str:
    """Convert a time gap into a human-readable bridging phrase."""
    mins = gap_seconds / 60
    if mins < 2:
        return "moments later..."
    if mins < 10:
        return "minutes later..."
    if mins < 60:
        return f"{int(mins)} minutes later..."
    hours = mins / 60
    if hours < 2:
        return "an hour later..."
    return f"{int(hours)} hours later..."


def _make_time_jump_card(gap_seconds: float, resolution: tuple[int, int], duration: float = 1.5):
    """Black card with centred italic text indicating the time jump."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = resolution
    text = _format_time_gap(gap_seconds)

    black = ColorClip(size=(w, h), color=(0, 0, 0), duration=duration)
    try:
        label = TextClip(
            text,
            fontsize=38,
            color="white",
            font="Liberation-Sans-Bold",
            method="label",
        ).set_position("center").set_duration(duration)
    except Exception:
        try:
            label = TextClip(text, fontsize=38, color="white", method="label") \
                       .set_position("center").set_duration(duration)
        except Exception:
            # Last resort: return plain black card with no text
            return black.fadein(0.4).fadeout(0.4)

    return CompositeVideoClip([black, label]).fadein(0.4).fadeout(0.4)


def build_arc_reel_clips(
    arc_scenes: list[Scene],
    movie_path: str,
    thread: NarrativeThread,
    characters: list[Character],
    config: Config,
    total_movie_duration: float,
) -> list:
    """
    Build the list of moviepy clips for an arc reel.
    Inserts time-jump cards wherever consecutive selected scenes are > 30s apart.
    Returns list of clips ready for concatenation.
    """
    from moviepy.editor import VideoFileClip

    char_by_id: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    clips = []

    for i, scene in enumerate(arc_scenes):
        # ── Time-jump card between non-adjacent scenes ──
        if i > 0:
            prev_end = arc_scenes[i - 1].end_time
            gap = scene.start_time - prev_end
            if gap > 30.0:
                card = _make_time_jump_card(gap, config.OUTPUT_RESOLUTION, duration=1.5)
                clips.append(card)

        # ── Scene clip ──
        try:
            clip = VideoFileClip(movie_path).subclip(scene.start_time, scene.end_time)

            # Scene description from caption
            if scene.caption:
                clip = render_scene_description_overlay(clip, scene.caption, font_size=24)

            # Progress bar: shows where in the full movie this moment sits
            position_ratio = scene.start_time / max(total_movie_duration, 1.0)
            clip = add_progress_bar(clip, position_ratio)

            clips.append(clip)

        except Exception as e:
            logger.warning(f"Failed to load scene {scene.scene_id} for arc reel: {e}")

    return clips


def generate_arc_reel(
    thread: NarrativeThread,
    arc_scenes: list[Scene],
    all_scenes: list[Scene],
    movie_path: str,
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
    add_narration: bool = True,
) -> str:
    """
    Render a complete narrative arc reel as an MP4.
    Returns the output file path.
    """
    from moviepy.editor import concatenate_videoclips, AudioFileClip, CompositeAudioClip

    config.REELS_DIR.mkdir(parents=True, exist_ok=True)
    safe_topic = thread.topic.replace(" ", "_").replace("/", "-")[:40]
    output_path = str(config.REELS_DIR / f"{thread.thread_id}_{safe_topic}_arc.mp4")

    if Path(output_path).exists():
        logger.info(f"Arc reel already exists: {output_path}")
        return output_path

    logger.info(f"Generating arc reel: '{thread.topic}' "
                f"({len(arc_scenes)} scenes from {thread.time_span_minutes:.0f} min span)")

    clips = build_arc_reel_clips(
        arc_scenes, movie_path, thread, characters, config, total_movie_duration
    )

    if not clips:
        logger.error(f"No clips for arc reel '{thread.topic}'")
        return output_path

    # ── Add thread title lower-third to first clip ──
    if clips:
        try:
            title = write_reel_title(
                type("Seg", (), {
                    "category": "arc",
                    "scene_ids": thread.scene_ids,
                })(),
                arc_scenes, local_llm
            ) if local_llm else thread.topic
            clips[0] = render_lower_third(clips[0], title, thread.topic[:50])
        except Exception as e:
            logger.debug(f"Lower-third failed: {e}")

    # ── Optional TTS narration over the entire reel ──
    if add_narration and local_llm is not None:
        _add_arc_narration(clips, arc_scenes, characters, thread, local_llm, config)

    # ── Concatenate and render ──
    try:
        final = concatenate_videoclips(clips, method="compose")
        final.write_videofile(
            output_path,
            codec=config.OUTPUT_CODEC,
            audio_codec=config.OUTPUT_AUDIO_CODEC,
            fps=config.OUTPUT_FPS,
            logger=None,
            ffmpeg_params=["-preset", "fast", "-crf", "22"],
        )
        final.close()
        logger.info(f"Arc reel saved: {output_path} ({final.duration:.0f}s)")
    except Exception as e:
        logger.error(f"Arc reel render failed: {e}")

    # Free any open clips
    for c in clips:
        try:
            c.close()
        except Exception:
            pass

    return output_path


def _add_arc_narration(clips, arc_scenes, characters, thread, local_llm, config) -> None:
    """Generate and mix in TTS narration for the full arc reel."""
    from .narration_writer import write_gap_narration
    from .voice_over import text_to_speech, mix_narration_with_video

    char_names: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    char_list = list({char_names.get(cid, "") for s in arc_scenes for cid in s.character_ids if cid})

    total_dur = sum(getattr(c, "duration", 0) for c in clips if hasattr(c, "duration"))
    target_words = max(30, int(total_dur / 150 * 100))  # ~100 wpm for clarity

    scene_texts = []
    for s in arc_scenes:
        chars = [char_names.get(cid, cid) for cid in s.character_ids]
        scene_texts.append(
            f"Scene [{s.dominant_emotion or 'neutral'}]: "
            f"{s.caption or 'no description'}. "
            f"Characters: {', '.join(chars) or 'unknown'}."
        )

    system = (
        "You write concise, engaging narration for short viral movie clips. "
        "This narration tells the story of a complete narrative arc compressed from "
        "its original spread across the movie. Keep it punchy and under "
        f"{target_words} words. Return only spoken text, no stage directions."
    )
    user = (
        f"Write narration for this complete story arc: '{thread.topic}'\n\n"
        f"The reel shows {len(arc_scenes)} scenes originally spanning "
        f"{thread.time_span_minutes:.0f} minutes of the movie, "
        f"compressed into ~{total_dur:.0f} seconds.\n\n"
        f"Arc scenes in order:\n" + "\n".join(scene_texts)
    )

    tts_path = str(config.TTS_DIR / f"{thread.thread_id}_narration.wav")
    try:
        narration_text = local_llm.generate(system, user, max_tokens=target_words * 4)
        config.TTS_DIR.mkdir(parents=True, exist_ok=True)
        text_to_speech(narration_text, tts_path, config)
        # Mix narration over the LAST clip (resolution/payoff) for maximum impact
        if clips and Path(tts_path).exists():
            clips[-1] = mix_narration_with_video(clips[-1], tts_path, original_audio_volume=0.2)
    except Exception as e:
        logger.warning(f"Arc narration failed: {e}")


def generate_all_arc_reels(
    arc_results: list[tuple[NarrativeThread, list[Scene]]],
    all_scenes: list[Scene],
    movie_path: str,
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> list[tuple[NarrativeThread, str]]:
    """
    Generate arc reels for all detected narrative threads.
    Returns list of (thread, output_path).
    """
    logger.info(f"Generating {len(arc_results)} narrative arc reels...")
    results = []
    for thread, arc_scenes in arc_results:
        path = generate_arc_reel(
            thread, arc_scenes, all_scenes, movie_path,
            characters, local_llm, config, total_movie_duration
        )
        results.append((thread, path))
    return results
