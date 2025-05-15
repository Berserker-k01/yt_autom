import os
import requests
import json
from dotenv import load_dotenv
import time

# Charger les variables d'environnement
load_dotenv()

# Configuration de l'API Claude
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")

def claude_search(query: str, num_results: int = 5) -> str:
    """Effectue une recherche via l'API Claude en remplacement de DeepSeek."""
    try:
        print(f"Recherche Claude pour: {query}")
        
        # Vérification de la clé API
        if not CLAUDE_API_KEY:
            print("Erreur: Clé API Claude manquante ou invalide")
            return ""
        
        # Construction du prompt pour demander à Claude de rechercher des informations
        search_prompt = f"""
Tu es un moteur de recherche internet avancé. J'ai besoin que tu me fournisses des informations factuelles sur le sujet suivant: 
"{query}"

Réponds-moi avec les informations suivantes:
1. Un résumé synthétique des informations principales (environ 100-150 mots)
2. Les {num_results} meilleures sources d'information sur ce sujet avec pour chaque source:
   - Le titre de la source
   - L'URL (fictive mais réaliste si nécessaire)
   - Un résumé du contenu pertinent (environ 50-100 mots)

Formatage pour chaque source:
Source: [URL]
Titre: [Titre]
Résumé: [Résumé du contenu]

Les sources doivent être variées et refléter différentes perspectives sur le sujet. Si certaines informations ne sont pas disponibles, génère des sources plausibles et note-le discrètement dans ton résumé.
"""

        try:
            max_retries = 3
            retry_delay = 2  # secondes
            
            for attempt in range(max_retries):
                try:
                    response = requests.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": CLAUDE_API_KEY,
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "claude-3-opus-20240229",
                            "max_tokens": 4096,
                            "messages": [
                                {"role": "user", "content": search_prompt}
                            ],
                            "temperature": 0.5
                        },
                        timeout=30  # Timeout de 30 secondes
                    )
                    
                    response.raise_for_status()
                    result = response.json()
                    
                    if "content" not in result or not result["content"]:
                        print("Erreur: Réponse Claude vide")
                        if attempt < max_retries - 1:
                            print(f"Nouvelle tentative ({attempt+2}/{max_retries})...")
                            time.sleep(retry_delay)
                            continue
                        return ""
                    
                    # Extraire le texte du contenu (Claude renvoie une liste de blocs de contenu)
                    text = ""
                    for content_block in result["content"]:
                        if content_block["type"] == "text":
                            text += content_block["text"]
                    
                    if not text or len(text.strip()) < 100:
                        print(f"Réponse Claude trop courte ({len(text) if text else 0} caractères)")
                        if attempt < max_retries - 1:
                            print(f"Nouvelle tentative ({attempt+2}/{max_retries})...")
                            time.sleep(retry_delay)
                            continue
                        return ""
                    
                    print(f"Recherche Claude terminée avec succès ({len(text)} caractères)")
                    return text
                    
                except requests.exceptions.ConnectionError as conn_err:
                    print(f"Erreur de connexion Claude (tentative {attempt+1}/{max_retries}): {conn_err}")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative dans {retry_delay} secondes...")
                        time.sleep(retry_delay)
                        continue
                    print("Échec après plusieurs tentatives")
                    return ""
                except requests.exceptions.Timeout as timeout_err:
                    print(f"Timeout lors de la connexion à Claude (tentative {attempt+1}/{max_retries}): {timeout_err}")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative dans {retry_delay} secondes...")
                        time.sleep(retry_delay)
                        continue
                    print("Échec après plusieurs tentatives")
                    return ""
                except requests.exceptions.RequestException as req_err:
                    print(f"Erreur de requête Claude (tentative {attempt+1}/{max_retries}): {req_err}")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative dans {retry_delay} secondes...")
                        time.sleep(retry_delay)
                        continue
                    print("Échec après plusieurs tentatives")
                    return ""
        except Exception as e:
            print(f"Erreur générale lors de la recherche Claude: {e}")
            return ""
    except Exception as e:
        print(f"Erreur Claude: {e}")
        return ""

