import edge_tts
import asyncio

class AudioGenerator:
    """Générateur de voix off utilisant Edge TTS (Gratuit & Qualitatif)."""
    
    def __init__(self):
        # Voix françaises par défaut
        self.voices = {
            'male': 'fr-FR-HenriNeural',
            'female': 'fr-FR-DeniseNeural'
        }
    
    async def generate_audio(self, text: str, output_path: str, gender: str = 'male') -> str:
        """
        Génère un fichier MP3 à partir du texte.
        """
        voice = self.voices.get(gender, self.voices['male'])
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)
        return output_path

    def generate_sync(self, text: str, output_path: str, gender: str = 'male'):
        """Wrapper synchrone pour appel depuis Flask."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self.generate_audio(text, output_path, gender))
            return output_path
        finally:
            loop.close()
