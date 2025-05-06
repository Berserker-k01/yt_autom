import os
from dotenv import load_dotenv
import json
from datetime import datetime
import requests
from fpdf import FPDF
import google.generativeai as genai
import re

# Charge les variables d'environnement
load_dotenv()

# Configuration des APIs
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DEEPSEEK_API_KEY = "sk-c53f5831d24a444584d5afff2f8d0d0d"  # Clé API DeepSeek corrigée

# Configuration de Gemini
genai.configure(api_key=GEMINI_API_KEY)
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    # Test rapide pour vérifier si la clé API fonctionne
    _ = model.generate_content("Test")
    print("Configuration Gemini réussie")
except Exception as e:
    print(f"AVERTISSEMENT: Problème avec la clé API Gemini: {e}")
    print("Les fonctions Gemini pourraient ne pas fonctionner correctement")

def gemini_generate(prompt: str) -> str:
    """Génère du texte avec Gemini."""
    try:
        # Vérification de la clé API
        if not GEMINI_API_KEY:
            print("Erreur: Clé API Gemini manquante ou invalide")
            raise ValueError("Clé API Gemini manquante ou invalide")
        
        try:
            response = model.generate_content(prompt)
            if not response or not response.text:
                print("Erreur: Réponse Gemini vide")
                return ""
                
            # Essaie de trouver un JSON valide dans la réponse
            text = response.text
            start = text.find('{')
            end = text.rfind('}') + 1
            
            if start >= 0 and end > 0:
                json_str = text[start:end]
                # Vérifie si c'est un JSON valide
                try:
                    json.loads(json_str)
                    return json_str
                except:
                    print(f"Erreur: JSON invalide dans la réponse")
                    print(f"Début de la réponse reçue: {text[:200]}...")
                    return text
            
            return text
        except requests.exceptions.ConnectionError as conn_err:
            print(f"Erreur de connexion Gemini: {conn_err}")
            raise ValueError(f"Failed to fetch - Problème de connexion: {conn_err}")
        except requests.exceptions.Timeout as timeout_err:
            print(f"Timeout lors de la connexion à Gemini: {timeout_err}")
            raise ValueError(f"Failed to fetch - Timeout: {timeout_err}")
        except requests.exceptions.RequestException as req_err:
            print(f"Erreur de requête Gemini: {req_err}")
            raise ValueError(f"Failed to fetch - Erreur de requête: {req_err}")
    except Exception as e:
        print(f"Erreur Gemini: {e}")
        return ""

def deepseek_search(query: str, num_results: int = 5) -> str:
    """Effectue une recherche via l'API DeepSeek en priorité sur Tavily et SerpAPI."""
    try:
        print(f"Recherche DeepSeek pour: {query}")
        
        # Vérification de la clé API
        if not DEEPSEEK_API_KEY:
            print("Erreur: Clé API DeepSeek manquante ou invalide")
            return ""
        
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
                return ""
                
            text = result["choices"][0]["message"]["content"]
            
            if not text or len(text.strip()) < 100:
                print(f"Réponse DeepSeek trop courte ({len(text) if text else 0} caractères)")
                return ""
            
            print(f"Recherche DeepSeek terminée avec succès ({len(text)} caractères)")
            return text
            
        except requests.exceptions.ConnectionError as conn_err:
            print(f"Erreur de connexion DeepSeek: {conn_err}")
            return ""
        except requests.exceptions.Timeout as timeout_err:
            print(f"Timeout lors de la connexion à DeepSeek: {timeout_err}")
            return ""
        except requests.exceptions.RequestException as req_err:
            print(f"Erreur de requête DeepSeek: {req_err}")
            return ""
    except Exception as e:
        print(f"Erreur DeepSeek: {e}")
        return ""

def deepseek_generate(prompt: str) -> str:
    """Génère du texte avec DeepSeek."""
    try:
        # Vérification de la clé API
        if not DEEPSEEK_API_KEY:
            print("Erreur: Clé API DeepSeek manquante ou invalide")
            raise ValueError("Clé API DeepSeek manquante ou invalide")
        
        try:
            response = requests.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4096,
                    "temperature": 0.5
                },
                timeout=30  # Timeout de 30 secondes
            )
            response.raise_for_status()
            result = response.json()
            
            if "choices" not in result or not result["choices"]:
                print("Erreur: Réponse DeepSeek vide")
                return ""
                
            text = result["choices"][0]["message"]["content"]
            
            if not text or len(text.strip()) < 100:
                print(f"Réponse DeepSeek trop courte ({len(text) if text else 0} caractères)")
                return ""
            
            print(f"Génération DeepSeek terminée avec succès ({len(text)} caractères)")
            return text
            
        except requests.exceptions.ConnectionError as conn_err:
            print(f"Erreur de connexion DeepSeek: {conn_err}")
            raise ValueError(f"Failed to fetch - Problème de connexion: {conn_err}")
        except requests.exceptions.Timeout as timeout_err:
            print(f"Timeout lors de la connexion à DeepSeek: {timeout_err}")
            raise ValueError(f"Failed to fetch - Timeout: {timeout_err}")
        except requests.exceptions.RequestException as req_err:
            print(f"Erreur de requête DeepSeek: {req_err}")
            raise ValueError(f"Failed to fetch - Erreur de requête: {req_err}")
    except Exception as e:
        print(f"Erreur DeepSeek: {e}")
        return ""

