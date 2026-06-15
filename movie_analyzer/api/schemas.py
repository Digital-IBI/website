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
