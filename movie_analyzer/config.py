from __future__ import annotations
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Paths
    OUTPUT_DIR: Path = Path("output")
    FRAMES_DIR: Path = OUTPUT_DIR / "frames"
    AUDIO_DIR: Path = OUTPUT_DIR / "audio"
    TTS_DIR: Path = OUTPUT_DIR / "tts"
    CHARACTERS_DIR: Path = OUTPUT_DIR / "characters"
    REELS_DIR: Path = OUTPUT_DIR / "reels"
    CACHE_DIR: Path = Path(".cache")

    # Scene detection
    SCENE_THRESHOLD: float = 27.0
    MIN_SCENE_DURATION: float = 2.0
    KEYFRAMES_PER_SCENE: int = 3

    # Whisper
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_LANGUAGE: str | None = os.getenv("WHISPER_LANGUAGE", None)
    AUDIO_CHUNK_MINUTES: int = 10

    # BLIP-2 scene captioning (auto-selects model based on available VRAM)
    BLIP2_DEVICE: str = os.getenv("BLIP2_DEVICE", "auto")
    BLIP2_MODEL: str = os.getenv("BLIP2_MODEL", "")  # empty = auto-select below

    @classmethod
    def auto_blip2_model(cls) -> str:
        """Pick BLIP-2 model based on available GPU VRAM."""
        if cls.BLIP2_MODEL:
            return cls.BLIP2_MODEL
        try:
            import torch
            if torch.cuda.is_available():
                vram_gb = torch.cuda.get_device_properties(0).total_memory / 1024 ** 3
                if vram_gb >= 12:
                    return "Salesforce/blip2-opt-2.7b"      # 12GB+: best quality
                elif vram_gb >= 8:
                    return "Salesforce/blip2-flan-t5-xl"    # 8GB: good quality
                else:
                    return "Salesforce/blip2-flan-t5-base"  # 4-8GB: lighter model
        except Exception:
            pass
        return "Salesforce/blip2-flan-t5-base"  # CPU fallback (slow but works)

    # Emotion analysis
    EMOTION_MODEL: str = "j-hartmann/emotion-english-distilroberta-base"
    EMOTION_BATCH_SIZE: int = 32

    # Face detection
    FACE_BACKEND: str = os.getenv("FACE_BACKEND", "deepface")
    FACE_MODEL: str = "Facenet512"
    FACE_DISTANCE_THRESHOLD: float = 0.4
    MIN_FACE_SIZE: int = 40
    FRAMES_PER_SCENE_FOR_FACES: int = 5

    # Local LLM
    LLM_BACKEND: str = os.getenv("LLM_BACKEND", "auto")  # "auto"|"ollama"|"transformers"
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    TRANSFORMERS_LLM_MODEL: str = os.getenv(
        "TRANSFORMERS_LLM_MODEL", "microsoft/Phi-3-mini-4k-instruct"
    )
    LLM_MAX_TOKENS: int = 512

    # Optional cloud AI
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = "claude-sonnet-4-6"

    # TTS
    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "coqui")
    TTS_VOICE: str = "tts_models/en/ljspeech/tacotron2-DDC"
    TTS_SPEED: float = 1.1

    # Video output
    OUTPUT_FPS: int = 24
    OUTPUT_RESOLUTION: tuple[int, int] = (1920, 1080)
    OUTPUT_CODEC: str = "libx264"
    OUTPUT_AUDIO_CODEC: str = "aac"
    REEL_MAX_DURATION: int = 90
    REEL_MIN_DURATION: int = 30
    EXPLAINER_TARGET_MIN: int = 20
    TOP_REELS_COUNT: int = 10

    # Parallel workers
    IO_WORKERS: int = int(os.getenv("IO_WORKERS", "8"))
    CPU_WORKERS: int = int(os.getenv("CPU_WORKERS", str(min(os.cpu_count() or 4, 12))))

    def setup_dirs(self) -> None:
        for d in [
            self.OUTPUT_DIR,
            self.FRAMES_DIR,
            self.AUDIO_DIR,
            self.TTS_DIR,
            self.CHARACTERS_DIR,
            self.REELS_DIR,
            self.CACHE_DIR,
        ]:
            d.mkdir(parents=True, exist_ok=True)