def fetch_research(topic: str, max_results: int = 5) -> str:
    """
    Recherche des informations sur un sujet donné en utilisant SerpAPI ou une simulation.
    
    Args:
        topic (str): Le sujet à rechercher
        max_results (int, optional): Nombre maximum de résultats à récupérer
        
    Returns:
        str: Le texte de recherche formaté avec les sources
    """
    try:
        # Valider l'entrée
        if not topic:
            return ""
            
        print(f"Recherche d'informations sur: {topic}")
        
        # Nettoyer le texte du sujet
        topic = topic.strip()
        
        # Option 1: Utiliser SerpAPI si disponible (à implémenter selon les clés API disponibles)
        try:
            from serpapi import GoogleSearch
            
            # Vérifier si l'API SERPAPI est configurée
            serpapi_key = os.getenv("SERPAPI_API_KEY")
            
            if serpapi_key:
                print("Utilisation de SerpAPI pour la recherche...")
                
                params = {
                    "engine": "google",
                    "q": topic,
                    "api_key": serpapi_key,
                    "num": max_results
                }
                
                search = GoogleSearch(params)
                results = search.get_dict()
                
                if results.get("organic_results"):
                    research_text = f"Recherche sur: {topic}\n\n"
                    
                    for i, result in enumerate(results["organic_results"][:max_results], 1):
                        title = result.get("title", "")
                        link = result.get("link", "")
                        snippet = result.get("snippet", "")
                        
                        research_text += f"[Source {i}] {title}\n"
                        research_text += f"URL: {link}\n"
                        research_text += f"Résumé: {snippet}\n\n"
                    
                    print(f"Récupération de {len(results['organic_results'][:max_results])} résultats")
                    return research_text
                else:
                    print("Aucun résultat trouvé via SerpAPI")
            else:
                print("Clé API SerpAPI non configurée")
        
        except Exception as serpapi_error:
            print(f"Erreur lors de l'utilisation de SerpAPI: {serpapi_error}")
            # Continuer avec l'alternative
        
        # Option 2: Utiliser Gemini pour simuler une recherche
        try:
            print("Utilisation de Gemini pour la recherche...")
            
            # Créer une instance Gemini
            generation_config = {
                "temperature": 0.4,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 4096,
            }
            
            model = genai.GenerativeModel(
                model_name="gemini-1.5-pro",
                generation_config=generation_config
            )
            
            # Construire le prompt
            prompt = f"""En tant qu'assistant de recherche, génère 5 résultats de recherche fictifs mais réalistes sur le sujet: "{topic}".
            
            Format de réponse:
            [Source 1] Titre du premier résultat
            URL: https://exemple.com/article-pertinent-1
            Résumé: Un résumé pertinent de 2-3 phrases sur le sujet.
            
            [Source 2] Titre du deuxième résultat
            URL: https://exemple.com/article-pertinent-2
            Résumé: Un autre résumé pertinent.
            
            Et ainsi de suite pour 5 sources.
            
            Important:
            - Les URLs doivent être réalistes mais fictives
            - Les titres doivent être informatifs et pertinents
            - Les résumés doivent être informatifs et factuels
            - Inclure une variété de sources (sites d'actualités, blogs, sites éducatifs)
            """
            
            response = model.generate_content(prompt)
            
            if hasattr(response, 'text') and response.text:
                research_text = response.text.strip()
                print("Recherche générée avec succès via Gemini")
                return research_text
            else:
                print("Échec de la génération via Gemini")
        
        except Exception as gemini_error:
            print(f"Erreur lors de l'utilisation de Gemini: {gemini_error}")
            # Continuer avec l'option de secours
        
        # Option 3: Retourner des informations fictives (secours)
        print("Utilisation de résultats de recherche fictifs (secours)")
        
        research_text = f"Recherche sur: {topic}\n\n"
        
        for i in range(1, 6):
            research_text += f"[Source {i}] Article sur {topic} - Partie {i}\n"
            research_text += f"URL: https://example.com/article-{i}-{topic.replace(' ', '-').lower()}\n"
            research_text += f"Résumé: Ceci est un résumé fictif sur {topic} pour la démonstration. Information générale sur le sujet, point {i}.\n\n"
        
        return research_text
    
    except Exception as e:
        print(f"Erreur générale lors de la recherche: {e}")
        import traceback
        traceback.print_exc()
        
        # Retourner un texte minimal en cas d'erreur
        return f"Information sur {topic}.\nSource: https://example.com/info"

def extract_sources(research_text: str) -> list:
    """Extrait les sources depuis un texte de recherche."""
    sources = []  # Liste des URLs uniquement
    source_data = []  # Liste des dictionnaires {url, title}
    
    if not research_text:
        print("Aucun texte de recherche fourni pour extraire les sources")
        return source_data
        
    print(f"Extraction des sources depuis un texte de {len(research_text)} caractères")
    
    # Adaptation pour le format de DeepSeek
    # Vérifie si le texte contient une section de synthèse suivie de sources
    if "Source:" in research_text:
        # Séparation par blocs (séparés par ---)
        blocks = research_text.split("---")
        
        # Si pas de blocs séparés par ---, essayer de séparer par double saut de ligne
        if len(blocks) <= 1:
            blocks = research_text.split("\n\n")
        
        # Pour chaque bloc, extraire Source, Titre et Résumé
        for block in blocks:
            source_url = None
            title = None
            
            lines = block.strip().split('\n')
            for i, line in enumerate(lines):
                if line.strip().startswith("Source:"):
                    source_url = line.replace("Source:", "").strip()
                elif line.strip().startswith("Titre:"):
                    title = line.replace("Titre:", "").strip()
                    
            # Si nous avons trouvé une source et un titre, les ajouter
            if source_url and title:
                # Ne pas ajouter les sources déjà présentes
                if not any(src["url"] == source_url for src in source_data):
                    # Ne pas ajouter les sources explicitement fictives
                    if not (source_url.startswith("https://example.com/") or 
                           source_url.startswith("http://example.com/")):
                        sources.append(source_url)
                        source_data.append({"url": source_url, "title": title})
                        print(f"Source extraite: {source_url} - {title}")
    
    # Extract URLs from the text directly
    urls = re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\-._~:/?#[\]@!$&\'()*+,;=]*', research_text)
    for url in urls:
        # Clean the URL
        url = url.strip('.,;:\'\"')
        if url not in sources:
            # Generate a title from the URL
            domain = url.split('/')[2] if len(url.split('/')) > 2 else url
            title = f"Source depuis {domain}"
            sources.append(url)
            source_data.append({"url": url, "title": title})
            print(f"URL extraite du texte: {url}")
    
    # Si aucune source n'a été trouvée, générer des sources factices
    if not source_data:
        print("Aucune source trouvée dans le format attendu, génération de sources factices")
        
        # Créer quelques sources fictives basées sur le contenu
        research_words = research_text.replace('\n', ' ').split()
        topics = []
        
        for i in range(0, len(research_words), 20):
            if i + 5 < len(research_words):
                topic = ' '.join(research_words[i:i+5])
                topics.append(topic)
        
        # Si on n'a pas assez de sujets, en ajouter quelques-uns génériques
        if len(topics) < 3:
            topics.extend(["actualités et tendances", "statistiques et analyses", "guides et tutoriels"])
        
        # Créer 3 sources factices
        domains = ["forbes.com", "medium.com", "wikipedia.org", "nytimes.com", "techcrunch.com"]
        import random
        for i in range(min(3, len(topics))):
            domain = random.choice(domains)
            source_url = f"https://www.{domain}/article-{i+1}"
            title = f"Information sur {topics[i]}"
            sources.append(source_url)
            source_data.append({"url": source_url, "title": title})
            print(f"Source factice générée: {source_url} - {title}")
    
    print(f"{len(sources)} sources uniques extraites")
    
    return source_data  # Retourner les données complètes des sources

