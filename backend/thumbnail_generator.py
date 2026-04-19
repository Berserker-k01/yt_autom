import os
import time
import requests
import google.generativeai as genai
from datetime import datetime

class ThumbnailGenerator:
    """
    Générateur de miniatures YouTube via IA.
    Utilise Gemini pour le Prompt Engineering et Pollinations.ai (Flux/SDXL) pour le rendu.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            print("⚠️ Pas de clé API Gemini pour les miniatures")
            self.model = None
            
        # Use absolute path mapped to docker volume
        self.output_dir = os.path.join(os.getcwd(), 'output', 'thumbnails')
        # If absolute path not working as expected in some envs, force /app/output
        if os.path.exists('/app/output'):
             self.output_dir = '/app/output/thumbnails'
             
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_prompt(self, video_script: str, video_title: str) -> str:
        """Utilise Gemini pour créer un prompt de description d'image optimisé pour l'IA."""
        if not self.model:
            return f"YouTube thumbnail for {video_title}, high quality, 4k"

        print(f"🎨 Création du prompt de miniature pour : {video_title}")
        
        prompt = f"""
        Tu es un expert en design de miniatures YouTube virales (MrBeast, Iman Gadzhi style).
        
        Titre de la vidéo : "{video_title}"
        Extrait du script : "{video_script[:500]}..."
        
        TA MISSION : 
        Rédige un prompt en ANGLAIS pour un générateur d'images IA (comme Midjourney/Flux) pour créer la miniature parfaite.
        
        Règles pour le prompt :
        1. Décris une image visuellement frappante, contrastée et émotive.
        2. Spécifie le style : "Hyper-realistic", "Cinematic lighting", "Vibrant colors", "YouTube thumbnail style".
        3. Fais court mais dense (max 40 mots).
        4. N'inclus PAS de texte dans l'image (l'IA gère mal le texte).
        
        Réponds UNIQUEMENT avec le prompt en anglais, rien d'autre.
        """
        
        try:
            response = self.model.generate_content(prompt)
            image_prompt = response.text.strip()
            # Nettoyage si jamais Gemini parle trop
            if '"' in image_prompt:
                image_prompt = image_prompt.replace('"', '')
            print(f"✨ Prompt généré : {image_prompt}")
            return image_prompt
        except Exception as e:
            print(f"❌ Erreur génération prompt : {e}")
            return f"YouTube thumbnail for {video_title}, cinematic, 4k"

    def generate_image(self, prompt: str) -> str:
        """Génère l'image via Pollinations.ai (gratuit, rapide, haute qualité)."""
        try:
            print(f"🖼️ Génération de l'image avec prompt : {prompt}")
            
            # Encoder le prompt pour l'URL
            import urllib.parse
            encoded_prompt = urllib.parse.quote(prompt)
            
            # URL Pollinations avec paramètres
            # model=flux : Souvent meilleur pour le photoréalisme
            # width=1280, height=720 : Format YouTube standard 16:9
            url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1280&height=720&model=flux&seed={int(time.time())}&nologo=true"
            
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                filename = f"thumb_{int(time.time())}.jpg"
                filepath = os.path.join(self.output_dir, filename)
                
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ Miniature sauvegardée : {filepath}")
                return filepath
            else:
                print(f"❌ Erreur API Image ({response.status_code})")
                return None
                
        except Exception as e:
            print(f"❌ Erreur téléchargement image : {e}")
            return None
