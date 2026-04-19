from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.video_analyst import VideoAnalyst
import logging

analysis_bp = Blueprint('analysis', __name__)
logger = logging.getLogger(__name__)

# Instanciation unique (attention à la gestion de la clé API)
# Instanciation unique (attention à la gestion de la clé API)
analyst = VideoAnalyst()

# Redis Init
from backend.redis_client import get_redis_client
redis_client = get_redis_client()

@analysis_bp.route('/status/<request_id>', methods=['GET'])
def get_analysis_status(request_id):
    """Retourne le statut en temps réel de l'analyse."""
    if not redis_client:
        return jsonify({"status": "unknown"}), 200
        
    status = redis_client.get(f"job:{request_id}")
    return jsonify({"status": status or "Initialisation..."})

@analysis_bp.route('/process', methods=['POST'])
@jwt_required()
def process_video():
    """
    Télécharge, upload vers Gemini et analyse une vidéo.
    Input: { "url": "https://...", "request_id": "optional-uuid" }
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    url = data.get('url')
    request_id = data.get('request_id')
    
    if not url:
        return jsonify({"error": "URL manquante"}), 400

    # Fonction de callback pour Redis
    def progress_callback(msg):
        if redis_client and request_id:
            try:
                redis_client.setex(f"job:{request_id}", 300, msg)
            except Exception as e:
                logger.error(f"Redis error: {e}")
        
    try:
        # 1. Téléchargement & Métadatas
        logger.info(f"User {user_id} requesting video analysis for {url}")
        progress_callback("⬇️ Démarrage du téléchargement...")
        video_path, metadata = analyst.download_video(url, progress_callback=progress_callback)
        
        # 2. Upload Gemini
        video_file = analyst.upload_to_gemini(video_path, progress_callback=progress_callback)
        
        # 3. Analyse Initiale Enrichie
        context_prompt = f"""
        Voici les métadonnées de la vidéo :
        - Titre : {metadata['title']}
        - Auteur : {metadata['author']}
        - Vues : {metadata['views']}
        - Likes : {metadata['likes']}
        
        Tâche : Fais un résumé stratégique pour un créateur de contenu.
        1. De quoi parle la vidéo ?
        2. Quels sont les éléments viraux (Hook, Structure) ?
        3. Donne une note de viralité sur 10 avec justification.
        """
        initial_analysis = analyst.analyze_content(video_file, query=context_prompt, progress_callback=progress_callback)
        
        # 4. Nettoyage local (on garde le fichier sur Gemini)
        analyst.cleanup(video_path)
        progress_callback("✅ Analyse terminée !")
        
        return jsonify({
            "success": True,
            "summary": initial_analysis,
            "video_info": metadata, # Send metadata to frontend
            "gemini_file_uri": video_file.uri,
            "gemini_file_name": video_file.name
        })
        
    except Exception as e:
        logger.error(f"Erreur process video: {e}")
        progress_callback(f"❌ Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500

@analysis_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_video():
    """
    Discute à propos d'une vidéo déjà uploadée.
    Input: { "query": "...", "file_name": "files/..." }
    """
    data = request.get_json()
    query = data.get('query')
    file_name = data.get('file_name')
    
    if not query or not file_name:
        return jsonify({"error": "Query et file_name requis"}), 400
        
    try:
        # Récupération de l'objet fichier Gemini (sans re-upload)
        # Note: genai.get_file(name) permet de récupérer la référence
        import google.generativeai as genai
        video_file = genai.get_file(file_name)
        
        response = analyst.analyze_content(video_file, query=query)
        
        return jsonify({
            "response": response
        })
        
    except Exception as e:
        logger.error(f"Erreur chat video: {e}")
        return jsonify({"error": str(e)}), 500
