from __future__ import annotations
import asyncio
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..broadcaster import subscribe, unsubscribe
from ..database import get_job

router = APIRouter(prefix="/jobs", tags=["events"])

_KEEPALIVE_INTERVAL = 15  # seconds


@router.get("/{job_id}/events")
async def job_events(job_id: str) -> StreamingResponse:
    d = await get_job(job_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Job not found")

    q = await subscribe(job_id)

    async def _stream():
        try:
            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=_KEEPALIVE_INTERVAL)
                    yield f"data: {payload}\n\n"
                    event = json.loads(payload)
                    if event.get("event") in ("complete", "error"):
                        break
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            await unsubscribe(job_id, q)

    return StreamingResponse(
        _stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
