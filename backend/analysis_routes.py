from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.video_analyst import VideoAnalyst
import logging

analysis_bp = Blueprint('analysis', __name__)
logger = logging.getLogger(__name__)

# Instanciation unique (attention à la gestion de la clé API)
analyst = VideoAnalyst()

@analysis_bp.route('/process', methods=['POST'])
@jwt_required()
def process_video():
    """
    Télécharge, upload vers Gemini et analyse une vidéo.
    Input: { "url": "https://..." }
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({"error": "URL manquante"}), 400
        
    try:
        # 1. Téléchargement
        logger.info(f"User {user_id} requesting video analysis for {url}")
        video_path = analyst.download_video(url)
        
        # 2. Upload Gemini
        video_file = analyst.upload_to_gemini(video_path)
        
        # 3. Analyse Initiale
        initial_analysis = analyst.analyze_content(video_file, query="Fais un résumé détaillé de cette vidéo. Quels sont les points clés, le ton, et les éléments visuels importants ?")
        
        # 4. Nettoyage local (on garde le fichier sur Gemini)
        analyst.cleanup(video_path)
        
        return jsonify({
            "success": True,
            "summary": initial_analysis,
            "gemini_file_uri": video_file.uri,
            "gemini_file_name": video_file.name
        })
        
    except Exception as e:
        logger.error(f"Erreur process video: {e}")
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
