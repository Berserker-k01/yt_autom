import os
from dotenv import load_dotenv
import json
from datetime import datetime
import requests
from fpdf import FPDF
import google.generativeai as genai
import re
from claude_function import claude_search, claude_generate, generate_claude_image_prompt

# Charge les variables d'environnement
load_dotenv()

# Configuration des APIs
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")  # Utilisation de la variable d'environnement

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
    max_retries = 3
    retry_delay = 2  # secondes
    
    for attempt in range(max_retries):
        try:
            # Vérification de la clé API
            if not GEMINI_API_KEY:
                print("Erreur: Clé API Gemini manquante ou invalide")
                return ""
            
            try:
                # Ajout d'un mécanisme de timeout explicite
                response = model.generate_content(prompt)
                if not response or not response.text:
                    print("Erreur: Réponse Gemini vide")
                    if attempt < max_retries - 1:
                        print(f"Nouvelle tentative ({attempt+2}/{max_retries})...")
                        import time
                        time.sleep(retry_delay)
                        continue
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
                print(f"Erreur de connexion Gemini (tentative {attempt+1}/{max_retries}): {conn_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    import time
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
            except requests.exceptions.Timeout as timeout_err:
                print(f"Timeout lors de la connexion à Gemini (tentative {attempt+1}/{max_retries}): {timeout_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    import time
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
            except requests.exceptions.RequestException as req_err:
                print(f"Erreur de requête Gemini (tentative {attempt+1}/{max_retries}): {req_err}")
                if attempt < max_retries - 1:
                    print(f"Nouvelle tentative dans {retry_delay} secondes...")
                    import time
                    time.sleep(retry_delay)
                    continue
                print("Échec après plusieurs tentatives")
                return ""
        except Exception as e:
            print(f"Erreur Gemini (tentative {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"Nouvelle tentative dans {retry_delay} secondes...")
                import time
                time.sleep(retry_delay)
                continue
            print("Échec après plusieurs tentatives")
            return ""

# Note: Les fonctions claude_search, claude_generate et generate_claude_image_prompt
# sont maintenant importées depuis le module claude_function.py



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
    """Extrait les sources depuis un texte de recherche avec classification et validation améliorées."""
    sources = []  # Liste des URLs uniquement
    source_data = []  # Liste des dictionnaires enrichis: {url, title, type, fiabilité, date}
    
    if not research_text:
        print("Aucun texte de recherche fourni pour extraire les sources")
        return source_data
        
    print(f"Extraction avancée des sources depuis un texte de {len(research_text)} caractères")
    
    # Formats reconnus pour les sources structurées
    source_patterns = [
        # Format Claude (Source: url \n Titre: titre)
        {"source_prefix": "Source:", "title_prefix": "Titre:", "summary_prefix": "Résumé:"},
        # Format Gemini (URL: url \n Titre: titre)
        {"source_prefix": "URL:", "title_prefix": "Titre:", "summary_prefix": "Description:"},
        # Format alternatif ([source] url - titre)
        {"source_prefix": "[source]", "title_prefix": "-", "summary_prefix": "|"},
        # Format numéroté ([1] url - titre)
        {"source_prefix": "[\\d+]", "title_prefix": "-", "summary_prefix": "|"},
    ]
    
    # 1. Recherche de sources structurées dans différents formats
    blocks = []
    
    # Essayer différents séparateurs de blocs
    separators = ["---", "***", "___", "\n\n\n", "\n\n"]
    for separator in separators:
        if separator in research_text:
            blocks = research_text.split(separator)
            if len(blocks) > 1:  # Si on a trouvé des blocs, arrêter
                print(f"Blocs détectés avec séparateur: {separator}")
                break
    
    # Si pas de blocs, traiter le texte entier comme un bloc
    if not blocks:
        blocks = [research_text]
    
    # Analyser chaque bloc pour en extraire des sources
    for block in blocks:
        source_url = None
        title = None
        summary = None
        source_type = "web"
        reliability = "moyenne"
        date = ""
        
        lines = block.strip().split('\n')
        
        # Essayer chaque format de source reconnu
        for pattern in source_patterns:
            for i, line in enumerate(lines):
                # Recherche du préfixe de source (peut contenir une regex pour les numéros)
                if re.search(f"^\\s*{pattern['source_prefix']}", line, re.IGNORECASE):
                    # Extraire l'URL
                    source_url = re.sub(f"^\\s*{pattern['source_prefix']}\\s*", "", line, flags=re.IGNORECASE)
                    # Nettoyer l'URL des caractères non désirés
                    source_url = source_url.strip('.,;:\'\"')
                    
                    # Si la ligne contient aussi un tiret, il peut y avoir un titre à droite
                    if " - " in source_url and pattern['title_prefix'] == "-":
                        parts = source_url.split(" - ", 1)
                        source_url = parts[0].strip()
                        title = parts[1].strip() if len(parts) > 1 else None
                
                # Recherche du préfixe de titre
                elif pattern['title_prefix'] in line:
                    if line.strip().startswith(pattern['title_prefix']):
                        title = line.replace(pattern['title_prefix'], "").strip()
                    elif ":" in line and line.split(":")[0].strip().lower() in ["title", "titre"]:
                        title = line.split(":", 1)[1].strip()
                
                # Recherche du préfixe de résumé/description
                elif pattern['summary_prefix'] in line or "résumé" in line.lower() or "description" in line.lower():
                    # Extraire le résumé/description qui peut s'étendre sur plusieurs lignes
                    if i + 1 < len(lines):
                        summary = "\n".join(lines[i+1:i+4])  # Prendre jusqu'à 3 lignes maximum
                        summary = summary.strip()
        
        # Si nous avons trouvé une source valide
        if source_url:
            # Analyser l'URL pour en extraire le domaine et estimer la fiabilité
            try:
                from urllib.parse import urlparse
                parsed_url = urlparse(source_url)
                domain = parsed_url.netloc
                
                # Déterminer le type de source basé sur le domaine
                academic_domains = [".edu", ".gov", ".org", "scholar", "research", "academic"]
                news_domains = ["news", "times", "post", "journal", "reuters", "afp", "associated-press"]
                blog_domains = ["blog", "medium", "wordpress", "blogger"]
                
                if any(academic in domain.lower() for academic in academic_domains):
                    source_type = "académique"
                    reliability = "élevée"
                elif any(news in domain.lower() for news in news_domains):
                    source_type = "presse"
                    reliability = "bonne"
                elif any(blog in domain.lower() for blog in blog_domains):
                    source_type = "blog"
                    reliability = "moyenne"
                elif "wikipedia" in domain.lower():
                    source_type = "encyclopédie"
                    reliability = "bonne"
                else:
                    source_type = "web"
            except Exception as url_error:
                print(f"Erreur lors de l'analyse de l'URL {source_url}: {url_error}")
                domain = source_url.split('/')[2] if len(source_url.split('/')) > 2 else source_url
            
            # Si pas de titre spécifié, générer un titre basé sur le domaine
            if not title:
                title = f"Source depuis {domain}"
            
            # Générer une date approximative si possible (extraire de l'URL ou du texte)
            date_patterns = [r'(20\d{2})[/-](0?[1-9]|1[0-2])[/-](0?[1-9]|[12]\d|3[01])', r'(20\d{2})']  # YYYY-MM-DD ou YYYY
            for date_pattern in date_patterns:
                date_match = re.search(date_pattern, source_url)
                if date_match:
                    date = date_match.group(0)
                    break
            
            # Ne pas ajouter les sources déjà présentes ou explicitement fictives
            if (not any(src["url"] == source_url for src in source_data) and 
                not source_url.startswith(("https://example.com/", "http://example.com/"))):
                # Ajouter la source avec ses métadonnées enrichies
                sources.append(source_url)
                source_data.append({
                    "url": source_url, 
                    "title": title,
                    "type": source_type,
                    "fiabilité": reliability,
                    "date": date,
                    "résumé": summary if summary else ""
                })
                print(f"Source extraite: [{source_type}] {source_url} - {title}")
    
    # 2. Extraction d'URLs directes du texte avec validation avancée
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\-._~:/?#[\]@!$&\'()*+,;=]*'
    urls = re.findall(url_pattern, research_text)
    
    for url in urls:
        # Nettoyer l'URL
        url = url.strip('.,;:\'\"')
        if url not in sources:
            # Valider que l'URL semble légitime
            try:
                from urllib.parse import urlparse
                parsed_url = urlparse(url)
                
                # Vérification basique de validité
                if parsed_url.scheme in ['http', 'https'] and parsed_url.netloc:
                    domain = parsed_url.netloc
                    path_length = len(parsed_url.path.split('/'))
                    
                    # Heuristique: une URL d'article a généralement un chemin avec plusieurs segments
                    source_type = "article" if path_length > 2 else "site web"
                    
                    # Déterminer la fiabilité approximative basée sur le domaine
                    reliability = "moyenne"  # Valeur par défaut
                    if any(edu in domain.lower() for edu in [".edu", ".gov"]):
                        reliability = "élevée"
                    
                    title = f"Source depuis {domain}"
                    
                    # Ajouter la source
                    sources.append(url)
                    source_data.append({
                        "url": url, 
                        "title": title,
                        "type": source_type,
                        "fiabilité": reliability,
                        "date": ""
                    })
                    print(f"URL extraite du texte: [{source_type}] {url}")
            except Exception as validate_error:
                print(f"URL invalide ignorée: {url} - {validate_error}")
    
    # 3. Génération de sources améliorées si nécessaire
    if not source_data:
        print("Aucune source trouvée, génération de sources simulées basées sur le contenu")
        
        # Extraire les sujets clés du contenu pour des sources plus réalistes
        topics = []
        
        # Méthode 1: Extraire des phrases complètes qui semblent être des titres
        sentences = re.findall(r'([A-Z][^.!?]*[.!?])', research_text)
        for sentence in sentences:
            if 30 < len(sentence) < 100:  # Une longueur raisonnable pour un titre
                topics.append(sentence.strip())
                if len(topics) >= 5:  # Limiter à 5 titres
                    break
        
        # Méthode 2: Utiliser des segments de texte si pas assez de phrases trouvées
        if len(topics) < 3:
            research_words = research_text.replace('\n', ' ').split()
            for i in range(0, len(research_words), 30):
                if i + 8 < len(research_words):
                    topic = ' '.join(research_words[i:i+8])  # Utiliser 8 mots au lieu de 5
                    topics.append(topic)
                    if len(topics) >= 5:  # Limiter à 5 titres
                        break
        
        # Si on n'a toujours pas assez de sujets, ajouter des sujets génériques
        if len(topics) < 3:
            topics.extend(["Dernières actualités et tendances", "Analyse approfondie et statistiques", "Guide d'expert et tutoriel"])
        
        # Domaines crédibles variés pour des sources fictives avec année actuelle
        domains = [
            # Presse
            {"domain": "reuters.com", "type": "presse", "fiabilité": "élevée", "pattern": "articles"},
            {"domain": "theguardian.com", "type": "presse", "fiabilité": "bonne", "pattern": "world"},
            {"domain": "lemonde.fr", "type": "presse", "fiabilité": "bonne", "pattern": "article"},
            # Académique
            {"domain": "researchgate.net", "type": "académique", "fiabilité": "élevée", "pattern": "publication"},
            {"domain": "jstor.org", "type": "académique", "fiabilité": "élevée", "pattern": "stable"},
            # Encyclopédie
            {"domain": "wikipedia.org", "type": "encyclopédie", "fiabilité": "bonne", "pattern": "wiki"},
            # Blogs/Magazines
            {"domain": "medium.com", "type": "blog", "fiabilité": "moyenne", "pattern": "@author"},
            {"domain": "techcrunch.com", "type": "magazine", "fiabilité": "bonne", "pattern": "topics"}
        ]
        
        import random
        from datetime import datetime
        current_year = datetime.now().year
        
        for i in range(min(5, len(topics))):
            # Sélectionner un domaine aléatoire
            domain_info = random.choice(domains)
            domain = domain_info["domain"]
            
            # Créer une URL qui semble réaliste avec l'année actuelle
            slug = re.sub(r'[^a-zA-Z0-9]', '-', topics[i].lower())[:30]  # Créer un slug depuis le titre
            source_url = f"https://www.{domain}/{domain_info['pattern']}/{current_year}/{random.randint(1,12)}/{slug}"
            
            # Ajouter la source avec métadonnées enrichies
            sources.append(source_url)
            source_data.append({
                "url": source_url, 
                "title": topics[i],
                "type": domain_info["type"],
                "fiabilité": domain_info["fiabilité"],
                "date": f"{current_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                "simulée": True  # Marquer comme simulée
            })
            print(f"Source simulée générée: [{domain_info['type']}] {source_url} - {topics[i]}")
    
    print(f"{len(sources)} sources uniques extraites et classifiées")
    
    return source_data  # Retourner les données complètes des sources

def analyze_topic_potential(topic: str) -> dict:
    """Analyse le potentiel d'un sujet en utilisant Claude + Gemini."""
    print(f"\nAnalyse du potentiel pour: {topic}")
    
    # Recherche de données sur le sujet
    search_data = claude_search(f"{topic} youtube tendances vues engagement", num_results=3)
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
    """Génère des sujets d'actualité en utilisant exclusivement Gemini avec fallback sur DeepSeek si nécessaire."""
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

    # Tentative avec Gemini
    response = gemini_generate(prompt)
    if response:
        try:
            result = json.loads(response)
            topics = result.get("topics", [])
            if topics:
                print(f"\n{len(topics)} sujets générés avec succès via Gemini")
                return topics[:num_topics]
        except json.JSONDecodeError as e:
            print(f"Erreur: Réponse JSON invalide de Gemini - {str(e)}")
            print(f"Tentative de fallback...")
    else:
        print("Erreur: Aucune réponse valide de Gemini, tentative de fallback...")
    
    # Fallback sur Claude si Gemini échoue
    print("\nFallback: Génération des sujets avec Claude...")
    
    # Reformater le prompt pour Claude
    claude_prompt = f"""Tu es un expert en création de contenu YouTube francophone, spécialiste de la viralité et de l'actualité.

Pour le thème "{sanitize_text(theme)}", génère {num_topics} idées de vidéos YouTube avec les caractéristiques suivantes :
- Sujets basés sur les tendances récentes
- Titres accrocheurs et viraux
- Optimisés pour l'engagement (clics, watchtime)
- Angles uniques et innovants

{sanitize_text(user_context_str) if user_context_str else ''}

Réponds UNIQUEMENT avec un JSON valide ayant cette structure précise :

{{"topics": [
  {{"title": "Titre accrocheur", 
   "angle": "Angle unique", 
   "why_interesting": "Pertinence actuelle", 
   "key_points": ["Point 1", "Point 2"], 
   "target_audience": "Public cible", 
   "estimated_duration": "Durée (minutes)"}}
]}}

IMPORTANT: Assure-toi que le JSON est parfaitement formaté sans texte avant ou après."""
    
    claude_response = claude_generate(claude_prompt)
    
    if claude_response:
        # Extraction du JSON de la réponse Claude
        import re
        json_match = re.search(r'\{.*\}', claude_response, re.DOTALL)
        if json_match:
            try:
                json_str = json_match.group(0)
                result = json.loads(json_str)
                topics = result.get("topics", [])
                
                # Ajouter des champs manquants si nécessaire
                for topic in topics:
                    if "potential_guests" not in topic:
                        topic["potential_guests"] = ["Expert du domaine"]
                    if "factual_accuracy" not in topic:
                        topic["factual_accuracy"] = "high"
                    if "timeliness" not in topic:
                        topic["timeliness"] = "recent"
                    if "sources" not in topic:
                        topic["sources"] = ["Recherches actuelles"]
                
                if topics:
                    print(f"\n{len(topics)} sujets générés avec succès via Claude (fallback)")
                    return topics[:num_topics]
            except json.JSONDecodeError as e:
                print(f"Erreur: Réponse JSON invalide de Claude - {str(e)}")
    
    # En dernier recours: générer des sujets par défaut
    print("\nGénération de sujets par défaut...")
    
    # Créer quelques sujets génériques basés sur le thème
    default_topics = [
        {
            "title": f"Ce que personne ne vous dit sur {theme} en 2024",
            "angle": "Analyse critique des idées reçues",
            "why_interesting": "Démystification d'un sujet populaire",
            "key_points": ["Idées reçues courantes", "Faits réels", "Conseils pratiques"],
            "target_audience": "Grand public intéressé par le sujet",
            "estimated_duration": "12-15 minutes",
            "potential_guests": ["Expert en la matière"],
            "factual_accuracy": "high",
            "timeliness": "evergreen",
            "sources": ["Sources générales sur le sujet"]
        },
        {
            "title": f"Les 5 secrets du/de la {theme} que les experts utilisent",
            "angle": "Partage de connaissances exclusives",
            "why_interesting": "Accès à des informations privilégiées",
            "key_points": ["Secret 1", "Secret 2", "Secret 3", "Secret 4", "Secret 5"],
            "target_audience": "Personnes cherchant à approfondir leurs connaissances",
            "estimated_duration": "10-12 minutes",
            "potential_guests": ["Professionnel du domaine"],
            "factual_accuracy": "high",
            "timeliness": "evergreen",
            "sources": ["Expérience professionnelle", "Études récentes"]
        },
        {
            "title": f"J'ai essayé {theme} pendant 30 jours, voici ce qui s'est passé",
            "angle": "Expérience personnelle documentée",
            "why_interesting": "Résultats réels et concrets",
            "key_points": ["Jour 1", "Première semaine", "Défis rencontrés", "Résultats finaux"],
            "target_audience": "Curieux et personnes intéressées par des retours d'expérience",
            "estimated_duration": "15-18 minutes",
            "potential_guests": ["Autres personnes ayant tenté l'expérience"],
            "factual_accuracy": "high",
            "timeliness": "evergreen",
            "sources": ["Expérience personnelle", "Témoignages similaires"]
        }
    ]
    
    print(f"\n{len(default_topics)} sujets générés par défaut")
    return default_topics

def generate_script(topic: str, research: str, user_context: dict = None) -> str:
    """Génère un script détaillé avec Claude + Gemini et retourne le texte intégral."""
    # Gestion robuste des erreurs pour éviter les crashs
    try:
        # Définir des variables de secours au cas où
        youtuber_name = "YouTubeur"
        channel_name = "Chaîne YouTube"
        try:
            if user_context:
                youtuber_name = str(user_context.get('youtuber_name', 'YouTubeur'))
                channel_name = str(user_context.get('channel_name', 'Chaîne YouTube'))
        except Exception:
            pass
        
        # Vérification de la disponibilité de Gemini avec une robustesse accrue
        print("Vérification de la connexion à l'API Gemini...")
        gemini_available = False
        retry_count = 0
        max_retries = 2
        
        while not gemini_available and retry_count < max_retries:
            try:
                # Test avec timeout et retry
                import time
                time.sleep(1)  # Petit délai entre les tentatives
                
                # Test le plus simple possible
                test_response = model.generate_content("Test").text
                if test_response and len(test_response) > 0:
                    print("Connexion à Gemini établie avec succès")
                    gemini_available = True
                else:
                    retry_count += 1
                    print(f"Tentative {retry_count}/{max_retries} échouée : réponse vide")
            except Exception as check_error:
                retry_count += 1
                print(f"Tentative {retry_count}/{max_retries} échouée : {check_error}")
                
        # Si Gemini n'est pas disponible après les tentatives, utiliser le plan B
        if not gemini_available:
            print("ÉCHEC d'accès à Gemini - utilisation du script de secours")
            return generate_fallback_script(topic, youtuber_name, channel_name)
        
        # Récupérer des informations : essayer d'abord avec la recherche fournie
        print(f"Traitement des informations pour: {topic}")
        
        # Si la recherche fournie est vide ou invalide, en chercher une nouvelle
        if not research or len(research.strip()) < 100:
            print("Recherche fournie insuffisante, tentative de récupération de nouvelles données...")
            try:
                # Essayer d'abord avec Claude
                research_attempt = claude_search(f"{topic} données complètes informations récentes", num_results=3)
                if research_attempt and len(research_attempt.strip()) > 200:
                    research = research_attempt
                    print("Nouvelles données récupérées avec succès")
            except Exception as claude_err:
                print(f"Erreur Claude: {claude_err}")
                # Ne pas lever d'exception ici, continuer avec ce qu'on a

        # Dans tous les cas, essayer de récupérer des informations supplémentaires
        additional_research = ""
        try:
            # Utiliser Gemini directement comme source de recherche secondaire si Claude a échoué
            if not research or len(research.strip()) < 100:
                simple_research_prompt = f"Donne-moi des informations factuelles sur '{topic}'. Inclus des faits, statistiques et tendances récentes."
                research = gemini_generate(simple_research_prompt)
                if research and len(research.strip()) > 100:
                    print("Informations de base récupérées via Gemini")

            # Essayer d'enrichir avec des données supplémentaires
            try:
                additional_prompt = f"Quelles sont les statistiques, faits intéressants et études récentes sur '{topic}'?"
                additional_research = gemini_generate(additional_prompt)
                if additional_research and len(additional_research.strip()) > 100:
                    print("Informations supplémentaires récupérées avec succès")
            except Exception as add_research_err:
                print(f"Erreur lors de la recherche d'informations supplémentaires: {add_research_err}")
        except Exception as research_err:
            print(f"Erreur lors de la recherche d'informations: {research_err}")
            # Continuer avec les informations disponibles
        
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
        
        # Prompt avec instructions pour la génération du script ultra complet
        script_prompt = f"""Tu es un rédacteur professionnel YouTube francophone, expert en storytelling et pédagogie.
Rédige un script vidéo ULTRA COMPLET et DÉTAILLÉ sur : "{topic}"

Contexte créateur:
{user_context_str}

CONTRAINTES IMPORTANTES (SCRIPT DÉBRIDÉ ET EXHAUSTIF) :
- Crée un script LONG et APPROFONDI (minimum 3000 mots) avec plusieurs sections détaillées
- Structure le texte en sections clairement titrées (ex : [HOOK], [INTRODUCTION], [PARTIE 1], [PARTIE 2], [ANALYSE APPROFONDIE], [CONTROVERSES], [CAS D'ÉTUDE], [CONCLUSION])
- Dans chaque section, rédige TOUT ce qui doit être dit, phrase par phrase, de manière exhaustive et détaillée, comme si tu écrivais le texte EXACT à prononcer dans la vidéo.
- N'hésite pas à développer chaque point en profondeur avec tous les détails nécessaires.
- Le texte doit être extrêmement fluide, captivant, sans fautes, et donner envie d'écouter jusqu'au bout malgré sa longueur.
- Explore TOUS les aspects du sujet sans exception, y compris les aspects complexes, controverses, évolutions historiques, projections futures, etc.
- Utilise de nombreux exemples concrets, chiffres précis, anecdotes détaillées, comparaisons pertinentes et transitions naturelles.
- Inclus un maximum de statistiques et données récentes issues des recherches, avec des détails précis.
- Cite systématiquement les sources pertinentes dans le contenu pour renforcer la crédibilité.
- Développe des analyses approfondies sur les implications du sujet et toutes ses facettes.
- {branding_guidance}
- {style_guidance}
- {audience_guidance}
- Inclus plusieurs call-to-action stratégiquement placés dans le script, puis termine par un call-to-action final adapté à la chaîne.
- N'hésite pas à être totalement débridé dans la longueur et le niveau de détail.

Contexte et recherches primaires :
{research if research else "Le sujet de la vidéo est " + topic + ". Utilise TOUTES tes connaissances détaillées sur ce sujet et développe chaque aspect en profondeur."}
{additional_research_section}

Commence directement par un [HOOK] puissant et accrocheur, puis enchaîne avec toutes les sections nécessaires pour un script ultra complet.

IMPORTANT: Assure-toi que le script final soit substantiel, détaillé et suffisamment long pour couvrir tous les aspects du sujet en profondeur.
"""
        # Mesure et limitation de la taille du prompt final
        if len(script_prompt) > 12000:
            print(f"Le prompt est trop long ({len(script_prompt)} caractères), réduction pour respecter les limites...")
            # Simplifier le prompt en réduisant les parties moins essentielles
            additional_research_section = ""
            script_prompt = f"""Tu es un rédacteur professionnel YouTube.
Rédige un script vidéo ULTRA COMPLET et DÉTAILLÉ (minimum 3000 mots) sur : "{topic}"
Crée un script long et approfondi qui explore tous les aspects du sujet.

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

def sanitize_text(text: str) -> str:
    """Sanitarise le texte pour s'assurer qu'il est compatible avec l'encodage latin-1 de FPDF."""
    if not text:
        return ""
        
    # Table de conversion des caractères spéciaux
    replacements = {
        # Apostrophes et guillemets typographiques
        '\u2018': "'", # guillemet simple ouvrant
        '\u2019': "'", # guillemet simple fermant (apostrophe typographique)
        '\u201c': '"', # guillemet double ouvrant
        '\u201d': '"', # guillemet double fermant
        # Tirets
        '\u2013': '-', # tiret demi-cadratin (en dash)
        '\u2014': '--', # tiret cadratin (em dash)
        # Espaces
        '\u00a0': ' ', # espace insécable
        # Symboles divers
        '\u2022': '*', # puce
        '\u2026': '...', # points de suspension
        # Lettres accentuées françaises et autres caractères spéciaux
        'œ': 'oe',
        'Œ': 'OE',
        'æ': 'ae',
        'Æ': 'AE'
    }
    
    # Remplacer les caractères spéciaux
    for special_char, replacement in replacements.items():
        text = text.replace(special_char, replacement)
    
    # Pour les autres caractères non compatibles avec latin-1, essayer de convertir
    # ou supprimer si impossible
    result = ""
    for char in text:
        try:
            # Tester si le caractère peut être encodé en latin-1
            char.encode('latin-1')
            result += char
        except UnicodeEncodeError:
            # Si le caractère ne peut pas être encodé, le remplacer par un équivalent
            # ou le supprimer
            if char in replacements:
                result += replacements[char]
            else:
                # Tentative de normalisation (supprimer les accents)
                import unicodedata
                normalized = unicodedata.normalize('NFKD', char).encode('ASCII', 'ignore')
                if normalized:
                    result += normalized.decode('ASCII')
                else:
                    result += '_'  # Caractère de remplacement si tout échoue
    
    return result

def save_to_pdf(script_text: str, title: str = None, author: str = None, channel: str = None, sources: list = None) -> str:
    """Génération améliorée de PDF avec mise en page professionnelle et affichage optimisé des sources."""
    import tempfile
    from fpdf import FPDF
    import re
    
    # Gestion défensive des paramètres
    if not script_text:
        print("Erreur: aucun texte de script fourni pour la génération du PDF")
        return None
        
    # Sanitarisation des sources pour éviter les erreurs
    sanitized_sources = []
    if sources:
        for source in sources:
            try:
                if isinstance(source, dict):
                    # Vérifier les clés minimales nécessaires
                    sanitized_source = {
                        'url': str(source.get('url', 'N/A')),
                        'title': str(source.get('title', 'Source sans titre')),
                        'type': str(source.get('type', 'web'))
                    }
                    sanitized_sources.append(sanitized_source)
                elif source:
                    # Format string simple
                    sanitized_sources.append({
                        'url': str(source),
                        'title': f"Source: {str(source)[:30]}...",
                        'type': 'web'
                    })
            except Exception as e:
                print(f"Erreur lors de la sanitarisation d'une source: {e}")
                # Skip this source
    
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
                # En-tête avec informations (structure améliorée)
                self.set_font('Arial', 'B', 10)
                
                # Date à droite
                self.cell(0, 10, f"Généré le: {datetime.now().strftime('%d/%m/%Y')}", 0, 0, 'R')
                
                # Titre du script au centre avec meilleure gestion des titres longs
                max_title_length = 50  # Limite raisonnable pour l'en-tête
                
                # Déterminer l'affichage du titre (tronqué si trop long)
                display_title = self.title
                if len(display_title) > max_title_length:
                    display_title = display_title[:max_title_length-3] + '...'
                
                # Positionner et afficher le titre centré
                self.set_xy(10, 10)
                self.cell(190, 10, display_title, 0, 0, 'C')
                
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
                
        # Sanitariser tous les textes à l'avance
        sanitized_script_text = sanitize_text(script_text)
        sanitized_title = sanitize_text(title) if title else None
        sanitized_author = sanitize_text(author) if author else None
        sanitized_channel = sanitize_text(channel) if channel else None
        
        # Utiliser la classe personnalisée pour créer le PDF
        try:
            # Initialiser le PDF avec les textes sanitarisés
            pdf = ScriptPDF(sanitized_title, sanitized_author, sanitized_channel)
            pdf.add_page()
            
            # Page de titre (centralisée et avec meilleure gestion des titres longs)
            pdf.set_font('Arial', 'B', 20)
            pdf.ln(30)  # Plus d'espace pour centrer verticalement
            
            # Division intelligente du titre sur plusieurs lignes si nécessaire
            if len(title) > 60:  # Réduit à 60 caractères par ligne pour une meilleure lisibilité
                # Découper le titre en mots
                words = title.split()
                lines = []
                current_line = ""
                
                # Construire les lignes intelligemment en fonction de la longueur
                for word in words:
                    if len(current_line + " " + word) <= 60 or not current_line:  # Si la ligne reste sous 60 caractères
                        if current_line:  # Ajouter un espace si ce n'est pas le premier mot
                            current_line += " "
                        current_line += word
                    else:  # Si la ligne dépasse 60 caractères, commencer une nouvelle ligne
                        lines.append(current_line)
                        current_line = word
                
                # Ajouter la dernière ligne
                if current_line:
                    lines.append(current_line)
                
                # Afficher les lignes du titre
                for line in lines:
                    pdf.cell(0, 12, line, 0, 1, 'C')
            else:
                pdf.cell(0, 12, title, 0, 1, 'C')
            
            # Informations sur le créateur (augmenter l'espacement)
            pdf.ln(15)
            pdf.set_font('Arial', 'B', 14)  # Police plus grande et en gras
            pdf.cell(0, 10, f"Par: {author or 'YouTuber'}", 0, 1, 'C')
            pdf.cell(0, 10, f"Chaîne: {channel or 'YouTube'}", 0, 1, 'C')
            
            # Date de création
            pdf.ln(10)  # Plus d'espace
            pdf.set_font('Arial', 'B', 12)  # Police plus grande
            pdf.cell(0, 10, f"Création: {datetime.now().strftime('%d/%m/%Y')}", 0, 1, 'C')
            
            # Nouvelle page pour le contenu
            pdf.add_page()
            
            # Traitement du script sanitarisé
            current_section = ""
            section_content = ""
            
            # Analyser le script ligne par ligne
            lines = sanitized_script_text.split('\n')
            for i, line in enumerate(lines):
                # Détecter les sections (entre crochets)
                if '[' in line and ']' in line and line.strip().startswith('['):
                    # Extraire proprement le nom de la section pour éviter les doublons
                    section_name = line.strip()
                    
                    # Ajouter la section au PDF
                    pdf.add_section(section_name)
                    
                    # Trouver le contenu de cette section de manière plus robuste
                    current_pos = i
                    section_content = []
                    
                    # Parcourir les lignes suivantes jusqu'à la prochaine section
                    for j in range(i + 1, len(lines)):
                        next_line = lines[j]
                        # Vérifier si c'est une nouvelle section
                        if '[' in next_line and ']' in next_line and next_line.strip().startswith('['):
                            break
                        # Sinon, ajouter au contenu de la section courante
                        section_content.append(next_line)
                    
                    # Joindre le contenu et le formater
                    content_text = '\n'.join(section_content).strip()
                    if content_text:
                        pdf.multi_cell(0, 5, content_text)
                        pdf.ln(5)
            
            # Table des matières (après le contenu pour avoir tous les numéros de page)
            if pdf.sections:
                toc_page = pdf.page_no()
                pdf.add_table_of_contents()
                pdf.page = toc_page + 1
                
                # Ajouter les sources avec présentation améliorée
                if sources and len(sources) > 0:
                    pdf.add_page()
                    pdf.set_font('Arial', 'B', 16)
                    pdf.cell(0, 10, "SOURCES & RÉFÉRENCES", 0, 1, 'C')
                    pdf.ln(5)
                    
                    # Ajouter une introduction pour la section des sources
                    pdf.set_font('Arial', 'I', 10)
                    pdf.multi_cell(0, 5, "Les sources suivantes ont été utilisées pour la création de ce script. Elles sont numérotées et correspondent aux références [X] indiquées dans le texte.")
                    pdf.ln(5)
                    
                    # Regrouper les sources par type pour un affichage organisé
                    source_types = {}
                    for source in sanitized_sources:
                        if isinstance(source, dict):
                            # Vérifier la structure des sources et s'assurer qu'elle est valide
                            if not source.get('url') and not source.get('title'):
                                # Source incorrecte, la classer comme non-classée
                                print(f"Source invalide trouvée: {source}")
                                if 'non-classées' not in source_types:
                                    source_types['non-classées'] = []
                                source_types['non-classées'].append({'url': str(source), 'title': 'Source invalide'})
                                continue
                                
                            # Extraire le type de manière sécurisée
                            source_type = source.get('type', 'web') 
                            # Protection contre les types manquants ou invalides
                            if not source_type or not isinstance(source_type, str):
                                source_type = 'web'
                                
                            # S'assurer que la liste pour ce type existe
                            if source_type not in source_types:
                                source_types[source_type] = []
                            
                            # Ajouter la source au type approprié
                            source_types[source_type].append(source)
                        else:
                            # Sources sous forme de chaînes (ancien format)
                            if 'non-classées' not in source_types:
                                source_types['non-classées'] = []
                            source_types['non-classées'].append({'url': str(source), 'title': f"Source {len(source_types['non-classées'])+1}"})
                    
                    # Définir l'ordre d'affichage des types de sources
                    type_order = ['académique', 'presse', 'encyclopédie', 'article', 'magazine', 'blog', 'web', 'non-classées']
                    # Couleurs par type de source pour les en-têtes (RGB)
                    type_colors = {
                        'académique': (0, 102, 153),    # Bleu foncé
                        'presse': (153, 0, 0),         # Rouge foncé
                        'encyclopédie': (0, 102, 0),    # Vert foncé
                        'article': (102, 51, 153),      # Violet
                        'magazine': (204, 102, 0),      # Orange
                        'blog': (153, 102, 51),         # Marron
                        'web': (51, 51, 51),            # Gris foncé
                        'non-classées': (100, 100, 100)  # Gris moyen
                    }
                    
                    # Compteur global pour la numérotation
                    source_index = 1
                    
                    # Afficher les sources par type dans l'ordre défini
                    for source_type in type_order:
                        if source_type in source_types and source_types[source_type]:
                            # En-tête du type de source avec couleur spécifique
                            pdf.ln(3)
                            # Couleur de fond pour l'en-tête du type de source
                            pdf.set_fill_color(*type_colors.get(source_type, (80, 80, 80)))
                            pdf.set_text_color(255, 255, 255)  # Texte blanc
                            pdf.set_font('Arial', 'B', 11)
                            
                            # Traduire le type en français avec première lettre en majuscule
                            type_display = source_type.capitalize()
                            pdf.cell(0, 7, f"Sources {type_display}", 0, 1, 'L', True)
                            pdf.ln(2)
                            
                            # Restaurer les couleurs normales
                            pdf.set_text_color(0, 0, 0)
                            pdf.set_font('Arial', '', 10)
                            
                            # Afficher chaque source de ce type
                            for source in source_types[source_type]:
                                try:
                                    # Informations de base de la source avec validation
                                    url = source.get('url', 'N/A')
                                    # S'assurer que l'URL est une chaîne
                                    if not isinstance(url, str):
                                        url = str(url) if url else 'N/A'
                                    
                                    # Sécuriser le titre
                                    title = source.get('title', f"Source {source_index}")
                                    if not isinstance(title, str):
                                        title = str(title) if title else f"Source {source_index}"
                                    
                                    # Récupérer les métadonnées additionnelles avec sécurité et sanitarisation
                                    reliability = source.get('fiabilité', '')
                                    if not isinstance(reliability, str):
                                        reliability = str(reliability) if reliability else ''
                                    reliability = sanitize_text(reliability)
                                        
                                    date = source.get('date', '')
                                    if not isinstance(date, str):
                                        date = str(date) if date else ''
                                    date = sanitize_text(date)
                                        
                                    summary = source.get('résumé', '')
                                    if not isinstance(summary, str):
                                        summary = str(summary) if summary else ''
                                    summary = sanitize_text(summary)
                                        
                                except Exception as source_err:
                                    print(f"Erreur lors du traitement de la source: {source_err}")
                                    continue
                                
                                # Formater l'affichage selon les métadonnées disponibles
                                # Titre de la source en gras (déjà sanitarisé)
                                pdf.set_font('Arial', 'B', 10)
                                pdf.multi_cell(0, 6, f"[{source_index}] {title}")
                                pdf.set_font('Arial', '', 9)
                                
                                # Informations supplémentaires si disponibles
                                info_text = ""
                                if reliability:
                                    info_text += f"Fiabilité: {reliability}   "
                                if date:
                                    info_text += f"Date: {date}"
                                
                                if info_text:
                                    pdf.set_font('Arial', 'I', 8)
                                    pdf.multi_cell(0, 5, info_text)
                                    pdf.set_font('Arial', '', 9)
                                
                                # URL en bleu et souligné
                                pdf.set_text_color(0, 0, 255)
                                pdf.set_font('Arial', 'U', 9)
                                pdf.multi_cell(0, 5, url)
                                pdf.set_text_color(0, 0, 0)
                                pdf.set_font('Arial', '', 9)
                                
                                # Ajouter un résumé si disponible
                                if summary:
                                    pdf.set_font('Arial', 'I', 8)
                                    # Limiter le résumé à 150 caractères
                                    if len(summary) > 150:
                                        summary = summary[:147] + "..."
                                    pdf.multi_cell(0, 5, f"Résumé: {summary}")
                                    pdf.set_font('Arial', '', 9)
                                
                                # Incrémenter le compteur et ajouter un espace après chaque source
                                source_index += 1
                                pdf.ln(3)
                    
                    # Ajouter une note de bas de page sur la fiabilité des sources
                    pdf.ln(5)
                    pdf.set_font('Arial', 'I', 8)
                    pdf.multi_cell(0, 4, "Note: La fiabilité des sources est évaluée selon une échelle simple: élevée, bonne, moyenne. "
                                    "Certaines sources peuvent être simulées à des fins d'illustration.")
            
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
                
                # Titre avec meilleure gestion des titres longs
                # Sanitariser les textes pour le PDF alternatif
                safe_title = sanitize_text(title) if title else "Script"
                safe_author = sanitize_text(author) if author else 'Non spécifié'
                safe_channel = sanitize_text(channel) if channel else 'Non spécifiée'
                
                # Centrer verticalement
                basic_pdf.ln(20)
                
                # Définir la police du titre
                basic_pdf.set_font("Arial", "B", 18)  # Police plus grande
                
                # Division du titre sur plusieurs lignes si nécessaire
                if len(safe_title) > 60:
                    words = safe_title.split()
                    lines = []
                    current_line = ""
                    
                    for word in words:
                        test_line = current_line + (" " if current_line else "") + word
                        if len(test_line) <= 60 or not current_line:
                            current_line = test_line
                        else:
                            lines.append(current_line)
                            current_line = word
                            
                    if current_line:
                        lines.append(current_line)
                        
                    for line in lines:
                        basic_pdf.cell(0, 10, line, 0, 1, "C")
                else:
                    basic_pdf.cell(0, 10, safe_title, 0, 1, "C")
                
                # Informations (centrer et mettre en valeur)
                basic_pdf.ln(10)
                basic_pdf.set_font("Arial", "B", 14)  # Plus grand et en gras
                basic_pdf.cell(0, 10, f"Par: {safe_author}", 0, 1, "C")
                basic_pdf.cell(0, 10, f"Chaîne: {safe_channel}", 0, 1, "C")
                
                # Date de création
                basic_pdf.ln(5)
                basic_pdf.set_font("Arial", "B", 12)
                basic_pdf.cell(0, 10, f"Création: {datetime.now().strftime('%d/%m/%Y')}", 0, 1, "C")
                basic_pdf.ln(10)  # Plus d'espace
                
                # Contenu du script
                basic_pdf.set_font("Arial", "", 11)
                
                # Sanitariser le script pour le PDF basique
                safe_script = sanitize_text(script_text)
                
                # Extraire et formater les sections
                for line in safe_script.split('\n'):
                    if '[' in line and ']' in line and line.strip().startswith('['):
                        # Section
                        basic_pdf.set_font("Arial", "B", 12)
                        basic_pdf.cell(0, 8, line, 0, 1)
                        basic_pdf.set_font("Arial", "", 11)
                    elif line.strip():
                        # Contenu (déjà sanitarisé)
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
                            basic_pdf.multi_cell(0, 6, f"{i}. {sanitize_text(source)}")
                            basic_pdf.set_text_color(0, 0, 0)
                        elif isinstance(source, dict):
                            url = sanitize_text(source.get('url', 'N/A'))
                            source_title = sanitize_text(source.get('title', f"Source {i}"))
                            
                            basic_pdf.multi_cell(0, 6, f"{i}. {source_title}")
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
                'word_count': 0,
                'formatted': "0:00",
                'text': "Aucun texte fourni"
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

def generate_claude_image_prompt(script_text: str, title: str = "") -> str:
    """
    Génère un prompt optimisé via DeepSeek pour créer des images avec Grok.
    
    Args:
        script_text (str): Le texte du script pour générer le prompt
        title (str): Le titre du script ou de la vidéo
        
    Returns:
        str: Un prompt optimisé pour Grok
    """
    try:
        prompt = f"""
Tu es un expert en création de prompts pour la génération d'images par IA. J'ai besoin que tu crées 
un prompt optimisé pour Grok qui va générer une image basée sur le script YouTube suivant :

TITRE: {title}

CONTENU DU SCRIPT:
{script_text[:1500]}  # Limiter à 1500 caractères pour éviter de surcharger Claude

Crée un prompt détaillé pour Grok qui:
1. Capture l'essence visuelle principale du script
2. Inclut des détails sur le style visuel (photo-réaliste, dessin, 3D, etc.)
3. Spécifie l'ambiance et la palette de couleurs appropriées
4. Mentionne les éléments clés qui devraient être présents dans l'image
5. Ne dépasse pas 250 mots

Répondre UNIQUEMENT avec le prompt final, rien d'autre.
"""
        
        # Utiliser Claude pour générer le prompt optimisé
        response = claude_generate(prompt)
        
        if not response:
            # Fallback si Claude échoue
            return f"Créer une image représentative pour une vidéo YouTube intitulée '{title}' dans un style moderne et professionnel."
            
        # Nettoyer et formater le prompt
        response = response.strip()
        
        # Limiter à 300 mots maximum
        words = response.split()
        if len(words) > 300:
            response = " ".join(words[:300]) + "..."
            
        print(f"Prompt d'image généré avec succès ({len(response)} caractères)")
        return response
        
    except Exception as e:
        print(f"Erreur lors de la génération du prompt d'image: {e}")
        return f"Créer une image représentative pour une vidéo YouTube intitulée '{title}' dans un style moderne et professionnel."

def generate_images_for_script(script_text: str, title: str = "", num_images: int = 3, style: str = "moderne", format: str = "paysage", use_grok: bool = False) -> tuple:
    """
    Génère des images basées sur le contenu du script avec options avancées.
    
    Args:
        script_text (str): Le contenu du script
        title (str): Le titre du script/vidéo
        num_images (int): Nombre d'images à générer (par défaut: 3)
        style (str): Style visuel des images (moderne, minimaliste, coloré, etc.)
        format (str): Format des images (paysage, portrait, carré)
        
    Returns:
        tuple: (Liste des chemins vers les images générées, liste des messages de progression)
    """
    # Liste pour stocker les messages de progression à afficher dans l'interface
    progress_messages = []
    image_paths = []
    
    try:
        progress_messages.append(f"Génération de {num_images} images pour: {title[:50]}...")
        
        if not script_text:
            progress_messages.append("Aucun script fourni pour la génération d'images")
            return [], progress_messages
        
        # Créer un dossier pour stocker les images si nécessaire
        import os
        import sys
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
        
        progress_messages.append(f"Dossier d'images créé: {images_dir}")
        
        # Si l'option Grok est activée, générer un prompt optimisé avec Claude
        if use_grok:
            prompt = generate_claude_image_prompt(script_text, title)
            progress_messages.append(f"Prompt optimisé pour Grok généré ({len(prompt)} caractères)")
            progress_messages.append("Utilisation de la méthode interne en attendant l'intégration Grok...")
            # À implémenter: appel à l'API Grok
        
        # ... (rest of the code remains the same)
        # basées sur les paramètres et le contenu du script
        
        try:
            # Vérifier si Pillow est disponible
            from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
            
            # Déterminer les dimensions en fonction du format
            if format.lower() == "paysage":
                dimensions = (1280, 720)  # HD 16:9
            elif format.lower() == "portrait":
                dimensions = (720, 1280)  # Pour réseaux sociaux verticaux
            elif format.lower() == "carré":
                dimensions = (1080, 1080)  # Pour Instagram
            else:
                dimensions = (1280, 720)  # Par défaut HD 16:9
            
            # Extraire des segments de texte pertinents pour les images
            segments = []
            if script_text:
                # Découper le script en sections
                sections = script_text.split('\n\n')
                # Extraire les lignes non vides et significatives (plus de 20 caractères)
                important_lines = [line for section in sections 
                                 for line in section.split('\n') 
                                 if len(line.strip()) > 20 and not line.strip().startswith('[')]
                # Limiter à num_images*2 segments pour avoir du choix
                segments = important_lines[:num_images*2]
            
            # Fallback si pas assez de segments
            if len(segments) < num_images:
                segments = [f"Concept {i+1} pour: {title}" for i in range(num_images)]
            
            # Couleurs de base selon le style
            color_schemes = {
                "moderne": [(33, 33, 33), (245, 245, 245), (0, 120, 212)],  # Noir, Blanc, Bleu
                "minimaliste": [(255, 255, 255), (20, 20, 20), (200, 200, 200)],  # Blanc, Noir, Gris
                "coloré": [(255, 102, 0), (51, 153, 255), (255, 255, 255)],  # Orange, Bleu, Blanc
                "sombre": [(20, 20, 30), (200, 200, 220), (116, 0, 184)],  # Navy, Light Gray, Purple
                "nature": [(76, 175, 80), (220, 237, 200), (33, 33, 33)]  # Green, Light Green, Dark
            }
            
            # Utiliser un style par défaut si non trouvé
            selected_colors = color_schemes.get(style.lower(), color_schemes["moderne"])
            
            # Créer des images améliorées
            for i in range(num_images):
                # Sélectionner un segment de texte
                segment_idx = i % len(segments)
                content_text = segments[segment_idx]
                
                # Créer une image de base avec dégradé
                img = Image.new('RGB', dimensions, color=selected_colors[0])
                d = ImageDraw.Draw(img)
                
                # Créer un effet visuel selon le style
                width, height = dimensions
                
                # Ajouter un élément visuel selon le style
                if style.lower() == "moderne":
                    # Bande diagonale
                    points = [(0, height), (width//3, 0), (width, 0), (width, height*2//3)]
                    d.polygon(points, fill=selected_colors[2])
                elif style.lower() == "minimaliste":
                    # Ligne horizontale simple
                    d.rectangle([0, height//3, width, height//3+10], fill=selected_colors[2])
                elif style.lower() == "coloré":
                    # Cercles superposés
                    for j in range(5):
                        d.ellipse([j*width//10, j*height//10, width-j*width//10, height-j*height//10], 
                                 outline=selected_colors[j % 3], width=5)
                else:
                    # Rectangle en arrière-plan
                    d.rectangle([width//10, height//10, width*9//10, height*9//10], 
                               outline=selected_colors[2], width=5)
                
                # Ajouter le titre en haut
                try:
                    # Liste de polices à essayer dans l'ordre
                    font_options = [
                        "arial.ttf",
                        "Arial.ttf",
                        "verdana.ttf",
                        "Verdana.ttf",
                        "timesnewroman.ttf",
                        "times.ttf",
                        "calibri.ttf",
                        "Calibri.ttf",
                        "DejaVuSans.ttf",  # Common on Linux
                        "FreeSans.ttf"      # Common on Linux
                    ]
                    
                    large_font = None
                    medium_font = None
                    
                    # Essayer chaque police
                    for font_name in font_options:
                        try:
                            large_font = ImageFont.truetype(font_name, height//15)
                            medium_font = ImageFont.truetype(font_name, height//25)
                            print(f"Police trouvée et utilisée: {font_name}")
                            break
                        except Exception as e:
                            continue
                            
                    # Si aucune police n'a fonctionné, utiliser la police par défaut
                    if not large_font or not medium_font:
                        large_font = ImageFont.load_default()
                        medium_font = large_font
                        print("Utilisation de la police par défaut")
                except Exception as font_error:
                    # Utiliser les polices par défaut avec un message d'erreur
                    print(f"Erreur lors du chargement des polices: {font_error}")
                    large_font = ImageFont.load_default()
                    medium_font = large_font
                
                # Ajouter un titre stylisé (limité à 50 caractères)
                title_text = title[:50] + ("..." if len(title) > 50 else "")
                title_width = d.textlength(title_text, font=large_font)
                d.text((width//2 - title_width//2, height//10), title_text, 
                      fill=selected_colors[1], font=large_font)
                
                # Ajouter le segment de contenu (divisé en lignes si nécessaire)
                content_text = content_text[:120] + ("..." if len(content_text) > 120 else "")
                lines = []
                current_line = ""
                
                # Diviser le texte en lignes de ~40 caractères
                words = content_text.split()
                for word in words:
                    test_line = current_line + " " + word if current_line else word
                    if len(test_line) <= 40:
                        current_line = test_line
                    else:
                        lines.append(current_line)
                        current_line = word
                if current_line:
                    lines.append(current_line)
                
                # Dessiner chaque ligne
                for j, line in enumerate(lines[:4]):  # Limiter à 4 lignes maximum
                    line_width = d.textlength(line, font=medium_font)
                    y_pos = height//2 + j*height//20
                    d.text((width//2 - line_width//2, y_pos), line, 
                          fill=selected_colors[1], font=medium_font)
                
                # Ajouter un léger flou au background pour un effet professionnel
                try:
                    # Vérifier si le filtre est disponible avant de l'appliquer
                    if hasattr(ImageFilter, 'GaussianBlur'):
                        # Créer une copie, appliquer un filtre et fusionner
                        background = img.copy()
                        background = background.filter(ImageFilter.GaussianBlur(radius=5))  # Réduit le radius pour éviter les problèmes de mémoire
                        # Utiliser une approche plus simple pour la fusion pour éviter les erreurs
                        img = background
                        progress_messages.append("Filtre de flou appliqué avec succès")
                    else:
                        progress_messages.append("Le filtre GaussianBlur n'est pas disponible dans cette version de Pillow")
                except Exception as filter_error:
                    progress_messages.append(f"Info: Effet de filtre non appliqué: {filter_error}")
                    print(f"Erreur lors de l'application du filtre: {filter_error}")
                
                # Ajouter un numéro d'image discrètement
                d = ImageDraw.Draw(img)
                d.text((width-40, height-30), f"#{i+1}", fill=selected_colors[1], font=medium_font)
                
                # Sauvegarder l'image avec un nom significatif
                placeholder_path = os.path.join(images_dir, f"{style}_{format}_{i+1}.png")
                img.save(placeholder_path, quality=95)
                
                image_paths.append(placeholder_path)
                progress_messages.append(f"Image stylisée créée: {placeholder_path}")
        
        except ImportError as import_err:
            progress_messages.append(f"Pillow est requis pour la génération d'images: {import_err}")
            print(f"ImportError détaillée: {import_err}")
            
            # Tenter d'installer Pillow dynamiquement seulement si autorisé
            try:
                # Vérifier d'abord si l'installation automatique est autorisée
                # Cette vérification est importante pour les environnements de production où pip peut ne pas être disponible
                auto_install = os.environ.get('AUTO_INSTALL_DEPS', 'false').lower() == 'true'
                
                if auto_install:
                    import subprocess
                    print("Installation automatique de Pillow...")
                    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pillow'])
                    progress_messages.append("Pillow installé avec succès, nouvelle tentative de génération...")
                else:
                    progress_messages.append("L'installation automatique de dépendances n'est pas activée. Veuillez installer manuellement 'pillow'")
                    print("Pour activer l'installation automatique, définissez la variable d'environnement AUTO_INSTALL_DEPS=true")
                
                # Réessayer après installation
                try:
                    from PIL import Image, ImageDraw, ImageFont
                    # Création d'une image basique après installation réussie
                    for i in range(num_images):
                        img = Image.new('RGB', (800, 450), color=(240, 240, 240))
                        d = ImageDraw.Draw(img)
                        font = ImageFont.load_default()
                        d.text((40, 200), f"Image {i+1} pour {title}", fill=(0, 0, 0), font=font)
                        d.rectangle((20, 20, 780, 430), outline=(200, 200, 200), width=2)
                        placeholder_path = os.path.join(images_dir, f"simple_{i+1}.png")
                        img.save(placeholder_path)
                        image_paths.append(placeholder_path)
                        progress_messages.append(f"Image de base créée: {placeholder_path}")
                    
                except Exception as pil_retry_error:
                    progress_messages.append(f"Échec de la génération après installation: {pil_retry_error}")
                    # Fallback vers des fichiers texte
                    for i in range(num_images):
                        text_path = os.path.join(images_dir, f"image_{i+1}.txt")
                        with open(text_path, 'w') as f:
                            f.write(f"Ceci est un placeholder pour l'image {i+1} du script '{title}'")
                        image_paths.append(text_path)
                        progress_messages.append(f"Fichier texte placeholder créé: {text_path}")
            
            except Exception as install_error:
                progress_messages.append(f"Échec de l'installation de Pillow: {install_error}")
                # Fallback vers des fichiers texte
                for i in range(num_images):
                    text_path = os.path.join(images_dir, f"image_{i+1}.txt")
                    with open(text_path, 'w') as f:
                        f.write(f"Ceci est un placeholder pour l'image {i+1} du script '{title}'")
                    image_paths.append(text_path)
        
        progress_messages.append(f"Génération d'images terminée. {len(image_paths)} images générées.")
        return image_paths, progress_messages
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_details = str(e)
        error_type = type(e).__name__
        
        # Créer des messages d'erreur plus informatifs selon le type d'erreur
        if "permission" in error_details.lower():
            progress_messages.append(f"Erreur de permission: Impossible d'accéder au dossier ou au fichier. Détails: {error_details}")
        elif "memory" in error_details.lower():
            progress_messages.append(f"Erreur de mémoire: Pas assez de mémoire disponible pour générer les images. Essayez avec moins d'images ou de taille plus petite.")
        elif "not found" in error_details.lower() or "no such file" in error_details.lower():
            progress_messages.append(f"Fichier ou dossier introuvable: {error_details}")
        else:
            progress_messages.append(f"Erreur {error_type} lors de la génération d'images: {error_details}")
        
        print(f"Erreur détaillée dans generate_images_for_script: {error_details}")
        return [], progress_messages