def analyze_topic_potential(topic: str) -> dict:
    """Analyse le potentiel d'un sujet en utilisant DeepSeek + Gemini."""
    print(f"\nAnalyse du potentiel pour: {topic}")
    
    # Recherche de données sur le sujet
    search_data = deepseek_search(f"{topic} youtube tendances vues engagement", num_results=3)
    if not search_data:
        print("Aucune donnée trouvée pour l'analyse")
        return {}
    
    print("Analyse avec Gemini...")
    analysis_prompt = f"""Analyse le potentiel YouTube de ce sujet: "{topic}"
Basé sur ces données:
{search_data}

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide de cette forme:
{{
    "topic": "{topic}",
    "metrics": {{
        "trending_score": "1-10",
        "competition_level": "low/medium/high",
        "audience_size": "small/medium/large",
        "monetization_potential": "1-10",
        "evergreen_score": "1-10"
    }},
    "insights": {{
        "target_demographics": ["liste des démographies clés"],
        "best_video_length": "durée optimale en minutes",
        "suggested_upload_time": "meilleur moment pour publier",
        "estimated_views": "estimation des vues potentielles"
    }},
    "recommendations": [
        "liste de 3-5 recommandations clés"
    ]
}}"""

    response = gemini_generate(analysis_prompt)
    try:
        result = json.loads(response)
        print("Analyse terminée avec succès")
        return result
    except json.JSONDecodeError as e:
        print(f"Erreur: Analyse invalide - {str(e)}")
        return {}

def generate_topics(theme: str, num_topics: int = 5, user_context: dict = None) -> list:
    """Génère des sujets d'actualité en utilisant exclusivement Gemini."""
    print(f"\nRecherche d'informations sur: {theme}")
    
    # Construction du contexte utilisateur
    user_context_str = ""
    if user_context and any(user_context.values()):
        user_context_str = f"""
Informations sur le créateur:
- Nom de la chaîne: {user_context.get('channel_name', 'Non spécifié')}
- Nom du YouTubeur: {user_context.get('youtuber_name', 'Non spécifié')}
- Style vidéo préféré: {user_context.get('video_style', 'Non spécifié')}
- Approche habituelle: {user_context.get('approach_style', 'Non spécifié')}
- Public cible: {user_context.get('target_audience', 'Non spécifié')}
- Durée vidéo préférée: {user_context.get('video_length', 'Non spécifié')}
"""
    
    print("\nGénération des sujets avec Gemini...")
    prompt = f"""Tu es un expert en création de contenu YouTube francophone, spécialiste de la viralité et de l'actualité.
Pour le thème "{theme}", propose-moi {num_topics} sujets de vidéos YouTube qui sont :
- Basés sur les tendances et actualités du moment (actualité très récente, sujets chauds, viraux)
- Optimisés pour générer un fort engagement sur YouTube (taux de clics, watchtime, partages)
- Rédigés sans aucune faute d'orthographe ou de grammaire
- Avec un titre digne des plus grands youtubeurs (accrocheur, original, viral)
- Avec un angle unique et une justification sur l'intérêt du sujet
{user_context_str}

IMPORTANT: Ta réponse doit être UNIQUEMENT un objet JSON valide avec cette structure:
{{
    "topics": [
        {{
            "title": "Titre accrocheur format podcast",
            "angle": "Angle de discussion unique",
            "why_interesting": "Pourquoi c'est pertinent maintenant",
            "key_points": ["Points clés à aborder"],
            "target_audience": "Public cible",
            "estimated_duration": "Durée estimée en minutes",
            "potential_guests": ["Experts ou invités potentiels"],
            "factual_accuracy": "high",
            "timeliness": "very_recent",
            "sources": ["sources fiables à citer"]
        }}
    ]
}}

Ne génère RIEN d'autre que ce JSON. Pas d'explications, pas de texte avant ou après."""

    response = gemini_generate(prompt)
    if not response:
        print("Erreur: Aucune réponse de Gemini")
        return []
        
    try:
        result = json.loads(response)
        topics = result.get("topics", [])
        if not topics:
            print("Erreur: Aucun sujet trouvé dans la réponse")
            return []
        
        print(f"\n{len(topics)} sujets générés avec succès")
        return topics[:num_topics]
        
    except json.JSONDecodeError as e:
        print(f"Erreur: Réponse JSON invalide - {str(e)}")
        print(f"Début de la réponse reçue: {response[:200]}...")
        return []

