from __future__ import annotations
import asyncio
import threading
from pathlib import Path
from typing import Any, Optional

from ...config import Config
from ...utils.logging_setup import logger
from .callbacks import ProgressCallback
from .presets import WORKFLOW_PRESETS


def _stage_weights(workflow: str) -> dict[str, float]:
    preset = WORKFLOW_PRESETS.get(workflow, WORKFLOW_PRESETS["full_pipeline"])
    stages = preset["stages"]
    # Assign relative cost per stage (weights must sum to 1)
    COSTS = {
        "scene_detection": 3,
        "frame_extraction": 4,
        "audio_extraction": 2,
        "transcription": 12,
        "scene_captioning": 15,
        "emotion_analysis": 6,
        "audio_features": 4,
        "face_detection": 10,
        "character_clustering": 3,
        "personality_analysis": 5,
        "story_analysis": 5,
        "reel_scoring": 5,
        "arc_detection": 5,
        "reel_generation": 8,
        "arc_reel_generation": 6,
        "explainer_generation": 12,
        "themed_reel_generation": 8,
    }
    total = sum(COSTS.get(s, 3) for s in stages)
    return {s: COSTS.get(s, 3) / total for s in stages}


def run_themed_pipeline(
    job_id: str,
    movie_path: str,
    output_dir: str,
    options: dict[str, Any],
    loop: asyncio.AbstractEventLoop,
    cancel_event: threading.Event,
) -> dict[str, Any]:
    """Themed compilation runner — reads from an existing checkpoint."""
    import json

    weights = {"themed_reel_generation": 1.0}
    cb = ProgressCallback(job_id, loop, weights)

    config = Config()
    config.OUTPUT_DIR = Path(output_dir)
    config.FRAMES_DIR = config.OUTPUT_DIR / "frames"
    config.AUDIO_DIR = config.OUTPUT_DIR / "audio"
    config.TTS_DIR = config.OUTPUT_DIR / "tts"
    config.CHARACTERS_DIR = config.OUTPUT_DIR / "characters"
    config.REELS_DIR = config.OUTPUT_DIR / "reels"
    config.setup_dirs()

    checkpoint_path = options.get("existing_checkpoint") or str(config.OUTPUT_DIR / "analysis_report.json")
    cp = Path(checkpoint_path)
    if not cp.exists():
        raise FileNotFoundError(
            f"No analysis checkpoint at {checkpoint_path}. "
            "Run analyze_only workflow first."
        )

    data = json.loads(cp.read_text())

    from ...data_models import Scene, DialogueLine
    from ...themed_reel import ThemeQuery
    from ...themed_reel_generator import generate_all_themed_reels

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

    raw_queries = options.get("queries", [])
    if not raw_queries:
        raise ValueError("No queries provided. Pass 'queries' in options.")

    queries = [
        ThemeQuery(
            theme=q["theme"],
            character_ids=q.get("character_ids", []),
            character_filter_mode=q.get("character_filter_mode", "any"),
            custom_descriptor=q.get("custom_descriptor", ""),
            min_score=q.get("min_score", 0.25),
            max_scenes=q.get("max_scenes", 25),
            target_duration=q.get("target_duration", 90.0),
            label=q.get("label", ""),
        )
        for q in raw_queries
    ]

    local_llm = None
    try:
        from ...utils.local_llm import LocalLLM
        local_llm = LocalLLM(
            backend=config.LLM_BACKEND,
            ollama_model=config.OLLAMA_MODEL,
            ollama_host=config.OLLAMA_HOST,
            transformers_model=config.TRANSFORMERS_LLM_MODEL,
        )
    except Exception as e:
        logger.warning(f"Local LLM unavailable: {e}")

    if cancel_event.is_set():
        raise InterruptedError("Job cancelled")

    cb.stage_start("themed_reel_generation", f"Generating {len(queries)} themed reels")
    results = generate_all_themed_reels(
        queries, scenes, [], movie_path, local_llm, config, total_duration
    )
    cb.stage_done(f"{len(results)} reels generated")

    outputs: dict[str, Any] = {
        "themed_reels": {q.display_label(): path for q, path in results},
    }
    cb.complete(outputs)
    return outputs


