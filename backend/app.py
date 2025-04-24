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
from main import generate_topics, generate_script, save_to_pdf, modify_script_with_ai, estimate_reading_time

# Import des modèles de base de données
from models import db, User, UserProfile

app = Flask(__name__)

# Configuration de l'application
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_change_in_production')

# Configuration spéciale pour PostgreSQL sur Render
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
    print(f"URL de base de données adaptée pour SQLAlchemy : {database_url[:20]}...")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///yt_autom.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Session persistante de 7 jours

# Initialisation de la base de données
db.init_app(app)

# Configurer CORS pour fonctionner avec l'environnement de production
frontend_url = os.environ.get('FRONTEND_URL', '*')
CORS(app, resources={r"/*": {"origins": frontend_url, "supports_credentials": True, "expose_headers": ["Content-Disposition", "Content-Type", "Content-Length"]}}, allow_headers=["Content-Type", "Accept"], max_age=86400)

# Stockage local des profils (pour simplifier sans authentification)
user_profiles = {}

# Système d'authentification désactivé en faveur d'une approche simplifiée
print("🔓 Système de profil simplifié activé")

# Configuration pour l'authentification désactivée
app.config['LOGIN_DISABLED'] = True
print("⚠️ Authentification désactivée, utilisation du système de profil simplifié")

# Route pour enregistrer le profil
@app.route('/api/save-profile', methods=['POST'])
def save_profile():
    data = request.get_json()
    youtuber_name = data.get('youtuber_name', '')
    
    if not youtuber_name:
        return jsonify({'error': 'Le nom du YouTubeur est requis'}), 400
    
    # Utiliser le nom du YouTubeur comme identifiant unique
    user_profiles[youtuber_name] = data
    
    # Log pour débogage
    print(f"Profil enregistré pour: {youtuber_name}")
    print(f"Nombre de profils en mémoire: {len(user_profiles)}")
    
    return jsonify({
        'success': True,
        'profile': data,
        'message': f"Profil enregistré pour {youtuber_name}"
    })

# Fichier pour stocker l'historique des sujets
HISTORY_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'topics_history.json'))

# Fonction pour sauvegarder un thème dans l'historique
def save_theme_to_history(theme, user_id=''):
    try:
        # Créer la structure de l'historique si le fichier n'existe pas
        if not os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'w') as f:
                json.dump({'topics': []}, f)
        
        # Lire l'historique existant
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
        
        # Ajouter le nouveau thème avec l'identifiant utilisateur si disponible
        history['topics'].append({
            'theme': theme,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'user_id': user_id  # Ajouter l'identifiant utilisateur (nom du YouTubeur)
        })
        
        # Limiter à 20 derniers thèmes
        history['topics'] = history['topics'][-20:]
        
        # Écrire l'historique mis à jour
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f)
            
    except Exception as e:
        print(f"Erreur lors de la sauvegarde dans l'historique: {str(e)}")

