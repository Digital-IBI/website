from __future__ import annotations
import asyncio
from typing import Any, Optional

from ..broadcaster import publish_sync
from ..database import update_job


class ProgressCallback:
    """Thread-safe progress reporter — called from sync pipeline worker threads."""

    def __init__(
        self,
        job_id: str,
        loop: asyncio.AbstractEventLoop,
        stage_weights: dict[str, float],
    ) -> None:
        self.job_id = job_id
        self.loop = loop
        self.stage_weights = stage_weights  # stage_name → fraction of total work (sums to 1)
        self._completed_weight: float = 0.0
        self._current_stage: Optional[str] = None
        self._current_stage_weight: float = 0.0

    def stage_start(self, stage: str, message: Optional[str] = None) -> None:
        self._current_stage = stage
        self._current_stage_weight = self.stage_weights.get(stage, 0.0)
        total_pct = self._completed_weight * 100
        event = {
            "job_id": self.job_id,
            "event": "stage_start",
            "stage": stage,
            "stage_pct": 0.0,
            "total_pct": total_pct,
            "message": message or f"Starting {stage.replace('_', ' ')}",
        }
        self._emit(event)
        asyncio.run_coroutine_threadsafe(
            update_job(self.job_id, stage=stage, stage_pct=0.0, total_pct=total_pct),
            self.loop,
        )

    def progress(self, stage_pct: float, message: Optional[str] = None, data: Optional[dict[str, Any]] = None) -> None:
        total_pct = (self._completed_weight + self._current_stage_weight * stage_pct / 100) * 100
        event: dict[str, Any] = {
            "job_id": self.job_id,
            "event": "progress",
            "stage": self._current_stage,
            "stage_pct": stage_pct,
            "total_pct": total_pct,
        }
        if message:
            event["message"] = message
        if data:
            event["data"] = data
        self._emit(event)
        asyncio.run_coroutine_threadsafe(
            update_job(self.job_id, stage_pct=stage_pct, total_pct=total_pct),
            self.loop,
        )

    def stage_done(self, result_summary: Optional[str] = None) -> None:
        self._completed_weight += self._current_stage_weight
        total_pct = self._completed_weight * 100
        event = {
            "job_id": self.job_id,
            "event": "stage_done",
            "stage": self._current_stage,
            "stage_pct": 100.0,
            "total_pct": total_pct,
            "message": result_summary,
        }
        self._emit(event)

    def error(self, message: str) -> None:
        self._emit({
            "job_id": self.job_id,
            "event": "error",
            "stage": self._current_stage,
            "message": message,
        })

    def complete(self, outputs: dict[str, Any]) -> None:
        self._emit({
            "job_id": self.job_id,
            "event": "complete",
            "total_pct": 100.0,
            "data": {"outputs": outputs},
        })

    def _emit(self, event: dict[str, Any]) -> None:
        publish_sync(self.job_id, event, self.loop)
