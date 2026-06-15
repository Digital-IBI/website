from __future__ import annotations
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routes import jobs, events, files, workflows


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Movie Analyzer API",
    description="Local-first ML pipeline for movie analysis, reel generation, and explainer video creation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router)
app.include_router(events.router)
app.include_router(files.router)
app.include_router(workflows.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