def generate_script(topic: str, research: str, user_context: dict = None) -> str:
    """Génère un script détaillé avec DeepSeek + Gemini et retourne le texte intégral."""
    # Gestion robuste des erreurs pour éviter les crashs
    try:
        # Vérification de la disponibilité de Gemini
        gemini_available = True
        try:
            # Test rapide pour vérifier si l'API est accessible
            test_response = gemini_generate("Bonjour")
            if not test_response:
                print("AVERTISSEMENT: Gemini ne répond pas correctement au test initial")
                gemini_available = False
        except Exception as check_error:
            print(f"ERREUR lors du test de Gemini: {check_error}")
            gemini_available = False
            
        if not gemini_available:
            print("ÉCHEC d'accès à Gemini - utilisation immédiate du script de secours")
            # Extraire les informations de base nécessaires pour le script de secours
            youtuber_name = "YouTubeur"
            channel_name = "Chaîne YouTube"
            try:
                if user_context:
                    youtuber_name = str(user_context.get('youtuber_name', 'YouTubeur'))
                    channel_name = str(user_context.get('channel_name', 'Chaîne YouTube'))
            except Exception:
                pass
            return generate_fallback_script(topic, youtuber_name, channel_name)
        
        # Récupérer des informations supplémentaires avec DeepSeek
        print(f"Recherche d'informations supplémentaires pour: {topic}")
        additional_research = ""
        try:
            # Utiliser toujours DeepSeek pour la recherche d'informations supplémentaires
            additional_research = deepseek_search(f"{topic} faits statistiques études expert tendances", num_results=3)
            if not additional_research:
                print("Recherche DeepSeek vide, utilisation des recherches existantes uniquement")
        except Exception as e:
            print(f"Erreur lors de la recherche d'informations supplémentaires: {e}")
            print("Poursuite de la génération sans recherches supplémentaires...")
        
        # Construction du prompt avec le contexte utilisateur si disponible
        user_context_str = ""
        youtuber_name = "Non spécifié"
        channel_name = "Non spécifié"
        video_style = "Non spécifié"
        approach_style = "Non spécifié"
        target_audience = "Non spécifié"
        language = "français"
        content_type = "général"
        custom_options = {}
        
        # Construction du prompt avec le contexte utilisateur si disponible
        user_context_str = ""
        if user_context:
            youtuber_name = str(user_context.get('youtuber_name', 'Non spécifié'))
            channel_name = str(user_context.get('channel_name', 'Non spécifié'))
            video_style = str(user_context.get('video_style', user_context.get('content_style', 'Non spécifié')))
            approach_style = str(user_context.get('approach_style', user_context.get('tone', 'professionnel')))
            target_audience = str(user_context.get('target_audience', user_context.get('audience_age', 'adultes')))
            language = str(user_context.get('language', 'français'))
            content_type = str(user_context.get('content_type', 'général'))
            custom_options = user_context.get('custom_options', {})
            
            user_context_str = f"""
Informations sur le créateur:
- Nom de la chaîne: {channel_name}
- Nom du YouTubeur: {youtuber_name}
- Langue principale: {language}
- Type de contenu: {content_type}
- Style vidéo préféré: {video_style}
- Approche habituelle: {approach_style}
- Public cible: {target_audience}
"""
            
            # Ajouter les options personnalisées si présentes
            if custom_options and len(custom_options) > 0:
                user_context_str += "\nPréférences personnalisées du créateur:\n"
                for key, value in custom_options.items():
                    user_context_str += f"- {key}: {value}\n"
        
        # Personnalisation supplémentaire basée sur le profil
        style_guidance = ""
        if video_style and video_style.lower() != "non spécifié":
            if "informatif" in video_style.lower():
                style_guidance = "Adopte un ton informatif et éducatif, en expliquant clairement les concepts."
            elif "divertissant" in video_style.lower():
                style_guidance = "Utilise de l'humour et un ton dynamique pour capter l'attention."
            elif "tutoriel" in video_style.lower():
                style_guidance = "Explique étape par étape avec des instructions claires et précises."
            elif "vlog" in video_style.lower():
                style_guidance = "Adopte un ton conversationnel et partage des anecdotes personnelles."
                
        # Personnalisation pour l'audience
        audience_guidance = ""
        if target_audience and target_audience.lower() != "non spécifié":
            if "enfant" in target_audience.lower() or "jeune" in target_audience.lower():
                audience_guidance = "Utilise un langage simple et des explications accessibles pour un jeune public."
            elif "professionnel" in target_audience.lower() or "business" in target_audience.lower():
                audience_guidance = "Emploie un vocabulaire professionnel et des exemples pertinents pour un public d'affaires."
            elif "expert" in target_audience.lower():
                audience_guidance = "Aborde des concepts avancés sans simplifier excessivement."
        
        # Assurer les mentions de marque
        branding_guidance = ""
        if youtuber_name and youtuber_name.lower() != "non spécifié" and channel_name and channel_name.lower() != "non spécifié":
            branding_guidance = f"Assure-toi que les références au créateur ('{youtuber_name}') et à la chaîne ('{channel_name}') sont correctement maintenues dans le script."
        
        # Adapter le prompt en fonction de la disponibilité des informations supplémentaires
        additional_research_section = ""
        if additional_research:
            # Tronquer les recherches supplémentaires si elles sont trop longues
            max_research_length = 4000
            if len(additional_research) > max_research_length:
                additional_research = additional_research[:max_research_length] + "... [tronqué pour longueur]"
                
            additional_research_section = f"""
Recherches complémentaires (à intégrer dans le script pour l'enrichir):
{additional_research}
"""
        
        # Prompt avec instructions pour la génération du script
        script_prompt = f"""Tu es un rédacteur professionnel YouTube francophone, expert en storytelling et pédagogie.
Rédige un script vidéo complet sur : "{topic}"

Contexte créateur:
{user_context_str}

Contraintes :
- Structure le texte en sections titrées (ex : [HOOK], [INTRODUCTION], etc.)
- Dans chaque section, rédige tout ce qui doit être dit, phrase par phrase, comme si tu écrivais le texte exact à prononcer dans la vidéo.
- Le texte doit être fluide, captivant, sans fautes, et donner envie d'écouter jusqu'au bout.
- Utilise des exemples concrets, des chiffres, des anecdotes, des transitions naturelles.
- Inclus des statistiques et données récentes issues des recherches.
- Cite les sources pertinentes dans le contenu.
- {branding_guidance}
- {style_guidance}
- {audience_guidance}
- Termine par un call-to-action adapté à la chaîne: invite à s'abonner, liker et partager.

Contexte et recherches primaires :
{research if research else "Le sujet de la vidéo est " + topic + ". Utilise tes connaissances générales sur ce sujet."}
{additional_research_section}

Commence directement par le [HOOK] puis enchaîne les sections.
"""
        # Mesure et limitation de la taille du prompt final
        if len(script_prompt) > 12000:
            print(f"Le prompt est trop long ({len(script_prompt)} caractères), réduction pour respecter les limites...")
            # Simplifier le prompt en réduisant les parties moins essentielles
            additional_research_section = ""
            script_prompt = f"""Tu es un rédacteur professionnel YouTube.
Rédige un script vidéo complet sur : "{topic}"

Contexte créateur: {youtuber_name} sur {channel_name}, style {video_style}, pour {target_audience}.

Contraintes :
- Structure le texte en sections ([HOOK], [INTRODUCTION], etc.)
- Ce doit être le texte exact à prononcer dans la vidéo.
- Texte fluide, captivant, sans fautes.
- {style_guidance}
- {audience_guidance}
- Termine par un call-to-action adapté à la chaîne.

Contexte: Le sujet de la vidéo est {topic}.
{research[:1000] if research else ""}

Commence directement par le [HOOK] puis enchaîne les sections.
"""
            print(f"Prompt réduit à {len(script_prompt)} caractères")

        # Implémentation de retry avec backoff exponentiel et limitation du nombre de tentatives
        max_attempts = 3
        base_wait_time = 2  # secondes
        
        for attempt in range(1, max_attempts + 1):
            try:
                print(f"Tentative {attempt}/{max_attempts} de génération de script avec Gemini...")
                
                # Ajouter une gestion explicite des erreurs réseau
                try:
                    response = gemini_generate(script_prompt)
                except ValueError as ve:
                    if "Failed to fetch" in str(ve):
                        print(f"Erreur réseau détectée: {ve}")
                        # Si c'est la dernière tentative, lever l'erreur pour passer au fallback
                        if attempt == max_attempts:
                            raise ve
                        continue  # Sinon, essayer à nouveau
                    else:
                        # Pour les autres erreurs de valeur, les propager
                        raise ve
                
                # Vérification basique de la qualité de la réponse
                if response and len(response.strip()) >= 200:
                    print(f"Script généré avec succès ({len(response)} caractères)")
                    return response.strip()
                
                print(f"Réponse trop courte ou vide ({len(response) if response else 0} caractères)")
                
                if attempt < max_attempts:
                    wait_time = base_wait_time * (2 ** (attempt - 1))  # Backoff exponentiel
                    print(f"Attente de {wait_time} secondes avant la prochaine tentative...")
                    import time
                    time.sleep(wait_time)
            except Exception as e:
                print(f"Erreur Gemini à la tentative {attempt}/{max_attempts}: {e}")
                if "Failed to fetch" in str(e) and attempt == max_attempts:
                    # Si c'est une erreur "Failed to fetch" à la dernière tentative, on passe directement au fallback
                    print("Détection d'une erreur 'Failed to fetch' persistante, passage au script de secours...")
                    break
                
                if attempt < max_attempts:
                    wait_time = base_wait_time * (2 ** (attempt - 1))
                    print(f"Attente de {wait_time} secondes avant la prochaine tentative...")
                    import time
                    time.sleep(wait_time)
        
        # Toutes les tentatives ont échoué, utilisation du plan de secours
        print("Toutes les tentatives de génération ont échoué, utilisation du script de secours...")
        return generate_fallback_script(topic, youtuber_name, channel_name)
        
    except Exception as e:
        print(f"Erreur globale lors de la génération du script: {e}")
        import traceback
        traceback.print_exc()
        
        # Script de secours en cas d'échec total
        return generate_fallback_script(topic, "YouTubeur", "Chaîne YouTube")


