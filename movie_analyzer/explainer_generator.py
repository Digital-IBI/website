from __future__ import annotations
import math
from pathlib import Path

from .config import Config
from .data_models import Character, Scene
from .narration_writer import write_gap_narration
from .text_overlay import (
    render_scene_title_overlay,
    render_scene_description_overlay,
    render_lower_third,
    add_progress_bar,
)
from .voice_over import text_to_speech, mix_narration_with_video
from .utils.logging_setup import logger


def select_explainer_scenes(
    scenes: list[Scene],
    target_duration_minutes: float,
    total_movie_duration: float,
) -> list[Scene]:
    """
    Select ~20 minutes of content from a 2-hour movie.
    Pass 1: high-score scenes fill 60% of target duration.
    Pass 2: structurally important scenes fill the remaining 40%.
    """
    target_secs = target_duration_minutes * 60

    # Pass 1: top scoring scenes
    sorted_by_score = sorted(scenes, key=lambda s: -(s.reel_score or 0.0))
    selected: set[int] = set()
    accumulated = 0.0
    pass1_target = target_secs * 0.60

    for scene in sorted_by_score:
        if accumulated >= pass1_target:
            break
        selected.add(scene.scene_id)
        accumulated += scene.duration

    # Pass 2: structurally important scenes
    n = len(scenes)
    structural_ratios = [0.0, 0.1, 0.25, 0.5, 0.75, 0.85, 0.92, 1.0]
    for ratio in structural_ratios:
        idx = min(int(ratio * (n - 1)), n - 1)
        scene = scenes[idx]
        if scene.scene_id not in selected and accumulated < target_secs:
            selected.add(scene.scene_id)
            accumulated += scene.duration

    # Return in chronological order
    result = [s for s in scenes if s.scene_id in selected]
    result.sort(key=lambda s: s.start_time)
    logger.info(
        f"Selected {len(result)} scenes = {accumulated / 60:.1f} min "
        f"(target {target_duration_minutes} min)"
    )
    return result


def build_explainer_timeline(
    selected_scenes: list[Scene],
    all_scenes: list[Scene],
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> list[dict]:
    """
    Build a timeline of clips and narration gaps.
    Returns list of dicts: {"type": "clip"|"narration"|"transition", ...}
    """
    all_by_id: dict[int, Scene] = {s.scene_id: s for s in all_scenes}
    selected_ids: set[int] = {s.scene_id for s in selected_scenes}
    timeline: list[dict] = []

    config.TTS_DIR.mkdir(parents=True, exist_ok=True)
    narration_idx = 0

    for i, scene in enumerate(selected_scenes):
        # Find gap before this scene (skipped scenes)
        prev_id = selected_scenes[i - 1].scene_id if i > 0 else -1
        skipped = [
            all_by_id[sid]
            for sid in range(prev_id + 1, scene.scene_id)
            if sid in all_by_id and sid not in selected_ids
        ]

        if skipped and i > 0:
            # Generate bridging narration
            gap_duration = sum(s.duration for s in skipped)
            target_words = max(20, int(gap_duration / 150 * 130))
            narration_text = write_gap_narration(skipped, characters, local_llm, target_words)

            if narration_text:
                tts_path = str(config.TTS_DIR / f"narration_{narration_idx:04d}.wav")
                try:
                    text_to_speech(narration_text, tts_path, config)
                    from moviepy.editor import AudioFileClip
                    audio_dur = AudioFileClip(tts_path).duration
                    timeline.append({
                        "type": "narration",
                        "text": narration_text,
                        "audio_path": tts_path,
                        "duration": audio_dur,
                        "skipped_scenes": len(skipped),
                    })
                    narration_idx += 1
                except Exception as e:
                    logger.warning(f"TTS generation failed: {e}")

            # Add transition
            timeline.append({"type": "transition", "style": "fade", "duration": 0.5})

        position_ratio = scene.start_time / max(total_movie_duration, 1.0)
        timeline.append({
            "type": "clip",
            "scene": scene,
            "start_time": scene.start_time,
            "end_time": scene.end_time,
            "position_ratio": position_ratio,
        })

    return timeline


def render_explainer(
    timeline: list[dict],
    movie_path: str,
    characters: list[Character],
    config: Config,
    output_path: str,
) -> str:
    """Render the full explainer video from the timeline."""
    from moviepy.editor import (
        VideoFileClip,
        AudioFileClip,
        ColorClip,
        CompositeVideoClip,
        concatenate_videoclips,
    )

    char_by_id: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}
    clips = []

    logger.info(f"Rendering explainer from {len(timeline)} timeline entries...")

    for entry in timeline:
        if entry["type"] == "clip":
            scene: Scene = entry["scene"]
            try:
                clip = VideoFileClip(movie_path).subclip(
                    entry["start_time"], entry["end_time"]
                )
                # Scene description overlay
                if scene.caption:
                    clip = render_scene_description_overlay(clip, scene.caption, font_size=24)
                # Progress bar
                clip = add_progress_bar(clip, entry["position_ratio"])
                # Character names on first appearance (first frame of scene)
                clips.append(clip)
            except Exception as e:
                logger.warning(f"Failed to load clip for scene {scene.scene_id}: {e}")

        elif entry["type"] == "narration":
            # Black frame with narration audio
            duration = entry.get("duration", 3.0)
            w, h = config.OUTPUT_RESOLUTION
            black = ColorClip(size=(w, h), color=(0, 0, 0), duration=duration)
            try:
                audio = AudioFileClip(entry["audio_path"])
                black = black.set_audio(audio)
                # Show narration text as subtitle
                text = entry.get("text", "")
                if text:
                    black = render_scene_description_overlay(black, text[:200], font_size=28)
            except Exception as e:
                logger.warning(f"Narration clip failed: {e}")
            clips.append(black)

        elif entry["type"] == "transition":
            # Brief fade handled by moviepy crossfade
            pass

    if not clips:
        logger.error("No clips to render!")
        return output_path

    logger.info(f"Concatenating {len(clips)} clips...")
    final = concatenate_videoclips(clips, method="compose")

    logger.info(f"Writing explainer to {output_path}...")
    final.write_videofile(
        output_path,
        codec=config.OUTPUT_CODEC,
        audio_codec=config.OUTPUT_AUDIO_CODEC,
        fps=config.OUTPUT_FPS,
        logger=None,
        ffmpeg_params=["-preset", "fast", "-crf", "22"],
    )
    final.close()
    logger.info(f"Explainer saved: {output_path}")
    return output_path
