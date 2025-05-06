def deepseek_search(query: str, num_results: int = 5) -> str:
    """Effectue une recherche via l'API DeepSeek."""
    try:
        print(f"Recherche DeepSeek pour: {query}")
        
        # Vérification de la clé API
        if not DEEPSEEK_API_KEY:
            print("Erreur: Clé API DeepSeek manquante ou invalide")
            return serpapi_search(query, num_results)  # Fallback à SerpAPI
        
        # Construction du prompt pour demander à DeepSeek de rechercher des informations
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
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": search_prompt}],
                    "max_tokens": 4096,
                    "temperature": 0.5
                },
                timeout=30  # Timeout de 30 secondes
            )
            response.raise_for_status()
            result = response.json()
            
            if "choices" not in result or not result["choices"]:
                print("Erreur: Réponse DeepSeek vide")
                return serpapi_search(query, num_results)  # Fallback à SerpAPI
                
            text = result["choices"][0]["message"]["content"]
            
            if not text or len(text.strip()) < 100:
                print(f"Réponse DeepSeek trop courte ({len(text) if text else 0} caractères)")
                return serpapi_search(query, num_results)  # Fallback à SerpAPI
            
            print(f"Recherche DeepSeek terminée avec succès ({len(text)} caractères)")
            return text
            
        except requests.exceptions.ConnectionError as conn_err:
            print(f"Erreur de connexion DeepSeek: {conn_err}")
            return serpapi_search(query, num_results)  # Fallback à SerpAPI
        except requests.exceptions.Timeout as timeout_err:
            print(f"Timeout lors de la connexion à DeepSeek: {timeout_err}")
            return serpapi_search(query, num_results)  # Fallback à SerpAPI
        except requests.exceptions.RequestException as req_err:
            print(f"Erreur de requête DeepSeek: {req_err}")
            return serpapi_search(query, num_results)  # Fallback à SerpAPI
    except Exception as e:
        print(f"Erreur DeepSeek: {e}")
        return serpapi_search(query, num_results)  # Fallback à SerpAPI
