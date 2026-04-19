"""
HTTP client for the LTX GPU worker (ltx_runner/).

Configure Scripty with:
  LTX_RUNNER_URL   e.g. http://ltx-runner:8090
  LTX_RUNNER_TOKEN optional shared secret (Bearer)

Env for polling:
  LTX_POLL_INTERVAL_SEC  default 5
  LTX_POLL_MAX_SEC       default 3600
"""
import os
import time
from typing import Any, Dict, Optional

import requests

DEFAULT_POLL_INTERVAL = int(os.getenv("LTX_POLL_INTERVAL_SEC", "5"))
DEFAULT_POLL_MAX = int(os.getenv("LTX_POLL_MAX_SEC", "3600"))


def _base() -> str:
    url = (os.getenv("LTX_RUNNER_URL") or "").strip().rstrip("/")
    if not url:
        raise RuntimeError("LTX_RUNNER_URL is not configured")
    return url


def _headers() -> Dict[str, str]:
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    token = (os.getenv("LTX_RUNNER_TOKEN") or "").strip()
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def submit_job(
    prompt: str,
    pipeline: str = "two_stage",
    enhance_prompt: bool = True,
    negative_prompt: str = "",
    platform: str = "youtube",
    width: Optional[int] = None,
    height: Optional[int] = None,
    num_frames: Optional[int] = None,
    frame_rate: Optional[float] = None,
) -> str:
    """POST /v1/jobs -> job_id."""
    payload: Dict[str, Any] = {
        "prompt": prompt,
        "pipeline": pipeline,
        "enhance_prompt": enhance_prompt,
        "negative_prompt": negative_prompt or "",
        "platform": platform,
    }
    if width is not None:
        payload["width"] = width
    if height is not None:
        payload["height"] = height
    if num_frames is not None:
        payload["num_frames"] = num_frames
    if frame_rate is not None:
        payload["frame_rate"] = frame_rate

    r = requests.post(
        f"{_base()}/v1/jobs",
        json=payload,
        headers=_headers(),
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    job_id = data.get("job_id")
    if not job_id:
        raise RuntimeError(f"LTX runner returned no job_id: {data}")
    return str(job_id)


def get_job(job_id: str) -> Dict[str, Any]:
    r = requests.get(
        f"{_base()}/v1/jobs/{job_id}",
        headers=_headers(),
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def download_result(job_id: str) -> bytes:
    r = requests.get(
        f"{_base()}/v1/jobs/{job_id}/file",
        headers=_headers(),
        timeout=600,
    )
    r.raise_for_status()
    return r.content


def wait_for_job(
    job_id: str,
    poll_interval: Optional[int] = None,
    poll_max: Optional[int] = None,
) -> Dict[str, Any]:
    interval = poll_interval if poll_interval is not None else DEFAULT_POLL_INTERVAL
    max_wait = poll_max if poll_max is not None else DEFAULT_POLL_MAX
    deadline = time.time() + max_wait
    last: Dict[str, Any] = {}
    while time.time() < deadline:
        last = get_job(job_id)
        status = last.get("status")
        if status == "completed":
            return last
        if status == "failed":
            raise RuntimeError(last.get("error") or "LTX job failed")
        time.sleep(interval)
    raise TimeoutError(f"LTX job {job_id} did not finish within {max_wait}s; last={last}")