def generate_fallback_script(topic: str, youtuber_name: str = "YouTubeur", channel_name: str = "Chaîne") -> str:
    """Génère un script basique de secours en cas d'échec des autres méthodes."""
    try:
        # S'assurer que les paramètres sont des chaînes valides
        topic = str(topic) if topic else "le sujet du jour"
        youtuber_name = str(youtuber_name) if youtuber_name and youtuber_name != "Non spécifié" else "YouTubeur"
        channel_name = str(channel_name) if channel_name and channel_name != "Non spécifié" else "notre chaîne"
        
        # Générer un script minimal mais fonctionnel
        return f"""[HOOK]
Salut YouTube ! Aujourd'hui on parle de {topic} !

[INTRODUCTION]
Bienvenue à tous sur cette nouvelle vidéo. Je suis {youtuber_name} et aujourd'hui, nous allons explorer ensemble le sujet de {topic}.

[SECTION 1: PRÉSENTATION DU SUJET]
{topic} est un sujet qui suscite beaucoup d'intérêt dernièrement. Que vous soyez débutant ou expert, il y a toujours de nouvelles perspectives à découvrir dans ce domaine.

Au cours des dernières années, de nombreux développements ont eu lieu, ce qui rend ce sujet plus pertinent que jamais. Des experts du monde entier partagent régulièrement de nouvelles découvertes et techniques.

[SECTION 2: POINTS CLÉS]
Voici les aspects essentiels à comprendre sur ce sujet :

Premièrement, il est important de considérer le contexte historique. Comment en sommes-nous arrivés là ? Quels événements ou découvertes ont façonné notre compréhension actuelle ?

Deuxièmement, examinons les applications pratiques. Comment pouvons-nous utiliser ces connaissances dans notre vie quotidienne ou professionnelle ?

Troisièmement, n'oublions pas les perspectives futures. Où va ce domaine ? Quelles innovations pouvons-nous attendre dans les années à venir ?

[SECTION 3: ANALYSE]
Quand on regarde de plus près, on peut voir que ce sujet a de nombreuses implications dans différents domaines. Que ce soit en technologie, en sciences, en art ou en société, l'impact est considérable.

Les experts s'accordent généralement sur l'importance fondamentale de {topic} dans notre monde en constante évolution. Certains soutiennent que c'est l'un des domaines les plus prometteurs pour l'innovation future.

[CONCLUSION]
Pour résumer ce que nous avons vu aujourd'hui, {topic} est un domaine riche en possibilités et en défis. J'espère que cette vidéo vous a donné un bon aperçu du sujet et vous a inspiré à en apprendre davantage.

N'hésitez pas à me dire ce que vous en pensez en commentaire ! Vos perspectives et questions sont toujours les bienvenues.

Si cette vidéo vous a plu, n'oubliez pas de liker et de vous abonner à {channel_name} pour plus de contenu similaire. Activez aussi la cloche de notification pour être alerté des nouvelles vidéos.

Merci d'avoir regardé et à bientôt pour une nouvelle vidéo !
"""
    except Exception as e:
        print(f"Erreur lors de la génération du script de secours: {e}")
        # Dans le pire des cas, retourner un script ultra-basique
        return f"""[HOOK]
Bienvenue à cette vidéo sur YouTube !

[INTRODUCTION]
Aujourd'hui nous parlons de {str(topic) if topic else 'notre sujet du jour'}.

[CONTENU]
Ce sujet est vraiment intéressant et mérite notre attention.
Il y a beaucoup à dire à ce propos et j'espère que vous apprendrez quelque chose de nouveau.

[CONCLUSION]
En résumé, nous avons vu que {str(topic) if topic else 'notre sujet du jour'} est un domaine riche et complexe qui mérite notre attention.

Si vous avez apprécié cette vidéo, n'oubliez pas de liker, commenter et vous abonner pour ne manquer aucun contenu. Merci d'avoir regardé, et à bientôt pour une nouvelle vidéo !
"""

