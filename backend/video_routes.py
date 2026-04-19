import os
import re
from datetime import datetime

from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required

from backend.auth_utils import check_usage_limit, get_current_user
from backend.database import db
from backend.saas_models import Script

from .audio_generator import AudioGenerator
from .video_assets import VideoAssetManager
from .video_maker import VideoMaker

video_bp = Blueprint("video", __name__)


def _ltx_filename_ok(fn: str) -> bool:
    return bool(re.match(r"^ltx_\d+_[a-f0-9]+\.mp4$", fn))


def _queue_ltx_generation(script: Script, user) -> dict:
    """Met le script en file Celery pour vidéo IA (format déduit du `script.platform`)."""
    if not os.getenv("LTX_RUNNER_URL"):
        raise ValueError("LTX_RUNNER_URL is not configured")
    can, msg = check_usage_limit(user.id, "ltx_video_generated")
    if not can:
        raise PermissionError(msg)
    ltx = (script.extra_metadata or {}).get("ltx_video") or {}
    if ltx.get("status") in ("queued", "processing"):
        raise RuntimeError("ALREADY_RUNNING")
    meta = dict(script.extra_metadata or {})
    meta["ltx_video"] = {
        **ltx,
        "status": "queued",
        "mode": "auto",
        "queued_at": datetime.utcnow().isoformat() + "Z",
    }
    script.extra_metadata = meta
    script.updated_at = datetime.utcnow()
    db.session.commit()
    try:
        from backend.tasks_ltx import enqueue_ltx_for_script

        enqueue_ltx_for_script(script.id)
    except Exception as exc:
        meta = dict(script.extra_metadata or {})
        meta["ltx_video"] = {
            **(meta.get("ltx_video") or {}),
            "status": "failed",
            "error": f"File d'attente indisponible: {exc}",
        }
        script.extra_metadata = meta
        script.updated_at = datetime.utcnow()
        db.session.commit()
        raise RuntimeError(str(exc)) from exc
    return meta["ltx_video"]


@video_bp.route("/config", methods=["GET"])
def video_config():
    """Indique si la génération vidéo IA est disponible (sans JWT)."""
    return jsonify(
        {
            "ai_video_available": bool(os.getenv("LTX_RUNNER_URL")),
            "message": "Génération vidéo IA disponible" if os.getenv("LTX_RUNNER_URL") else "Worker vidéo non configuré",
        }
    )


@video_bp.route("/auto", methods=["POST"])
@jwt_required()
def video_auto():
    """Une action simple : générer la vidéo IA pour ce script (format = réseau du script)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "User not found"}), 401
    script_id = (request.get_json() or {}).get("script_id")
    if not script_id:
        return jsonify({"error": "script_id is required"}), 400
    script = Script.query.filter_by(id=script_id, user_id=user.id).first()
    if not script:
        return jsonify({"error": "Script not found"}), 404
    try:
        meta = _queue_ltx_generation(script, user)
    except ValueError as e:
        return jsonify({"error": str(e)}), 503
    except PermissionError as e:
        return jsonify({"error": str(e), "upgrade_required": True}), 403
    except RuntimeError as e:
        if str(e) == "ALREADY_RUNNING":
            ltx = (script.extra_metadata or {}).get("ltx_video") or {}
            return jsonify({"error": "Une génération est déjà en cours", "ltx_video": ltx}), 409
        return jsonify({"error": str(e)}), 503
    return jsonify({"message": "Vidéo en cours de génération", "script_id": script_id, "ltx_video": meta}), 202


@video_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate_video():
    """
    Génère une vidéo complète à partir d'un script (stock + voix + montage).
    """
    data = request.json

    script_text = data.get("script_text", "")
    keywords = data.get("keywords", ["business", "technology"])

    if not script_text:
        return jsonify({"error": "Script manquant"}), 400

    if not os.getenv("PEXELS_API_KEY"):
        return jsonify({"error": "Clé API Pexels manquante dans le .env"}), 503

    try:
        print("🔊 Génération Audio...")
        audio_gen = AudioGenerator()
        audio_filename = f"audio_{os.urandom(4).hex()}.mp3"
        audio_path = os.path.join("temp", audio_filename)
        os.makedirs("temp", exist_ok=True)
        audio_gen.generate_sync(script_text[:1000], audio_path)

        print("🎥 Recherche Assets Pexels...")
        asset_manager = VideoAssetManager()
        assets = []
        for kw in keywords[:3]:
            vid_url = asset_manager.search_video(kw, duration_min=5, orientation="portrait")
            if vid_url:
                local_vid = os.path.join("temp", f"vid_{kw}_{os.urandom(2).hex()}.mp4")
                asset_manager.download_asset(vid_url, local_vid)
                assets.append(local_vid)

        if not assets:
            return jsonify({"error": "Aucune vidéo trouvée sur Pexels"}), 404

        print("🎬 Assemblage Final...")
        maker = VideoMaker(output_dir="static/videos")
        final_video = maker.create_video(
            assets=assets,
            audio_path=audio_path,
            subtitles=[],
            options={"format": "vertical"},
        )

        video_url = f"/static/videos/{os.path.basename(final_video)}"

        return jsonify(
            {
                "status": "success",
                "video_url": video_url,
                "message": "Vidéo générée avec succès",
            }
        )

    except Exception as e:
        print(f"Erreur Génération Vidéo: {e}")
        return jsonify({"error": str(e)}), 500


@video_bp.route("/ltx/start", methods=["POST"])
@jwt_required()
def ltx_start():
    """Alias de /auto (rétrocompat)."""
    return video_auto()


@video_bp.route("/ltx/status/<int:script_id>", methods=["GET"])
@jwt_required()
def ltx_status(script_id: int):
    user = get_current_user()
    script = Script.query.filter_by(id=script_id, user_id=user.id).first()
    if not script:
        return jsonify({"error": "Script not found"}), 404
    return jsonify({"ltx_video": (script.extra_metadata or {}).get("ltx_video")}), 200


@video_bp.route("/ltx/result/<int:script_id>", methods=["GET"])
@jwt_required()
def ltx_result(script_id: int):
    """Stream ou téléchargement du MP4 généré."""
    user = get_current_user()
    script = Script.query.filter_by(id=script_id, user_id=user.id).first()
    if not script:
        return jsonify({"error": "Script not found"}), 404

    ltx = (script.extra_metadata or {}).get("ltx_video") or {}
    if ltx.get("status") != "completed":
        return jsonify({"error": "Video not ready", "ltx_video": ltx}), 409

    fn = ltx.get("filename") or ""
    if not _ltx_filename_ok(fn):
        return jsonify({"error": "Invalid stored filename"}), 500

    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    path = os.path.join(root, "static", "videos", fn)
    if not os.path.isfile(path):
        return jsonify({"error": "File missing on server"}), 404

    inline = request.args.get("inline") == "1"
    return send_file(
        path,
        mimetype="video/mp4",
        as_attachment=not inline,
        download_name=fn,
    )
