from __future__ import annotations
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor

_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="pipeline")
_cancel_events: dict[str, threading.Event] = {}
_lock = threading.Lock()


def get_pool() -> ThreadPoolExecutor:
    return _pool


def register_cancel(job_id: str) -> threading.Event:
    ev = threading.Event()
    with _lock:
        _cancel_events[job_id] = ev
    return ev


def cancel_job(job_id: str) -> bool:
    with _lock:
        ev = _cancel_events.get(job_id)
    if ev:
        ev.set()
        return True
    return False


def cleanup_cancel(job_id: str) -> None:
    with _lock:
        _cancel_events.pop(job_id, None)


async def run_in_executor(fn, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_pool, fn, *args)
