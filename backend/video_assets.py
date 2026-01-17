import os
import requests
import random

class VideoAssetManager:
    """Gère la récupération de ressources vidéo (Stock Footage) via Pexels/Pixabay."""
    
    def __init__(self):
        self.pexels_api_key = os.getenv('PEXELS_API_KEY')
        self.pixabay_api_key = os.getenv('PIXABAY_API_KEY')
    
    def search_video(self, query: str, duration_min: int = 5, orientation: str = 'landscape') -> str:
        """
        Cherche une vidéo pertinente sur Pexels.
        Retourne l'URL de téléchargement ou None.
        
        Args:
            query: Mots-clés de recherche (en anglais idéalement)
            duration_min: Durée minimale souhaitée (en secondes)
            orientation: 'landscape', 'portrait', or 'square'
        """
        if not self.pexels_api_key:
            print("❌ PEXELS_API_KEY manquant.")
            return None
            
        headers = {'Authorization': self.pexels_api_key}
        url = f"https://api.pexels.com/videos/search?query={query}&per_page=5&orientation={orientation}"
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                videos = data.get('videos', [])
                
                # Filtrer par durée et qualité
                valid_videos = []
                for video in videos:
                    # Trouver le fichier vidéo MP4 HD
                    video_files = video.get('video_files', [])
                    hd_files = [v for v in video_files if v['quality'] == 'hd' and v['file_type'] == 'video/mp4']
                    
                    if hd_files and video['duration'] >= duration_min:
                        # Prendre le meilleur fichier HD disponible
                        best_file = sorted(hd_files, key=lambda x: x['width'] * x['height'], reverse=True)[0]
                        valid_videos.append(best_file['link'])
                
                if valid_videos:
                    return random.choice(valid_videos)
            else:
                print(f"Erreur Pexels: {response.status_code}")
                
        except Exception as e:
            print(f"Exception Pexels: {e}")
            
        return None

    def download_asset(self, url: str, target_path: str):
        """Télécharge le fichier vidéo localement."""
        try:
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with open(target_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            return target_path
        except Exception as e:
            print(f"Erreur téléchargement asset: {e}")
            return None
