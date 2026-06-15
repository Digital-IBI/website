"""
Themed reel generator: assembles scene clips for a ThemeQuery result
(e.g. "all badass scenes from Character A") into a single MP4.

Reuses arc_reel_generator's clip-building logic (time-jump cards,
progress bar, caption overlay) but adds themed title cards and
character-specific lower-thirds.
"""
from __future__ import annotations
from pathlib import Path

from .config import Config
from .data_models import Character, Scene
from .themed_reel import ThemeQuery, ThemeScorer, find_themed_scenes, BUILTIN_THEMES
from .arc_reel_generator import build_arc_reel_clips
from .utils.logging_setup import logger


def _make_theme_title_card(label: str, subtitle: str, resolution: tuple[int, int], duration: float = 2.5):
    """Opening title card with theme label and optional subtitle."""
    from moviepy.editor import TextClip, ColorClip, CompositeVideoClip

    w, h = resolution
    # Dark gradient background
    bg = ColorClip(size=(w, h), color=(10, 10, 30), duration=duration)

    clips = [bg]
    try:
        title_clip = (
            TextClip(label.upper(), fontsize=64, color="white",
                     font="Liberation-Sans-Bold", method="label")
            .set_position(("center", h * 0.38))
            .set_duration(duration)
        )
        clips.append(title_clip)
    except Exception:
        pass

    if subtitle:
        try:
            sub_clip = (
                TextClip(subtitle, fontsize=28, color="#aaaaaa",
                         font="Liberation-Sans", method="label")
                .set_position(("center", h * 0.58))
                .set_duration(duration)
            )
            clips.append(sub_clip)
        except Exception:
            pass

    result = CompositeVideoClip(clips)
    return result.fadein(0.5).fadeout(0.5)


def _character_label(character_ids: list[str], characters: list[Character]) -> str:
    """Build a display label from character IDs."""
    char_by_id = {c.character_id: (c.name or c.character_id) for c in characters}
    names = [char_by_id.get(cid, cid) for cid in character_ids if cid in char_by_id]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} & {names[1]}"
    return ", ".join(names[:-1]) + f" & {names[-1]}"