def run_pipeline(
    job_id: str,
    workflow: str,
    movie_path: str,
    output_dir: str,
    options: dict[str, Any],
    loop: asyncio.AbstractEventLoop,
    cancel_event: threading.Event,
) -> dict[str, Any]:
    """
    Synchronous pipeline runner — called from a ThreadPoolExecutor.
    Returns outputs dict on success; raises on failure.
    """
    weights = _stage_weights(workflow)
    cb = ProgressCallback(job_id, loop, weights)
    preset = WORKFLOW_PRESETS.get(workflow, WORKFLOW_PRESETS["full_pipeline"])
    active_stages = set(preset["stages"])

    # Merge preset defaults with user options (user overrides win)
    opts: dict[str, Any] = {**preset["default_options"], **options}

    def _check_cancel():
        if cancel_event.is_set():
            raise InterruptedError("Job cancelled by user")

    # ── Build config ──────────────────────────────────────────────────────────
    config = Config()
    config.OUTPUT_DIR = Path(output_dir)
    config.FRAMES_DIR = config.OUTPUT_DIR / "frames"
    config.AUDIO_DIR = config.OUTPUT_DIR / "audio"
    config.TTS_DIR = config.OUTPUT_DIR / "tts"
    config.CHARACTERS_DIR = config.OUTPUT_DIR / "characters"
    config.REELS_DIR = config.OUTPUT_DIR / "reels"
    config.WHISPER_MODEL = opts.get("whisper_model", "small")
    config.TOP_REELS_COUNT = opts.get("top_reels", 10)
    config.setup_dirs()

    # Flags from options
    skip_captions = opts.get("skip_captions", False)
    skip_faces = opts.get("skip_faces", False)
    skip_explainer = opts.get("skip_explainer", False)
    skip_arc_reels = opts.get("skip_arc_reels", False)
    skip_character_intros = opts.get("skip_character_intros", False)
    explainer_duration = opts.get("explainer_duration", 20)
    arc_reel_duration = opts.get("arc_reel_duration", 60.0)
    max_arc_reels = opts.get("max_arc_reels", 8)
    arc_threshold = opts.get("arc_threshold", 0.45)

    from ...video_processor import detect_scenes, extract_keyframes, extract_audio, get_video_metadata
    from ...transcript_processor import transcribe_movie, align_dialogue_to_scenes, save_transcript
    from ...emotion_analyzer import analyze_all_dialogue
    from ...utils.audio_analysis import analyze_scenes as analyze_audio_scenes
    from ...segment_selector import score_all_scenes, find_reel_segments

    # ── Stage 1: Scene detection ──────────────────────────────────────────────
    _check_cancel()
    cb.stage_start("scene_detection")
    meta = get_video_metadata(movie_path)
    total_duration = meta["duration"]
    scenes = detect_scenes(movie_path, config)
    cb.stage_done(f"{len(scenes)} scenes detected")

    # ── Stage 2: Frame extraction ─────────────────────────────────────────────
    _check_cancel()
    cb.stage_start("frame_extraction")
    scenes = extract_keyframes(movie_path, scenes, config, n_frames=config.KEYFRAMES_PER_SCENE)
    cb.stage_done(f"{sum(len(s.keyframe_paths) for s in scenes)} frames extracted")

    # ── Stage 3: Audio extraction ─────────────────────────────────────────────
    _check_cancel()
    cb.stage_start("audio_extraction")
    audio_path = extract_audio(movie_path, config)
    cb.stage_done("Audio extracted")

    # ── Stage 4: Transcription ────────────────────────────────────────────────
    _check_cancel()
    cb.stage_start("transcription")
    dialogue = transcribe_movie(audio_path, config)
    scenes = align_dialogue_to_scenes(dialogue, scenes)
    save_transcript(dialogue, str(config.OUTPUT_DIR / "transcript.json"))
    cb.stage_done(f"{len(dialogue)} dialogue lines transcribed")

    # ── Stage 5: Scene captioning (BLIP-2) ───────────────────────────────────
    if "scene_captioning" in active_stages and not skip_captions:
        _check_cancel()
        cb.stage_start("scene_captioning")
        from ...scene_captioner import caption_all_scenes
        scenes = caption_all_scenes(scenes, config)
        cb.stage_done("Scenes captioned")

    # ── Stage 6: Emotion analysis ─────────────────────────────────────────────
    if "emotion_analysis" in active_stages:
        _check_cancel()
        cb.stage_start("emotion_analysis")
        dialogue, scenes = analyze_all_dialogue(dialogue, scenes, batch_size=config.EMOTION_BATCH_SIZE)
        cb.stage_done("Emotion analysis complete")

    # ── Stage 7: Audio features ───────────────────────────────────────────────
    if "audio_features" in active_stages:
        _check_cancel()
        cb.stage_start("audio_features")
        scenes = analyze_audio_scenes(audio_path, scenes)
        cb.stage_done("Audio features extracted")

    # ── Stage 8–9: Face detection + clustering ───────────────────────────────
    characters = []
    if "face_detection" in active_stages and not skip_faces:
        _check_cancel()
        cb.stage_start("face_detection")
        from ...character_detector import (
            extract_face_embeddings, cluster_faces_into_characters,
            infer_character_names, assign_characters_to_scenes,
            assign_dialogue_speakers, save_character_profiles,
        )
        embeddings = extract_face_embeddings(scenes, config)
        cb.stage_done(f"{len(embeddings)} face embeddings extracted")

        _check_cancel()
        cb.stage_start("character_clustering")
        characters = cluster_faces_into_characters(embeddings, config)
        characters = infer_character_names(characters, dialogue)
        scenes, characters = assign_characters_to_scenes(scenes, characters)
        dialogue = assign_dialogue_speakers(characters, dialogue)
        save_character_profiles(characters, config.CHARACTERS_DIR)
        cb.stage_done(f"{len(characters)} characters identified")

    # ── Stage 10: Personality analysis ───────────────────────────────────────
    local_llm = None
    try:
        from ...utils.local_llm import LocalLLM
        local_llm = LocalLLM(
            backend=config.LLM_BACKEND,
            ollama_model=config.OLLAMA_MODEL,
            ollama_host=config.OLLAMA_HOST,
            transformers_model=config.TRANSFORMERS_LLM_MODEL,
        )
    except Exception as e:
        logger.warning(f"Local LLM unavailable: {e}")

    if "personality_analysis" in active_stages and characters:
        _check_cancel()
        cb.stage_start("personality_analysis")
        from ...personality_analyzer import analyze_all_characters
        from ...character_detector import save_character_profiles
        characters = analyze_all_characters(characters, local_llm)
        save_character_profiles(characters, config.CHARACTERS_DIR)
        cb.stage_done("Personality profiles generated")

    # ── Stage 11: Story analysis ──────────────────────────────────────────────
    structure = None
    if "story_analysis" in active_stages and not skip_explainer:
        _check_cancel()
        cb.stage_start("story_analysis")
        from ...movie_analyst import analyse_movie_structure
        structure = analyse_movie_structure(scenes, characters, local_llm, total_duration)
        cb.stage_done(f"Theme: {structure.central_theme}")

    # ── Stage 12: Reel scoring ────────────────────────────────────────────────
    if "reel_scoring" in active_stages:
        _check_cancel()
        cb.stage_start("reel_scoring")
        scenes = score_all_scenes(scenes, characters, local_llm, config)
        segments = find_reel_segments(scenes, config)
        cb.stage_done(f"{len(segments)} reel candidates scored")
    else:
        segments = []

    # ── Save checkpoint ───────────────────────────────────────────────────────
    import json

    def _scenes_to_dict(scenes_list):
        return [
            {
                "scene_id": s.scene_id, "start_time": s.start_time,
                "end_time": s.end_time, "duration": s.duration,
                "keyframe_paths": s.keyframe_paths, "character_ids": s.character_ids,
                "caption": s.caption, "dominant_emotion": s.dominant_emotion,
                "audio_energy": s.audio_energy, "speech_rate": s.speech_rate,
                "reel_score": s.reel_score, "reel_score_reason": s.reel_score_reason,
                "dialogue": [
                    {"speaker_id": dl.speaker_id, "text": dl.text,
                     "start_time": dl.start_time, "end_time": dl.end_time,
                     "confidence": dl.confidence, "emotions": dl.emotions}
                    for dl in s.dialogue
                ],
            }
            for s in scenes_list
        ]

    checkpoint = {
        "movie_path": movie_path,
        "total_duration": total_duration,
        "meta": meta,
        "scenes": _scenes_to_dict(scenes),
        "stage": "complete",
    }
    checkpoint_path = config.OUTPUT_DIR / "analysis_report.json"
    checkpoint_path.write_text(json.dumps(checkpoint, indent=2, default=str))

    # ── Stage 13: Arc detection ───────────────────────────────────────────────
    arc_results = []
    if "arc_detection" in active_stages and not skip_arc_reels:
        _check_cancel()
        cb.stage_start("arc_detection")
        from ...story_arc_detector import find_best_arc_threads
        arc_results = find_best_arc_threads(
            scenes, characters, local_llm,
            target_duration=arc_reel_duration,
            max_threads=max_arc_reels,
            distance_threshold=arc_threshold,
        )
        cb.stage_done(f"{len(arc_results)} arc threads found")

    # ── Stage 14: Reel generation ─────────────────────────────────────────────
    if "reel_generation" in active_stages and segments:
        _check_cancel()
        cb.stage_start("reel_generation")
        from ...reel_generator import generate_all_reels
        segments = generate_all_reels(
            segments, scenes, movie_path, characters, local_llm, config, total_duration
        )
        cb.stage_done(f"{len(segments)} reels generated")

    # ── Stage 15: Arc reel generation ────────────────────────────────────────
    if "arc_reel_generation" in active_stages and arc_results and not skip_arc_reels:
        _check_cancel()
        cb.stage_start("arc_reel_generation")
        from ...arc_reel_generator import generate_all_arc_reels
        generate_all_arc_reels(
            arc_results, scenes, movie_path, characters, local_llm, config, total_duration
        )
        cb.stage_done(f"{len(arc_results)} arc reels generated")

    # ── Stage 16: Explainer generation ───────────────────────────────────────
    explainer_path = None
    if "explainer_generation" in active_stages and not skip_explainer and structure is not None:
        _check_cancel()
        cb.stage_start("explainer_generation")
        from ...explainer_generator import select_explainer_scenes, build_and_render_explainer
        target_secs = explainer_duration * 60
        explainer_scenes = select_explainer_scenes(scenes, structure, target_secs, total_duration)
        explainer_path = str(config.OUTPUT_DIR / "explainer.mp4")
        build_and_render_explainer(
            explainer_scenes, scenes, characters, structure,
            movie_path, config, explainer_path, total_duration,
            local_llm=local_llm,
            add_character_intros=(not skip_character_intros),
        )
        cb.stage_done("Explainer generated")

    # ── Collect outputs ───────────────────────────────────────────────────────
    outputs: dict[str, Any] = {
        "report": str(checkpoint_path),
        "transcript": str(config.OUTPUT_DIR / "transcript.json"),
    }
    reels_dir = config.REELS_DIR
    if reels_dir.exists():
        reel_files = sorted(reels_dir.glob("*.mp4"))
        outputs["reels"] = [str(f) for f in reel_files]
    if explainer_path and Path(explainer_path).exists():
        outputs["explainer"] = explainer_path

    cb.complete(outputs)
    return outputs
