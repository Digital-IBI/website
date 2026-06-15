from __future__ import annotations
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class WorkflowPreset(str, Enum):
    quick_reels = "quick_reels"
    arc_reels = "arc_reels"
    full_explainer = "full_explainer"
    full_pipeline = "full_pipeline"
    analyze_only = "analyze_only"
    themed_compilation = "themed_compilation"


class ThemeQuerySchema(BaseModel):
    theme: str = Field(..., description=(
        "Built-in theme key or 'custom'. "
        "Keys: funny, badass, romantic, sexy, scary, sad, action, dramatic, tense, triumphant"
    ))
    character_ids: list[str] = Field(default_factory=list, description="Filter to scenes featuring these characters")
    character_filter_mode: str = Field("any", description="'any' = at least one; 'all' = all must appear (relationships)")
    custom_descriptor: str = Field("", description="Custom semantic descriptor when theme='custom'")
    min_score: float = Field(0.25, ge=0.0, le=1.0, description="Minimum theme match score")
    max_scenes: int = Field(25, ge=1, le=100)
    target_duration: float = Field(90.0, gt=0, description="Target reel duration in seconds")
    label: str = Field("", description="Display label for the reel title card")


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class JobCreate(BaseModel):
    movie_path: str = Field(..., description="Absolute path to the input movie file")
    workflow: WorkflowPreset = Field(WorkflowPreset.full_pipeline)
    output_dir: Optional[str] = Field(None, description="Output directory; auto-generated if omitted")
    options: dict[str, Any] = Field(default_factory=dict, description="Workflow-specific overrides")


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    workflow: str
    movie_path: str
    output_dir: str
    created_at: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    stage: Optional[str] = None
    stage_pct: Optional[float] = None
    total_pct: Optional[float] = None
    error: Optional[str] = None
    outputs: Optional[dict[str, Any]] = None


class ProgressEvent(BaseModel):
    job_id: str
    event: str  # "stage_start" | "progress" | "stage_done" | "complete" | "error"
    stage: Optional[str] = None
    stage_pct: Optional[float] = None
    total_pct: Optional[float] = None
    message: Optional[str] = None
    data: Optional[dict[str, Any]] = None


class WorkflowInfo(BaseModel):
    id: str
    label: str
    description: str
    stages: list[str]
    estimated_minutes_per_hour_of_film: int
    default_options: dict[str, Any]
