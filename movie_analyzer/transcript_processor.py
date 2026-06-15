from __future__ import annotations
import json
import os
import math
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import ffmpeg

from .config import Config
from .data_models import DialogueLine, Scene
from .utils.logging_setup import logger


def _transcribe_chunk(args: tuple[str, str, str, float]) -> list[dict]:
    """Worker: transcribe a single audio chunk. Runs in a subprocess."""
    chunk_path, model_name, language, time_offset = args
    import whisper
    model = whisper.load_model(model_name)
    opts = {"language": language} if language else {}
    result = model.transcribe(chunk_path, **opts, word_timestamps=False)
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "text": seg["text"].strip(),
            "start": seg["start"] + time_offset,
            "end": seg["end"] + time_offset,
            "confidence": seg.get("avg_logprob", 0.0),
        })
    return segments


def transcribe_movie(audio_path: str, config: Config) -> list[DialogueLine]:
    """
    Split audio into chunks and transcribe in parallel with Whisper.
    Returns flat list of DialogueLine sorted by start_time.
    """
    try:
        import whisper  # noqa: F401
    except ImportError:
        raise ImportError("Install whisper: pip install openai-whisper")

    chunk_dir = config.AUDIO_DIR / "chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)

    # Get total duration
    probe = ffmpeg.probe(audio_path)
    total_duration = float(probe["format"]["duration"])
    chunk_secs = config.AUDIO_CHUNK_MINUTES * 60

    # Split into chunks
    n_chunks = math.ceil(total_duration / chunk_secs)
    chunk_args: list[tuple] = []
    logger.info(f"Splitting audio into {n_chunks} chunks of {config.AUDIO_CHUNK_MINUTES} min each...")

    for i in range(n_chunks):
        start = i * chunk_secs
        duration = min(chunk_secs, total_duration - start)
        chunk_path = str(chunk_dir / f"chunk_{i:04d}.wav")
        if not Path(chunk_path).exists():
            (
                ffmpeg
                .input(audio_path, ss=start, t=duration)
                .output(chunk_path, acodec="pcm_s16le", ac=1, ar=16000)
                .overwrite_output()
                .run(quiet=True)
            )
        chunk_args.append((chunk_path, config.WHISPER_MODEL, config.WHISPER_LANGUAGE, start))

    logger.info(f"Transcribing {n_chunks} chunks with Whisper ({config.WHISPER_MODEL})...")
    all_segments: list[dict] = []

    with ProcessPoolExecutor(max_workers=config.CPU_WORKERS) as pool:
        for chunk_segs in pool.map(_transcribe_chunk, chunk_args):
            all_segments.extend(chunk_segs)

    all_segments.sort(key=lambda s: s["start"])

    dialogue = [
        DialogueLine(
            speaker_id=None,
            text=s["text"],
            start_time=round(s["start"], 3),
            end_time=round(s["end"], 3),
            confidence=float(s["confidence"]),
        )
        for s in all_segments
        if s["text"].strip()
    ]
    logger.info(f"Transcribed {len(dialogue)} dialogue segments")
    return dialogue


def align_dialogue_to_scenes(
    dialogue: list[DialogueLine],
    scenes: list[Scene],
) -> list[Scene]:
    """Assign each dialogue line to the scene whose window contains its start_time."""
    import bisect
    scene_starts = [s.start_time for s in scenes]

    for line in dialogue:
        idx = bisect.bisect_right(scene_starts, line.start_time) - 1
        idx = max(0, min(idx, len(scenes) - 1))
        if scenes[idx].start_time <= line.start_time <= scenes[idx].end_time:
            scenes[idx].dialogue.append(line)

    return scenes


def save_transcript(dialogue: list[DialogueLine], output_path: str) -> None:
    data = [
        {
            "speaker_id": d.speaker_id,
            "text": d.text,
            "start_time": d.start_time,
            "end_time": d.end_time,
            "confidence": d.confidence,
        }
        for d in dialogue
    ]
    Path(output_path).write_text(json.dumps(data, indent=2))
    logger.info(f"Transcript saved to {output_path}")
