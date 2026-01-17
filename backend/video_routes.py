from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from .audio_generator import AudioGenerator
from .video_assets import VideoAssetManager
from .video_maker import VideoMaker

video_bp = Blueprint('video', __name__)

@video_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_video():
    """
    Génère une vidéo complète à partir d'un script.
    """
    user_id = get_jwt_identity()
    data = request.json
    
    script_text = data.get('script_text', '')
    keywords = data.get('keywords', ['business', 'technology']) # TODO: extraire du script
    
    if not script_text:
        return jsonify({"error": "Script manquant"}), 400

    # 1. Vérifications API Keys
    if not os.getenv('PEXELS_API_KEY'):
        return jsonify({"error": "Clé API Pexels manquante dans le .env"}), 503

    try:
        # 2. Génération Audio
        print("🔊 Génération Audio...")
        audio_gen = AudioGenerator()
        audio_filename = f"audio_{os.urandom(4).hex()}.mp3"
        audio_path = os.path.join("temp", audio_filename)
        os.makedirs("temp", exist_ok=True)
        # Appel synchrone du wrapper async
        audio_gen.generate_sync(script_text[:1000], audio_path) # Limite 1000 chars pour test

        # 3. Récupération Assets
        print("🎥 Recherche Assets Pexels...")
        asset_manager = VideoAssetManager()
        assets = []
        for kw in keywords[:3]: # Chercher 3 vidéos max
            vid_url = asset_manager.search_video(kw, duration_min=5, orientation='portrait')
            if vid_url:
                local_vid = os.path.join("temp", f"vid_{kw}_{os.urandom(2).hex()}.mp4")
                asset_manager.download_asset(vid_url, local_vid)
                assets.append(local_vid)
        
        if not assets:
            return jsonify({"error": "Aucune vidéo trouvée sur Pexels"}), 404

        # 4. Assemblage
        print("🎬 Assemblage Final...")
        maker = VideoMaker(output_dir="static/videos")
        final_video = maker.create_video(
            assets=assets,
            audio_path=audio_path,
            subtitles=[], # Pas de sous-titres pour l'instant
            options={'format': 'vertical'}
        )
        
        # URL relative pour le frontend (nginx servira static/videos)
        video_url = f"/static/videos/{os.path.basename(final_video)}"
        
        return jsonify({
            "status": "success",
            "video_url": video_url,
            "message": "Vidéo générée avec succès"
        })

    except Exception as e:
        print(f"Erreur Génération Vidéo: {e}")
        return jsonify({"error": str(e)}), 500
