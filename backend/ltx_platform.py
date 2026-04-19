"""
Résolution, cadence et pipeline LTX par réseau social (aligné sur les contraintes LTX-2 / two-stage).
Les dimensions sont des multiples de 32 ; num_frames suit le format 8k+1 attendu par le modèle.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict


@dataclass(frozen=True)
class LtxVideoSpec:
    width: int
    height: int
    num_frames: int
    frame_rate: float
    pipeline: str  # two_stage | distilled | one_stage
    format_label: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "num_frames": self.num_frames,
            "frame_rate": self.frame_rate,
            "pipeline": self.pipeline,
            "format_label": self.format_label,
        }


def spec_for_platform(platform: str | None) -> LtxVideoSpec:
    p = (platform or "youtube").lower().strip()
    if p == "tiktok":
        return LtxVideoSpec(
            width=704,
            height=1280,
            num_frames=97,
            frame_rate=30.0,
            pipeline="distilled",
            format_label="vertical_9_16_tiktok",
        )
    if p == "instagram":
        return LtxVideoSpec(
            width=704,
            height=1280,
            num_frames=97,
            frame_rate=30.0,
            pipeline="distilled",
            format_label="vertical_9_16_reel",
        )
    if p == "facebook":
        return LtxVideoSpec(
            width=704,
            height=1280,
            num_frames=97,
            frame_rate=30.0,
            pipeline="distilled",
            format_label="vertical_9_16_facebook_reel",
        )
    # youtube & default : paysage type contenu long
    return LtxVideoSpec(
        width=1344,
        height=768,
        num_frames=161,
        frame_rate=24.0,
        pipeline="two_stage",
        format_label="horizontal_16_9_youtube",
    )


def default_pipeline_for_platform(platform: str | None) -> str:
    return spec_for_platform(platform).pipeline