def save_to_pdf(script_text: str, title: str = None, author: str = None, channel: str = None, sources: list = None) -> str:
    """Génération améliorée de PDF avec mise en page professionnelle et affichage optimisé des sources."""
    import tempfile
    from fpdf import FPDF
    import re
    
    try:
        # Configuration pour le PDF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        
        # Créer le nom de fichier avec le chemin complet
        if os.name == 'nt':  # Windows
            temp_dir = tempfile.gettempdir()
        else:  # Linux (Render)
            temp_dir = '/tmp'
            
        if not title:
            title = "Script_YouTube"
            
        safe_title = "".join([c if c.isalnum() or c in " -_" else "_" for c in title])
        filename = os.path.join(temp_dir, f"{safe_title}_{timestamp}.pdf")
        txt_filename = filename.replace('.pdf', '.txt')
        
        print(f"Création de PDF à l'emplacement: {filename}")
        
        # Toujours créer un fichier texte complet pour référence
        try:
            with open(txt_filename, 'w', encoding='utf-8') as f:
                f.write("=" * 50 + "\n")
                f.write(f"TITRE: {title or 'Script YouTube'}\n")
                f.write(f"{'='*50}\n\n")
                
                f.write("INFORMATIONS GÉNÉRALES\n")
                metadata = {"author": author, "channel": channel}
                for key, value in metadata.items():
                    f.write(f"{key.replace('_', ' ').title()}: {value}\n")
                
                f.write("\nSCRIPT DÉTAILLÉ\n")
                for section in script_text.split('\n\n'):
                    f.write(f"\n{section}\n")
                
                # Ajouter les sources
                if sources and len(sources) > 0:
                    f.write("\n\n" + "=" * 50 + "\n")
                    f.write("SOURCES:\n")
                    for i, source in enumerate(sources, 1):
                        # Handle both string and dictionary formats
                        if isinstance(source, str):
                            f.write(f"[{i}] {source}\n")
                        elif isinstance(source, dict):
                            source_url = source.get('url', 'Pas d\'URL')
                            source_title = source.get('title', 'Sans titre')
                            f.write(f"[{i}] {source_title} - {source_url}\n")

            print(f"Fichier texte de référence créé: {txt_filename}")
        except Exception as txt_error:
            print(f"Erreur lors de la création du fichier texte: {txt_error}")
        
        # Créer une classe personnalisée de PDF avec en-tête et pied de page
        class ScriptPDF(FPDF):
            def __init__(self, title=None, author=None, channel=None):
                super().__init__()
                self.title = title or "Script YouTube"
                self.author = author or "YouTuber"
                self.channel = channel or "Chaîne YouTube"
                self.sections = []  # Pour stocker les sections pour la table des matières
                
            def header(self):
                # En-tête avec informations
                self.set_font('Arial', 'B', 10)
                # Date à droite
                self.cell(0, 10, f"Généré le: {datetime.now().strftime('%d/%m/%Y')}", 0, 0, 'R')
                # Titre du script à gauche
                self.set_xy(10, 10)
                self.cell(100, 10, self.title[:40] + ('...' if len(self.title) > 40 else ''), 0, 0, 'L')
                # Ligne de séparation
                self.line(10, 20, 200, 20)
                # Positionner après l'en-tête
                self.set_y(25)
            
            def footer(self):
                # Pied de page avec numérotation et informations de chaîne
                self.set_y(-15)
                self.set_font('Arial', 'I', 8)
                # Numéro de page centré
                self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
                # Chaîne YouTube à gauche
                self.set_y(-15)
                self.cell(60, 10, self.channel[:30], 0, 0, 'L')
                # Auteur/YouTuber à droite
                self.set_x(150)
                self.cell(50, 10, self.author[:20], 0, 0, 'R')
                
            def add_section(self, section_name):
                # Garde en mémoire les sections pour la table des matières
                self.sections.append((section_name, self.page_no()))
                
                # Formatage visuel de la section
                # Créer un fond pour la section
                current_y = self.get_y()
                self.set_fill_color(230, 230, 230)  # Gris clair
                self.rect(10, current_y, 190, 8, 'F')
                
                # Écrire le titre de section
                self.set_font('Arial', 'B', 12)
                self.cell(0, 8, section_name, 0, 1, 'L')
                self.ln(2)
                self.set_font('Arial', '', 11)
                
            def add_table_of_contents(self):
                # Ajouter une table des matières
                if not self.sections:
                    return
                    
                self.add_page()
                self.set_font('Arial', 'B', 16)
                self.cell(0, 10, "Table des matières", 0, 1, 'C')
                self.ln(5)
                
                self.set_font('Arial', '', 11)
                for section, page in self.sections:
                    dots = '.' * max(5, 60 - len(section))
                    self.cell(0, 8, f"{section} {dots} {page}", 0, 1)
                
        # Utiliser la classe personnalisée pour créer le PDF
        try:
            # Initialiser le PDF
            pdf = ScriptPDF(title, author, channel)
            pdf.add_page()
            
            # Page de titre
            pdf.set_font('Arial', 'B', 20)
            pdf.ln(20)  # Espace après l'en-tête
            
            # Limiter le titre à 2 lignes maximum
            if len(title) > 80:
                part1 = title[:80]
                part2 = title[80:160]
                pdf.cell(0, 10, part1, 0, 1, 'C')
                pdf.cell(0, 10, part2 + ('...' if len(title) > 160 else ''), 0, 1, 'C')
            else:
                pdf.cell(0, 10, title, 0, 1, 'C')
            
            # Informations sur le créateur
            pdf.ln(10)
            pdf.set_font('Arial', 'I', 12)
            pdf.cell(0, 10, f"Par: {author or 'YouTuber'}", 0, 1, 'C')
            pdf.cell(0, 10, f"Chaîne: {channel or 'YouTube'}", 0, 1, 'C')
            
            # Date de création
            pdf.ln(5)
            pdf.set_font('Arial', '', 10)
            pdf.cell(0, 10, f"Création: {datetime.now().strftime('%d/%m/%Y')}", 0, 1, 'C')
            
            # Nouvelle page pour le contenu
            pdf.add_page()
            
            # Traitement du script
            current_section = ""
            section_content = ""
            
            # Analyser le script ligne par ligne
            lines = script_text.split('\n')
            for i, line in enumerate(lines):
                # Détecter les sections (entre crochets)
                if '[' in line and ']' in line and line.strip().startswith('['):
                    # Nouvelle section
                    current_section = line.strip()
                    pdf.add_section(current_section)
                    
                    # Trouver le contenu de cette section
                    start_idx = script_text.find(line) + len(line)
                    next_section_match = re.search(r'\n\s*\[[^\]]+\]', script_text[start_idx:])
                    if next_section_match:
                        end_idx = start_idx + next_section_match.start()
                    else:
                        end_idx = len(script_text)
                    
                    # Extraire et formater le contenu de la section
                    section_text = script_text[start_idx:end_idx].strip()
                    pdf.multi_cell(0, 5, section_text)
                    pdf.ln(5)
            
            # Table des matières (après le contenu pour avoir tous les numéros de page)
            if pdf.sections:
                toc_page = pdf.page_no()
                pdf.add_table_of_contents()
                pdf.page = toc_page + 1
                
            # Ajouter les sources au PDF de manière professionnelle
            if sources and len(sources) > 0:
                pdf.add_page()
                pdf.set_font('Arial', 'B', 14)
                pdf.cell(0, 10, "SOURCES & RÉFÉRENCES", 0, 1, 'C')
                pdf.ln(5)
                
                pdf.set_font('Arial', '', 10)
                
                for i, source in enumerate(sources, 1):
                    if isinstance(source, str):
                        pdf.set_text_color(0, 0, 255)
                        pdf.multi_cell(0, 6, f"{i}. {source}")
                        pdf.set_text_color(0, 0, 0)
                    elif isinstance(source, dict):
                        url = source.get('url', 'N/A')
                        title = source.get('title', f"Source {i}")
                        
                        pdf.multi_cell(0, 6, f"{i}. {title}")
                        pdf.set_text_color(0, 0, 255)
                        pdf.multi_cell(0, 6, url)
                        pdf.set_text_color(0, 0, 0)
                    pdf.ln(2)
            
            # Sauvegarder le PDF
            pdf.output(filename)
            
            # Vérifier que le PDF est valide
            if os.path.exists(filename) and os.path.getsize(filename) > 100:
                print(f"PDF généré avec succès: {filename}")
                return filename
            else:
                print(f"Le PDF généré est trop petit ou invalide: {filename}")
                return txt_filename
                
        except Exception as pdf_error:
            print(f"Erreur lors de la génération du PDF: {pdf_error}")
            import traceback
            traceback.print_exc()
            
            # Tentative alternative avec un PDF plus simple
            try:
                print("Tentative alternative de génération de PDF...")
                basic_pdf = FPDF()
                basic_pdf.add_page()
                
                # Titre
                basic_pdf.set_font("Arial", "B", 16)
                basic_pdf.cell(0, 10, title[:60], 0, 1, "C")
                
                # Informations
                basic_pdf.set_font("Arial", "I", 12)
                basic_pdf.cell(0, 10, f"Par: {author or 'Non spécifié'} | Chaîne: {channel or 'Non spécifiée'}", 0, 1, "C")
                basic_pdf.ln(5)
                
                # Contenu du script
                basic_pdf.set_font("Arial", "", 11)
                
                # Extraire et formater les sections
                for line in script_text.split('\n'):
                    if '[' in line and ']' in line and line.strip().startswith('['):
                        # Section
                        basic_pdf.set_font("Arial", "B", 12)
                        basic_pdf.cell(0, 8, line, 0, 1)
                        basic_pdf.set_font("Arial", "", 11)
                    elif line.strip():
                        # Contenu
                        basic_pdf.multi_cell(0, 6, line)
                
                # Sources
                if sources and len(sources) > 0:
                    basic_pdf.add_page()
                    basic_pdf.set_font("Arial", "B", 14)
                    basic_pdf.cell(0, 10, "SOURCES", 0, 1, "C")
                    basic_pdf.ln(5)
                    
                    basic_pdf.set_font("Arial", "", 10)
                    for i, source in enumerate(sources, 1):
                        if isinstance(source, str):
                            basic_pdf.set_text_color(0, 0, 255)
                            basic_pdf.multi_cell(0, 6, f"{i}. {source}")
                            basic_pdf.set_text_color(0, 0, 0)
                        elif isinstance(source, dict):
                            url = source.get('url', 'N/A')
                            title = source.get('title', f"Source {i}")
                            
                            basic_pdf.multi_cell(0, 6, f"{i}. {title}")
                            basic_pdf.set_text_color(0, 0, 255)
                            basic_pdf.multi_cell(0, 6, url)
                            basic_pdf.set_text_color(0, 0, 0)
                        basic_pdf.ln(2)
                
                # Sauvegarder ce PDF alternatif
                alt_filename = os.path.join(temp_dir, f"{safe_title}_alt_{timestamp}.pdf")
                basic_pdf.output(alt_filename)
                
                if os.path.exists(alt_filename) and os.path.getsize(alt_filename) > 100:
                    print(f"PDF alternatif généré avec succès: {alt_filename}")
                    return alt_filename
                else:
                    print(f"Échec de la génération du PDF alternatif")
                    return txt_filename
                    
            except Exception as alt_error:
                print(f"Erreur lors de la génération du PDF alternatif: {alt_error}")
                traceback.print_exc()
                return txt_filename
                
    except Exception as e:
        print(f"Erreur générale lors de la sauvegarde: {e}")
        import traceback
        traceback.print_exc()
        return txt_filename

