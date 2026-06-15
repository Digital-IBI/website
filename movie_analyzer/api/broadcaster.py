from __future__ import annotations
import asyncio
import json
from typing import Any

# job_id → set of asyncio.Queue (one per SSE connection)
_registry: dict[str, set[asyncio.Queue]] = {}
_lock = asyncio.Lock()


async def subscribe(job_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=256)
    async with _lock:
        _registry.setdefault(job_id, set()).add(q)
    return q


async def unsubscribe(job_id: str, q: asyncio.Queue) -> None:
    async with _lock:
        bucket = _registry.get(job_id)
        if bucket:
            bucket.discard(q)
            if not bucket:
                del _registry[job_id]


async def publish(job_id: str, event: dict[str, Any]) -> None:
    payload = json.dumps(event)
    async with _lock:
        queues = list(_registry.get(job_id, []))
    for q in queues:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass


def publish_sync(job_id: str, event: dict[str, Any], loop: asyncio.AbstractEventLoop) -> None:
    """Thread-safe publish called from worker threads."""
    asyncio.run_coroutine_threadsafe(publish(job_id, event), loop)
