from __future__ import annotations

from fastapi import APIRouter

from ..pipeline.presets import WORKFLOW_PRESETS
from ..schemas import WorkflowInfo

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowInfo])
async def list_workflows() -> list[WorkflowInfo]:
    return [
        WorkflowInfo(
            id=wid,
            label=w["label"],
            description=w["description"],
            stages=w["stages"],
            estimated_minutes_per_hour_of_film=w["estimated_minutes_per_hour_of_film"],
            default_options=w["default_options"],
        )
        for wid, w in WORKFLOW_PRESETS.items()
    ]
