import os
import time
import glob
import logging
import google.generativeai as genai
from yt_dlp import YoutubeDL

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoAnalyst:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ GEMINI_API_KEY manquant. L'analyse vidéo ne fonctionnera pas.")
        else:
            genai.configure(api_key=self.api_key)
            
        # Dossier temporaire pour les vidéos
        self.temp_dir = os.path.join(os.getcwd(), "temp_videos")
        os.makedirs(self.temp_dir, exist_ok=True)

    def download_video(self, url: str) -> str:
        """
        Télécharge une vidéo depuis une URL (YouTube, TikTok, FB, etc.) via yt-dlp.
        Retourne le chemin absolu du fichier téléchargé.
        """
        logger.info(f"⬇️ Début du téléchargement: {url}")
        
        # Options yt-dlp
        ydl_opts = {
            'format': 'best[ext=mp4]', # Force MP4 pour compatibilité max
            'outtmpl': os.path.join(self.temp_dir, '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'max_filesize': 50 * 1024 * 1024, # Limite à 50MB pour l'instant (quota Gemini)
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                video_id = info.get('id', 'video')
                ext = info.get('ext', 'mp4')
                filename = f"{video_id}.{ext}"
                filepath = os.path.join(self.temp_dir, filename)
                
                logger.info(f"✅ Vidéo téléchargée: {filepath}")
                
                # Extraction des métadatas pertinentes
                metadata = {
                    "title": info.get('title', 'Unknown Title'),
                    "views": info.get('view_count', 0),
                    "likes": info.get('like_count', 0),
                    "author": info.get('uploader', 'Unknown Author'),
                    "duration": info.get('duration', 0),
                    "thumbnail": info.get('thumbnail', '')
                }
                
                return filepath, metadata
        except Exception as e:
            logger.error(f"❌ Erreur de téléchargement: {str(e)}")
            raise e

    def upload_to_gemini(self, video_path: str):
        """
        Upload le fichier vidéo sur les serveurs Gemini pour analyse.
        """
        logger.info(f"cloud_upload Upload vers Gemini: {video_path}")
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Fichier inexistant: {video_path}")

        try:
            video_file = genai.upload_file(path=video_path)
            logger.info(f"✅ Upload réussi. URI: {video_file.uri}")
            
            # Attendre que le fichier soit prêt (état ACTIVE)
            while video_file.state.name == "PROCESSING":
                print('.', end='', flush=True)
                time.sleep(2)
                video_file = genai.get_file(video_file.name)
            
            if video_file.state.name == "FAILED":
                raise ValueError("Le traitement vidéo par Gemini a échoué.")
                
            return video_file
        except Exception as e:
            logger.error(f"❌ Erreur Upload Gemini: {str(e)}")
            raise e

    def analyze_content(self, video_file, query: str = "Décris cette vidéo en détail.", chat_history=None) -> str:
        """
        Analyse le contenu vidéo avec Gemini 1.5 Flash.
        """
        logger.info(f"🧠 Analyse en cours... Query: {query}")
        
        try:
            # Liste de modèles à tenter par ordre de préférence
            models_to_try = [
                "models/gemini-1.5-flash",
                "models/gemini-1.5-flash-latest",
                "models/gemini-1.5-flash-001",
                "models/gemini-1.5-pro", 
                "models/gemini-1.5-pro-latest",
                "models/gemini-pro"
            ]
            
            response = None
            last_error = None

            # Prompt système pour forcer l'expertise
            system_prompt = "Tu es un analyste vidéo expert. Tu observes la vidéo avec une précision extrême. Tu es capable de transcrire les dialogues, décrire les émotions, les visuels et le contexte."
            
            for model_name in models_to_try:
                try:
                    logger.info(f"Tentative avec le modèle : {model_name}")
                    model = genai.GenerativeModel(model_name=model_name)
                    response = model.generate_content([video_file, system_prompt, query])
                    logger.info(f"✅ Succès avec {model_name}")
                    break
                except Exception as e:
                    logger.warning(f"⚠️ Échec avec {model_name}: {e}")
                    last_error = e
                    continue
            
            if response:
                return response.text
            else:
                raise last_error

        except Exception as e:
            logger.error(f"❌ Erreur Analyse (tous modèles échoués): {str(e)}")
            return f"Désolé, je n'ai pas pu analyser cette vidéo. Erreur: {str(e)}"

    def cleanup(self, filepath: str):
        """Supprime le fichier temporaire."""
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"🧹 Nettoyage: {filepath} supprimé.")
        except Exception as e:
            logger.warning(f"⚠️ Erreur nettoyage: {e}")
