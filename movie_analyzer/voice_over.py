from __future__ import annotations
from pathlib import Path

from .config import Config
from .utils.logging_setup import logger


def text_to_speech(text: str, output_path: str, config: Config) -> str:
    """Route to Coqui TTS or gTTS fallback."""
    if config.TTS_ENGINE == "coqui":
        try:
            return coqui_tts(text, output_path, config)
        except Exception as e:
            logger.warning(f"Coqui TTS failed ({e}), falling back to gTTS")
    return gtts_fallback(text, output_path)


def coqui_tts(text: str, output_path: str, config: Config) -> str:
    """Generate speech using Coqui TTS (runs fully locally)."""
    try:
        from TTS.api import TTS
    except ImportError:
        raise ImportError("Install Coqui TTS: pip install TTS")

    tts = TTS(model_name=config.TTS_VOICE, progress_bar=False)
    tts.tts_to_file(text=text, file_path=output_path, speed=config.TTS_SPEED)
    return output_path


def gtts_fallback(text: str, output_path: str) -> str:
    """Generate speech using gTTS (requires internet)."""
    try:
        from gtts import gTTS
    except ImportError:
        raise ImportError("Install gTTS: pip install gTTS")

    mp3_path = output_path.replace(".wav", ".mp3")
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(mp3_path)

    # Convert to WAV for uniform handling
    try:
        import ffmpeg
        (
            ffmpeg.input(mp3_path)
            .output(output_path, acodec="pcm_s16le", ac=1, ar=22050)
            .overwrite_output()
            .run(quiet=True)
        )
        Path(mp3_path).unlink(missing_ok=True)
    except Exception:
        return mp3_path

    return output_path


def mix_narration_with_video(video_clip, narration_path: str,
                              original_audio_volume: float = 0.15):
    """Duck original movie audio and overlay narration."""
    from moviepy.editor import AudioFileClip, CompositeAudioClip

    narration = AudioFileClip(narration_path)
    original = video_clip.audio

    if original is None:
        return video_clip.set_audio(narration)

    ducked = original.volumex(original_audio_volume)
    mixed = CompositeAudioClip([ducked, narration])
    return video_clip.set_audio(mixed)