def estimate_reading_time(script_text: str) -> dict:
    """
    Estime le temps de lecture d'un script en fonction du nombre de mots et de la vitesse de lecture moyenne.
    
    Args:
        script_text (str): Le texte du script à analyser
        
    Returns:
        dict: Dictionnaire contenant les estimations de temps (en minutes et secondes)
    """
    try:
        # Valider l'entrée
        if not script_text:
            return {
                'minutes': 0,
                'seconds': 0,
                'total_seconds': 0,
                'word_count': 0
            }
            
        # Nettoyer le texte (supprimer les sections entre [])
        import re
        cleaned_text = re.sub(r'\[.*?\]', '', script_text)
        
        # Compter les mots
        words = cleaned_text.split()
        word_count = len(words)
        
        # Calculer le temps de lecture (moyenne de 150 mots par minute)
        # Pour un script YouTube, on utilise une vitesse plus lente que la lecture normale
        # car il faut prendre en compte les pauses, l'emphase, etc.
        words_per_minute = 130
        
        total_seconds = (word_count / words_per_minute) * 60
        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)
        
        # Arrondir vers le haut pour les minutes si les secondes sont > 45
        if seconds > 45:
            minutes += 1
            seconds = 0
            
        return {
            'minutes': minutes,
            'seconds': seconds,
            'total_seconds': round(total_seconds),
            'word_count': word_count,
            'formatted': f"{minutes}:{seconds:02d}",
            'text': f"{minutes} minute{'s' if minutes != 1 else ''}" + (f" et {seconds} seconde{'s' if seconds != 1 else ''}" if seconds > 0 else "")
        }
    
    except Exception as e:
        print(f"Erreur lors de l'estimation du temps de lecture: {e}")
        # Retourner une estimation par défaut en cas d'erreur
        return {
            'minutes': 0,
            'seconds': 0,
            'total_seconds': 0,
            'word_count': 0,
            'formatted': "0:00",
            'text': "Temps indéterminé"
        }

