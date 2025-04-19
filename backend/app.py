from flask import Flask, request, jsonify, send_file, after_this_request
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime
import io
# Permet d'importer main.py depuis le dossier parent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import generate_topics, generate_script, save_to_pdf
import tempfile

app = Flask(__name__)

# Configurer CORS pour fonctionner avec l'environnement de production
frontend_url = os.environ.get('FRONTEND_URL', '*')
CORS(app, resources={r"/*": {"origins": frontend_url, "supports_credentials": True, "expose_headers": ["Content-Disposition", "Content-Type", "Content-Length"]}}, allow_headers=["Content-Type", "Accept"], max_age=86400)

# Fichier pour stocker l'historique des sujets
HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'topics_history.json'))

# Fonction pour charger l'historique
def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erreur lors du chargement de l'historique: {e}")
    return {'topics': []}

# Fonction pour sauvegarder l'historique
def save_history(history):
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Erreur lors de la sauvegarde de l'historique: {e}")
        return False

@app.route('/generate-topics', methods=['POST'])
def api_generate_topics():
    data = request.get_json()
    theme = data.get('theme', '')
    num_topics = int(data.get('num_topics', 5))
    topics = generate_topics(theme, num_topics)
    
    # Enregistrer dans l'historique
    if topics:
        history = load_history()
        # Ajouter les nouveaux sujets avec timestamp et thème
        entry = {
            "theme": theme,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "topics": topics
        }
        history['topics'].append(entry)
        save_history(history)
    
    return jsonify({'topics': topics})

@app.route('/generate-script', methods=['POST'])
def api_generate_script():
    data = request.get_json()
    topic = data.get('topic', '')
    research = data.get('research', '')
    script = generate_script(topic, research)
    return jsonify({'script': script})

@app.route('/export-pdf', methods=['POST', 'OPTIONS'])
def api_export_pdf():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')  # ou votre domaine spécifique
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '86400')  # 24 heures
        return response
        
    print("Requête export PDF reçue")
    data = request.get_json()
    print(f"Données reçues: {data}")
    
    script_text = data.get('script')
    if not script_text:
        print("Erreur: Aucun script fourni")
        return jsonify({'error': 'Aucun script fourni'}), 400
        
    # Assure-toi que script_text est bien une chaîne de caractères
    if not isinstance(script_text, str):
        try:
            script_text = json.dumps(script_text)
        except:
            script_text = str(script_text)
    
    print(f"Longueur du script: {len(script_text)} caractères")
    
    filename = save_to_pdf(script_text)
    if not filename or not os.path.exists(filename):
        print("Erreur: Impossible de générer le PDF")
        return jsonify({'error': 'Erreur lors de la génération du PDF'}), 500
        
    print(f"PDF généré: {filename}")
    
    try:
        # Lire le fichier en mémoire pour éviter les problèmes d'accès et de permissions
        with open(filename, 'rb') as f:
            pdf_data = f.read()
        
        # Créer un objet BytesIO pour éviter les problèmes de fichiers temporaires
        pdf_io = io.BytesIO(pdf_data)
        
        # Flask >=2.0: download_name, sinon fallback
        send_file_kwargs = dict(
            mimetype='application/pdf',
            as_attachment=True
        )
        import flask
        if hasattr(flask, 'send_file') and 'download_name' in flask.send_file.__code__.co_varnames:
            send_file_kwargs['download_name'] = os.path.basename(filename)
        else:
            send_file_kwargs['attachment_filename'] = os.path.basename(filename)
            
        # Utiliser le BytesIO au lieu du fichier directement
        response = send_file(
            pdf_io,
            **send_file_kwargs
        )
        
        # Headers CORS complets - Définissons des headers bien spécifiques pour le PDF
        response.headers['Access-Control-Allow-Origin'] = frontend_url  # Utilise la même origine que la configuration CORS
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length, Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{os.path.basename(filename)}"'
        
        print("Envoi du PDF en cours")
        
        # Nettoyage du fichier temporaire après envoi
        @response.call_on_close
        def cleanup():
            try:
                os.remove(filename)
                print(f"Fichier temporaire supprimé: {filename}")
            except Exception as e:
                print(f"Erreur lors de la suppression du fichier temporaire: {e}")
                
        return response
    except Exception as e:
        print(f"Erreur lors de l'envoi du PDF: {str(e)}")
        return jsonify({'error': f'Erreur lors de l\'envoi du PDF: {str(e)}'}), 500

@app.route('/topics-history', methods=['GET'])
def api_get_history():
    history = load_history()
    return jsonify(history)
    
@app.route('/', methods=['GET'])
def index():
    """Route racine pour vérifier que l'API est en marche"""
    return jsonify({
        "status": "ok",
        "message": "API YouTube Script Generator est opérationnelle",
        "routes": [
            "/generate-topics - Générer des sujets tendance",
            "/generate-script - Générer un script",
            "/export-pdf - Exporter un script en PDF",
            "/topics-history - Consulter l'historique des sujets"
        ],
        "version": "1.0"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