# Route pour générer des sujets YouTube
@app.route('/generate-topics', methods=['POST'])
def generate_topics_route():
    try:
        data = request.get_json()
        theme = data.get('theme', '')
        profile = data.get('profile', {})
        
        if not theme:
            return jsonify({'error': 'Un thème est requis'}), 400
        
        # Extraire les informations du profil
        youtuber_name = profile.get('youtuber_name', '')
        channel_name = profile.get('channel_name', '')
        content_type = profile.get('content_type', 'tech')
        
        # Générer les sujets avec les informations du profil
        result = generate_topics(theme, user_context={
            'youtuber_name': youtuber_name,
            'channel_name': channel_name,
            'content_type': content_type,
            'video_style': profile.get('content_style', 'informative'),
            'approach_style': profile.get('tone', 'professionnel'),
            'target_audience': profile.get('target_audience', 'adultes'),
            'video_length': profile.get('video_length', '10-15 minutes')
        })
        
        # Sauvegarder dans l'historique avec l'utilisateur si disponible
        save_theme_to_history(theme, youtuber_name)
        
        return jsonify({"topics": result})
    except Exception as e:
        print(f"Erreur lors de la génération des sujets: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération des sujets: {str(e)}'}), 500

# Route pour générer un script
@app.route('/generate-script', methods=['POST'])
def generate_script_route():
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        research = data.get('research', '')
        profile = data.get('profile', {})
        sources = data.get('sources', [])
        
        if not topic:
            return jsonify({'error': 'Un sujet est requis'}), 400
        
        # Extraire les informations du profil
        youtuber_name = profile.get('youtuber_name', '')
        channel_name = profile.get('channel_name', '')
        content_style = profile.get('content_style', 'informative')
        
        # Générer le script avec les informations du profil
        script_text = generate_script(topic, research, user_context={
            'youtuber_name': youtuber_name,
            'channel_name': channel_name,
            'content_style': content_style,
            'video_style': profile.get('content_style', 'informative'),
            'approach_style': profile.get('tone', 'professionnel'),
            'target_audience': profile.get('target_audience', 'adultes'),
            'video_length': profile.get('video_length', '10-15 minutes')
        })
        
        # Générer le PDF si le script a été généré avec succès
        if script_text:
            pdf_path = save_to_pdf(script_text, sources)
            
            result = {
                'script': script_text,
                'pdf_url': f"/download/{os.path.basename(pdf_path)}",
                'sources': sources
            }
            
            return jsonify(result)
        else:
            return jsonify({'error': 'Échec de la génération du script'}), 500
            
    except Exception as e:
        print(f"Erreur lors de la génération du script: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération du script: {str(e)}'}), 500

# Route pour exporter en PDF
@app.route('/export-pdf', methods=['POST'])
def export_pdf_route():
    try:
        data = request.get_json()
        script = data.get('script', '')
        profile = data.get('profile', {})
        topic = data.get('topic', 'Script YouTube')
        sources = data.get('sources', [])
        
        if not script:
            return jsonify({'error': 'Un script est requis'}), 400
        
        # Extraire les informations du profil
        youtuber_name = profile.get('youtuber_name', '')
        channel_name = profile.get('channel_name', '')
        
        # Générer le PDF avec les informations du profil
        pdf_path = save_to_pdf(
            script,
            title=topic,
            author=youtuber_name,
            channel=channel_name,
            sources=sources
        )
        
        if not pdf_path:
            return jsonify({'error': 'Échec de la génération du PDF'}), 500
            
        # Retourner l'URL pour télécharger le PDF
        return jsonify({
            'pdf_url': f"/download/{os.path.basename(pdf_path)}",
            'message': 'PDF généré avec succès'
        })
        
    except Exception as e:
        print(f"Erreur lors de l'export PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de l\'export PDF: {str(e)}'}), 500

# Route pour télécharger un PDF généré
@app.route('/download/<filename>', methods=['GET'])
def download_pdf(filename):
    try:
        # Déterminer le chemin du fichier selon l'OS
        if os.name == 'nt':  # Windows
            file_directory = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(file_directory, '..', filename)
            # Chercher dans le répertoire temporaire également
            import tempfile
            if not os.path.exists(file_path):
                temp_dir = tempfile.gettempdir()
                file_path = os.path.join(temp_dir, filename)
        else:  # Linux (Render)
            file_path = f"/tmp/{filename}"
        
        print(f"Tentative de téléchargement du PDF depuis: {file_path}")
        
        # Vérifier si le fichier existe
        if not os.path.exists(file_path):
            print(f"Fichier PDF introuvable: {file_path}")
            # Recherche élargie dans plusieurs répertoires potentiels
            potential_paths = [
                os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', filename),
                os.path.join(os.path.dirname(os.path.abspath(__file__)), filename),
                os.path.join('/tmp', filename),
                os.path.join(tempfile.gettempdir(), filename)
            ]
            
            found = False
            for path in potential_paths:
                if os.path.exists(path):
                    file_path = path
                    found = True
                    print(f"Fichier trouvé dans un emplacement alternatif: {file_path}")
                    break
                    
            if not found:
                return jsonify({'error': 'Fichier PDF introuvable'}), 404
        
        # Vérifier la taille du fichier
        file_size = os.path.getsize(file_path)
        print(f"Taille du fichier: {file_size} octets")
        
        if file_size == 0:
            return jsonify({'error': 'Le fichier PDF est vide'}), 500
            
        # Vérifier si le fichier est lisible
        try:
            with open(file_path, 'rb') as f:
                # Lire un peu du fichier pour vérifier qu'il est valide
                header = f.read(10)
                f.seek(0)  # Revenir au début du fichier
                
                if not header.startswith(b'%PDF'):
                    print(f"Le fichier {file_path} n'est pas un PDF valide")
                    # Si ce n'est pas un PDF valide, chercher une version .txt
                    txt_path = file_path.replace('.pdf', '.txt')
                    if os.path.exists(txt_path):
                        print(f"Renvoi du fichier texte alternatif: {txt_path}")
                        return send_file(
                            txt_path,
                            as_attachment=True,
                            download_name=f"Script_YouTube_{datetime.now().strftime('%Y%m%d')}.txt",
                            mimetype='text/plain'
                        )
                    else:
                        return jsonify({'error': 'Le fichier PDF est corrompu et aucune alternative n\'est disponible'}), 500
                        
                # Lire tout le contenu du fichier
                file_content = f.read()
                
        except Exception as e:
            print(f"Erreur lors de la lecture du fichier: {str(e)}")
            return jsonify({'error': f'Erreur lors de la lecture du fichier: {str(e)}'}), 500
            
        # Définir un nom de fichier pour le téléchargement
        base_name = os.path.basename(file_path)
        download_name = f"Script_YouTube_{datetime.now().strftime('%Y%m%d')}.pdf"
        
        print(f"Envoi du fichier: {file_path} avec nom de téléchargement: {download_name}")
        
        # Solution alternative en cas d'échec de send_file
        response = make_response(file_content)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="{download_name}"'
        
        return response
        
    except Exception as e:
        print(f"Erreur critique lors du téléchargement du PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors du téléchargement du PDF: {str(e)}'}), 500

# Route pour consulter l'historique des sujets
@app.route('/topics-history', methods=['GET'])
def api_get_history():
    # Charger l'historique complet
    full_history = load_history()
    
    # Si l'utilisateur est authentifié, filtrer l'historique pour ne montrer que le sien
    if current_user.is_authenticated:
        user_id = current_user.id
        # Filtrer les entrées avec l'ID utilisateur ou sans ID utilisateur (compatibilité avec anciennes entrées)
        filtered_topics = [entry for entry in full_history.get('topics', []) 
                           if entry.get('user_id') == user_id or 'user_id' not in entry]
        
        return jsonify({'topics': filtered_topics})
    else:
        # Pour les utilisateurs non connectés, retourner un historique vide ou générique
        return jsonify({'topics': []})
    
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
@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', frontend_url)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        print("📝 Traitement d'une demande d'inscription...")
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Vérification des données requises
        if not all([username, email, password]):
            return jsonify({'error': 'Tous les champs sont requis'}), 400
            
        # Vérifier si l'utilisateur existe déjà avec ces identifiants exacts
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        
        if existing_user:
            # Plutôt que de rejeter, connecter automatiquement si le mot de passe correspond
            if existing_user.check_password(password):
                login_user(existing_user)
                session.permanent = True
                
                # Vérifier si le profil est configuré
                setup_required = True
                if existing_user.profile:
                    setup_required = not existing_user.profile.setup_completed
                    
                response = jsonify({
                    'message': 'Utilisateur existant reconnecté', 
                    'user': {
                        'id': existing_user.id,
                        'username': existing_user.username,
                        'email': existing_user.email,
                        'setupRequired': setup_required
                    }
                })
                
                # Ajouter les en-têtes CORS
                response.headers['Access-Control-Allow-Origin'] = frontend_url
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                response.set_cookie('logged_in_user', str(existing_user.id), httponly=False, samesite='Lax', max_age=604800)
                
                return response
            else:
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
        print(f"Nouvel utilisateur créé: {username} ({email})")
        
        # Connecter automatiquement l'utilisateur
        login_user(new_user)
        session.permanent = True
        
        # Vérifier si le profil est configuré
        setup_required = True
        if new_user.profile:
            setup_required = not new_user.profile.setup_completed
        
        # Préparer la réponse
        response = jsonify({
            'message': 'Inscription réussie', 
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email,
                'setupRequired': setup_required
            }
        })
        
        # Ajouter les en-têtes CORS
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.set_cookie('logged_in_user', str(new_user.id), httponly=False, samesite='Lax', max_age=604800)
        
        # Garantir que l'ID utilisateur est dans la session
        if '_user_id' not in session:
            session['_user_id'] = str(new_user.id)
            
        return response
        
    except Exception as e:
        print(f"Erreur lors de l'inscription: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': f"Erreur lors de l'inscription: {str(e)}"}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', frontend_url)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        print("🔒 Tentative de connexion...")
        data = request.get_json()
        
        # Extraire les données de connexion
        email = data.get('email')
        password = data.get('password')
        remember = data.get('remember', False)
        
        print(f"Email: {email}, Remember: {remember}")
        
        # Vérification des données requises
        if not all([email, password]):
            print("Données manquantes dans la requête")
            return jsonify({'error': 'Email et mot de passe requis'}), 400
            
        # SOLUTION ROBUSTE: Essayer d'abord par email exact, puis par nom d'utilisateur
        user = User.query.filter(User.email == email).first()
        if not user:
            user = User.query.filter(User.username == email).first()
        
        print(f"Utilisateur trouvé: {user is not None}")
        
        # Si l'utilisateur n'existe pas, créer automatiquement un compte (facilite l'utilisation)
        if not user:
            # Créer un nouvel utilisateur avec ces identifiants
            print(f"Création automatique d'utilisateur: {email}")
            username = email.split('@')[0] if '@' in email else email
            user = User(email=email, username=username)
            user.set_password(password)
            
            # Créer un profil vide pour l'utilisateur
            profile = UserProfile(user=user)
            
            db.session.add(user)
            db.session.add(profile)
            db.session.commit()
        elif not user.check_password(password):
            print("Mot de passe incorrect")
            return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
            
        # Connecter l'utilisateur
        login_user(user, remember=remember)
        session.permanent = True
        
        # Vérifier si le profil est configuré
        setup_required = True
        if user.profile:
            setup_required = not user.profile.setup_completed
        
        # Préparer les données utilisateur
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'setupRequired': setup_required
        }
        
        # Ajouter des informations de profil si disponibles
        if user.profile:
            user_data['profile'] = {
                'channel_name': user.profile.channel_name,
                'youtuber_name': user.profile.youtuber_name,
                'setup_completed': user.profile.setup_completed
            }
        
        response = jsonify({
            'message': 'Connexion réussie',
            'user': user_data,
            'auth': True,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # Ajouter les en-têtes CORS pour assurer le fonctionnement cross-origin
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        # Assurer que l'ID utilisateur est dans la session
        if '_user_id' not in session:
            session['_user_id'] = str(user.id)
        
        # Cookie de débogage
        response.set_cookie('logged_in_user', str(user.id), httponly=False, samesite='Lax', max_age=604800)  # 7 jours
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

@app.route('/api/setup-profile', methods=['POST', 'OPTIONS'])
@login_required
def setup_profile():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', frontend_url)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        print(f"💻 Configuration du profil pour l'utilisateur {current_user.username}...")
        data = request.get_json()
        
        # Vérification des données minimales requises
        channel_name = data.get('channel_name')
        youtuber_name = data.get('youtuber_name')
        
        if not all([channel_name, youtuber_name]):
            return jsonify({'error': 'Le nom de la chaîne et du YouTubeur sont requis'}), 400
        
        # Récupérer ou créer le profil pour l'utilisateur actuel
        profile = current_user.profile
        if not profile:
            profile = UserProfile(user_id=current_user.id)
            db.session.add(profile)
            print(f"Nouveau profil créé pour {current_user.username}")
        else:
            print(f"Profil existant mis à jour pour {current_user.username}")
        
        # Mettre à jour les champs du profil
        profile.channel_name = channel_name
        profile.youtuber_name = youtuber_name
        profile.video_style = data.get('video_style', '')
        profile.approach_style = data.get('approach_style', '')
        profile.target_audience = data.get('target_audience', '')
        profile.video_length = data.get('video_length', '')
        profile.setup_completed = True
        
        # Sauvegarder les modifications
        db.session.commit()
        
        # Préparer une réponse détaillée
        response = jsonify({
            'message': 'Profil configuré avec succès',
            'profile': {
                'id': profile.id,
                'channel_name': profile.channel_name,
                'youtuber_name': profile.youtuber_name,
                'video_style': profile.video_style,
                'approach_style': profile.approach_style,
                'target_audience': profile.target_audience,
                'video_length': profile.video_length,
                'setup_completed': profile.setup_completed
            },
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'setupRequired': False
            }
        })
        
        # Ajouter les en-têtes CORS
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
        
    except Exception as e:
        print(f"Erreur lors de la configuration du profil: {e}")
        import traceback
        traceback.print_exc()
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

# Route simplifiée pour la configuration du profil (sans authentification)
@app.route('/api/setup-profile-simple', methods=['POST', 'OPTIONS'])
def setup_profile_simple():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        data = request.get_json()
        print(f"Reçu une configuration de profil simplifiée: {data}")
        
        response = jsonify({
            'success': True,
            'message': 'Profil configuré avec succès (mode simplifié)',
            'profile': data
        })
        
        # CORS headers pour assurer le fonctionnement cross-origin
        frontend_url = os.environ.get('FRONTEND_URL', '*')
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
        
    except Exception as e:
        print(f"Erreur lors de la configuration simplifiée du profil: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Erreur lors de la configuration du profil: {str(e)}"}), 500

# Route simplifiée pour l'inscription (sans vérification de doublon)
@app.route('/api/register-simple', methods=['POST', 'OPTIONS'])
def register_simple():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        data = request.get_json()
        username = data.get('username', '')
        email = data.get('email', '')
        
        print(f"Tentative d'inscription simplifiée pour: {email} / {username}")
        
        # Créer un utilisateur fictif pour une inscription directe
        user_data = {
            'id': 1,
            'username': username or email.split('@')[0],
            'email': email,
            'setupRequired': True
        }
        
        response = jsonify({
            'message': 'Inscription réussie (mode simplifié)',
            'user': user_data,
            'auth': True,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # CORS headers pour assurer le fonctionnement cross-origin
        frontend_url = os.environ.get('FRONTEND_URL', '*')
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        # Cookies pour l'authentification en mode simplifié
        session['_user_id'] = '1'  # Simuler une session Flask-Login
        response.set_cookie('logged_in_user', '1', httponly=False, samesite='Lax', max_age=86400)
        response.set_cookie('auth_mode', 'simple', httponly=False, samesite='Lax', max_age=86400)
        
        print("Inscription simplifiée réussie, cookies définis")
        return response
    
    except Exception as e:
        print(f"Erreur lors de l'inscription simplifiée: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Erreur lors de l'inscription: {str(e)}"}), 500

# Route simplifiée pour la connexion (sans vérification de mot de passe)
@app.route('/api/login-simple', methods=['POST', 'OPTIONS'])
def login_simple():
    # Gestion des requêtes OPTIONS pour CORS preflight
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    try:
        data = request.get_json()
        email = data.get('email', '')
        
        print(f"Tentative de connexion simplifiée pour: {email}")
        
        # Créer un utilisateur fictif pour une connexion directe
        username = email.split('@')[0] if '@' in email else email
        user_data = {
            'id': 1,
            'username': username,
            'email': email,
            'setupRequired': False,
            'profile': {
                'channel_name': 'Votre chaîne',
                'youtuber_name': username,
                'setup_completed': True
            }
        }
        
        response = jsonify({
            'message': 'Connexion réussie (mode simplifié)',
            'user': user_data,
            'auth': True,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # CORS headers pour assurer le fonctionnement cross-origin
        frontend_url = os.environ.get('FRONTEND_URL', '*')
        response.headers['Access-Control-Allow-Origin'] = frontend_url
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        # Cookies pour l'authentification en mode simplifié
        session['_user_id'] = '1'  # Simuler une session Flask-Login
        response.set_cookie('logged_in_user', '1', httponly=False, samesite='Lax', max_age=86400)
        response.set_cookie('auth_mode', 'simple', httponly=False, samesite='Lax', max_age=86400)
        
        print("Connexion simplifiée réussie, cookies définis")
        return response
    
    except Exception as e:
        print(f"Erreur lors de la connexion simplifiée: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Erreur lors de la connexion: {str(e)}"}), 500

# Route pour demander une modification de script par IA
@app.route('/modify-script', methods=['POST'])
def modify_script_route():
    try:
        data = request.get_json()
        original_script = data.get('script', '')
        modification_request = data.get('request', '')
        profile = data.get('profile', {})
        
        if not original_script:
            return jsonify({'error': 'Un script original est requis'}), 400
        if not modification_request:
            return jsonify({'error': 'Une demande de modification est requise'}), 400
        
        # Extraire les informations du profil
        youtuber_name = profile.get('youtuber_name', '')
        channel_name = profile.get('channel_name', '')
        
        # Demander à l'IA de modifier le script
        modified_script = modify_script_with_ai(
            original_script, 
            modification_request,
            {
                'youtuber_name': youtuber_name,
                'channel_name': channel_name,
                'video_style': profile.get('content_style', 'informative'),
                'approach_style': profile.get('tone', 'professionnel'),
                'target_audience': profile.get('target_audience', 'adultes')
            }
        )
        
        # Estimer le temps de lecture du script modifié
        estimated_time = estimate_reading_time(modified_script)
        
        return jsonify({
            'modified_script': modified_script,
            'estimated_reading_time': estimated_time
        })
        
    except Exception as e:
        print(f"Erreur lors de la modification du script: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la modification du script: {str(e)}'}), 500

# Route pour estimer le temps de lecture d'un script
@app.route('/estimate-time', methods=['POST'])
def estimate_time_route():
    try:
        data = request.get_json()
        script = data.get('script', '')
        
        if not script:
            return jsonify({'error': 'Un script est requis'}), 400
        
        # Estimer le temps de lecture
        estimated_time = estimate_reading_time(script)
        
        return jsonify({
            'estimated_reading_time': estimated_time
        })
        
    except Exception as e:
        print(f"Erreur lors de l'estimation du temps de lecture: {str(e)}")
        return jsonify({'error': 'Erreur lors de l\'estimation du temps de lecture'}), 500

# Initialiser la base de données et démarrer l'application
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Configuration pour un serveur de développement léger
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, processes=1)
