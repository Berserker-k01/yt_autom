from flask import Flask, request, jsonify, send_file, after_this_request, redirect, url_for, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import os
import sys
import json
from datetime import datetime, timedelta
import io
import tempfile

# Permet d'importer main.py depuis le dossier parent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import generate_topics, generate_script, save_to_pdf

# Import des modèles de base de données
from models import db, User, UserProfile

app = Flask(__name__)

# Configuration de l'application
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_change_in_production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///yt_autom.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session persistante de 7 jours

# Initialisation de la base de données
db.init_app(app)

# Configurer CORS pour fonctionner avec l'environnement de production
frontend_url = os.environ.get('FRONTEND_URL', '*')
CORS(app, resources={r"/*": {"origins": frontend_url, "supports_credentials": True, "expose_headers": ["Content-Disposition", "Content-Type", "Content-Length"]}}, allow_headers=["Content-Type", "Accept"], max_age=86400)

# Configuration du système d'authentification
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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

# Routes d'authentification et de profil utilisateur
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Vérification des données requises
        if not all([username, email, password]):
            return jsonify({'error': 'Tous les champs sont requis'}), 400
            
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({'error': 'Nom d\'utilisateur ou email déjà utilisé'}), 409
            
        # Créer un nouvel utilisateur
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        # Créer un profil vide pour l'utilisateur
        new_profile = UserProfile(user=new_user)
        
        # Sauvegarder dans la base de données
        db.session.add(new_user)
        db.session.add(new_profile)
        db.session.commit()
        
        # Connecter automatiquement l'utilisateur
        login_user(new_user)
        
        return jsonify({
            'message': 'Inscription réussie', 
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'setupRequired': True
            }
        })
        
    except Exception as e:
        print(f"Erreur lors de l'inscription: {e}")
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'inscription: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        print("Tentative de connexion...")
        # Afficher les en-têtes pour déboguer les problèmes CORS
        print(f"En-têtes de la requête: {request.headers}")
        
        data = request.get_json()
        print(f"Données reçues: {data}")
        
        email = data.get('email')
        password = data.get('password')
        remember = data.get('remember', False)
        
        print(f"Email: {email}, Remember: {remember}")
        
        # Vérification des données requises
        if not all([email, password]):
            print("Données manquantes dans la requête")
            return jsonify({'error': 'Email et mot de passe requis'}), 400
            
        # Chercher l'utilisateur
        user = User.query.filter_by(email=email).first()
        print(f"Utilisateur trouvé: {user is not None}")
        
        # Vérifier le mot de passe
        if not user:
            print("Utilisateur non trouvé")
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
            
        if not user.check_password(password):
            print("Mot de passe incorrect")
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
            
        # Connecter l'utilisateur
        print("Connexion de l'utilisateur...")
        login_user(user, remember=remember)
        print(f"Utilisateur connecté: {current_user.is_authenticated}")
        
        # Vérifier si le profil est configuré
        setup_required = True
        if user.profile:
            setup_required = not user.profile.setup_completed
        print(f"Configuration requise: {setup_required}")
        
        response = jsonify({
            'message': 'Connexion réussie',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'setupRequired': setup_required
            }
        })
        
        # Ajouter le cookie de session manuellement si nécessaire
        # response.set_cookie('session', session.sid, httponly=True, samesite='Lax')
        
        print("Réponse de connexion envoyée avec succès")
        return response
        
    except Exception as e:
        print(f"Erreur lors de la connexion: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Erreur lors de la connexion: {str(e)}"}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Déconnexion réussie'})

@app.route('/api/setup-profile', methods=['POST'])
@login_required
def setup_profile():
    try:
        data = request.get_json()
        
        # Récupérer ou créer le profil pour l'utilisateur actuel
        profile = current_user.profile
        if not profile:
            profile = UserProfile(user_id=current_user.id)
            db.session.add(profile)
        
        # Mettre à jour les champs du profil
        profile.channel_name = data.get('channel_name')
        profile.youtuber_name = data.get('youtuber_name')
        profile.video_style = data.get('video_style')
        profile.approach_style = data.get('approach_style')
        profile.target_audience = data.get('target_audience')
        profile.video_length = data.get('video_length')
        profile.setup_completed = True
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profil configuré avec succès',
            'profile': {
                'channel_name': profile.channel_name,
                'youtuber_name': profile.youtuber_name,
                'setup_completed': profile.setup_completed
            }
        })
        
    except Exception as e:
        print(f"Erreur lors de la configuration du profil: {e}")
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de la configuration du profil: {str(e)}"}), 500

@app.route('/api/profile', methods=['GET'])
@login_required
def get_profile():
    profile = current_user.profile
    
    if not profile:
        return jsonify({'error': 'Profil non trouvé'}), 404
        
    return jsonify({
        'id': profile.id,
        'channel_name': profile.channel_name,
        'youtuber_name': profile.youtuber_name,
        'video_style': profile.video_style,
        'approach_style': profile.approach_style,
        'target_audience': profile.target_audience,
        'video_length': profile.video_length,
        'setup_completed': profile.setup_completed
    })

@app.route('/api/user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'setupRequired': not current_user.profile.setup_completed if current_user.profile else True
    })

# Initialiser la base de données et démarrer l'application
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Configuration pour un serveur de développement léger
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, processes=1)
