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
        cleanup_memory()  # Nettoyer en cas d'erreur aussi
        return jsonify({'error': str(e)}), 500

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
    sources = data.get('sources', [])
    
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
        
        # Headers CORS complets - Définissons des headers bien spécifiques pour le PDF
        response.headers['Access-Control-Allow-Origin'] = frontend_url  # Utilise la même origine que la configuration CORS
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
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validation des données
        if not username or not email or not password:
            return jsonify({'error': 'Tous les champs sont requis'}), 400
            
        # Vérifier si l'utilisateur existe déjà
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            if existing_user.email == email:
                return jsonify({'error': 'Cette adresse email est déjà utilisée'}), 409
            else:
                return jsonify({'error': 'Ce nom d\'utilisateur est déjà pris'}), 409
                
        # Créer le nouvel utilisateur
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        # Créer un profil vide
        new_profile = UserProfile(user=new_user, setup_completed=False)
        
        # Sauvegarder dans la base de données
        db.session.add(new_user)
        db.session.add(new_profile)
        db.session.commit()
        
        # Connecter l'utilisateur automatiquement
        login_user(new_user)
        
        return jsonify({
            'id': new_user.id,
            'username': new_user.username,
            'setupRequired': True
        }), 201
        
    except Exception as e:
        print(f"Erreur lors de l'inscription: {e}")
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'inscription: {str(e)}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email_or_username = data.get('email')  # peut être email ou username
        password = data.get('password')
        
        # Trouver l'utilisateur
        user = User.query.filter((User.email == email_or_username) | (User.username == email_or_username)).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Identifiants incorrects'}), 401
            
        # Connecter l'utilisateur
        login_user(user, remember=True)
        
        # Vérifier si le profil a été configuré
        setup_required = not user.profile.setup_completed if user.profile else True
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'setupRequired': setup_required
        })
        
    except Exception as e:
        print(f"Erreur lors de la connexion: {e}")
        return jsonify({'error': f"Erreur lors de la connexion: {str(e)}"}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Déconnexion réussie'})

@app.route('/api/profile/setup', methods=['POST'])
@login_required
def setup_profile():
    try:
        data = request.json
        
        # Récupérer le profil utilisateur actuel
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

# Modifier les routes existantes pour exiger l'authentification et utiliser le profil utilisateur

@app.route('/generate-topics', methods=['POST'])
@login_required
def api_generate_topics():
    try:
        data = request.get_json()
        theme = data.get('theme', '')
        num_topics = int(data.get('num_topics', 5))
        
        # Récupérer le profil pour personnalisation
        profile = current_user.profile
        
        # Ajouter les préférences utilisateur à la génération (à implémenter dans main.py)
        user_context = {}
        if profile and profile.setup_completed:
            user_context = {
                'channel_name': profile.channel_name,
                'youtuber_name': profile.youtuber_name,
                'video_style': profile.video_style,
                'approach_style': profile.approach_style,
                'target_audience': profile.target_audience,
                'video_length': profile.video_length
            }
        
        # Passer le contexte utilisateur à la fonction de génération
        topics = generate_topics(theme, num_topics, user_context)
        
        # Enregistrer dans l'historique
        if topics:
            history = load_history()
            # Ajouter les nouveaux sujets avec timestamp, thème et utilisateur
            entry = {
                "theme": theme,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "topics": topics,
                "user_id": current_user.id
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

# Initialiser la base de données et démarrer l'application
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Configuration pour un serveur de développement léger
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, processes=1)
