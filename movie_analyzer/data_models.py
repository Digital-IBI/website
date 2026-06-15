from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class EmotionalTone(str, Enum):
    DRAMATIC = "dramatic"
    HUMOROUS = "humorous"
    TENSE = "tense"
    ROMANTIC = "romantic"
    SAD = "sad"
    ACTION = "action"
    NEUTRAL = "neutral"


@dataclass
class DialogueLine:
    speaker_id: Optional[str]
    text: str
    start_time: float
    end_time: float
    confidence: float
    emotions: Optional[dict[str, float]] = None


@dataclass
class FaceEmbedding:
    character_id: str
    embedding: list[float]
    source_frame: str
    bbox: tuple[int, int, int, int]
    timestamp: float


@dataclass
class PersonalityProfile:
    big_five: dict[str, float]
    dominant_traits: list[str]
    emotion_distribution: dict[str, float]
    summary: str
    evidence: list[str]


@dataclass
class Character:
    character_id: str
    name: Optional[str]
    face_embeddings: list[FaceEmbedding]
    representative_face_path: str
    total_screen_time: float
    scenes_appeared: list[int]
    dialogue_lines: list[DialogueLine]
    personality: Optional[PersonalityProfile] = None


@dataclass
class Scene:
    scene_id: int
    start_time: float
    end_time: float
    duration: float
    keyframe_paths: list[str] = field(default_factory=list)
    dialogue: list[DialogueLine] = field(default_factory=list)
    character_ids: list[str] = field(default_factory=list)
    caption: Optional[str] = None
    dominant_emotion: Optional[str] = None
    audio_energy: Optional[float] = None
    speech_rate: Optional[float] = None
    reel_score: Optional[float] = None
    reel_score_reason: Optional[str] = None


@dataclass
class ReelSegment:
    segment_id: str
    scene_ids: list[int]
    start_time: float
    end_time: float
    duration: float
    score: float
    category: str
    reason: str
    output_path: Optional[str] = None


@dataclass
class MovieAnalysis:
    movie_path: str
    movie_title: Optional[str]
    total_duration: float
    scenes: list[Scene] = field(default_factory=list)
    characters: list[Character] = field(default_factory=list)
    top_reels: list[ReelSegment] = field(default_factory=list)
    transcript: list[DialogueLine] = field(default_factory=list)
