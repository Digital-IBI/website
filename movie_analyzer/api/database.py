from __future__ import annotations
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import aiosqlite

DB_PATH = Path("movie_analyzer_jobs.db")


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id          TEXT PRIMARY KEY,
                status      TEXT NOT NULL DEFAULT 'queued',
                workflow    TEXT NOT NULL,
                movie_path  TEXT NOT NULL,
                output_dir  TEXT NOT NULL,
                options     TEXT NOT NULL DEFAULT '{}',
                created_at  TEXT NOT NULL,
                started_at  TEXT,
                finished_at TEXT,
                stage       TEXT,
                stage_pct   REAL,
                total_pct   REAL,
                error       TEXT,
                outputs     TEXT
            )
        """)
        await db.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_job(
    workflow: str,
    movie_path: str,
    output_dir: str,
    options: dict[str, Any],
) -> str:
    job_id = str(uuid.uuid4())
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO jobs (id, status, workflow, movie_path, output_dir, options, created_at)
               VALUES (?, 'queued', ?, ?, ?, ?, ?)""",
            (job_id, workflow, movie_path, output_dir, json.dumps(options), _now()),
        )
        await db.commit()
    return job_id


async def get_job(job_id: str) -> Optional[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)) as cur:
            row = await cur.fetchone()
    if row is None:
        return None
    d = dict(row)
    d["options"] = json.loads(d["options"] or "{}")
    d["outputs"] = json.loads(d["outputs"]) if d.get("outputs") else None
    return d


async def list_jobs(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ) as cur:
            rows = await cur.fetchall()
    result = []
    for row in rows:
        d = dict(row)
        d["options"] = json.loads(d["options"] or "{}")
        d["outputs"] = json.loads(d["outputs"]) if d.get("outputs") else None
        result.append(d)
    return result


async def update_job(job_id: str, **fields: Any) -> None:
    if not fields:
        return
    serialized = {}
    for k, v in fields.items():
        if k in ("options", "outputs") and isinstance(v, (dict, list)):
            serialized[k] = json.dumps(v)
        else:
            serialized[k] = v
    set_clause = ", ".join(f"{k} = ?" for k in serialized)
    values = list(serialized.values()) + [job_id]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE jobs SET {set_clause} WHERE id = ?", values)
        await db.commit()


async def mark_running(job_id: str) -> None:
    await update_job(job_id, status="running", started_at=_now())


async def mark_completed(job_id: str, outputs: dict[str, Any]) -> None:
    await update_job(
        job_id,
        status="completed",
        finished_at=_now(),
        total_pct=100.0,
        outputs=outputs,
    )


async def mark_failed(job_id: str, error: str) -> None:
    await update_job(job_id, status="failed", finished_at=_now(), error=error)


async def mark_cancelled(job_id: str) -> None:
    await update_job(job_id, status="cancelled", finished_at=_now())
