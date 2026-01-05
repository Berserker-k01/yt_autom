from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from backend.auth_utils import get_current_user
import sys
import os

# Add parent directory to path to import from main.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import generate_topics as main_generate_topics
from main import generate_script as main_generate_script
from main import save_to_pdf # Import PDF function
from flask import send_file
import tempfile
import time

legacy_bp = Blueprint('legacy', __name__)

@legacy_bp.route('/generate-topics', methods=['POST'])
def generate_topics_route():
    try:
        # Attempt to get user context if logged in, but don't fail if not
        user_context = {}
        try:
            verify_jwt_in_request(optional=True)
            user = get_current_user()
            if user:
                user_context = {
                    'youtuber_name': user.name,
                    'channel_name': user.name,
                    # Add other convenient fields if available in user model
                }
        except Exception:
            pass  # Continue as anonymous if auth fails or is missing

        data = request.get_json()
        theme = data.get('theme')
        platform = data.get('platform', 'youtube')
        
        if not theme:
            return jsonify({'error': 'Theme is required'}), 400

        topics = main_generate_topics(
            theme=theme, 
            platform=platform, 
            num_topics=5, 
            user_context=user_context
        )
        
        return jsonify({'topics': topics}), 200

    except Exception as e:
        print(f"Error in /generate-topics: {e}")
        return jsonify({'error': str(e)}), 500

@legacy_bp.route('/generate-script', methods=['POST'])
def generate_script_route():
    try:
        # Attempt to get user context
        user_context = {}
        try:
            verify_jwt_in_request(optional=True)
            user = get_current_user()
            if user:
                user_context = {
                    'youtuber_name': user.name,
                    'channel_name': user.name
                }
        except Exception:
            pass

        data = request.get_json()
        topic = data.get('topic')
        platform = data.get('platform', 'youtube')
        research = data.get('research', '')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400

        script_content = main_generate_script(
            topic=topic,
            research=research,
            platform=platform,
            user_context=user_context
        )
        
        if not script_content:
             return jsonify({'error': 'Failed to generate script'}), 500

        return jsonify({'script': script_content}), 200

    except Exception as e:
        print(f"Error in /generate-script: {e}")
        return jsonify({'error': str(e)}), 500

@legacy_bp.route('/export-pdf', methods=['POST'])
def export_pdf_route():
    try:
        data = request.get_json()
        script_content = data.get('script')
        title = data.get('title', 'Script Export')
        platform = data.get('platform', 'Universal')
        
        if not script_content:
            return jsonify({'error': 'Script content is required'}), 400

        # Create user details text
        author = "ScriptyAI User"
        channel = "My Channel"
        try:
            verify_jwt_in_request(optional=True)
            user = get_current_user()
            if user:
                author = user.name
                channel = user.name # Or retrieve channel if available
        except:
            pass

        # Generate PDF using main's function
        # Note: save_to_pdf returns format (pdf_path)
        # We need to make sure save_to_pdf writes to a location we can access
        
        pdf_path = save_to_pdf(
            script_text=script_content,
            title=f"{title} ({platform})",
            author=author,
            channel=channel
        )
        
        if pdf_path and os.path.exists(pdf_path):
             return send_file(pdf_path, as_attachment=True, download_name=f"script_{platform}_{int(time.time())}.pdf")
        
        return jsonify({'error': 'Failed to generate PDF file'}), 500

    except Exception as e:
        print(f"Error in /export-pdf: {e}")
        return jsonify({'error': str(e)}), 500
