from __future__ import annotations
from typing import Any

# Stage names used in progress events (in pipeline order)
ALL_STAGES = [
    "scene_detection",
    "frame_extraction",
    "audio_extraction",
    "transcription",
    "scene_captioning",
    "emotion_analysis",
    "audio_features",
    "face_detection",
    "character_clustering",
    "personality_analysis",
    "story_analysis",
    "reel_scoring",
    "arc_detection",
    "reel_generation",
    "arc_reel_generation",
    "explainer_generation",
]

WORKFLOW_PRESETS: dict[str, dict[str, Any]] = {
    "quick_reels": {
        "label": "Quick Reels",
        "description": "Fast reel extraction — tiny Whisper, no face/arc/explainer",
        "stages": [
            "scene_detection", "frame_extraction", "audio_extraction",
            "transcription", "emotion_analysis", "audio_features",
            "reel_scoring", "reel_generation",
        ],
        "estimated_minutes_per_hour_of_film": 15,
        "default_options": {
            "whisper_model": "tiny",
            "skip_captions": True,
            "skip_faces": True,
            "skip_arc_reels": True,
            "skip_explainer": True,
            "top_reels": 5,
        },
    },
    "arc_reels": {
        "label": "Narrative Arc Reels",
        "description": "Semantic arc detection to produce story-thread reels",
        "stages": [
            "scene_detection", "frame_extraction", "audio_extraction",
            "transcription", "scene_captioning", "emotion_analysis",
            "audio_features", "reel_scoring", "arc_detection",
            "reel_generation", "arc_reel_generation",
        ],
        "estimated_minutes_per_hour_of_film": 35,
        "default_options": {
            "whisper_model": "small",
            "skip_faces": True,
            "skip_explainer": True,
            "top_reels": 5,
            "max_arc_reels": 5,
        },
    },
    "full_explainer": {
        "label": "Full Explainer Video",
        "description": "Produces a 15–25 min explainer with character intros and narration",
        "stages": [
            "scene_detection", "frame_extraction", "audio_extraction",
            "transcription", "scene_captioning", "emotion_analysis",
            "audio_features", "face_detection", "character_clustering",
            "personality_analysis", "story_analysis", "reel_scoring",
            "explainer_generation",
        ],
        "estimated_minutes_per_hour_of_film": 60,
        "default_options": {
            "whisper_model": "small",
            "skip_arc_reels": True,
            "top_reels": 0,
            "explainer_duration": 20,
        },
    },
    "full_pipeline": {
        "label": "Full Pipeline",
        "description": "Everything: reels, arc reels, and explainer",
        "stages": ALL_STAGES,
        "estimated_minutes_per_hour_of_film": 90,
        "default_options": {
            "whisper_model": "small",
            "top_reels": 10,
            "max_arc_reels": 5,
            "explainer_duration": 20,
        },
    },
    "analyze_only": {
        "label": "Analysis Only",
        "description": "Run analysis and save JSON report — no video rendering",
        "stages": [
            "scene_detection", "frame_extraction", "audio_extraction",
            "transcription", "scene_captioning", "emotion_analysis",
            "audio_features", "face_detection", "character_clustering",
            "personality_analysis", "story_analysis", "reel_scoring",
        ],
        "estimated_minutes_per_hour_of_film": 50,
        "default_options": {
            "whisper_model": "small",
            "top_reels": 0,
            "skip_arc_reels": True,
            "skip_explainer": True,
        },
    },
    "themed_compilation": {
        "label": "Themed Compilation",
        "description": (
            "Generate curated theme reels from an existing analysis checkpoint — "
            "e.g. 'all funny scenes', 'Character A's badass moments', "
            "'romantic scenes between A and B'. Requires a prior analyze_only run."
        ),
        "stages": ["themed_reel_generation"],
        "estimated_minutes_per_hour_of_film": 5,
        "default_options": {
            "queries": [],           # list of ThemeQuery dicts
            "existing_checkpoint": None,  # path; defaults to output_dir/analysis_report.json
        },
    },
}