def claude_generate(prompt: str) -> str:
    """Génère du texte avec Claude en remplacement de DeepSeek."""
    try:
        # Vérification de la clé API
        if not CLAUDE_API_KEY:
            print("Erreur: Clé API Claude manquante ou invalide")
            raise ValueError("Clé API Claude manquante ou invalide")
        
        max_retries = 3
        retry_delay = 2  # secondes
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": CLAUDE_API_KEY,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "claude-3-opus-20240229",
                        "max_tokens": 4096,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.5
                    },
                    timeout=30  # Timeout de 30 secondes
                )
                
                response.raise_for_status()
                result = response.json()
                
                if "content" not in result or not result["content"]:
                    print("Erreur: Réponse Claude vide")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative ({attempt+2}/{max_retries})...")
                        time.sleep(retry_delay)
                        continue
                    return ""
                
                # Extraire le texte du contenu (Claude renvoie une liste de blocs de contenu)
                text = ""
                for content_block in result["content"]:
                    if content_block["type"] == "text":
                        text += content_block["text"]
                
                if not text:
                    print("Erreur: Réponse Claude vide après extraction")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative ({attempt+2}/{max_retries})...")
                        time.sleep(retry_delay)
                        continue
                    return ""
                
                # Essaie de trouver un JSON valide dans la réponse si nécessaire
                start = text.find('{')
                end = text.rfind('}') + 1
                
                if start >= 0 and end > 0:
                    json_str = text[start:end]
                    # Vérifie si c'est un JSON valide
                    try:
                        json.loads(json_str)
                        return json_str
                    except:
                        # Si ce n'est pas un JSON valide, retourne le texte complet
                        return text
                
                return text
                
            except requests.exceptions.ConnectionError as conn_err:
                print(f"Erreur de connexion Claude (tentative {attempt+1}/{max_retries}): {conn_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
            except requests.exceptions.Timeout as timeout_err:
                print(f"Timeout lors de la connexion à Claude (tentative {attempt+1}/{max_retries}): {timeout_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
            except requests.exceptions.RequestException as req_err:
                print(f"Erreur de requête Claude (tentative {attempt+1}/{max_retries}): {req_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
    except Exception as e:
        print(f"Erreur Claude: {e}")
        return ""

def generate_claude_image_prompt(script_text: str, title: str = "") -> str:
    """
    Génère un prompt optimisé via Claude pour créer des images en remplacement de DeepSeek.
    
    Args:
        script_text (str): Le texte du script pour générer le prompt
        title (str): Le titre du script ou de la vidéo
        
    Returns:
        str: Un prompt optimisé pour la génération d'images
    """
    try:
        if not script_text:
            print("Erreur: Texte du script vide")
            return ""
        
        # Limite la taille du texte pour éviter les dépassements de token
        max_chars = 5000
        if len(script_text) > max_chars:
            trimmed_script = script_text[:max_chars] + "..."
        else:
            trimmed_script = script_text
        
        prompt = f"""
Tu es un expert en génération de prompts pour l'IA générative d'images. 
Je vais te fournir un script de vidéo YouTube et j'ai besoin que tu crées un prompt de haute qualité pour générer une image de couverture (thumbnail) qui captera l'attention.

Le titre de la vidéo est : {title if title else "Non spécifié"}

Voici un extrait du script:
```
{trimmed_script}
```

Génère un prompt descriptif et détaillé pour une image de couverture qui:
1. Capte l'essence du sujet
2. Est visuellement attrayante
3. Donne envie de cliquer sur la vidéo

Le prompt doit être:
- Ultra précis avec des détails visuels spécifiques (couleurs, composition, éléments, style)
- Long de 100-200 mots maximum
- Formulé en une description cohérente et non une liste à puces

IMPORTANT: Génère uniquement le prompt d'image, rien d'autre.
"""
        
        result = claude_generate(prompt)
        
        if not result or len(result) < 20:
            print("Erreur: Prompt d'image généré trop court")
            return ""
        
        # Nettoyer le résultat si nécessaire
        if "prompt :" in result.lower():
            # Extraire seulement la partie après "prompt :"
            result = result[result.lower().find("prompt :") + 8:].strip()
        
        return result.strip()
    except Exception as e:
        print(f"Erreur lors de la génération du prompt d'image: {e}")
        return ""
