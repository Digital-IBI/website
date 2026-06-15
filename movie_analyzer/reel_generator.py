from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from .config import Config
from .data_models import Character, ReelSegment, Scene
from .narration_writer import write_reel_title
from .text_overlay import (
    render_lower_third,
    render_scene_description_overlay,
    add_progress_bar,
)
from .voice_over import text_to_speech
from .utils.logging_setup import logger


def generate_reel(
    segment: ReelSegment,
    scenes: list[Scene],
    movie_path: str,
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> ReelSegment:
    """Produce a single reel MP4 from a segment."""
    from moviepy.editor import VideoFileClip, CompositeVideoClip

    config.REELS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(config.REELS_DIR / f"{segment.segment_id}_{segment.category}.mp4")

    if Path(output_path).exists():
        logger.info(f"Reel already exists: {output_path}")
        segment.output_path = output_path
        return segment

    logger.info(f"Generating reel: {segment.segment_id} ({segment.duration:.0f}s, {segment.category})")

    title = write_reel_title(segment, scenes, local_llm)
    seg_scenes = [s for s in scenes if s.scene_id in segment.scene_ids]
    caption = " ".join(s.caption or "" for s in seg_scenes[:2])[:120]
    char_by_id: dict[str, str] = {c.character_id: (c.name or c.character_id) for c in characters}

    try:
        clip = VideoFileClip(movie_path).subclip(segment.start_time, segment.end_time)

        # Add lower-third with title
        clip = render_lower_third(clip, title, segment.category.upper())

        # Add scene description subtitle
        if caption:
            clip = render_scene_description_overlay(clip, caption, font_size=24)

        # Add progress bar showing position in movie
        position_ratio = segment.start_time / max(total_movie_duration, 1.0)
        clip = add_progress_bar(clip, position_ratio)

        clip.write_videofile(
            output_path,
            codec=config.OUTPUT_CODEC,
            audio_codec=config.OUTPUT_AUDIO_CODEC,
            fps=config.OUTPUT_FPS,
            logger=None,
            ffmpeg_params=["-preset", "fast", "-crf", "23"],
        )
        clip.close()
        segment.output_path = output_path
        logger.info(f"  → Saved: {output_path}")

    except Exception as e:
        logger.error(f"Failed to generate reel {segment.segment_id}: {e}")

    return segment


def generate_all_reels(
    segments: list[ReelSegment],
    scenes: list[Scene],
    movie_path: str,
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> list[ReelSegment]:
    """Generate all reels with limited parallelism (memory constrained)."""
    logger.info(f"Generating {len(segments)} reels...")

    def _gen(seg: ReelSegment) -> ReelSegment:
        return generate_reel(seg, scenes, movie_path, characters, local_llm,
                             config, total_movie_duration)

    # Limit to 2 workers — video decoding is memory-heavy
    with ThreadPoolExecutor(max_workers=2) as pool:
        segments = list(pool.map(_gen, segments))

    completed = sum(1 for s in segments if s.output_path)
    logger.info(f"Completed {completed}/{len(segments)} reels")
    return segments
