"""
Worker HTTP pour Lightricks LTX-2 (CLI) + mode démo LTX_MOCK (ffmpeg, sans GPU).

Variables utiles : voir docstring du fichier dans le dépôt (LTX_REPO_ROOT, checkpoints, etc.).
LTX_MOCK=1 : ignore les checkpoints, génère un MP4 de démonstration aux dimensions demandées.
"""
from __future__ import annotations

import os
import shlex
import subprocess
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Dict, Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Scripty LTX Runner", version="1.1.0")

_jobs: Dict[str, Dict[str, Any]] = {}
_lock = threading.Lock()
_executor = ThreadPoolExecutor(max_workers=1)


def _is_mock() -> bool:
    return os.getenv("LTX_MOCK", "").strip().lower() in ("1", "true", "yes", "on")


def _require_token(authorization: Optional[str] = Header(default=None)) -> None:
    expected = (os.getenv("LTX_RUNNER_TOKEN") or "").strip()
    if not expected:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    got = authorization.split(" ", 1)[1].strip()
    if got != expected:
        raise HTTPException(status_code=401, detail="Invalid token")


class JobCreate(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=8000)
    pipeline: Literal["two_stage", "distilled", "one_stage"] = "two_stage"
    enhance_prompt: bool = True
    negative_prompt: str = ""
    platform: Literal["youtube", "tiktok", "instagram", "facebook"] = "youtube"
    width: int = Field(default=1344, ge=64, le=4096)
    height: int = Field(default=768, ge=64, le=4096)
    num_frames: int = Field(default=161, ge=9, le=512)
    frame_rate: float = Field(default=24.0, gt=0, le=120)


def _module_for_pipeline(pipeline: str) -> str:
    if pipeline == "distilled":
        return os.getenv("LTX_PIPELINE_MODULE_DISTILLED", "ltx_pipelines.distilled")
    if pipeline == "one_stage":
        return os.getenv("LTX_PIPELINE_MODULE_ONE_STAGE", "ltx_pipelines.ti2vid_one_stage")
    return os.getenv("LTX_PIPELINE_MODULE", "ltx_pipelines.ti2vid_two_stages")


def _build_command(body: JobCreate, output_path: Path) -> list[str]:
    py = os.getenv("LTX_PYTHON", "python")
    module = _module_for_pipeline(body.pipeline)
    strength = os.getenv("LTX_DISTILLED_LORA_STRENGTH", "0.8")
    cmd: list[str] = [
        py,
        "-m",
        module,
        "--checkpoint-path",
        os.environ["LTX_CHECKPOINT_PATH"],
        "--spatial-upsampler-path",
        os.environ["LTX_SPATIAL_UPSCALER_PATH"],
        "--gemma-root",
        os.environ["LTX_GEMMA_ROOT"],
        "--prompt",
        body.prompt,
        "--output-path",
        str(output_path),
        "--height",
        str(body.height),
        "--width",
        str(body.width),
        "--num-frames",
        str(body.num_frames),
        "--frame-rate",
        str(body.frame_rate),
    ]
    if body.negative_prompt.strip() and "distilled" not in module:
        cmd.extend(["--negative-prompt", body.negative_prompt])
    if body.enhance_prompt and "distilled" not in module:
        cmd.append("--enhance-prompt")
    distilled_lora = os.getenv("LTX_DISTILLED_LORA_PATH", "").strip()
    if distilled_lora and "distilled" not in module:
        cmd.extend(["--distilled-lora", distilled_lora, strength])
    extra = os.getenv("LTX_EXTRA_ARGS", "").strip()
    if extra:
        cmd.extend(shlex.split(extra))
    return cmd


def _ffmpeg_demo_video(path: Path, body: JobCreate) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    w, h = body.width, body.height
    dur = max(2, min(8, int(body.num_frames / max(body.frame_rate, 1))))
    rate = min(60, max(1, int(body.frame_rate)))
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"testsrc=duration={dur}:size={w}x{h}:rate={rate}",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "ffmpeg failed")[-4000:]
        raise RuntimeError(err)


def _run_job(job_id: str, body: JobCreate) -> None:
    out_dir = Path(os.getenv("LTX_OUTPUT_DIR", "./outputs")).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / f"{job_id}.mp4"

    with _lock:
        _jobs[job_id]["status"] = "running"

    try:
        if _is_mock():
            _ffmpeg_demo_video(output_path, body)
        else:
            repo_root = Path(os.environ["LTX_REPO_ROOT"]).resolve()
            cmd = _build_command(body, output_path)
            proc = subprocess.run(
                cmd,
                cwd=str(repo_root),
                env=os.environ.copy(),
                capture_output=True,
                text=True,
                timeout=int(os.getenv("LTX_SUBPROCESS_TIMEOUT_SEC", "7200")),
            )
            if proc.returncode != 0:
                err = (proc.stderr or proc.stdout or "").strip()[-8000:]
                raise RuntimeError(err or f"exit {proc.returncode}")
        if not output_path.is_file():
            raise RuntimeError("Output file missing after inference")

        with _lock:
            _jobs[job_id]["status"] = "completed"
            _jobs[job_id]["output_path"] = str(output_path)
    except Exception as e:
        with _lock:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = str(e)


@app.post("/v1/jobs")
def create_job(body: JobCreate, _: None = Depends(_require_token)) -> dict:
    if not _is_mock():
        for key in (
            "LTX_REPO_ROOT",
            "LTX_CHECKPOINT_PATH",
            "LTX_SPATIAL_UPSCALER_PATH",
            "LTX_GEMMA_ROOT",
        ):
            if not os.getenv(key):
                raise HTTPException(status_code=500, detail=f"Missing env {key}")

        module = _module_for_pipeline(body.pipeline)
        if "ti2vid_two_stages" in module and not (os.getenv("LTX_DISTILLED_LORA_PATH") or "").strip():
            raise HTTPException(
                status_code=500,
                detail="LTX_DISTILLED_LORA_PATH is required for the two-stage text-to-video module",
            )

    job_id = uuid.uuid4().hex
    with _lock:
        _jobs[job_id] = {
            "status": "queued",
            "pipeline": body.pipeline,
            "platform": body.platform,
            "mock": _is_mock(),
        }
    _executor.submit(_run_job, job_id, body)
    return {"job_id": job_id}


@app.get("/v1/jobs/{job_id}")
def job_status(job_id: str, _: None = Depends(_require_token)) -> dict:
    with _lock:
        job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job")
    return {"job_id": job_id, **job}


@app.get("/v1/jobs/{job_id}/file")
def job_file(job_id: str, _: None = Depends(_require_token)) -> FileResponse:
    with _lock:
        job = _jobs.get(job_id)
    if not job or job.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Result not ready")
    path = job.get("output_path")
    if not path or not Path(path).is_file():
        raise HTTPException(status_code=404, detail="File missing")
    return FileResponse(path, media_type="video/mp4", filename=f"{job_id}.mp4")


@app.get("/health")
def health() -> Response:
    return Response(status_code=200)
