import os
try:
    from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
except ImportError:
    print("MoviePy not installed or ImageMagick missing.")

class VideoMaker:
    """Moteur d'assemblage vidéo utilisant MoviePy."""
    
    def __init__(self, output_dir="generated_videos"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def create_video(self, assets: list, audio_path: str, subtitles: list, options: dict) -> str:
        """
        Assemble la vidéo finale.
        """
        try:
            # 1. Charger Audio
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration
            print(f"🎵 Durée audio: {duration}s")

            # 2. Préparer les clips vidéo
            clips = []
            current_duration = 0
            
            # Format cible (Vertical 9:16 ou Horizontal 16:9)
            target_res = (1080, 1920) if options.get('format', 'vertical') == 'vertical' else (1920, 1080)
            target_ratio = target_res[0] / target_res[1]

            import random
            random.shuffle(assets) # Mélanger les stocks
            
            # Boucler sur les assets jusqu'à remplir la durée
            while current_duration < duration:
                for asset in assets:
                    if current_duration >= duration:
                        break
                        
                    clip = VideoFileClip(asset)
                    # Couper si le clip est trop long pour le reste
                    remaining = duration - current_duration
                    if clip.duration > remaining:
                        clip = clip.subclip(0, remaining)
                    
                    # Rognage (Crop) pour remplir l'écran (Object-fit: cover logic)
                    if clip.w / clip.h > target_ratio:
                        # Video est plus large -> couper les cotés
                        new_w = clip.h * target_ratio
                        clip = clip.crop(x1=(clip.w/2 - new_w/2), width=new_w, height=clip.h)
                    else:
                        # Video est plus haute -> couper haut/bas
                        new_h = clip.w / target_ratio
                        clip = clip.crop(y1=(clip.h/2 - new_h/2), width=clip.w, height=new_h)
                        
                    # Redimensionner
                    clip = clip.resize(newsize=target_res)
                    
                    clips.append(clip)
                    current_duration += clip.duration
                    
            # 3. Assembler Vidéo de base
            base_video = concatenate_videoclips(clips, method="compose")
            base_video = base_video.set_duration(duration)
            base_video = base_video.set_audio(audio_clip)

            # 4. Ajouter les Sous-titres (si présents)
            if subtitles:
                print(f"📝 Ajout de {len(subtitles)} sous-titres...")
                subtitle_clips = []
                
                # Style des sous-titres
                fontsize = 70 if target_res[0] < target_res[1] else 50 # Plus gros en vertical
                
                for sub in subtitles:
                    # sub = {'text': "Mot", 'start': 0.5, 'end': 0.9}
                    # TextClip avec MoviePy (requiert ImageMagick)
                    txt_clip = (TextClip(sub['text'], fontsize=fontsize, color='white', font='Arial-Bold', stroke_color='black', stroke_width=2, method='caption', size=(target_res[0]*0.9, None))
                                .set_position(('center', 'center')) # Au centre pour l'instant
                                .set_start(sub['start'])
                                .set_duration(sub['end'] - sub['start']))
                    subtitle_clips.append(txt_clip)
                    
                final_video_clip = CompositeVideoClip([base_video] + subtitle_clips)
            else:
                final_video_clip = base_video

            # 4. Export
            filename = f"video_{os.urandom(4).hex()}.mp4"
            output_path = os.path.join(self.output_dir, filename)
            
            # Threads=2 pour éviter de bloquer le CPU sur petit serveur
            final_video_clip.write_videofile(
                output_path, 
                fps=30, 
                codec='libx264', 
                audio_codec='aac', 
                threads=4,
                preset='ultrafast' # Pour le test
            )
            
            # Cleanup
            audio_clip.close()
            final_video_clip.close()
            for c in clips: c.close()

            return output_path

        except Exception as e:
            print(f"❌ Erreur assemblage vidéo: {e}")
            raise e
