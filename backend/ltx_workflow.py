"""
Orchestrate LTX text-to-video after a script exists: build prompt, call GPU runner, store MP4.
"""
import os
import re
from datetime import datetime
from typing import Optional

from backend.database import db
from backend.ltx_platform import spec_for_platform
from backend.ltx_prompt import script_to_ltx_prompt
from backend.ltx_runner_client import download_result, submit_job, wait_for_job
from backend.saas_models import Script, UsageMetric


def _merge_script_meta(script: Script, patch: dict) -> None:
    base = dict(script.extra_metadata or {})
    cur = dict(base.get("ltx_video") or {})
    cur.update(patch)
    base["ltx_video"] = cur
    script.extra_metadata = base


def _static_video_dir() -> str:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    d = os.path.join(root, "static", "videos")
    os.makedirs(d, exist_ok=True)
    return d


def _safe_filename(script_id: int, token: str) -> str:
    t = re.sub(r"[^a-f0-9]", "", token.lower())[:16] or "vid"
    return f"ltx_{script_id}_{t}.mp4"


def run_ltx_pipeline_for_script(
    script_id: int,
    pipeline: Optional[str] = None,
    enhance_prompt: bool = True,
) -> None:
    """
    Worker entry (Celery ou thread) : charge le script, envoie au runner LTX, enregistre le MP4.
    """
    script = Script.query.get(script_id)
    if not script:
        return

    spec = spec_for_platform(script.platform)
    effective_pipeline = pipeline or spec.pipeline
    spec_dict = spec.to_dict()
    extra = dict(script.extra_metadata or {})
    # language can come from settings metadata or user profile payload
    lang = (
        extra.get("ai_language")
        or (extra.get("profile") or {}).get("language")
        or (extra.get("custom_options") or {}).get("language")
        or "fr"
    )

    try:
        _merge_script_meta(
            script,
            {
                "status": "processing",
                "started_at": datetime.utcnow().isoformat() + "Z",
                "video_format": spec_dict,
                "platform": script.platform,
            },
        )
        db.session.commit()

        prompt = script_to_ltx_prompt(
            script.content,
            title=script.title,
            platform=script.platform,
            trend_style=True,
            video_spec=spec_dict,
            language=lang,
        )

        job_id = submit_job(
            prompt,
            pipeline=effective_pipeline,
            enhance_prompt=enhance_prompt,
            platform=script.platform,
            width=spec.width,
            height=spec.height,
            num_frames=spec.num_frames,
            frame_rate=spec.frame_rate,
        )
        _merge_script_meta(script, {"runner_job_id": job_id})
        db.session.commit()

        wait_for_job(job_id)
        script = Script.query.get(script_id)
        if not script:
            return
        blob = download_result(job_id)

        token = os.urandom(8).hex()
        fname = _safe_filename(script.id, token)
        out_dir = _static_video_dir()
        out_path = os.path.join(out_dir, fname)
        with open(out_path, "wb") as f:
            f.write(blob)

        rel = f"/api/video/ltx/result/{script.id}"
        _merge_script_meta(
            script,
            {
                "status": "completed",
                "filename": fname,
                "video_url": rel,
                "prompt_preview": prompt[:400],
                "completed_at": datetime.utcnow().isoformat() + "Z",
                "pipeline_used": effective_pipeline,
                "language_used": lang,
            },
        )
        script.updated_at = datetime.utcnow()
        db.session.commit()

        UsageMetric.log_action(
            script.user_id,
            "ltx_video_generated",
            {"script_id": script.id, "pipeline": effective_pipeline, "platform": script.platform},
        )
    except Exception as e:
        db.session.rollback()
        script = Script.query.get(script_id)
        if script:
            _merge_script_meta(
                script,
                {
                    "status": "failed",
                    "error": str(e),
                    "failed_at": datetime.utcnow().isoformat() + "Z",
                },
            )
            script.updated_at = datetime.utcnow()
            db.session.commit()
