from flask import Flask, request, jsonify, send_file, after_this_request, redirect, url_for, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import os
import sys
import json
import base64
from datetime import datetime, timedelta
import io
import tempfile

# Permet d'importer main.py depuis le dossier parent
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import generate_topics, generate_script, save_to_pdf, modify_script_with_ai, estimate_reading_time, fetch_research, extract_sources, generate_images_for_script

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

# Initialisation du gestionnaire de connexion
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Configurer CORS pour fonctionner avec l'environnement de production
frontend_url = os.environ.get('FRONTEND_URL', '*')
CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True, "expose_headers": ["Content-Disposition", "Content-Type", "Content-Length"]}}, allow_headers=["Content-Type", "Accept"], max_age=86400)

# Stockage local des profils (pour simplifier sans authentification)
user_profiles = {}

# Système d'authentification désactivé en faveur d'une approche simplifiée
print(" Système de profil simplifié activé")

# Configuration pour l'authentification désactivée
app.config['LOGIN_DISABLED'] = True
print(" Authentification désactivée, utilisation du système de profil simplifié")

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
        generate_images = data.get('generate_images', False)  # Nouveau paramètre pour générer des images
        
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
        
        # Si demandé, générer une image d'aperçu pour chaque sujet
        if generate_images and result:
            base_url = request.url_root.rstrip('/')
            for topic in result:
                try:
                    # Générer une image pour ce sujet (une seule image par sujet)
                    title = topic.get('title', '')
                    if title:
                        # Utiliser les points clés comme contexte pour l'image
                        key_points = topic.get('key_points', [])
                        context_text = "\n".join(key_points) if key_points else title
                        
                        # Générer une image avec style approprié au contenu
                        style = 'moderne'  # par défaut
                        if 'interview' in title.lower() or 'podcast' in title.lower():
                            style = 'minimaliste'
                        elif 'guide' in title.lower() or 'tutoriel' in title.lower():
                            style = 'coloré'
                        elif 'analyse' in title.lower() or 'étude' in title.lower():
                            style = 'sombre'
                        
                        # Générer l'image
                        image_paths = generate_images_for_script(
                            script_text=context_text,
                            title=title,
                            num_images=1,
                            style=style
                        )
                        
                        # Ajouter l'URL de l'image au résultat
                        if image_paths and len(image_paths) > 0:
                            # Utiliser l'API de téléchargement existante
                            filename = os.path.basename(image_paths[0])
                            image_url = f"{base_url}/download/{filename}"
                            topic['preview_image'] = image_url
                except Exception as img_err:
                    print(f"Erreur lors de la génération d'image pour le sujet '{title}': {img_err}")
                    # Continuer même en cas d'erreur
        
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
        
        # Vérifier et nettoyer les données entrantes
        try:
            # S'assurer que le sujet est une chaîne valide
            topic = str(topic).strip()
            if not topic:
                return jsonify({'error': 'Sujet invalide'}), 400
                
            # Vérifier la longueur du sujet
            if len(topic) > 500:
                topic = topic[:500] + "..."  # Tronquer pour éviter les erreurs
                
            # S'assurer que la recherche est une chaîne valide
            if research and not isinstance(research, str):
                research = str(research)
            
            # Vérifier que le profil est un dictionnaire valide
            if not isinstance(profile, dict):
                profile = {}
                
            # Vérifier que les sources sont une liste valide
            if not isinstance(sources, list):
                sources = []
        except Exception as data_error:
            print(f"Erreur lors de la validation des données: {data_error}")
            # Continuer avec des valeurs par défaut
        
        # Générer le script avec les informations du profil
        print(f"Début de génération du script pour: {topic}")
        try:
            script_text = generate_script(topic, research, user_context={
                'youtuber_name': profile.get('youtuber_name', ''),
                'channel_name': profile.get('channel_name', ''),
                'content_style': profile.get('content_style', 'informative'),
                'video_style': profile.get('content_style', 'informative'),
                'approach_style': profile.get('tone', 'professionnel'),
                'target_audience': profile.get('target_audience', 'adultes'),
                'video_length': profile.get('video_length', '10-15 minutes')
            })
        except Exception as script_error:
            print(f"Erreur lors de la génération du script: {script_error}")
            import traceback
            traceback.print_exc()
            
            # Utiliser le script de secours en cas d'erreur
            try:
                print("Génération du script de secours...")
                script_text = generate_fallback_script(
                    topic, 
                    profile.get('youtuber_name', 'YouTubeur'),
                    profile.get('channel_name', 'Chaîne YouTube')
                )
            except Exception as fallback_error:
                print(f"Erreur même avec le script de secours: {fallback_error}")
                script_text = f"""[HOOK]
Bienvenue sur cette vidéo à propos de {topic}.

[CONTENU]
Ce sujet est vraiment intéressant et nous allons l'explorer ensemble.

[CONCLUSION]
Merci d'avoir regardé. N'oubliez pas de vous abonner !
"""
        
        # Vérifier le script généré
        if not script_text or not isinstance(script_text, str) or len(script_text.strip()) < 50:
            print("Script généré invalide ou trop court, utilisation d'un script minimal")
            script_text = f"""[HOOK]
Bienvenue sur cette vidéo à propos de {topic}.

[CONTENU]
Ce sujet est vraiment intéressant et nous allons l'explorer ensemble.

[CONCLUSION]
Merci d'avoir regardé. N'oubliez pas de vous abonner !
"""
        
        # Générer le PDF avec système robuste à plusieurs niveaux
        pdf_path = ""
        pdf_filename = ""
        pdf_base64 = ""
        
        # 1. Premier niveau: Essayer la génération standard avec save_to_pdf
        try:
            print("Génération PDF standard...")
            pdf_path = save_to_pdf(
                script_text, 
                title=topic,
                author=profile.get('youtuber_name', ''),
                channel=profile.get('channel_name', ''),
                sources=sources
            )
            if pdf_path and os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
                pdf_filename = os.path.basename(pdf_path)
                print(f"PDF généré avec succès: {pdf_path}")
                
                # Vérifier que le PDF est valide
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_content = pdf_file.read()
                    if not pdf_content.startswith(b'%PDF'):
                        print("Le PDF généré n'est pas valide, passage au niveau 2")
                        raise Exception("PDF invalid")
                    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
            else:
                print("Chemin PDF non valide ou fichier non PDF")
                raise Exception("PDF path invalid")
        except Exception as pdf_error:
            print(f"Erreur niveau 1 - Génération standard: {pdf_error}")
            
            # 2. Deuxième niveau: génération directe avec FPDF
            try:
                print("Tentative de génération PDF de secours avec FPDF...")
                from fpdf import FPDF
                
                # Créer un nom de fichier unique avec extension .pdf
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '_' for c in topic[:30])
                safe_title = safe_title.replace(' ', '_')
                force_pdf_filename = f"script_{safe_title}_{timestamp}.pdf"
                
                # Déterminer le chemin du fichier temporaire
                if os.name == 'nt':  # Windows
                    temp_dir = tempfile.gettempdir()
                else:  # Linux/Render
                    temp_dir = '/tmp'
                force_pdf_path = os.path.join(temp_dir, force_pdf_filename)
                
                # Créer un PDF basique
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", size=12)
                
                # Titre du document
                pdf.set_font("Arial", 'B', 16)
                pdf.cell(200, 10, txt=topic, ln=True, align='C')
                pdf.ln(5)
                
                # Ajouter le script
                pdf.set_font("Arial", size=11)
                # Découper le script en lignes
                for line in script_text.split('\n'):
                    pdf.multi_cell(0, 5, txt=line)
                    pdf.ln(2)
                
                # Ajouter les sources si disponibles
                if sources and len(sources) > 0:
                    pdf.add_page()
                    pdf.set_font("Arial", 'B', 14)
                    pdf.cell(200, 10, txt="Sources", ln=True, align='L')
                    pdf.ln(5)
                    
                    pdf.set_font("Arial", size=10)
                    for i, source in enumerate(sources):
                        pdf.set_font("Arial", 'B', 10)
                        pdf.cell(200, 8, txt=f"Source {i+1}: {source.get('title', 'Source sans titre')}", ln=True, align='L')
                        pdf.set_font("Arial", size=10)
                        pdf.cell(200, 6, txt=source.get('url', ''), ln=True, align='L')
                        pdf.multi_cell(0, 5, txt=source.get('summary', ''))
                        pdf.ln(5)
                
                # Sauvegarder le PDF
                pdf.output(force_pdf_path)
                print(f"PDF de secours généré avec succès: {force_pdf_path}")
                
                # Vérifier que le PDF a bien été créé
                if os.path.exists(force_pdf_path):
                    pdf_path = force_pdf_path
                    pdf_filename = force_pdf_filename
                    
                    with open(force_pdf_path, 'rb') as pdf_file:
                        pdf_content = pdf_file.read()
                        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                else:
                    raise Exception("PDF de secours non créé")
            except Exception as fpdf_error:
                print(f"Erreur niveau 2 - Génération FPDF: {fpdf_error}")
                
                # 3. Troisième niveau: PDF minimal
                try:
                    print("Tentative de création d'un PDF minimal...")
                    from fpdf import FPDF
                    minimal_pdf = FPDF()
                    minimal_pdf.add_page()
                    minimal_pdf.set_font("Arial", size=12)
                    minimal_pdf.cell(200, 10, txt=topic, ln=True, align='C')
                    minimal_pdf.cell(200, 10, txt="Le script est disponible dans l'interface", ln=True, align='C')
                    
                    minimal_pdf_filename = f"script_minimal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    minimal_pdf_path = os.path.join(temp_dir, minimal_pdf_filename)
                    minimal_pdf.output(minimal_pdf_path)
                    
                    if os.path.exists(minimal_pdf_path):
                        pdf_path = minimal_pdf_path
                        pdf_filename = minimal_pdf_filename
                        
                        with open(minimal_pdf_path, 'rb') as min_pdf_file:
                            min_pdf_content = min_pdf_file.read()
                            pdf_base64 = base64.b64encode(min_pdf_content).decode('utf-8')
                except Exception as minimal_error:
                    print(f"Erreur niveau 3 - PDF minimal: {minimal_error}")
        
        # Construction de la réponse
        result = {
            'script': script_text,
            'sources': sources,
            'file_type': 'application/pdf'  # Toujours indiquer le type PDF
        }
        
        # Ajouter les informations du PDF si disponible
        if pdf_path and os.path.exists(pdf_path) and pdf_filename:
            result['pdf_url'] = f"/download/{pdf_filename}"
            if pdf_base64:
                result['file_data'] = pdf_base64
                result['file_name'] = pdf_filename
        
        return jsonify(result)
            
    except Exception as e:
        print(f"Erreur globale lors de la génération du script: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Créer une réponse d'erreur plus utile
        error_response = {
            'error': f'Erreur lors de la génération du script: {str(e)}',
            'fallback_script': f"""[ERREUR]
Une erreur s'est produite lors de la génération du script pour "{data.get('topic', 'sujet non spécifié')}"

[CONTENT]
Merci de réessayer ultérieurement ou de choisir un autre sujet.
"""
        }
        return jsonify(error_response), 500

# Route pour exporter en PDF
@app.route('/export-pdf', methods=['POST'])
def export_pdf_route():
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        # Accepter les deux formats possibles pour la compatibilité
        script = data.get('script')
        script_text = data.get('script_text')
        profile = data.get('profile', {})
        topic = data.get('topic') or data.get('title', 'Script YouTube')
        sources = data.get('sources', [])
        
        # Utiliser l'un ou l'autre format pour le script
        final_script = script or script_text
        
        if not final_script:
            return jsonify({'error': 'Script manquant'}), 400
            
        # Extraire les informations du profil avec les bonnes clés
        youtuber_name = None
        channel_name = None
        
        # Vérifier si le profil est sous forme de dictionnaire imbriqué ou plat
        if isinstance(profile, dict):
            youtuber_name = profile.get('youtuber_name')
            channel_name = profile.get('channel_name')
        
        # Vérifier les champs alternatifs 
        author = data.get('author')
        channel = data.get('channel')
        
        # Préférer les valeurs du profil, sinon utiliser les champs directs s'ils existent
        final_youtuber = youtuber_name or author or 'YouTuber'
        final_channel = channel_name or channel or 'Ma Chaîne YouTube'
        final_topic = topic or 'Script YouTube'
        
        print(f"Génération du PDF pour {final_youtuber}, chaîne: {final_channel}, sujet: {final_topic}")
        print(f"Nombre de sources: {len(sources)}")
        
        # Vérifier la structure des sources et les normaliser si nécessaire
        normalized_sources = []
        for source in sources:
            if isinstance(source, str):
                # Si c'est simplement une chaîne (URL), créer un dictionnaire
                normalized_sources.append({
                    'url': source,
                    'title': f"Source: {source.split('/')[2] if '/' in source else source}"
                })
            elif isinstance(source, dict):
                # Vérifier que les clés requises sont présentes
                if 'url' in source:
                    normalized_sources.append(source)
                elif 'link' in source:
                    normalized_sources.append({
                        'url': source['link'],
                        'title': source.get('title', f"Source: {source['link']}")
                    })
        
        # Système robuste de génération PDF à plusieurs niveaux
        pdf_path = ""
        pdf_filename = ""
        pdf_base64 = ""
        
        # 1. Premier niveau: Essayer la génération standard avec save_to_pdf
        try:
            print("Génération PDF standard...")
            pdf_path = save_to_pdf(
                final_script, 
                title=final_topic, 
                author=final_youtuber, 
                channel=final_channel,
                sources=normalized_sources
            )
            
            if pdf_path and os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
                pdf_filename = os.path.basename(pdf_path)
                print(f"PDF généré avec succès: {pdf_path}")
                
                # Vérifier que le PDF est valide
                with open(pdf_path, 'rb') as pdf_file:
                    pdf_content = pdf_file.read()
                    if not pdf_content.startswith(b'%PDF'):
                        print("Le PDF généré n'est pas valide, passage au niveau 2")
                        raise Exception("PDF invalid")
                    pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
            else:
                print("Chemin PDF non valide ou fichier non PDF")
                raise Exception("PDF path invalid")
        except Exception as pdf_error:
            print(f"Erreur niveau 1 - Génération standard: {pdf_error}")
            
            # 2. Deuxième niveau: génération directe avec FPDF
            try:
                print("Tentative de génération PDF de secours avec FPDF...")
                from fpdf import FPDF
                
                # Créer un nom de fichier unique avec extension .pdf
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '_' for c in final_topic[:30])
                safe_title = safe_title.replace(' ', '_')
                force_pdf_filename = f"script_{safe_title}_{timestamp}.pdf"
                
                # Déterminer le chemin du fichier temporaire
                if os.name == 'nt':  # Windows
                    temp_dir = tempfile.gettempdir()
                else:  # Linux/Render
                    temp_dir = '/tmp'
                force_pdf_path = os.path.join(temp_dir, force_pdf_filename)
                
                # Fonction pour sanitiser les chaînes de texte contre les problèmes d'encodage
                def sanitize_text(text):
                    if not text:
                        return ""
                    # Remplacer les apostrophes typographiques par des apostrophes simples
                    text = text.replace('\u2019', "'")
                    # Remplacer les guillemets typographiques par des guillemets simples
                    text = text.replace('\u201c', '"').replace('\u201d', '"')
                    # Remplacer les tirets longs par des tirets standards
                    text = text.replace('\u2014', '-').replace('\u2013', '-')
                    # Remplacer les ellipses par trois points
                    text = text.replace('\u2026', '...')
                    # Sanitiser tous les autres caractères Unicode qui pourraient causer des problèmes
                    text = ''.join(c if ord(c) < 128 else ' ' for c in text)
                    return text
                
                # Sanitiser le texte du script et du titre
                safe_script = sanitize_text(final_script)
                safe_topic = sanitize_text(final_topic)
                
                # Créer un PDF basique
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", size=12)
                
                # Titre du document
                pdf.set_font("Arial", 'B', 16)
                pdf.cell(200, 10, txt=safe_topic, ln=True, align='C')
                pdf.ln(5)
                
                # Ajouter le script
                pdf.set_font("Arial", size=11)
                # Découper le script en lignes
                for line in safe_script.split('\n'):
                    # Sanitiser chaque ligne individuellement
                    safe_line = sanitize_text(line)
                    pdf.multi_cell(0, 5, txt=safe_line)
                    pdf.ln(2)
                
                # Ajouter les sources si disponibles
                if normalized_sources and len(normalized_sources) > 0:
                    pdf.add_page()
                    pdf.set_font("Arial", 'B', 14)
                    pdf.cell(200, 10, txt="Sources", ln=True, align='L')
                    pdf.ln(5)
                    
                    pdf.set_font("Arial", size=10)
                    for i, source in enumerate(normalized_sources):
                        pdf.set_font("Arial", 'B', 10)
                        if isinstance(source, dict):
                            safe_title = sanitize_text(source.get('title', f'Source {i+1}'))
                            safe_url = sanitize_text(source.get('url', ''))
                            safe_summary = sanitize_text(source.get('summary', ''))
                            
                            pdf.cell(200, 8, txt=f"Source {i+1}: {safe_title}", ln=True, align='L')
                            pdf.set_font("Arial", size=10)
                            pdf.cell(200, 6, txt=safe_url, ln=True, align='L')
                            pdf.multi_cell(0, 5, txt=safe_summary)
                        else:
                            pdf.cell(200, 8, txt=f"Source {i+1}", ln=True, align='L')
                        pdf.ln(5)
                
                # Sauvegarder le PDF
                pdf.output(force_pdf_path)
                print(f"PDF de secours généré avec succès: {force_pdf_path}")
                
                # Vérifier que le PDF a bien été créé
                if os.path.exists(force_pdf_path):
                    pdf_path = force_pdf_path
                    pdf_filename = force_pdf_filename
                    
                    with open(force_pdf_path, 'rb') as pdf_file:
                        pdf_content = pdf_file.read()
                        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                else:
                    raise Exception("PDF de secours non créé")
            except Exception as fpdf_error:
                print(f"Erreur niveau 2 - Génération FPDF: {fpdf_error}")
                
                # 3. Troisième niveau: PDF minimal
                try:
                    print("Tentative de création d'un PDF minimal...")
                    from fpdf import FPDF
                    
                    # Utiliser la fonction de sanitisation déjà définie (ou la redéfinir)
                    def sanitize_text(text):
                        if not text:
                            return ""
                        # Remplacer les apostrophes typographiques par des apostrophes simples
                        text = text.replace('\u2019', "'")
                        # Remplacer les guillemets typographiques par des guillemets simples
                        text = text.replace('\u201c', '"').replace('\u201d', '"')
                        # Remplacer les tirets longs par des tirets standards
                        text = text.replace('\u2014', '-').replace('\u2013', '-')
                        # Remplacer les ellipses par trois points
                        text = text.replace('\u2026', '...')
                        # Sanitiser tous les autres caractères Unicode qui pourraient causer des problèmes
                        text = ''.join(c if ord(c) < 128 else ' ' for c in text)
                        return text
                    
                    # Sanitiser le texte du titre pour éviter les problèmes d'encodage
                    safe_topic = sanitize_text(final_topic)
                    message_safe = sanitize_text("Le script est disponible dans l'interface")
                    
                    minimal_pdf = FPDF()
                    minimal_pdf.add_page()
                    minimal_pdf.set_font("Arial", size=12)
                    minimal_pdf.cell(200, 10, txt=safe_topic, ln=True, align='C')
                    minimal_pdf.cell(200, 10, txt=message_safe, ln=True, align='C')
                    
                    minimal_pdf_filename = f"script_minimal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    minimal_pdf_path = os.path.join(temp_dir, minimal_pdf_filename)
                    minimal_pdf.output(minimal_pdf_path)
                    
                    if os.path.exists(minimal_pdf_path):
                        pdf_path = minimal_pdf_path
                        pdf_filename = minimal_pdf_filename
                        
                        with open(minimal_pdf_path, 'rb') as min_pdf_file:
                            min_pdf_content = min_pdf_file.read()
                            pdf_base64 = base64.b64encode(min_pdf_content).decode('utf-8')
                    else:
                        raise Exception("PDF minimal non créé")
                except Exception as minimal_error:
                    print(f"Erreur niveau 3 - PDF minimal: {minimal_error}")
                    return jsonify({
                        'error': 'Erreur lors de la génération du PDF',
                        'file_type': 'application/pdf'  # Toujours indiquer le type PDF
                    }), 500
            
        # Vérifier que le PDF a bien été généré
        if not pdf_path or not os.path.exists(pdf_path) or not pdf_filename:
            return jsonify({
                'error': 'Erreur lors de la génération du PDF',
                'file_type': 'application/pdf'  # Toujours indiquer le type PDF
            }), 500
        
        # Renvoyer l'URL de téléchargement du PDF
        return jsonify({
            'pdf_url': f"/download/{pdf_filename}",
            'file_data': pdf_base64 if pdf_base64 else None,
            'file_type': 'application/pdf',  # Toujours indiquer le type PDF
            'file_name': pdf_filename
        })
        
    except Exception as e:
        print(f"Erreur lors de l'export PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de l\'export PDF: {str(e)}'}), 500

# Route pour télécharger un PDF généré
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Route pour télécharger un fichier généré (PDF, TXT ou image)."""
    try:
        print(f"Demande de téléchargement pour: {filename}")
        
        # Trouver le fichier dans le répertoire temporaire
        if os.name == 'nt':  # Windows
            temp_dir = tempfile.gettempdir()
        else:  # Linux/Render
            temp_dir = '/tmp'
        
        # Vérifier si c'est le chemin complet ou juste le nom du fichier
        if os.path.dirname(filename):
            # C'est un chemin complet
            file_path = filename
            basename = os.path.basename(filename)
        else:
            # C'est juste un nom de fichier
            file_path = os.path.join(temp_dir, filename)
            basename = filename
            
        print(f" Recherche de: {file_path}")
        
        # Liste tous les fichiers du répertoire temporaire pour le débogage
        print(f" Contenu du répertoire temporaire: {os.listdir(temp_dir)}")
        
        # Essayer de trouver un fichier correspondant par nom partiel si le fichier exact n'existe pas
        if not os.path.exists(file_path):
            print(f" Fichier exact non trouvé: {file_path}")
            
            # Chercher un fichier correspondant par nom partiel
            basename_parts = basename.split('_')
            if len(basename_parts) > 1:
                title_part = basename_parts[0]
                matching_files = [f for f in os.listdir(temp_dir) if title_part in f and (f.endswith('.pdf') or f.endswith('.txt') or f.endswith('.png') or f.endswith('.jpg'))]
                
                if matching_files:
                    newest_file = max(matching_files, key=lambda f: os.path.getmtime(os.path.join(temp_dir, f)))
                    file_path = os.path.join(temp_dir, newest_file)
                    print(f" Fichier alternatif trouvé par correspondance partielle: {file_path}")
                else:
                    # Si toujours pas trouvé, chercher le fichier le plus récent avec les extensions acceptées
                    all_files = [f for f in os.listdir(temp_dir) if f.endswith('.pdf') or f.endswith('.txt') or f.endswith('.png') or f.endswith('.jpg')]
                    if all_files:
                        newest_file = max(all_files, key=lambda f: os.path.getmtime(os.path.join(temp_dir, f)))
                        file_path = os.path.join(temp_dir, newest_file)
                        print(f" Dernier fichier trouvé comme alternative: {file_path}")
        
        # Vérifier si le fichier existe après toutes nos tentatives
        if not os.path.exists(file_path):
            print(f" Fichier introuvable après toutes les tentatives: {file_path}")
            return jsonify({'error': 'Fichier introuvable'}), 404
        
        # Vérifier si le fichier est lisible et valide
        if os.path.getsize(file_path) == 0:
            print(f" Fichier vide: {file_path}")
            return jsonify({'error': 'Le fichier est vide'}), 500
        
        # Déterminer si le fichier est un PDF, TXT ou image
        is_pdf = file_path.lower().endswith('.pdf')
        is_txt = file_path.lower().endswith('.txt')
        is_image = file_path.lower().endswith(('.png', '.jpg', '.jpeg'))
        
        # Déterminer le nom de fichier à utiliser pour le téléchargement
        filename_base = os.path.splitext(os.path.basename(file_path))[0]
        download_name = f"{filename_base}_YT_Script"
        if is_pdf:
            download_name += ".pdf"
        elif is_txt:
            download_name += ".txt"
        elif is_image:
            # Conserver l'extension d'origine pour les images
            ext = os.path.splitext(file_path)[1]
            download_name += ext
        
        try:
            # Envoyer le fichier (qu'il soit PDF, TXT ou image)
            if is_pdf:
                mimetype = 'application/pdf'
            elif is_txt:
                mimetype = 'text/plain'
            elif is_image:
                if file_path.lower().endswith('.png'):
                    mimetype = 'image/png'
                elif file_path.lower().endswith(('.jpg', '.jpeg')):
                    mimetype = 'image/jpeg'
                else:
                    mimetype = 'application/octet-stream'
            else:
                mimetype = 'application/octet-stream'
            
            print(f" Envoi du fichier {file_path} ({os.path.getsize(file_path)} octets)")
            return send_file(
                file_path,
                as_attachment=True,
                download_name=download_name,
                mimetype=mimetype
            )
                
        except Exception as e:
            print(f" Erreur lors de la lecture/envoi du fichier: {str(e)}")
            return jsonify({'error': f'Erreur lors de la lecture du fichier: {str(e)}'}), 500
    
    except Exception as e:
        print(f" Erreur critique lors du téléchargement: {str(e)}")
        return jsonify({'error': f'Erreur critique lors du téléchargement: {str(e)}'}), 500

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
        print(" Traitement d'une demande d'inscription...")
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
        print(" Tentative de connexion...")
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
        print(f" Configuration du profil pour l'utilisateur {current_user.username}...")
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
        
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        script = data.get('script')
        
        if not script:
            return jsonify({'error': 'Script manquant'}), 400
        
        # Estimer le temps de lecture
        estimation = estimate_reading_time(script)
        
        return jsonify(estimation)
    except Exception as e:
        print(f"Erreur lors de l'estimation du temps: {str(e)}")
        return jsonify({'error': f'Erreur lors de l\'estimation: {str(e)}'}), 500

# Route pour générer directement un script à partir d'une idée
@app.route('/generate-direct-script', methods=['POST'])
def generate_direct_script_route():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        idea = data.get('idea', '')
        profile = data.get('profile', {})
        
        if not idea:
            return jsonify({'error': 'Une idée est requise'}), 400
        
        # Extraire les informations du profil
        youtuber_name = profile.get('youtuber_name', '')
        channel_name = profile.get('channel_name', '')
        content_style = profile.get('content_style', 'informative')
        
        # Rechercher des informations sur l'idée
        print(f"Recherche d'informations pour l'idée: {idea[:100]}...")
        research = fetch_research(idea)
        
        if not research:
            print("Aucune recherche trouvée, utilisation d'un contexte minimal.")
            research = f"Idée de vidéo YouTube: {idea}"
        else:
            print(f"Recherche récupérée: {len(research)} caractères")
        
        # Extraire les vraies sources depuis la recherche
        from main import extract_sources
        real_sources = extract_sources(research)
        print(f"Sources extraites: {len(real_sources)}")
        
        # Générer le script avec les informations du profil
        print(f"Génération du script pour l'idée: {idea[:100]}...")
        script_text = generate_script(idea, research, user_context={
            'youtuber_name': youtuber_name,
            'channel_name': channel_name,
            'content_style': content_style,
            'video_style': profile.get('content_style', 'informative'),
            'approach_style': profile.get('tone', 'professionnel'),
            'target_audience': profile.get('target_audience', 'adultes'),
            'video_length': profile.get('video_length', '10-15 minutes'),
            'language': profile.get('language', 'français'),
            'content_type': profile.get('content_type', 'général'),
            'custom_options': profile.get('custom_options', {})
        })
        
        # Si l'idée est très courte, l'utiliser comme titre de base, sinon créer un titre plus concis
        title = idea if len(idea) < 60 else idea[:57] + "..."
        
        # Générer le PDF si le script a été généré avec succès
        if script_text:
            print(f"Script généré avec succès ({len(script_text)} caractères). Génération du PDF...")
            
            # Système robuste de génération PDF à plusieurs niveaux
            pdf_path = ""
            pdf_filename = ""
            pdf_base64 = ""
            
            # 1. Premier niveau: Essayer la génération standard avec save_to_pdf
            try:
                print("Génération PDF standard...")
                pdf_path = save_to_pdf(
                    script_text, 
                    title=title, 
                    author=youtuber_name, 
                    channel=channel_name,
                    sources=real_sources
                )
                
                # Initialisation des variables pour éviter les erreurs
                pdf_filename = None
                pdf_base64 = None
                accessible_path = None
                
                if pdf_path and os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
                    pdf_filename = os.path.basename(pdf_path)
                    print(f"PDF généré avec succès: {pdf_path}")
                    
                    # Vérifier que le PDF est valide
                    with open(pdf_path, 'rb') as pdf_file:
                        pdf_content = pdf_file.read()
                        if not pdf_content.startswith(b'%PDF'):
                            print("Le PDF généré n'est pas valide, passage au niveau 2")
                            raise Exception("PDF invalid")
                        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                else:
                    # Si aucun PDF valide n'a été généré, passer directement au niveau 2
                    print("Aucun PDF valide n'a été généré, passage au niveau 2")
                    raise Exception("PDF path invalid or non-existent")
                
                # Définir temp_dir avant son utilisation
                if os.name == 'nt':  # Windows
                    temp_dir = tempfile.gettempdir()
                else:  # Linux/Render
                    temp_dir = '/tmp'
                
                # Vérifier que pdf_filename est bien défini avant de l'utiliser
                if pdf_filename:
                    full_path = os.path.join(temp_dir, pdf_filename)
                    if not os.path.exists(full_path) and os.path.exists(pdf_path):
                        # Si le fichier existe à l'emplacement original mais pas dans temp_dir
                        try:
                            import shutil
                            shutil.copy2(pdf_path, full_path)
                            print(f"Fichier copié de {pdf_path} vers {full_path}")
                            accessible_path = full_path
                        except Exception as copy_error:
                            print(f"Erreur lors de la copie du fichier: {copy_error}")
                            accessible_path = pdf_path
                    else:
                        # Si le fichier existe déjà à l'emplacement temporaire
                        accessible_path = full_path
                else:
                    # Si pdf_filename n'est pas défini, utiliser pdf_path
                    accessible_path = pdf_path if pdf_path and os.path.exists(pdf_path) else None
                
                # Vérifier si le fichier est accessible
                if accessible_path and os.path.exists(accessible_path):
                    print(f"Fichier PDF accessible à: {accessible_path}")
                    
                    # Encoder le PDF en base64 pour permettre le téléchargement direct
                    try:
                        import base64
                        with open(accessible_path, 'rb') as pdf_file:
                            pdf_content = pdf_file.read()
                            pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                            
                            if pdf_content.startswith(b'%PDF'):
                                print("Le contenu du PDF est valide.")
                                
                                # PDF valide, utiliser la structure standard
                                return jsonify({
                                    'script': script_text,
                                    'sources': real_sources,
                                    'pdf_url': f"/download/{pdf_filename}",
                                    'file_data': pdf_base64,
                                    'file_type': 'application/pdf',
                                    'file_name': pdf_filename,
                                    'estimated_reading_time': estimate_reading_time(script_text)
                                })
                            else:
                                print("Le contenu du PDF n'est pas valide. Nouvelle tentative de génération...")
                                # Forcer la régénération d'un PDF valide
                                try:
                                    # Utiliser un import FPDF direct pour créer un PDF basique sans passer par save_to_pdf
                                    from fpdf import FPDF
                                    
                                    # Créer un nom de fichier unique avec extension .pdf
                                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                    safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '_' for c in title[:30])
                                    safe_title = safe_title.replace(' ', '_')
                                    force_pdf_filename = f"script_{safe_title}_{timestamp}.pdf"
                                    
                                    # Déterminer le chemin du fichier temporaire
                                    if os.name == 'nt':  # Windows
                                        temp_dir = tempfile.gettempdir()
                                    else:  # Linux/Render
                                        temp_dir = '/tmp'
                                    force_pdf_path = os.path.join(temp_dir, force_pdf_filename)
                                    
                                    # Fonction pour sanitiser les chaînes de texte contre les problèmes d'encodage
                                    def sanitize_text(text):
                                        if not text:
                                            return ""
                                        # Remplacer les apostrophes typographiques par des apostrophes simples
                                        text = text.replace('\u2019', "'")
                                        # Remplacer les guillemets typographiques par des guillemets simples
                                        text = text.replace('\u201c', '"').replace('\u201d', '"')
                                        # Remplacer les tirets longs par des tirets standards
                                        text = text.replace('\u2014', '-').replace('\u2013', '-')
                                        # Remplacer les ellipses par trois points
                                        text = text.replace('\u2026', '...')
                                        # Sanitiser tous les autres caractères Unicode qui pourraient causer des problèmes
                                        text = ''.join(c if ord(c) < 128 else ' ' for c in text)
                                        return text
                                    
                                    # Sanitiser le texte du script et du titre
                                    safe_title = sanitize_text(title)
                                    safe_script = sanitize_text(script_text)
                                    
                                    # Créer un PDF basique
                                    pdf = FPDF()
                                    pdf.add_page()
                                    pdf.set_font("Arial", size=12)
                                    
                                    # Titre du document
                                    pdf.set_font("Arial", 'B', 16)
                                    pdf.cell(200, 10, txt=safe_title, ln=True, align='C')
                                    pdf.ln(5)
                                    
                                    # Ajouter le script
                                    pdf.set_font("Arial", size=11)
                                    # Découper le script en lignes
                                    for line in safe_script.split('\n'):
                                        safe_line = sanitize_text(line)  # Sanitiser chaque ligne individuellement
                                        pdf.multi_cell(0, 5, txt=safe_line)
                                        pdf.ln(2)
                                    
                                    # Ajouter les sources si disponibles
                                    if real_sources and len(real_sources) > 0:
                                        pdf.add_page()
                                        pdf.set_font("Arial", 'B', 14)
                                        pdf.cell(200, 10, txt="Sources", ln=True, align='L')
                                        pdf.ln(5)
                                        
                                        pdf.set_font("Arial", size=10)
                                        for i, source in enumerate(real_sources):
                                            pdf.set_font("Arial", 'B', 10)
                                            
                                            # Sanitiser les informations des sources
                                            safe_source_title = sanitize_text(source.get('title', f'Source {i+1}'))
                                            safe_source_url = sanitize_text(source.get('url', ''))
                                            safe_source_summary = sanitize_text(source.get('summary', ''))
                                            
                                            pdf.cell(200, 8, txt=f"Source {i+1}: {safe_source_title}", ln=True, align='L')
                                            pdf.set_font("Arial", size=10)
                                            pdf.cell(200, 6, txt=safe_source_url, ln=True, align='L')
                                            pdf.multi_cell(0, 5, txt=safe_source_summary)
                                            pdf.ln(5)
                                    
                                    # Sauvegarder le PDF
                                    pdf.output(force_pdf_path)
                                    print(f"PDF de secours généré avec succès: {force_pdf_path}")
                                    
                                    # Vérifier que le PDF a bien été créé
                                    if os.path.exists(force_pdf_path):
                                        with open(force_pdf_path, 'rb') as pdf_file:
                                            pdf_content = pdf_file.read()
                                            pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')
                                            
                                            return jsonify({
                                                'script': script_text,
                                                'sources': real_sources,
                                                'pdf_url': f"/download/{force_pdf_filename}",
                                                'file_data': pdf_base64,
                                                'file_type': 'application/pdf',
                                                'file_name': force_pdf_filename,
                                                'estimated_reading_time': estimate_reading_time(script_text)
                                            })
                                except Exception as pdf_error:
                                    print(f"Erreur lors de la création du PDF de secours: {pdf_error}")
                                
                                # Si tout échoue, essayer une dernière fois avec save_to_pdf
                                new_pdf_path = save_to_pdf(
                                    script_text,
                                    title=title,
                                    author=youtuber_name,
                                    channel=channel_name,
                                    sources=real_sources
                                )
                                
                                if new_pdf_path and os.path.exists(new_pdf_path):
                                    print(f"Nouveau PDF généré avec succès: {new_pdf_path}")
                                    with open(new_pdf_path, 'rb') as new_pdf_file:
                                        new_pdf_content = new_pdf_file.read()
                                        new_pdf_base64 = base64.b64encode(new_pdf_content).decode('utf-8')
                                        
                                        return jsonify({
                                            'script': script_text,
                                            'sources': real_sources,
                                            'pdf_url': f"/download/{os.path.basename(new_pdf_path)}",
                                            'file_data': new_pdf_base64,
                                            'file_type': 'application/pdf',
                                            'file_name': os.path.basename(new_pdf_path),
                                            'estimated_reading_time': estimate_reading_time(script_text)
                                        })
                                
                                # Échec catastrophique - renvoyer un PDF vide plutôt que rien
                                print("Dernière tentative avec création d'un PDF minimal")
                                try:
                                    from fpdf import FPDF
                                    minimal_pdf = FPDF()
                                    minimal_pdf.add_page()
                                    minimal_pdf.set_font("Arial", size=12)
                                    minimal_pdf.cell(200, 10, txt="Erreur de génération du PDF complet", ln=True, align='C')
                                    minimal_pdf.cell(200, 10, txt="Le script est disponible dans l'interface", ln=True, align='C')
                                    
                                    minimal_pdf_filename = f"script_minimal_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                                    minimal_pdf_path = os.path.join(temp_dir, minimal_pdf_filename)
                                    minimal_pdf.output(minimal_pdf_path)
                                    
                                    with open(minimal_pdf_path, 'rb') as min_pdf_file:
                                        min_pdf_content = min_pdf_file.read()
                                        min_pdf_base64 = base64.b64encode(min_pdf_content).decode('utf-8')
                                        
                                        return jsonify({
                                            'script': script_text,
                                            'sources': real_sources,
                                            'pdf_url': f"/download/{minimal_pdf_filename}",
                                            'file_data': min_pdf_base64,
                                            'file_type': 'application/pdf',
                                            'file_name': minimal_pdf_filename,
                                            'estimated_reading_time': estimate_reading_time(script_text),
                                            'warning': 'PDF minimal généré suite à une erreur'
                                        })
                                except Exception as final_error:
                                    print(f"Échec de la génération du PDF minimal: {final_error}")
                                
                                # Si même ça échoue, retourner le script sans PDF mais avec un type de fichier PDF
                                return jsonify({
                                    'script': script_text,
                                    'sources': real_sources,
                                    'error': 'Impossible de générer le PDF correctement',
                                    'file_type': 'application/pdf',  # Forcer le type PDF
                                    'estimated_reading_time': estimate_reading_time(script_text)
                                })
                            
                    except Exception as encode_error:
                        print(f"Erreur lors de l'encodage du PDF: {encode_error}")
                
                print(f"URL de téléchargement générée: /download/{pdf_filename}")
                
                # Retourner les données comme dans la méthode traditionnelle
                if not pdf_path or not os.path.exists(pdf_path) or not pdf_filename:
                    return jsonify({
                        'error': 'Erreur lors de la génération du PDF',
                        'file_type': 'application/pdf'  # Toujours indiquer le type PDF
                    }), 500
                
                # Renvoyer l'URL de téléchargement du PDF
                return jsonify({
                    'pdf_url': f"/download/{pdf_filename}",
                    'file_data': pdf_base64 if pdf_base64 else None,
                    'file_type': 'application/pdf',  # Toujours indiquer le type PDF
                    'file_name': pdf_filename
                })
            except Exception as file_error:
                print(f"Erreur lors du traitement du fichier PDF: {file_error}")
                import traceback
                traceback.print_exc()
                
                # Retourner au moins le script et les sources
                return jsonify({
                    'script': script_text,
                    'sources': real_sources,
                    'error': f'Erreur lors du traitement du PDF: {str(file_error)}',
                    'estimated_reading_time': estimate_reading_time(script_text)
                })
        else:
            return jsonify({'error': 'Échec de la génération du script'}), 500
            
    except Exception as e:
        print(f"Erreur lors de la génération directe du script: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération directe du script: {str(e)}'}), 500

# Route pour générer des images à partir d'un script avec l'approche standard
@app.route('/api/generate-images', methods=['POST'])
def generate_images_route():
    try:
        data = request.json
        script_text = data.get('script', '')
        title = data.get('title', '')
        num_images = data.get('num_images', 3)
        style = data.get('style', 'moderne')
        format_image = data.get('format', 'paysage')
        
        if not script_text and not title:
            return jsonify({
                'success': False,
                'message': 'Le texte du script ou le titre est requis',
                'images': []
            }), 400
            
        # Limiter le nombre d'images pour éviter les abus
        if num_images > 5:
            num_images = 5
            print(f"Limitation du nombre d'images à {num_images}")
            
        # Validation des styles supportés
        styles_supportes = ['moderne', 'minimaliste', 'coloré', 'sombre', 'nature']
        if style not in styles_supportes:
            print(f"Style non supporté: {style}, utilisation du style par défaut")
            style = 'moderne'
            
        # Validation des formats supportés
        formats_supportes = ['paysage', 'portrait', 'carré']
        if format_image not in formats_supportes:
            print(f"Format non supporté: {format_image}, utilisation du format par défaut")
            format_image = 'paysage'
            
        # Générer les images avec les options personnalisées et capturer les messages de progression
        image_paths, progress_messages = generate_images_for_script(
            script_text=script_text, 
            title=title, 
            num_images=num_images,
            style=style,
            format=format_image
        )
        
        # Préparation des URLs pour les images générées
        base_url = request.url_root.rstrip('/')
        image_urls = []
        
        for i, path in enumerate(image_paths):
            # Utiliser l'API de téléchargement existante
            filename = os.path.basename(path)
            url = f"{base_url}/download/{filename}"
            image_urls.append({
                'url': url,
                'path': path,
                'index': i+1
            })
            
        return jsonify({
            'success': True,
            'message': f'{len(image_paths)} images générées avec succès',
            'images': image_urls,
            'progress_messages': progress_messages
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la génération des images: {str(e)}',
            'images': []
        }), 500

# Route pour générer des images à partir d'un script avec Grok
@app.route('/api/generate-grok-images', methods=['POST'])
def generate_grok_images_route():
    try:
        data = request.json
        script_text = data.get('script', '')
        title = data.get('title', '')
        num_images = data.get('num_images', 3)
        format_image = data.get('format', 'paysage')
        
        if not script_text and not title:
            return jsonify({
                'success': False,
                'message': 'Le texte du script ou le titre est requis',
                'images': []
            }), 400
            
        # Limiter le nombre d'images pour éviter les abus
        if num_images > 5:
            num_images = 5
            print(f"Limitation du nombre d'images à {num_images}")
        
        # Générer les images avec l'option Grok activée
        image_paths, progress_messages = generate_images_for_script(
            script_text=script_text, 
            title=title, 
            num_images=num_images,
            format=format_image,
            use_grok=True  # Utilisation de Grok
        )
        
        # Préparation des URLs pour les images générées
        base_url = request.url_root.rstrip('/')
        image_urls = []
        
        for i, path in enumerate(image_paths):
            # Utiliser l'API de téléchargement existante
            filename = os.path.basename(path)
            url = f"{base_url}/download/{filename}"
            image_urls.append({
                'url': url,
                'path': path,
                'index': i+1
            })
            
        return jsonify({
            'success': True,
            'message': f'{len(image_paths)} images générées avec succès via Grok',
            'images': image_urls,
            'progress_messages': progress_messages
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Erreur lors de la génération des images avec Grok: {str(e)}',
            'images': []
        }), 500

# Initialiser la base de données et démarrer l'application
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Configuration pour un serveur de développement léger
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True, processes=1)
