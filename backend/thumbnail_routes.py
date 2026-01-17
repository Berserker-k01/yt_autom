from flask import Blueprint, request, jsonify, send_file
import os
from .thumbnail_generator import ThumbnailGenerator
import logging

thumbnail_bp = Blueprint('thumbnail', __name__)
generator = ThumbnailGenerator()
logger = logging.getLogger(__name__)

@thumbnail_bp.route('/generate', methods=['POST'])
def generate_thumbnail():
    try:
        data = request.json
        script = data.get('script', '')
        title = data.get('title', 'Video sans titre')
        
        if not script and not title:
            return jsonify({'error': 'Script ou titre requis'}), 400
            
        logger.info(f"🎨 Requête de miniature pour: {title}")
        
        # 1. Génération du prompt optimisé par IA
        prompt = generator.generate_prompt(script, title)
        
        # 2. Génération de l'image
        image_path = generator.generate_image(prompt)
        
        if image_path:
            # On retourne l'URL locale pour l'accès (servi par une route statique ou send_file)
            image_filename = os.path.basename(image_path)
            return jsonify({
                "success": True, 
                "imageUrl": f"/api/thumbnail/view/{image_filename}",
                "prompt_used": prompt
            })
        else:
            return jsonify({"error": "Échec de la génération de l'image"}), 500

    except Exception as e:
        logger.error(f"Erreur route thumbnail: {e}")
        return jsonify({"error": str(e)}), 500

@thumbnail_bp.route('/view/<filename>', methods=['GET'])
def view_thumbnail(filename):
    """Sert l'image générée."""
    try:
        filepath = os.path.join(generator.output_dir, filename)
        if os.path.exists(filepath):
            return send_file(filepath, mimetype='image/jpeg')
        else:
            return jsonify({"error": "Image introuvable"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
