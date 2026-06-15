from __future__ import annotations
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query

from ..database import (
    create_job, get_job, list_jobs, mark_running, mark_completed,
    mark_failed, mark_cancelled,
)
from ..executor import get_pool, register_cancel, cancel_job, cleanup_cancel
from ..pipeline.runner import run_pipeline, run_themed_pipeline
from ..schemas import JobCreate, JobResponse, JobStatus

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _job_to_response(d: dict) -> JobResponse:
    return JobResponse(
        job_id=d["id"],
        status=d["status"],
        workflow=d["workflow"],
        movie_path=d["movie_path"],
        output_dir=d["output_dir"],
        created_at=d["created_at"],
        started_at=d.get("started_at"),
        finished_at=d.get("finished_at"),
        stage=d.get("stage"),
        stage_pct=d.get("stage_pct"),
        total_pct=d.get("total_pct"),
        error=d.get("error"),
        outputs=d.get("outputs"),
    )


async def _execute_job(
    job_id: str,
    workflow: str,
    movie_path: str,
    output_dir: str,
    options: dict,
) -> None:
    loop = asyncio.get_running_loop()
    cancel_ev = register_cancel(job_id)
    await mark_running(job_id)

    def _run():
        if workflow == "themed_compilation":
            return run_themed_pipeline(job_id, movie_path, output_dir, options, loop, cancel_ev)
        return run_pipeline(job_id, workflow, movie_path, output_dir, options, loop, cancel_ev)

    try:
        outputs = await loop.run_in_executor(get_pool(), _run)
        await mark_completed(job_id, outputs)
    except InterruptedError:
        await mark_cancelled(job_id)
    except Exception as exc:
        await mark_failed(job_id, str(exc))
    finally:
        cleanup_cancel(job_id)


@router.post("", response_model=JobResponse, status_code=202)
async def create_job_endpoint(payload: JobCreate, background_tasks: BackgroundTasks) -> JobResponse:
    movie = Path(payload.movie_path)
    if not movie.exists():
        raise HTTPException(status_code=400, detail=f"Movie file not found: {payload.movie_path}")

    output_dir = payload.output_dir or f"output/{movie.stem}"
    job_id = await create_job(
        workflow=payload.workflow.value,
        movie_path=payload.movie_path,
        output_dir=output_dir,
        options=payload.options,
    )
    background_tasks.add_task(
        _execute_job, job_id, payload.workflow.value,
        payload.movie_path, output_dir, payload.options
    )
    d = await get_job(job_id)
    return _job_to_response(d)


@router.get("", response_model=list[JobResponse])
async def list_jobs_endpoint(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> list[JobResponse]:
    jobs = await list_jobs(limit=limit, offset=offset)
    return [_job_to_response(j) for j in jobs]


@router.get("/{job_id}", response_model=JobResponse)
async def get_job_endpoint(job_id: str) -> JobResponse:
    d = await get_job(job_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_response(d)


@router.delete("/{job_id}", status_code=204)
async def cancel_job_endpoint(job_id: str) -> None:
    d = await get_job(job_id)
    if d is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if d["status"] not in (JobStatus.queued.value, JobStatus.running.value):
        raise HTTPException(status_code=409, detail=f"Job is already {d['status']}")
    cancel_job(job_id)
    # Mark cancelled immediately for queued jobs that haven't started
    if d["status"] == JobStatus.queued.value:
        await mark_cancelled(job_id)
