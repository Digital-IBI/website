from __future__ import annotations
import numpy as np
from pathlib import Path
from ..data_models import Scene
from ..utils.logging_setup import logger


def extract_scene_audio_features(audio_path: str, scene: Scene) -> dict:
    """Extract librosa audio features for a scene time window."""
    try:
        import librosa
    except ImportError:
        logger.warning("librosa not installed, skipping audio features")
        return {"rms_energy": 0.5, "speech_rate": 0.0, "music_presence": False,
                "silence_ratio": 0.0, "tempo": 0.0}

    try:
        y, sr = librosa.load(
            audio_path,
            offset=scene.start_time,
            duration=scene.duration,
            sr=16000,
            mono=True,
        )
        if len(y) == 0:
            return _empty_features()

        # RMS energy (loudness proxy)
        rms = float(np.sqrt(np.mean(y ** 2)))
        rms_db = librosa.amplitude_to_db(np.array([rms]))[0]
        rms_norm = float(np.clip((rms_db + 60) / 60, 0.0, 1.0))

        # Speech rate from dialogue word count
        word_count = sum(len(d.text.split()) for d in scene.dialogue)
        speech_rate = word_count / max(scene.duration, 1.0)

        # Music presence: high spectral flux variance suggests music
        spectral_flux = librosa.onset.onset_strength(y=y, sr=sr)
        music_presence = bool(float(np.std(spectral_flux)) > 2.0)

        # Silence ratio
        silence_frames = np.sum(np.abs(y) < 0.01)
        silence_ratio = float(silence_frames / max(len(y), 1))

        # Tempo
        try:
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            tempo_val = float(tempo)
        except Exception:
            tempo_val = 0.0

        return {
            "rms_energy": rms_norm,
            "speech_rate": float(speech_rate),
            "music_presence": music_presence,
            "silence_ratio": silence_ratio,
            "tempo": tempo_val,
        }
    except Exception as e:
        logger.debug(f"Audio feature extraction failed for scene {scene.scene_id}: {e}")
        return _empty_features()


def _empty_features() -> dict:
    return {"rms_energy": 0.0, "speech_rate": 0.0, "music_presence": False,
            "silence_ratio": 1.0, "tempo": 0.0}


def score_audio_reel_potential(features: dict) -> float:
    """Heuristic: high energy + fast speech + music → higher reel potential."""
    energy = features.get("rms_energy", 0.0)
    speech = min(features.get("speech_rate", 0.0) / 3.0, 1.0)
    music = 0.2 if features.get("music_presence", False) else 0.0
    silence_penalty = features.get("silence_ratio", 0.0) * 0.3
    return float(np.clip(0.5 * energy + 0.3 * speech + music - silence_penalty, 0.0, 1.0))


def analyze_scenes(audio_path: str, scenes: list[Scene]) -> list[Scene]:
    """Populate audio_energy and speech_rate on all scenes."""
    logger.info(f"Analysing audio features for {len(scenes)} scenes...")
    from concurrent.futures import ThreadPoolExecutor

    def process(scene: Scene) -> Scene:
        features = extract_scene_audio_features(audio_path, scene)
        scene.audio_energy = score_audio_reel_potential(features)
        scene.speech_rate = features.get("speech_rate", 0.0)
        return scene

    with ThreadPoolExecutor(max_workers=4) as pool:
        scenes = list(pool.map(process, scenes))

    return scenes
