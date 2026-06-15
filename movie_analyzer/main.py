#!/usr/bin/env python3
"""
Movie Analyzer CLI — local-first ML pipeline.

Usage:
  python -m movie_analyzer.main analyze --movie /path/to/movie.mp4
  python -m movie_analyzer.main reels   --movie /path/to/movie.mp4
  python -m movie_analyzer.main explainer --movie /path/to/movie.mp4
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

from .config import Config
from .utils.logging_setup import logger


# ─── Serialisation helpers ───────────────────────────────────────────────────

def _save_checkpoint(analysis: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(analysis, indent=2, default=str))
    logger.info(f"Checkpoint saved: {path}")


def _load_checkpoint(path: Path) -> dict | None:
    if path.exists():
        logger.info(f"Resuming from checkpoint: {path}")
        return json.loads(path.read_text())
    return None


def _scenes_to_dict(scenes) -> list[dict]:
    result = []
    for s in scenes:
        d = {
            "scene_id": s.scene_id,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration": s.duration,
            "keyframe_paths": s.keyframe_paths,
            "character_ids": s.character_ids,
            "caption": s.caption,
            "dominant_emotion": s.dominant_emotion,
            "audio_energy": s.audio_energy,
            "speech_rate": s.speech_rate,
            "reel_score": s.reel_score,
            "reel_score_reason": s.reel_score_reason,
            "dialogue": [
                {
                    "speaker_id": dl.speaker_id,
                    "text": dl.text,
                    "start_time": dl.start_time,
                    "end_time": dl.end_time,
                    "confidence": dl.confidence,
                    "emotions": dl.emotions,
                }
                for dl in s.dialogue
            ],
        }
        result.append(d)
    return result


def _characters_to_dict(characters) -> list[dict]:
    result = []
    for c in characters:
        d = {
            "character_id": c.character_id,
            "name": c.name,
            "representative_face_path": c.representative_face_path,
            "total_screen_time": c.total_screen_time,
            "scenes_appeared": c.scenes_appeared,
            "dialogue_count": len(c.dialogue_lines),
            "personality": None,
        }
        if c.personality:
            d["personality"] = {
                "big_five": c.personality.big_five,
                "dominant_traits": c.personality.dominant_traits,
                "emotion_distribution": c.personality.emotion_distribution,
                "summary": c.personality.summary,
                "evidence": c.personality.evidence,
            }
        result.append(d)
    return result


# ─── Pipeline stages ──────────────────────────────────────────────────────────

def run_analyze(args, config: Config) -> None:
    from .video_processor import detect_scenes, extract_keyframes, extract_audio, get_video_metadata
    from .transcript_processor import transcribe_movie, align_dialogue_to_scenes, save_transcript
    from .scene_captioner import caption_all_scenes
    from .emotion_analyzer import analyze_all_dialogue
    from .utils.audio_analysis import analyze_scenes as analyze_audio_scenes
    from .character_detector import (
        extract_face_embeddings, cluster_faces_into_characters,
        infer_character_names, assign_characters_to_scenes,
        assign_dialogue_speakers, save_character_profiles,
    )
    from .personality_analyzer import analyze_all_characters
    from .segment_selector import score_all_scenes, find_reel_segments
    from .reel_generator import generate_all_reels

    movie_path = args.movie
    checkpoint_path = config.OUTPUT_DIR / "analysis_report.json"
    checkpoint = _load_checkpoint(checkpoint_path) if args.resume else None

    # ── 1. Video metadata ──
    logger.info(f"Analysing movie: {movie_path}")
    meta = get_video_metadata(movie_path)
    total_duration = meta["duration"]
    logger.info(f"Duration: {total_duration/60:.1f} min | {meta['width']}x{meta['height']} @ {meta['fps']:.1f}fps")

    # ── 2. Scene detection ──
    scenes = detect_scenes(movie_path, config)
    scenes = extract_keyframes(movie_path, scenes, config, n_frames=config.KEYFRAMES_PER_SCENE)

    # ── 3. Audio + transcription ──
    audio_path = extract_audio(movie_path, config)
    dialogue = transcribe_movie(audio_path, config)
    scenes = align_dialogue_to_scenes(dialogue, scenes)
    save_transcript(dialogue, str(config.OUTPUT_DIR / "transcript.json"))

    # ── 4. Scene captioning (BLIP-2) ──
    if not args.skip_captions:
        scenes = caption_all_scenes(scenes, config)

    # ── 5. Emotion analysis ──
    dialogue, scenes = analyze_all_dialogue(dialogue, scenes, batch_size=config.EMOTION_BATCH_SIZE)

    # ── 6. Audio energy (librosa) ──
    scenes = analyze_audio_scenes(audio_path, scenes)

    # ── 7. Character detection ──
    if not args.skip_faces:
        embeddings = extract_face_embeddings(scenes, config)
        characters = cluster_faces_into_characters(embeddings, config)
        characters = infer_character_names(characters, dialogue)
        scenes, characters = assign_characters_to_scenes(scenes, characters)
        dialogue = assign_dialogue_speakers(characters, dialogue)
    else:
        characters = []
        logger.info("Face detection skipped (--skip-faces)")

    # ── Checkpoint 1 ──
    _save_checkpoint({
        "movie_path": movie_path,
        "total_duration": total_duration,
        "meta": meta,
        "scenes": _scenes_to_dict(scenes),
        "characters": _characters_to_dict(characters),
        "stage": "pre_llm",
    }, checkpoint_path)
    save_character_profiles(characters, config.CHARACTERS_DIR)

    # ── 8. Initialise local LLM ──
    local_llm = None
    if not args.skip_llm:
        try:
            from .utils.local_llm import LocalLLM
            local_llm = LocalLLM(
                backend=config.LLM_BACKEND,
                ollama_model=config.OLLAMA_MODEL,
                ollama_host=config.OLLAMA_HOST,
                transformers_model=config.TRANSFORMERS_LLM_MODEL,
            )
        except Exception as e:
            logger.warning(f"Local LLM unavailable: {e}. Running without LLM tasks.")

    # ── 9. Personality analysis ──
    if not args.skip_personality and characters:
        characters = analyze_all_characters(characters, local_llm)
        save_character_profiles(characters, config.CHARACTERS_DIR)

    # ── 10. Reel scoring ──
    scenes = score_all_scenes(scenes, characters, local_llm, config)
    segments = find_reel_segments(scenes, config)

    # ── Checkpoint 2 (full) ──
    _save_checkpoint({
        "movie_path": movie_path,
        "total_duration": total_duration,
        "meta": meta,
        "scenes": _scenes_to_dict(scenes),
        "characters": _characters_to_dict(characters),
        "segments": [
            {
                "segment_id": seg.segment_id,
                "scene_ids": seg.scene_ids,
                "start_time": seg.start_time,
                "end_time": seg.end_time,
                "duration": seg.duration,
                "score": seg.score,
                "category": seg.category,
                "reason": seg.reason,
            }
            for seg in segments
        ],
        "stage": "complete",
    }, checkpoint_path)

    # ── 11. Generate contiguous reels ──
    if not args.skip_reels:
        segments = generate_all_reels(
            segments, scenes, movie_path, characters, local_llm, config, total_duration
        )

    # ── 11b. Narrative arc reels (non-contiguous story threads) ──
    if not args.skip_arc_reels:
        from .story_arc_detector import find_best_arc_threads
        from .arc_reel_generator import generate_all_arc_reels

        arc_results = find_best_arc_threads(
            scenes,
            characters,
            local_llm,
            target_duration=args.arc_reel_duration,
            max_threads=args.max_arc_reels,
            distance_threshold=args.arc_threshold,
        )
        logger.info(f"Found {len(arc_results)} narrative arc threads")
        for thread, arc_scenes in arc_results:
            logger.info(
                f"  '{thread.topic}': {len(arc_scenes)} scenes, "
                f"{thread.time_span_minutes:.0f} min span, "
                f"coherence={thread.coherence_score:.3f}"
            )
        generate_all_arc_reels(
            arc_results, scenes, movie_path, characters, local_llm, config, total_duration
        )

    # ── 12. Movie structure analysis (central theme, acts, character roles) ──
    from .movie_analyst import analyse_movie_structure
    from .explainer_generator import (
        select_explainer_scenes, build_and_render_explainer,
    )

    structure = None
    if not args.skip_explainer:
        structure = analyse_movie_structure(scenes, characters, local_llm, total_duration)
        logger.info(f"Central theme: {structure.central_theme}")
        logger.info(f"Genre: {structure.genre} | Tone: {structure.tone}")
        logger.info(f"Acts: {[a.title for a in structure.acts]}")
        logger.info(f"Key turning points: {structure.key_turning_points}")

    # ── 13. Generate explainer ──
    if not args.skip_explainer and structure is not None:
        target_secs = args.explainer_duration * 60
        explainer_scenes = select_explainer_scenes(
            scenes, structure, target_secs, total_duration
        )
        explainer_path = str(config.OUTPUT_DIR / "explainer.mp4")
        build_and_render_explainer(
            explainer_scenes, scenes, characters, structure,
            movie_path, config, explainer_path, total_duration,
            local_llm=local_llm,
            add_character_intros=(not args.skip_character_intros),
        )

    logger.info("Analysis complete!")
    logger.info(f"  Output:     {config.OUTPUT_DIR}/")
    logger.info(f"  Characters: {config.CHARACTERS_DIR}/")
    logger.info(f"  Reels:      {config.REELS_DIR}/")
    logger.info(f"  Arc reels:  {config.REELS_DIR}/*_arc.mp4")
    logger.info(f"  Explainer:  {config.OUTPUT_DIR}/explainer.mp4")


def run_reels(args, config: Config) -> None:
    """Re-generate reels from an existing analysis checkpoint."""
    from .reel_generator import generate_all_reels
    from .segment_selector import find_reel_segments
    from .data_models import ReelSegment, Scene

    checkpoint_path = config.OUTPUT_DIR / "analysis_report.json"
    data = _load_checkpoint(checkpoint_path)
    if not data:
        logger.error("No checkpoint found. Run 'analyze' first.")
        sys.exit(1)

    # Reconstruct minimal objects needed
    from .data_models import Scene, DialogueLine
    scenes = []
    for sd in data.get("scenes", []):
        s = Scene(
            scene_id=sd["scene_id"],
            start_time=sd["start_time"],
            end_time=sd["end_time"],
            duration=sd["duration"],
            keyframe_paths=sd.get("keyframe_paths", []),
            character_ids=sd.get("character_ids", []),
            caption=sd.get("caption"),
            dominant_emotion=sd.get("dominant_emotion"),
            audio_energy=sd.get("audio_energy"),
            speech_rate=sd.get("speech_rate"),
            reel_score=sd.get("reel_score"),
            reel_score_reason=sd.get("reel_score_reason"),
        )
        scenes.append(s)

    segments_raw = data.get("segments", [])
    segments = []
    for sr in segments_raw:
        segments.append(ReelSegment(
            segment_id=sr["segment_id"],
            scene_ids=sr["scene_ids"],
            start_time=sr["start_time"],
            end_time=sr["end_time"],
            duration=sr["duration"],
            score=sr["score"],
            category=sr["category"],
            reason=sr["reason"],
        ))

    if not segments:
        segments = find_reel_segments(scenes, config)

    segments = segments[: args.top_reels]
    generate_all_reels(
        segments, scenes, args.movie, [], None, config,
        data.get("total_duration", 7200)
    )


def run_explainer(args, config: Config) -> None:
    """Re-generate explainer from an existing analysis checkpoint."""
    from .movie_analyst import analyse_movie_structure
    from .explainer_generator import select_explainer_scenes, build_and_render_explainer
    from .data_models import Scene

    checkpoint_path = config.OUTPUT_DIR / "analysis_report.json"
    data = _load_checkpoint(checkpoint_path)
    if not data:
        logger.error("No checkpoint found. Run 'analyze' first.")
        sys.exit(1)

    scenes = []
    for sd in data.get("scenes", []):
        s = Scene(
            scene_id=sd["scene_id"],
            start_time=sd["start_time"],
            end_time=sd["end_time"],
            duration=sd["duration"],
            keyframe_paths=sd.get("keyframe_paths", []),
            character_ids=sd.get("character_ids", []),
            caption=sd.get("caption"),
            dominant_emotion=sd.get("dominant_emotion"),
            reel_score=sd.get("reel_score"),
        )
        scenes.append(s)

    total_duration = data.get("total_duration", 7200)
    target_secs = getattr(args, "explainer_duration", 20.0) * 60

    structure = analyse_movie_structure(scenes, [], None, total_duration)
    explainer_scenes = select_explainer_scenes(scenes, structure, target_secs, total_duration)
    build_and_render_explainer(
        explainer_scenes, scenes, [], structure,
        local_llm=None,
        movie_path=args.movie,
        config=config,
        output_path=str(config.OUTPUT_DIR / "explainer.mp4"),
        total_movie_duration=total_duration,
        add_character_intros=False,
    )


def _parse_theme_arg(raw: str, default_duration: float, default_min_score: float):
    """
    Parse a --theme argument:
      funny
      badass:character_001
      romantic:character_001:character_002
      badass:character_001:John's Moments
      romantic:character_001:character_002:Their Love Story
      custom:my custom descriptor text:My Label
    Returns a ThemeQuery.
    """
    from .themed_reel import ThemeQuery, BUILTIN_THEMES

    parts = [p.strip() for p in raw.split(":")]
    theme = parts[0]
    character_ids: list[str] = []
    label = ""
    custom_descriptor = ""

    remaining = parts[1:]
    if theme == "custom":
        # custom:descriptor[:label]
        if remaining:
            custom_descriptor = remaining[0]
            remaining = remaining[1:]
        if remaining:
            label = remaining[0]
    else:
        # Collect character IDs (look like "character_NNN" or short ids)
        while remaining:
            part = remaining[0]
            # Heuristic: if it looks like a character id (alphanumeric+underscore, no spaces)
            if part and " " not in part and (part.startswith("character") or len(part) < 20):
                character_ids.append(part)
                remaining = remaining[1:]
            else:
                break
        if remaining:
            label = ":".join(remaining)  # label may contain colons

    if not label:
        if character_ids:
            char_part = " & ".join(character_ids[:2])
            label = f"{char_part}'s {theme.title()} Moments"
        else:
            label = f"{theme.title()} Moments"

    return ThemeQuery(
        theme=theme,
        character_ids=character_ids,
        character_filter_mode="any",
        custom_descriptor=custom_descriptor,
        min_score=default_min_score,
        target_duration=default_duration,
        label=label,
    )


def run_themed_reels(args, config: Config) -> None:
    """Generate themed compilations from a saved analysis checkpoint."""
    from .data_models import Scene, DialogueLine
    from .themed_reel import ThemeQuery
    from .themed_reel_generator import generate_all_themed_reels

    checkpoint_path = config.OUTPUT_DIR / "analysis_report.json"
    data = _load_checkpoint(checkpoint_path)
    if not data:
        logger.error(
            "No analysis checkpoint found at %s. "
            "Run 'analyze' first: python -m movie_analyzer.main analyze --movie ...",
            checkpoint_path,
        )
        sys.exit(1)

    # Reconstruct scenes from checkpoint
    scenes: list[Scene] = []
    for sd in data.get("scenes", []):
        s = Scene(
            scene_id=sd["scene_id"],
            start_time=sd["start_time"],
            end_time=sd["end_time"],
            duration=sd["duration"],
            keyframe_paths=sd.get("keyframe_paths", []),
            character_ids=sd.get("character_ids", []),
            caption=sd.get("caption"),
            dominant_emotion=sd.get("dominant_emotion"),
            audio_energy=sd.get("audio_energy"),
            speech_rate=sd.get("speech_rate"),
            reel_score=sd.get("reel_score"),
            reel_score_reason=sd.get("reel_score_reason"),
            dialogue=[
                DialogueLine(
                    speaker_id=dl.get("speaker_id"),
                    text=dl["text"],
                    start_time=dl["start_time"],
                    end_time=dl["end_time"],
                    confidence=dl.get("confidence", 1.0),
                    emotions=dl.get("emotions"),
                )
                for dl in sd.get("dialogue", [])
            ],
        )
        scenes.append(s)

    total_duration = data.get("total_duration", 7200.0)
    theme_strs = getattr(args, "themes", None) or []

    if not theme_strs:
        logger.error(
            "No themes specified. Use --theme THEME (e.g. --theme funny --theme badass). "
            "Run --list-themes to see options."
        )
        sys.exit(1)

    default_dur = getattr(args, "duration", 90.0)
    default_min = getattr(args, "min_score", 0.25)
    queries: list[ThemeQuery] = [
        _parse_theme_arg(t, default_dur, default_min) for t in theme_strs
    ]
    for q in queries:
        logger.info(f"Theme query: '{q.display_label()}' | char filter: {q.character_ids or 'none'}")

    # Optional local LLM for narration
    local_llm = None
    try:
        from .utils.local_llm import LocalLLM
        local_llm = LocalLLM(
            backend=config.LLM_BACKEND,
            ollama_model=config.OLLAMA_MODEL,
            ollama_host=config.OLLAMA_HOST,
            transformers_model=config.TRANSFORMERS_LLM_MODEL,
        )
    except Exception as e:
        logger.warning(f"Local LLM unavailable: {e}")

    results = generate_all_themed_reels(
        queries, scenes, [], args.movie, local_llm, config, total_duration
    )

    logger.info(f"\nGenerated {len(results)} themed reels:")
    for query, path in results:
        logger.info(f"  '{query.display_label()}' → {path}")


# ─── CLI ─────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m movie_analyzer.main",
        description="Movie Analyzer — local-first ML pipeline",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # Shared args
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument("--movie", required=True, help="Path to input movie file")
    shared.add_argument("--output-dir", default="output", help="Output directory")
    shared.add_argument("--top-reels", type=int, default=10)

    # analyze
    p_analyze = sub.add_parser("analyze", parents=[shared], help="Full pipeline")
    p_analyze.add_argument("--whisper-model", default="base",
                           choices=["tiny", "base", "small", "medium", "large"])
    p_analyze.add_argument("--llm-backend", default="auto",
                           choices=["auto", "ollama", "transformers", "none"])
    p_analyze.add_argument("--ollama-model", default="llama3.2:3b")
    p_analyze.add_argument("--skip-faces", action="store_true")
    p_analyze.add_argument("--skip-captions", action="store_true",
                           help="Skip BLIP-2 scene captioning (faster)")
    p_analyze.add_argument("--skip-personality", action="store_true")
    p_analyze.add_argument("--skip-llm", action="store_true",
                           help="Skip all LLM tasks (purely signal-based scoring)")
    p_analyze.add_argument("--skip-reels", action="store_true")
    p_analyze.add_argument("--skip-arc-reels", action="store_true",
                           help="Skip narrative arc reel generation")
    p_analyze.add_argument("--arc-reel-duration", type=float, default=60.0,
                           help="Target duration (seconds) for each arc reel (default: 60)")
    p_analyze.add_argument("--max-arc-reels", type=int, default=8,
                           help="Maximum number of arc reels to generate (default: 8)")
    p_analyze.add_argument("--arc-threshold", type=float, default=0.45,
                           help="Semantic clustering distance threshold (lower=tighter clusters)")
    p_analyze.add_argument("--skip-explainer", action="store_true")
    p_analyze.add_argument("--explainer-duration", type=float, default=20.0,
                           help="Target explainer duration in minutes (default: 20, range 15-25)")
    p_analyze.add_argument("--skip-character-intros", action="store_true",
                           help="Skip character introduction montage at start of explainer")
    p_analyze.add_argument("--resume", action="store_true",
                           help="Resume from existing checkpoint")
    p_analyze.add_argument("--cloud-ai", action="store_true",
                           help="Use Claude API for narration/personality (requires ANTHROPIC_API_KEY)")
    p_analyze.add_argument("--log-level", default="INFO",
                           choices=["DEBUG", "INFO", "WARNING", "ERROR"])

    # reels
    p_reels = sub.add_parser("reels", parents=[shared], help="Regenerate reels from checkpoint")

    # explainer
    p_exp = sub.add_parser("explainer", parents=[shared],
                            help="Regenerate explainer from checkpoint")

    # themed-reel — curated compilations from a saved checkpoint
    p_themed = sub.add_parser(
        "themed-reel",
        parents=[shared],
        help="Generate themed compilations from a saved analysis checkpoint",
    )
    p_themed.add_argument(
        "--theme",
        action="append",
        dest="themes",
        metavar="THEME[:CHARACTER_ID[:CHARACTER_ID2]][:LABEL]",
        help=(
            "Theme to compile. Format: theme[:char_id[:char2_id]][:label]. "
            "Repeat for multiple compilations. "
            "Built-in themes: funny, badass, romantic, sexy, scary, sad, action, dramatic, tense, triumphant. "
            "Examples:\n"
            "  --theme funny\n"
            "  --theme 'badass:character_001:John Wick Moments'\n"
            "  --theme 'romantic:character_001:character_002:Their Love Story'\n"
            "  --theme 'custom:My Theme Descriptor'"
        ),
    )
    p_themed.add_argument(
        "--duration", type=float, default=90.0,
        help="Target reel duration in seconds (default: 90)",
    )
    p_themed.add_argument(
        "--min-score", type=float, default=0.25,
        help="Minimum theme match score to include a scene (default: 0.25)",
    )
    p_themed.add_argument(
        "--list-themes", action="store_true",
        help="Print available built-in themes and exit",
    )

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    config = Config()
    config.OUTPUT_DIR = Path(args.output_dir)
    config.FRAMES_DIR = config.OUTPUT_DIR / "frames"
    config.AUDIO_DIR = config.OUTPUT_DIR / "audio"
    config.TTS_DIR = config.OUTPUT_DIR / "tts"
    config.CHARACTERS_DIR = config.OUTPUT_DIR / "characters"
    config.REELS_DIR = config.OUTPUT_DIR / "reels"
    config.TOP_REELS_COUNT = args.top_reels
    config.setup_dirs()

    if args.command == "analyze":
        config.WHISPER_MODEL = args.whisper_model
        config.LLM_BACKEND = args.llm_backend if args.llm_backend != "none" else "auto"
        if args.llm_backend == "none":
            args.skip_llm = True
        config.OLLAMA_MODEL = args.ollama_model
        from .utils.logging_setup import setup_logging
        setup_logging(args.log_level)
        run_analyze(args, config)

    elif args.command == "reels":
        run_reels(args, config)

    elif args.command == "explainer":
        run_explainer(args, config)

    elif args.command == "themed-reel":
        if getattr(args, "list_themes", False):
            from .themed_reel import BUILTIN_THEMES
            print("\nBuilt-in themes:")
            for name, td in BUILTIN_THEMES.items():
                print(f"  {name:<14} — {td['descriptor'][:60]}")
            print()
            return
        run_themed_reels(args, config)


if __name__ == "__main__":
    main()
