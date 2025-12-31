"""
GitHub Models Integration
Utilise l'API GitHub Models (compatible OpenAI) pour la génération de texte.
"""

import os
import json
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODEL = os.getenv("GITHUB_MODEL", "gpt-4o")
API_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions"

def github_models_generate(prompt: str, model: str = None, temperature: float = 0.7, max_tokens: int = 4000) -> str:
    """
    Génère du texte avec GitHub Models via l'API OpenAI-compatible.
    
    Args:
        prompt: Le prompt à envoyer au modèle
        model: Le modèle à utiliser (par défaut: gpt-4o)
        temperature: Température de génération (0-1)
        max_tokens: Nombre maximum de tokens
        
    Returns:
        La réponse générée ou une chaîne vide en cas d'erreur
    """
    if not GITHUB_TOKEN:
        print("❌ Erreur: GITHUB_TOKEN manquant dans .env")
        return ""
    
    if model is None:
        model = GITHUB_MODEL
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GITHUB_TOKEN}"
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "Tu es un assistant IA expert en création de contenu pour les réseaux sociaux. Tu réponds toujours en français et génères du contenu de haute qualité."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "top_p": 1.0
    }
    
    max_retries = 3
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            print(f"🤖 Appel GitHub Models (modèle: {model}, tentative {attempt + 1}/{max_retries})...")
            
            response = requests.post(
                API_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0]["message"]["content"]
                    print(f"✅ Réponse reçue ({len(content)} caractères)")
                    return content
                else:
                    print("⚠️ Réponse vide de GitHub Models")
                    
            elif response.status_code == 401:
                print("❌ Erreur d'authentification: vérifiez votre GITHUB_TOKEN")
                return ""
                
            elif response.status_code == 429:
                print(f"⚠️ Rate limit atteint, attente de {retry_delay * (attempt + 1)}s...")
                import time
                time.sleep(retry_delay * (attempt + 1))
                continue
                
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                
                if attempt < max_retries - 1:
                    import time
                    time.sleep(retry_delay)
                    continue
                    
        except requests.exceptions.Timeout:
            print(f"⏱️ Timeout (tentative {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
                continue
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Erreur réseau: {e}")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
                continue
                
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            if attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
                continue
    
    print("❌ Échec après toutes les tentatives")
    return ""


def github_models_generate_json(prompt: str, model: str = None) -> dict:
    """
    Génère du JSON avec GitHub Models.
    
    Args:
        prompt: Le prompt demandant une réponse JSON
        model: Le modèle à utiliser
        
    Returns:
        Un dictionnaire Python ou un dict vide en cas d'erreur
    """
    response = github_models_generate(prompt, model=model, temperature=0.3)
    
    if not response:
        return {}
    
    # Extraire le JSON de la réponse
    try:
        # Chercher le JSON dans la réponse
        start = response.find('{')
        end = response.rfind('}') + 1
        
        if start >= 0 and end > 0:
            json_str = response[start:end]
            return json.loads(json_str)
        else:
            # Essayer de parser la réponse complète
            return json.loads(response)
            
    except json.JSONDecodeError as e:
        print(f"❌ Erreur de parsing JSON: {e}")
        print(f"Réponse brute: {response[:200]}...")
        return {}


# Test de la connexion
if __name__ == "__main__":
    print("🧪 Test de GitHub Models...")
    
    test_prompt = "Dis bonjour en une phrase."
    result = github_models_generate(test_prompt)
    
    if result:
        print(f"✅ Test réussi: {result}")
    else:
        print("❌ Test échoué")
