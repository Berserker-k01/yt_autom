from flask import Flask, request, jsonify, send_file, after_this_request, redirect, url_for, session
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime, timedelta
import io
import tempfile

# Permet d'importer main.py depuis le dossier parent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import generate_topics, generate_script, save_to_pdf

app = Flask(__name__)

# Configuration de l'application
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_change_in_production')

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
    try:
        data = request.get_json()
        theme = data.get('theme', '')
        num_topics = int(data.get('num_topics', 5))
        
        # Version simplifiée sans authentification pour le déploiement
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
        
        # Nettoyer la mémoire après génération des sujets
        cleanup_memory()
        
        return jsonify({'topics': topics})
    except Exception as e:
        print(f"Erreur lors de la génération des sujets: {e}")
        cleanup_memory()  # Nettoyer en cas d'erreur aussi
        return jsonify({'error': str(e), 'topics': []}), 500

@app.route('/generate-script', methods=['POST'])
def api_generate_script():
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        research = data.get('research', '')
        sources = data.get('sources', [])
        
        # Si les sources ne sont pas fournies, essayer de les extraire de la recherche
        if not sources and research:
            from main import extract_sources
            sources = extract_sources(research)
            
        script = generate_script(topic, research)
        
        # Nettoyer la mémoire après génération du script
        cleanup_memory()
        
        return jsonify({
            'script': script,
            'sources': sources
        })
    except Exception as e:
        print(f"Erreur lors de la génération du script: {e}")
        cleanup_memory()
        return jsonify({'error': str(e)}), 500

@app.route('/export-pdf', methods=['POST', 'OPTIONS'])
def api_export_pdf():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response
        
    try:
        data = request.get_json()
        script_text = data.get('script', '')
        sources = data.get('sources', [])
        
        if not script_text:
            return jsonify({'error': 'Aucun script fourni'}), 400
        
        # Formatage du texte pour assurer qu'il est utilisable par FPDF
        script_text = script_text.replace('\r\n', '\n').replace('\r', '\n')
        
        print(f"Longueur du script: {len(script_text)} caractères")
        print(f"Nombre de sources: {len(sources)}")
        
        # Passage des sources à la fonction save_to_pdf
        filename = save_to_pdf(script_text, sources)
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
            
            # Headers CORS complets
            response.headers['Access-Control-Allow-Origin'] = frontend_url
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept'
            response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition, Content-Length, Content-Type'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename="{os.path.basename(filename)}"'
            
            print("Envoi du PDF en cours")
            
            # Nettoyer le fichier temporaire après envoi
            @response.call_on_close
            def cleanup():
                try:
                    os.remove(filename)
                    print(f"Fichier temporaire supprimé: {filename}")
                except Exception as e:
                    print(f"Erreur lors de la suppression du fichier temporaire: {e}")
                # Libérer la mémoire
                cleanup_memory()
                print("Mémoire nettoyée après export PDF")
                    
            return response
        except Exception as e:
            print(f"Erreur lors de l'envoi du PDF: {str(e)}")
            return jsonify({'error': f'Erreur lors de l\'envoi du PDF: {str(e)}'}), 500
            
    except Exception as e:
        print(f"Erreur globale lors de l'export PDF: {str(e)}")
        return jsonify({'error': f'Erreur lors de la génération du PDF: {str(e)}'}), 500

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

# Configuration pour optimiser la mémoire sur le serveur
def cleanup_memory():
    """Libère la mémoire en forçant le garbage collector"""
    import gc
    gc.collect()

# Configurer le nombre de workers pour Gunicorn (si utilisé)
# Utiliser 2-4 workers au lieu du nombre de processeurs
import multiprocessing
workers = min(multiprocessing.cpu_count(), 2)

if __name__ == '__main__':
    # Configuration pour un serveur de développement léger
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, processes=1)