def generate_themed_reel(
    query: ThemeQuery,
    themed_scenes: list[tuple[Scene, float]],
    all_scenes: list[Scene],
    movie_path: str,
    characters: list[Character],
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> str:
    """
    Render one themed compilation reel. Returns output path.
    """
    from moviepy.editor import concatenate_videoclips

    config.REELS_DIR.mkdir(parents=True, exist_ok=True)

    safe_label = query.display_label().replace(" ", "_").replace("/", "-")[:40]
    char_suffix = ""
    if query.character_ids:
        char_suffix = "_" + "_".join(query.character_ids[:2])
    output_path = str(config.REELS_DIR / f"themed_{query.theme}{char_suffix}_{safe_label}.mp4")

    if Path(output_path).exists():
        logger.info(f"Themed reel already exists: {output_path}")
        return output_path

    if not themed_scenes:
        logger.warning(f"No scenes for themed reel '{query.display_label()}'")
        return output_path

    scenes_only = [s for s, _ in themed_scenes]
    duration_s = sum(s.duration for s in scenes_only)
    logger.info(
        f"Generating themed reel: '{query.display_label()}' "
        f"({len(scenes_only)} scenes, {duration_s:.0f}s)"
    )

    # Build scene clips (reuses arc logic: time-jump cards, progress bar, overlays)
    # Wrap in a lightweight NarrativeThread-like object for build_arc_reel_clips
    thread_stub = _ThreadStub(query, scenes_only)
    clips = build_arc_reel_clips(
        scenes_only, movie_path, thread_stub, characters, config, total_movie_duration
    )

    if not clips:
        logger.error(f"No clips built for themed reel '{query.display_label()}'")
        return output_path

    # Prepend title card
    char_label = _character_label(query.character_ids, characters) if query.character_ids else ""
    subtitle = char_label or BUILTIN_THEMES.get(query.theme, {}).get("descriptor", "")[:60]
    title_card = _make_theme_title_card(query.display_label(), subtitle, config.OUTPUT_RESOLUTION)
    clips = [title_card] + clips

    # Optional TTS narration
    if local_llm is not None:
        _add_themed_narration(clips[1:], scenes_only, characters, query, local_llm, config)

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
        logger.info(f"Themed reel saved: {output_path} ({final.duration:.0f}s)")
    except Exception as e:
        logger.error(f"Themed reel render failed for '{query.display_label()}': {e}")

    for c in clips:
        try:
            c.close()
        except Exception:
            pass

    return output_path


class _ThreadStub:
    """Minimal duck-type for NarrativeThread used by build_arc_reel_clips."""
    def __init__(self, query: ThemeQuery, scenes: list[Scene]) -> None:
        self.topic = query.display_label()
        self.scene_ids = [s.scene_id for s in scenes]
        self.time_span_minutes = (
            (scenes[-1].end_time - scenes[0].start_time) / 60 if scenes else 0
        )


def _add_themed_narration(
    scene_clips: list,
    scenes: list[Scene],
    characters: list[Character],
    query: ThemeQuery,
    local_llm,
    config: Config,
) -> None:
    """Generate TTS narration and mix over the last scene clip."""
    from .voice_over import text_to_speech, mix_narration_with_video

    char_by_id = {c.character_id: (c.name or c.character_id) for c in characters}
    char_names = list({char_by_id.get(cid, cid) for s in scenes for cid in s.character_ids if cid})

    total_dur = sum(getattr(c, "duration", 0) for c in scene_clips if hasattr(c, "duration"))
    target_words = max(20, int(total_dur / 60 * 80))  # 80 wpm keeps it punchy

    scene_lines = []
    for s in scenes:
        chars = [char_by_id.get(cid, cid) for cid in s.character_ids]
        scene_lines.append(f"- [{s.dominant_emotion or 'neutral'}] {s.caption or '(no caption)'}")

    char_context = f"featuring {', '.join(char_names[:3])}" if char_names else ""
    system = (
        "You write short, punchy narration for viral movie compilation videos. "
        "Your tone matches the theme. Keep it under "
        f"{target_words} words. Return only the narration text."
    )
    user = (
        f"Write narration for a '{query.display_label()}' movie compilation "
        f"{char_context}.\n\n"
        f"Scenes:\n" + "\n".join(scene_lines)
    )

    tts_path = str(config.TTS_DIR / f"themed_{query.theme}_{hash(query.display_label()) & 0xFFFF:04x}.wav")
    try:
        narration = local_llm.generate(system, user, max_tokens=target_words * 4)
        config.TTS_DIR.mkdir(parents=True, exist_ok=True)
        text_to_speech(narration, tts_path, config)
        if scene_clips and Path(tts_path).exists():
            scene_clips[-1] = mix_narration_with_video(scene_clips[-1], tts_path, original_audio_volume=0.2)
    except Exception as e:
        logger.warning(f"Themed narration failed: {e}")


def generate_all_themed_reels(
    queries: list[ThemeQuery],
    scenes: list[Scene],
    characters: list[Character],
    movie_path: str,
    local_llm,
    config: Config,
    total_movie_duration: float,
) -> list[tuple[ThemeQuery, str]]:
    """
    Score and generate themed reels for all queries.
    Shares a single ThemeScorer (sentence-transformer loaded once).
    """
    scorer = ThemeScorer()
    results: list[tuple[ThemeQuery, str]] = []

    for query in queries:
        themed_scenes = find_themed_scenes(scenes, characters, query, scorer)
        path = generate_themed_reel(
            query, themed_scenes, scenes, movie_path,
            characters, local_llm, config, total_movie_duration,
        )
        results.append((query, path))

    return results