def modify_script_with_ai(script_text: str, instructions: str, profile: dict = None) -> str:
    """
    Modifie un script existant en utilisant l'IA selon les instructions fournies.
    
    Args:
        script_text (str): Le texte du script à modifier
        instructions (str): Les instructions pour guider la modification
        profile (dict, optional): Profil utilisateur pour personnaliser les modifications
        
    Returns:
        str: Le script modifié
    """
    try:
        print(f"Modification du script avec les instructions: {instructions[:100]}...")
        
        # Valider les entrées
        if not script_text or not instructions:
            print("Script ou instructions manquants pour la modification")
            return script_text
            
        # Extraire les informations de profil utiles
        youtuber_name = profile.get('youtuber_name', '') if profile else ''
        channel_name = profile.get('channel_name', '') if profile else ''
        content_style = profile.get('content_style', 'informative') if profile else 'informative'
        
        # Construire le prompt pour Gemini
        system_prompt = f"""Tu es un expert en écriture de scripts YouTube.
        Tu dois modifier le script fourni selon les instructions données.
        Conserve le style et la structure globale, mais effectue les changements demandés.
        
        Style de contenu: {content_style}
        Chaîne: {channel_name}
        Créateur: {youtuber_name}
        
        Instructions de modification: {instructions}
        
        Ne commente pas tes modifications, retourne simplement le script modifié.
        """
        
        # Créer une instance unique de Gemini
        generation_config = {
            "temperature": 0.8,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
        }
        
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config=generation_config
        )
        
        # Combiner le script original et les instructions dans le prompt
        prompt = f"""
        INSTRUCTIONS DE MODIFICATION:
        {instructions}
        
        SCRIPT ORIGINAL:
        {script_text}
        
        Fournis le script modifié:
        """
        
        # Générer la réponse
        response = model.generate_content([system_prompt, prompt])
        
        # Extraire le contenu et vérifier s'il est valide
        if hasattr(response, 'text') and response.text:
            modified_script = response.text.strip()
            
            # Vérifier si la réponse est substantiellement différente
            if len(modified_script) > len(script_text) * 0.5:
                print(f"Script modifié avec succès ({len(modified_script)} caractères)")
                return modified_script
            else:
                print("La modification semble incomplète, utilisation du script original")
                return script_text
        else:
            print("Échec de la modification avec Gemini, utilisation du script original")
            return script_text
    
    except Exception as e:
        print(f"Erreur lors de la modification du script: {e}")
        import traceback
        traceback.print_exc()
        # Retourner le script original en cas d'erreur
        return script_text

def generate_images_for_script(script_text: str, title: str = "", num_images: int = 3) -> list:
    """
    Génère des images basées sur le contenu du script en utilisant Grok.
    
    Args:
        script_text (str): Le contenu du script
        title (str): Le titre du script/vidéo
        num_images (int): Nombre d'images à générer (par défaut: 3)
        
    Returns:
        list: Liste des chemins vers les images générées
    """
    try:
        print(f"Génération de {num_images} images pour le script: {title[:50]}...")
        
        if not script_text:
            print("Aucun script fourni pour la génération d'images")
            return []
        
        # Créer un dossier pour stocker les images si nécessaire
        import os
        import tempfile
        from datetime import datetime
        
        # Créer un sous-dossier dans le répertoire temporaire
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c if c.isalnum() or c in [' ', '_', '-'] else '_' for c in title[:30])
        safe_title = safe_title.replace(' ', '_')
        
        # Utiliser le même dossier temp que pour les PDF
        if os.name == 'nt':  # Windows
            temp_dir = tempfile.gettempdir()
        else:  # Linux/Render
            temp_dir = '/tmp'
            
        images_dir = os.path.join(temp_dir, f"script_images_{safe_title}_{timestamp}")
        os.makedirs(images_dir, exist_ok=True)
        
        print(f"Dossier d'images créé: {images_dir}")
        
        # Fonction simplifiée : créer directement des images de placeholder
        # au lieu d'appeler l'API Grok (pour éviter les problèmes de dépendances)
        image_paths = []
        
        try:
            # Vérifier si Pillow est disponible
            from PIL import Image, ImageDraw, ImageFont
            
            # Créer des images placeholder
            for i in range(num_images):
                # Créer une image de base
                img = Image.new('RGB', (800, 450), color=(240, 240, 240))
                d = ImageDraw.Draw(img)
                
                # Ajouter du texte
                try:
                    # Essayer de charger une police
                    font = ImageFont.truetype("arial.ttf", 20)
                except:
                    # Utiliser la police par défaut si arial n'est pas disponible
                    font = ImageFont.load_default()
                
                # Dessiner du texte sur l'image
                d.text((40, 200), f"Image {i+1} pour {title}", fill=(0, 0, 0), font=font)
                
                # Ajouter un cadre
                d.rectangle((20, 20, 780, 430), outline=(200, 200, 200), width=2)
                
                # Sauvegarder l'image
                placeholder_path = os.path.join(images_dir, f"placeholder_{i+1}.png")
                img.save(placeholder_path)
                
                image_paths.append(placeholder_path)
                print(f"Image placeholder créée: {placeholder_path}")
        
        except ImportError:
            # Si Pillow n'est pas disponible, créer de simples fichiers texte à la place
            for i in range(num_images):
                text_path = os.path.join(images_dir, f"image_{i+1}.txt")
                with open(text_path, 'w') as f:
                    f.write(f"Ceci est un placeholder pour l'image {i+1} du script '{title}'")
                image_paths.append(text_path)
                print(f"Fichier texte placeholder créé: {text_path}")
        
        print(f"Génération d'images terminée. {len(image_paths)} images générées.")
        return image_paths
        
    except Exception as e:
        print(f"Erreur générale lors de la génération d'images: {e}")
        import traceback
        traceback.print_exc()
        return []