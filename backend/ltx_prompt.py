"""
Build LTX-2 style prompts from a long-form script.
Tone: fun + marketing-friendly + creator-oriented.
"""
import re
from typing import Any, Dict, Optional

_MAX_WORDS = 200


def _strip_script_markdown(text: str) -> str:
    t = text or ""
    t = re.sub(r"^#+\s*.+$", " ", t, flags=re.MULTILINE)
    t = re.sub(r"\*\*([^*]+)\*\*", r"\1", t)
    t = re.sub(r"\*([^*]+)\*", r"\1", t)
    t = re.sub(r"`([^`]+)`", r"\1", t)
    t = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _first_paragraphs(text: str, max_chars: int = 4000) -> str:
    body = text.strip()[:max_chars]
    parts = re.split(r"\n\s*\n", body)
    return parts[0].strip() if parts else body.strip()


def script_to_ltx_prompt(
    script_text: str,
    title: Optional[str] = None,
    platform: str = "youtube",
    trend_style: bool = True,
    video_spec: Optional[Dict[str, Any]] = None,
    language: str = "fr",
) -> str:
    """
    Compress script content into one paragraph suitable for LTX text-to-video.
    """
    cleaned = _strip_script_markdown(script_text)
    core = _first_paragraphs(cleaned, max_chars=6000)
    words = core.split()
    if len(words) > _MAX_WORDS:
        core = " ".join(words[:_MAX_WORDS])
        if core and core[-1].isalnum():
            core += "..."

    lang = (language or "fr").strip().lower()[:5]
    if lang.startswith("fr"):
        platform_hint = {
            "youtube": "Style YouTube long format, plans lisibles, rythme captivant pour retenir l'audience",
            "tiktok": "Style TikTok vertical 9:16, rythme rapide, hooks visuels stop-scroll",
            "instagram": "Style Reel Instagram vertical, esthétique premium, énergie lifestyle",
            "facebook": "Style Facebook Reel vertical, clair et engageant, impact immédiat",
        }.get((platform or "youtube").lower(), "style social vidéo")
        fun_prefix = (
            "Vidéo social media ultra accrocheuse, fun, vendeuse, émotion forte, "
            "hook dès les premières secondes, potentiel viral élevé."
        )
        topic_prefix = "Sujet"
        tech_prefix = "Livrable technique"
    elif lang.startswith("en"):
        platform_hint = {
            "youtube": "YouTube long-form style, clear framing, engaging pacing for retention",
            "tiktok": "TikTok vertical 9:16 style, fast tempo, stop-scroll visual hooks",
            "instagram": "Instagram Reel vertical style, premium aesthetic, lifestyle energy",
            "facebook": "Facebook Reel vertical style, clear and engaging, instant impact",
        }.get((platform or "youtube").lower(), "social video style")
        fun_prefix = (
            "Highly engaging social video, playful and sales-driven energy, emotional pull, "
            "strong opening hook, high viral potential."
        )
        topic_prefix = "Topic"
        tech_prefix = "Technical delivery"
    else:
        # fallback to French for unsupported languages
        platform_hint = "style social vidéo"
        fun_prefix = (
            "Vidéo social media ultra accrocheuse, fun, vendeuse, émotion forte, "
            "hook dès les premières secondes, potentiel viral élevé."
        )
        topic_prefix = "Sujet"
        tech_prefix = "Livrable technique"

    prefix_parts = []
    if trend_style:
        prefix_parts.append(fun_prefix)
    prefix_parts.append(platform_hint + ".")
    if title:
        prefix_parts.append(f"{topic_prefix}: {title.strip()}.")
    prefix = " ".join(prefix_parts)

    tech = ""
    if video_spec:
        w = video_spec.get("width")
        h = video_spec.get("height")
        fps = video_spec.get("frame_rate")
        nf = video_spec.get("num_frames")
        fl = video_spec.get("format_label", "")
        if w and h and fps is not None:
            tech = f"{tech_prefix}: {w}x{h} pixels, {fps} fps"
            if nf:
                tech += f", {nf} frames"
            if fl:
                tech += f", format {fl}"
            tech += ". "

    return f"{prefix} {tech}{core}".strip()
