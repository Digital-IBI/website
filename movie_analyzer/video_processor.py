from __future__ import annotations
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

import cv2
import ffmpeg

from .config import Config
from .data_models import Scene
from .utils.logging_setup import logger


def get_video_metadata(movie_path: str) -> dict:
    probe = ffmpeg.probe(movie_path)
    video_stream = next(s for s in probe["streams"] if s["codec_type"] == "video")
    audio_streams = [s for s in probe["streams"] if s["codec_type"] == "audio"]
    fps_parts = video_stream.get("avg_frame_rate", "24/1").split("/")
    fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 24.0
    return {
        "duration": float(probe["format"]["duration"]),
        "fps": fps,
        "width": int(video_stream["width"]),
        "height": int(video_stream["height"]),
        "codec": video_stream.get("codec_name", "unknown"),
        "audio_codec": audio_streams[0].get("codec_name", "none") if audio_streams else "none",
    }


def detect_scenes(movie_path: str, config: Config) -> list[Scene]:
    """Detect scene boundaries using PySceneDetect ContentDetector."""
    try:
        from scenedetect import VideoManager, SceneManager
        from scenedetect.detectors import ContentDetector
    except ImportError:
        raise ImportError("Install scenedetect: pip install scenedetect[opencv]")

    logger.info(f"Detecting scenes in {movie_path}...")
    video_manager = VideoManager([movie_path])
    scene_manager = SceneManager()
    scene_manager.add_detector(ContentDetector(threshold=config.SCENE_THRESHOLD))

    video_manager.set_downscale_factor()
    video_manager.start()
    scene_manager.detect_scenes(frame_source=video_manager)
    scene_list = scene_manager.get_scene_list()
    video_manager.release()

    scenes = []
    for i, (start, end) in enumerate(scene_list):
        start_sec = start.get_seconds()
        end_sec = end.get_seconds()
        duration = end_sec - start_sec
        if duration < config.MIN_SCENE_DURATION:
            continue
        scenes.append(Scene(
            scene_id=i,
            start_time=round(start_sec, 3),
            end_time=round(end_sec, 3),
            duration=round(duration, 3),
        ))

    logger.info(f"Found {len(scenes)} scenes (filtered from {len(scene_list)} raw)")
    return scenes


def extract_keyframes(
    movie_path: str,
    scenes: list[Scene],
    config: Config,
    n_frames: int = 3,
) -> list[Scene]:
    """Extract n evenly-spaced keyframes per scene using OpenCV."""
    frames_dir = config.FRAMES_DIR
    frames_dir.mkdir(parents=True, exist_ok=True)

    def _extract_scene_frames(scene: Scene) -> Scene:
        cap = cv2.VideoCapture(movie_path)
        frame_paths = []
        timestamps = [
            scene.start_time + (scene.duration / (n_frames + 1)) * (k + 1)
            for k in range(n_frames)
        ]
        for idx, ts in enumerate(timestamps):
            cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
            ret, frame = cap.read()
            if ret:
                out_path = str(frames_dir / f"scene_{scene.scene_id:04d}_frame_{idx}.jpg")
                cv2.imwrite(out_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_paths.append(out_path)
        cap.release()
        scene.keyframe_paths = frame_paths
        return scene

    logger.info(f"Extracting keyframes for {len(scenes)} scenes ({n_frames} per scene)...")
    with ThreadPoolExecutor(max_workers=config.IO_WORKERS) as pool:
        scenes = list(pool.map(_extract_scene_frames, scenes))

    logger.info("Keyframe extraction complete")
    return scenes


def extract_audio(movie_path: str, config: Config) -> str:
    """Extract full audio as mono 16kHz WAV using ffmpeg."""
    config.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(config.AUDIO_DIR / "full_audio.wav")

    if Path(output_path).exists():
        logger.info("Audio already extracted, reusing existing file")
        return output_path

    logger.info("Extracting audio from movie...")
    (
        ffmpeg
        .input(movie_path)
        .output(output_path, acodec="pcm_s16le", ac=1, ar=16000)
        .overwrite_output()
        .run(quiet=True)
    )
    logger.info(f"Audio extracted to {output_path}")
    return output_path


def extract_audio_segment(
    audio_path: str,
    start_time: float,
    end_time: float,
    output_path: str,
) -> str:
    """Extract a time-bounded audio segment."""
    duration = end_time - start_time
    (
        ffmpeg
        .input(audio_path, ss=start_time, t=duration)
        .output(output_path, acodec="pcm_s16le", ac=1, ar=16000)
        .overwrite_output()
        .run(quiet=True)
    )
    return output_path
