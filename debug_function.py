def debug_deepseek_generate(prompt: str) -> str:
    """Version de débogage de la fonction deepseek_generate."""
    import requests
    import json
    import os
    
    # Récupérer la clé API DeepSeek
    DEEPSEEK_API_KEY = "sk-c53f5831d24a444584d5afff2f8d0d2d"
    
    try:
        # Log pour le débogage
        print(f"DEBUG: Envoi d'une requête à DeepSeek avec {len(prompt)} caractères")
        print(f"DEBUG: Utilisation de la clé API: {DEEPSEEK_API_KEY[:5]}...{DEEPSEEK_API_KEY[-4:]}")
        
        try:
            # Tenter la connexion
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 2048,
                    "temperature": 0.7
                },
                timeout=60  # 60 secondes de timeout
            )
            
            # Log du code de statut HTTP
            print(f"DEBUG: Code de statut HTTP: {response.status_code}")
            
            # Si erreur, afficher les détails
            if response.status_code >= 400:
                error_text = response.text
                print(f"DEBUG: Erreur HTTP {response.status_code}: {error_text}")
                if response.status_code == 401:
                    print("DEBUG: ERREUR D'AUTHENTIFICATION - Clé API invalide ou expirée")
                return ""
            
            # Traiter la réponse
            result = response.json()
            print(f"DEBUG: Structure de la réponse: {list(result.keys())}")
            
            if "choices" not in result or not result["choices"]:
                print("DEBUG: Réponse sans 'choices'")
                return ""
                
            text = result["choices"][0]["message"]["content"]
            print(f"DEBUG: Longueur de la réponse: {len(text)} caractères")
            print(f"DEBUG: Début de la réponse: {text[:100]}...")
            
            return text
            
        except requests.exceptions.ConnectionError as conn_err:
            print(f"DEBUG: Erreur de connexion: {conn_err}")
            return ""
        except requests.exceptions.Timeout as timeout_err:
            print(f"DEBUG: Timeout: {timeout_err}")
            return ""
        except requests.exceptions.RequestException as req_err:
            print(f"DEBUG: Erreur de requête: {req_err}")
            return ""
        except Exception as api_err:
            print(f"DEBUG: Erreur API imprévue: {api_err}")
            import traceback
            traceback.print_exc()
            return ""
    except Exception as e:
        print(f"DEBUG: Erreur générale: {e}")
        import traceback
        traceback.print_exc()
        return ""

# Fonction pour tester rapidement le générateur avec un prompt simple
def test_deepseek():
    prompt = """Génère un objet JSON simple avec deux propriétés: "hello" et "world".
    Format attendu:
    {
      "hello": "world",
      "test": "testing"
    }
    """
    response = debug_deepseek_generate(prompt)
    print("\nRÉSULTAT TEST:")
    print(response)
    
# Exécuter le test si ce fichier est exécuté directement
if __name__ == "__main__":
    test_deepseek()
