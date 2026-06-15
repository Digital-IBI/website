from __future__ import annotations
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse

from ..database import get_job

router = APIRouter(prefix="/jobs", tags=["files"])

_ALLOWED_EXTENSIONS = {".mp4", ".json", ".jpg", ".jpeg", ".png", ".wav", ".mp3"}
_CHUNK_SIZE = 1024 * 1024  # 1 MB


def _safe_resolve(output_dir: str, file_path: str) -> Path:
    base = Path(output_dir).resolve()
    target = (base / file_path).resolve()
    if not str(target).startswith(str(base)):
        raise HTTPException(status_code=403, detail="Access denied")
    if target.suffix.lower() not in _ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=403, detail="File type not allowed")
    if not target.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return target


@router.get("/{job_id}/files/{file_path:path}")
async def get_file(job_id: str, file_path: str, request: Request):
    d = await get_job(job_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Job not found")

    target = _safe_resolve(d["output_dir"], file_path)
    file_size = target.stat().st_size

    # Support HTTP Range requests for video streaming
    range_header = request.headers.get("range")
    if range_header and target.suffix.lower() == ".mp4":
        start, end = _parse_range(range_header, file_size)
        length = end - start + 1

        def _iter_file():
            with open(target, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk = f.read(min(_CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return StreamingResponse(
            _iter_file(),
            status_code=206,
            media_type="video/mp4",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(length),
                "Accept-Ranges": "bytes",
            },
        )

    return FileResponse(str(target))


def _parse_range(range_header: str, file_size: int) -> tuple[int, int]:
    try:
        unit, ranges = range_header.split("=", 1)
        assert unit.strip() == "bytes"
        start_str, end_str = ranges.split("-", 1)
        start = int(start_str) if start_str.strip() else file_size - int(end_str)
        end = int(end_str) if end_str.strip() else file_size - 1
        start = max(0, start)
        end = min(end, file_size - 1)
        return start, end
    except Exception:
        raise HTTPException(status_code=416, detail="Invalid Range header")
