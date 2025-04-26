import os
from dotenv import load_dotenv
import json
from datetime import datetime
import requests
from fpdf import FPDF
import google.generativeai as genai

# Import optionnel de Tavily
try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
    print("Tavily importé avec succès")
except ImportError:
    TAVILY_AVAILABLE = False
    print("Tavily non disponible, utilisation de SerpAPI comme fallback")

# Charge les variables d'environnement
load_dotenv()

# Configuration des APIs
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TAVILY_API_KEY = "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"  # Clé API Tavily

# Configuration de Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Configuration de Tavily si disponible
tavily_client = None
if TAVILY_AVAILABLE:
    try:
        tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
        print("Client Tavily initialisé avec succès")
    except Exception as e:
        print(f"Erreur lors de l'initialisation du client Tavily: {e}")
        TAVILY_AVAILABLE = False

def gemini_generate(prompt: str) -> str:
    """Génère du texte avec Gemini."""
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
        
    except Exception as e:
        print(f"Erreur Gemini: {e}")
        return ""

def tavily_search(query: str, num_results: int = 5) -> str:
    """Effectue une recherche via Tavily API."""
    if not TAVILY_AVAILABLE:
        print("Tavily non disponible, utilisation de SerpAPI comme fallback")
        return serpapi_search(query, num_results)
    
    try:
        print(f"Recherche Tavily pour: {query}")
        
        # Effectuer la recherche avec Tavily
        search_response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=num_results,
            include_answer=True,
            include_domains=[], # Laisser vide pour rechercher partout
            include_raw_content=False,
        )
        
        print(f"Recherche Tavily terminée, traitement des résultats...")
        
        # Extraire les résultats
        results = search_response.get("results", [])
        answer = search_response.get("answer", "")
        
        if not results:
            print("Aucun résultat trouvé dans la réponse Tavily")
            # Générer des sources fictives pour les tests si Tavily ne fonctionne pas
            if len(query) > 0:
                return "Source: https://example.com/article1\nTitre: Article sur " + query + "\nRésumé: Résumé de l'article...\n"
            return ""
        
        # Combine les résultats
        search_data = []
        for r in results:
            title = r.get("title", "")
            content = r.get("content", "")
            url = r.get("url", "")
            search_data.append(f"Source: {url}\nTitre: {title}\nRésumé: {content}\n")
        
        # Ajouter la réponse synthétisée par Tavily au début si disponible
        result_text = ""
        if answer:
            result_text = f"Synthèse Tavily: {answer}\n\n---\n\n"
        
        result_text += "\n---\n".join(search_data)
        print(f"Résultats de recherche extraits, {len(search_data)} sources trouvées.")
        return result_text
    
    except Exception as e:
        print(f"Erreur Tavily: {e}")
        # Générer des sources fictives pour les tests
        if len(query) > 0:
            return "Source: https://example.com/fallback\nTitre: Fallback pour " + query + "\nRésumé: Ceci est une source de secours...\n"
        return ""

def serpapi_search(query: str, num_results: int = 5) -> str:
    """Effectue une recherche via SerpAPI (Google)."""
    try:
        print(f"Recherche SerpAPI pour: {query}")
        params = {
            "q": query,
            "api_key": SERPAPI_KEY,
            "num": num_results,
            "hl": "fr"
        }
        response = requests.get("https://serpapi.com/search", params=params)
        print(f"Statut de la réponse SerpAPI: {response.status_code}")
        response.raise_for_status()
        
        # Débug: Afficher les clés disponibles dans la réponse
        response_json = response.json()
        print(f"Clés disponibles dans la réponse: {list(response_json.keys())}")
        
        results = response_json.get("organic_results", [])
        print(f"Nombre de résultats organiques: {len(results)}")
        
        if not results:
            # Essayer d'autres clés si organic_results est vide
            results = response_json.get("results", [])
            if not results:
                print("Aucun résultat trouvé dans la réponse SerpAPI")
                # Générer des sources fictives pour les tests si SERPAPI ne fonctionne pas
                if len(query) > 0:
                    return "Source: https://example.com/article1\nTitre: Article sur " + query + "\nRésumé: Résumé de l'article...\n"
                return ""
            
        # Combine les snippets et titres
        search_data = []
        for r in results:
            title = r.get("title", "")
            snippet = r.get("snippet", "")
            link = r.get("link", "")
            if not link and "link" not in r:  # Vérifier format alternatif
                link = r.get("url", r.get("displayUrl", "https://example.com"))
            search_data.append(f"Source: {link}\nTitre: {title}\nRésumé: {snippet}\n")
            
        result = "\n---\n".join(search_data)
        print(f"Résultats de recherche extraits, {len(search_data)} sources trouvées.")
        return result
        
    except Exception as e:
        print(f"Erreur SerpAPI: {e}")
        # Générer des sources fictives pour les tests
        if len(query) > 0:
            return "Source: https://example.com/fallback\nTitre: Fallback pour " + query + "\nRésumé: Ceci est une source de secours...\n"
        return ""

def fetch_research(query: str) -> str:
    """Effectue une recherche approfondie en utilisant Tavily + Gemini."""
    # Recherche générale
    general_search = tavily_search(f"{query} actualités derniers mois", num_results=3)
    technical_search = tavily_search(f"{query} analyse technique avis expert", num_results=3)
    
    if not general_search and not technical_search:
        return ""
    
    research_prompt = f"""En tant qu'expert en création de contenu, analyse ces recherches sur : {query}

RECHERCHES GÉNÉRALES:
{general_search}

RECHERCHES TECHNIQUES:
{technical_search}

Fournis une analyse structurée avec:
1. Contexte actuel et tendances
2. Points techniques importants
3. Statistiques et données clés
4. Avis d'experts
5. Controverses ou débats
6. Sources fiables citées
"""
    
    return gemini_generate(research_prompt)

def generate_topics(theme: str, num_topics: int = 5, user_context: dict = None) -> list:
    """Génère des sujets d'actualité en utilisant Tavily + Gemini."""
    print(f"\nRecherche d'informations sur: {theme}")
    search_results = tavily_search(f"{theme} tendances actualités podcast youtube", num_results=5)
    
    if not search_results:
        print("Aucun résultat de recherche trouvé")
        return []
    
    # Extrait les sources des résultats de recherche
    sources = extract_sources(search_results)
    print(f"\n{len(sources)} sources trouvées:")
    for i, source in enumerate(sources, 1):
        print(f"[{i}] {source}")
    
    # Construction du prompt avec le contexte utilisateur si disponible
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
    
    Voici les résultats de recherche à exploiter :
    {search_results}
    
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
        
        # Ajouter les sources à chaque sujet généré
        sources = extract_sources(search_results)
        for topic in topics:
            topic['sources'] = sources
            
        print(f"\n{len(topics)} sujets générés avec succès")
        return topics[:num_topics]
        
    except json.JSONDecodeError as e:
        print(f"Erreur: Réponse JSON invalide - {str(e)}")
        print(f"Début de la réponse reçue: {response[:200]}...")
        return []

def extract_sources(research_text: str) -> list:
    """Extrait les sources depuis un texte de recherche."""
    sources = []
    
    # Vérifier si le texte est vide ou None
    if not research_text:
        print("Aucun texte de recherche fourni pour extraire les sources")
        return sources
        
    print(f"Extraction des sources depuis un texte de {len(research_text)} caractères")
    
    # Séparation par lignes
    lines = research_text.split('\n')
    
    for line in lines:
        if line.strip().startswith("Source: "):
            source_url = line.replace("Source: ", "").strip()
            if source_url and not source_url in sources:  # Éviter les doublons
                sources.append(source_url)
                print(f"Source extraite: {source_url}")
                
    print(f"{len(sources)} sources uniques extraites")
    
    # Générer des sources factices si aucune n'est trouvée
    if len(sources) == 0:
        sources = [
            "https://example.com/source1",
            "https://example.com/source2",
            "https://example.com/source3"
        ]
        print("Génération de sources factices pour les tests")
        
    return sources

def analyze_topic_potential(topic: str) -> dict:
    """Analyse le potentiel d'un sujet en utilisant Tavily + Gemini."""
    print(f"\nAnalyse du potentiel pour: {topic}")
    
    # Recherche de données sur le sujet
    search_data = tavily_search(f"{topic} youtube tendances vues engagement", num_results=3)
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

def generate_script(topic: str, research: str, user_context: dict = None) -> str:
    """Génère un script détaillé avec Tavily + Gemini et retourne le texte intégral."""
    # Récupérer des informations supplémentaires avec Tavily ou SerpAPI
    print(f"Recherche d'informations supplémentaires pour: {topic}")
    if TAVILY_AVAILABLE:
        additional_research = tavily_search(f"{topic} faits statistiques études expert tendances", num_results=3)
    else:
        # Utiliser simplement les recherches existantes si Tavily n'est pas disponible
        print("Tavily non disponible, utilisation des recherches existantes uniquement")
        additional_research = ""
    
    # Construction du prompt avec le contexte utilisateur si disponible
    user_context_str = ""
    youtuber_name = "Non spécifié"
    channel_name = "Non spécifié"
    video_style = "Non spécifié"
    approach_style = "Non spécifié"
    target_audience = "Non spécifié"
    video_length = "10-15 minutes"
    language = "français"
    content_type = "général"
    
    # Extraire toutes les informations disponibles du profil
    if user_context:
        youtuber_name = user_context.get('youtuber_name', 'Non spécifié')
        channel_name = user_context.get('channel_name', 'Non spécifié')
        video_style = user_context.get('video_style', 'Non spécifié')
        approach_style = user_context.get('approach_style', user_context.get('tone', 'professionnel'))
        target_audience = user_context.get('target_audience', user_context.get('audience_age', 'adultes'))
        video_length = user_context.get('video_length', '10-15 minutes')
        language = user_context.get('language', 'français')
        content_type = user_context.get('content_type', 'général')
        
        # Vérifier les options personnalisées
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
- Durée vidéo préférée: {video_length}
"""

        # Ajouter les options personnalisées si présentes
        if custom_options and len(custom_options) > 0:
            user_context_str += "\nPréférences personnalisées du créateur:\n"
            for key, value in custom_options.items():
                user_context_str += f"- {key}: {value}\n"
    
    # Adapter le prompt en fonction de la disponibilité des recherches supplémentaires
    additional_research_section = ""
    if additional_research:
        additional_research_section = f"""
Recherches complémentaires (à intégrer dans le script pour l'enrichir):
{additional_research}
"""
    
    # Construire un prompt plus personnalisé basé sur le profil
    intro_style = ""
    if video_style and video_style.lower() != "non spécifié":
        if "informatif" in video_style.lower():
            intro_style = "Adopte un ton informatif et éducatif, en expliquant clairement les concepts."
        elif "divertissant" in video_style.lower():
            intro_style = "Utilise de l'humour et un ton dynamique pour capter l'attention."
        elif "tutoriel" in video_style.lower():
            intro_style = "Explique étape par étape avec des instructions claires et précises."
        elif "vlog" in video_style.lower():
            intro_style = "Adopte un ton conversationnel et partage des anecdotes personnelles."
    
    # Adjust for audience
    audience_adaptation = ""
    if target_audience and target_audience.lower() != "non spécifié":
        if "enfant" in target_audience.lower() or "jeune" in target_audience.lower():
            audience_adaptation = "Utilise un langage simple et des exemples ludiques adaptés à un jeune public."
        elif "professionnel" in target_audience.lower() or "business" in target_audience.lower():
            audience_adaptation = "Emploie un vocabulaire technique approprié et des exemples professionnels pertinents."
        elif "expert" in target_audience.lower():
            audience_adaptation = "Aborde des concepts avancés sans simplifier excessivement."
    
    # Adapter la longueur du script
    length_guidance = ""
    if video_length and video_length.lower() != "non spécifié":
        # Extraire les minutes approximatives
        minutes = 10
        if "-" in video_length:
            parts = video_length.replace("minutes", "").replace("minute", "").strip().split("-")
            if len(parts) >= 2 and parts[1].strip().isdigit():
                minutes = int(parts[1].strip())
        elif video_length.replace("minutes", "").replace("minute", "").strip().isdigit():
            minutes = int(video_length.replace("minutes", "").replace("minute", "").strip())
            
        word_count = minutes * 150  # Environ 150 mots par minute
        length_guidance = f"Crée un script d'environ {word_count} mots pour une vidéo de {minutes} minutes."
    
    # Salutation personnalisée si le nom est disponible
    greeting = ""
    if youtuber_name and youtuber_name.lower() != "non spécifié":
        greeting = f"Inclus une salutation personnalisée: 'Salut tout le monde, c'est {youtuber_name} et bienvenue sur {channel_name}'."
    
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
- {greeting}
- {intro_style}
- {audience_adaptation}
- {length_guidance}
- Termine par un call-to-action adapté à la chaîne: invite à s'abonner, liker et partager.

Contexte et recherches primaires :
{research}
{additional_research_section}

Commence directement par le [HOOK] puis enchaîne les sections.
"""

    response = gemini_generate(script_prompt)
    # Affichage de debug pour tracer ce que retourne Gemini
    print(f"DEBUG: Réponse Gemini (100 premiers caractères): {response[:100] if response else 'Vide'}")
    return response.strip() if response else ""

def save_to_pdf(script_text: str, title: str = None, author: str = None, channel: str = None, sources: list = None) -> str:
    """Version simplifiée et robuste de sauvegarde en PDF."""
    import tempfile
    
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
        
        print(f"Création de PDF à l'emplacement: {filename}")
        
        # Toujours créer un fichier texte de secours
        with open(filename.replace('.pdf', '.txt'), 'w', encoding='utf-8') as f:
            f.write("=" * 50 + "\n")
            f.write(f"TITRE: {title or 'Script YouTube'}\n")
            f.write(f"AUTEUR: {author or 'Non spécifié'}\n")
            f.write(f"CHAÎNE: {channel or 'Non spécifiée'}\n")
            f.write("=" * 50 + "\n\n")
            f.write(script_text)
            
            if sources and len(sources) > 0:
                f.write("\n\n" + "=" * 50 + "\n")
                f.write("SOURCES:\n")
                for i, source in enumerate(sources, 1):
                    f.write(f"[{i}] {source}\n")
        
        print(f"Fichier texte de secours créé: {filename.replace('.pdf', '.txt')}")
            
        # Version simplifiée avec FPDF
        try:
            # Nettoyage du texte de tous les caractères non-ASCII
            cleaned_text = ""
            for char in script_text:
                if ord(char) < 128 or char in 'àâäçèéêëîïôöùûüÿÀÂÄÇÈÉÊËÎÏÔÖÙÛÜŸ':
                    cleaned_text += char
                else:
                    cleaned_text += ' '
            
            # Créer PDF basique
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            
            # Titre
            pdf.set_font('Arial', 'B', 16)
            pdf.cell(0, 10, (title or "Script YouTube")[:50], 0, 1, 'C')
            
            # Infos auteur
            if author or channel:
                pdf.set_font('Arial', 'I', 12)
                info = ""
                if author: 
                    info += f"Par: {author}"
                if channel:
                    if info: 
                        info += " | "
                    info += f"Chaîne: {channel}"
                pdf.cell(0, 8, info, 0, 1, 'C')
            
            # Contenu principal
            pdf.set_font('Arial', '', 12)
            pdf.ln(5)
            
            # Traiter le texte par petits morceaux pour éviter les erreurs
            lines = cleaned_text.split('\n')
            for line in lines:
                if not line.strip():
                    pdf.ln(4)
                    continue
                
                if '[' in line and ']' in line and line.find('[') < line.find(']'):
                    pdf.ln(4)
                    pdf.set_font('Arial', 'B', 13)
                    pdf.multi_cell(0, 8, line[:80])  # Limiter la longueur pour éviter les erreurs
                    pdf.set_font('Arial', '', 12)
                else:
                    # Diviser les longues lignes en segments de 80 caractères
                    for i in range(0, len(line), 80):
                        segment = line[i:i+80]
                        if segment.strip():
                            pdf.multi_cell(0, 8, segment)
            
            # Sources
            if sources and len(sources) > 0:
                pdf.add_page()
                pdf.set_font('Arial', 'B', 16)
                pdf.cell(0, 10, "Sources", 0, 1, 'C')
                pdf.ln(5)
                
                pdf.set_font('Arial', '', 12)
                for i, source in enumerate(sources, 1):
                    source_text = str(source)
                    if len(source_text) > 80:
                        source_text = source_text[:80] + "..."
                    pdf.multi_cell(0, 8, f"[{i}] {source_text}")
            
            # Sauvegarder le PDF
            pdf.output(filename)
            
            # Vérifier la création du PDF
            if os.path.exists(filename) and os.path.getsize(filename) > 100:
                print(f"PDF généré avec succès: {filename}")
                return filename
            else:
                print("PDF non généré ou trop petit, utilisation du fichier texte")
                return filename.replace('.pdf', '.txt')
                
        except Exception as e:
            print(f"Erreur FPDF: {str(e)}")
            print(f"Utilisation du fichier texte à la place: {filename.replace('.pdf', '.txt')}")
            return filename.replace('.pdf', '.txt')
            
    except Exception as e:
        print(f"Erreur critique: {str(e)}")
        import traceback
        traceback.print_exc()
        return ""

def save_as_text(script: dict, filename: str):
    """Sauvegarde le script en format texte si le PDF échoue."""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"{'='*50}\n")
        f.write(f"TITRE: {script.get('title', '')}\n")
        f.write(f"{'='*50}\n\n")
        
        f.write("INFORMATIONS GÉNÉRALES\n")
        metadata = script.get("metadata", {})
        for key, value in metadata.items():
            f.write(f"{key.replace('_', ' ').title()}: {value}\n")
        
        f.write("\nPRÉ-PRODUCTION\n")
        pre_prod = script.get("pre_production", {})
        for key, value in pre_prod.items():
            f.write(f"{key.replace('_', ' ').title()}: {value}\n")
        
        f.write("\nSCRIPT DÉTAILLÉ\n")
        for section in script.get("script_sections", []):
            f.write(f"\n{section.get('section_title', '')}\n")
            f.write(f"Durée: {section.get('duration', '')}\n")
            f.write(f"Contenu:\n{section.get('content', '')}\n")
            if section.get("notes"):
                f.write("Notes:\n")
                for note in section["notes"]:
                    f.write(f"- {note}\n")
            if section.get("visuals"):
                f.write("Visuels:\n")
                for visual in section["visuals"]:
                    f.write(f"- {visual}\n")
        
        f.write("\nMARKETING ET PROMOTION\n")
        marketing = script.get("marketing", {})
        for key, value in marketing.items():
            f.write(f"{key.replace('_', ' ').title()}: {value}\n")

def run_workflow(theme: str = None) -> list:
    """Exécute le workflow complet de génération de script."""
    if not theme:
        theme = input("Entrez votre thème (ex: Tech et Innovation): ")
    
    print(f"\nGénération de sujets pour le thème: {theme}")
    topics = generate_topics(theme)
    
    if not topics:
        print("\nÉchec de la génération des sujets")
        return []
    
    print("\nSujets suggérés:\n")
    analyzed_topics = []
    
    for i, topic_data in enumerate(topics, 1):
        print(f"{i}. {topic_data['title']}")
        print(f"   Angle: {topic_data['angle']}")
        print(f"   Pourquoi: {topic_data['why_interesting']}")
        
        # Afficher les sources pour ce sujet
        if 'sources' in topic_data and topic_data['sources']:
            print(f"   Sources ({len(topic_data['sources'])}):") 
            for j, source in enumerate(topic_data['sources'], 1):
                print(f"      [{j}] {source}")
        print()  # Ligne vide pour la lisibilité
        
        # Analyse le potentiel du sujet
        potential = analyze_topic_potential(topic_data['title'])
        topic_data['potential'] = potential
        analyzed_topics.append(topic_data)
    
    return topics  # Retourne la liste originale pour préserver l'ordre

def main():
    """Point d'entrée principal."""
    theme = input("Entrez votre thème (ex: Tech et Innovation): ")
    topics = run_workflow(theme=theme)
    
    if not topics:
        return
    
    print("\nVoulez-vous générer un script pour l'un de ces sujets ? (1-5, ou 'n' pour quitter)")
    choice = input("> ")
    
    if choice.lower() == 'n':
        return
        
    try:
        index = int(choice) - 1
        if 0 <= index < len(topics):
            selected_topic = topics[index]
            print(f"\nGénération du script pour: {selected_topic['title']}")
            
            # Recherche approfondie sur le sujet
            research = fetch_research(selected_topic['title'])
            if not research:
                print("Aucune recherche trouvée, utilisation d'un contexte de test.")
                research = f"Contexte fictif pour test: {selected_topic['title']} est un sujet important qui touche à de multiples domaines et intéresse beaucoup de personnes aujourd'hui."
                
            # Génération du script
            script_text = generate_script(selected_topic['title'], research)
            print(f"DEBUG: Longueur du script généré: {len(script_text)} caractères")
            
            if not script_text:
                print("Aucun script généré, utilisation d'un script de secours.")
                script_text = f"""[HOOK]
Bienvenue à cette vidéo sur {selected_topic['title']}! Aujourd'hui nous allons explorer ce sujet fascinant.

[INTRODUCTION]
Le sujet de {selected_topic['title']} est plus important que jamais. Dans cette vidéo, nous allons voir pourquoi et comment cela nous affecte tous.

[PARTIE 1]
Commençons par comprendre les bases. Ce sujet touche plusieurs aspects de notre quotidien...

[PARTIE 2]
Maintenant, examinons les impacts concrets et les chiffres qui montrent l'importance de ce phénomène...

[CONCLUSION]
N'oubliez pas de liker cette vidéo et de vous abonner pour plus de contenu comme celui-ci!"""
                
            # Récupération des sources
            sources = selected_topic.get('sources', [])
            
            # Génération du PDF avec les sources
            filename = save_to_pdf(script_text, title=selected_topic['title'], author="Auteur Inconnu", channel="Chaîne Inconnue", sources=sources)
            if filename:
                print(f"\nScript généré et sauvegardé: {filename}")
                print(f"Sources incluses dans le PDF: {len(sources)}")
            else:
                print("\nÉchec de la génération du PDF")
            
        else:
            print("Choix invalide - Veuillez entrer un nombre entre 1 et", len(topics))
            
    except ValueError:
        print("Entrée invalide - Veuillez entrer un nombre ou 'n' pour quitter")

def estimate_reading_time(script: str) -> dict:
    """Estime le temps de lecture d'un script et fournit une analyse détaillée."""
    # Analyse du texte
    words = script.split()
    word_count = len(words)
    
    # Analyse des sections
    sections = []
    current_section = {"title": "Sans titre", "text": "", "start_pos": 0}
    lines = script.split('\n')
    
    for line_num, line in enumerate(lines):
        if '[' in line and ']' in line and line.strip().startswith('['):
            # Si on a trouvé une nouvelle section et qu'on a déjà du texte, on sauvegarde la section précédente
            if current_section["text"]:
                section_words = len(current_section["text"].split())
                current_section["word_count"] = section_words
                current_section["estimated_time"] = round(section_words / 150 * 60)  # secondes
                sections.append(current_section)
            
            # Nouvelle section
            section_title = line.strip()
            current_section = {
                "title": section_title,
                "text": "",
                "start_pos": line_num,
                "line_num": line_num
            }
        else:
            # Ajouter à la section courante
            current_section["text"] += line + " "
    
    # Ajouter la dernière section
    if current_section["text"]:
        section_words = len(current_section["text"].split())
        current_section["word_count"] = section_words
        current_section["estimated_time"] = round(section_words / 150 * 60)  # secondes
        sections.append(current_section)
    
    # Calcul du temps total (150 mots/min est la vitesse moyenne de parole)
    total_seconds = round(word_count / 150 * 60)
    minutes, seconds = divmod(total_seconds, 60)
    
    # Calcul de la répartition du temps
    total_minutes = max(1, round(total_seconds / 60))
    
    # Analyse avancée
    sentence_count = len([s for s in script.replace('!', '.').replace('?', '.').split('.') if s.strip()])
    avg_sentence_length = word_count / max(1, sentence_count)
    
    # Formatage pour l'affichage
    formatted_time = f"{minutes:02d}:{seconds:02d}"
    
    return {
        "total_words": word_count,
        "total_sentences": sentence_count,
        "avg_sentence_length": round(avg_sentence_length, 1),
        "total_seconds": total_seconds,
        "formatted_time": formatted_time,
        "minutes": int(minutes),
        "seconds": int(seconds),
        "sections": sections,
        "sections_count": len(sections),
        "estimated_retention": calculate_retention_estimate(word_count, sections)
    }

def calculate_retention_estimate(word_count: int, sections: list) -> dict:
    """Calcule une estimation approximative de la rétention d'audience basée sur des métriques YouTube standards."""
    # Heuristiques basées sur des statistiques YouTube
    
    # Indice de base selon la longueur (plus c'est long, plus la rétention diminue en moyenne)
    base_retention = 95 - min(40, (word_count / 150 * 60) / 60 * 10)
    
    # Bonus structurel (plus il y a de sections bien délimitées, meilleure est la rétention)
    sections_bonus = min(5, len(sections) * 0.5)
    
    # Check si le script a un hook et une conclusion clairs
    has_hook = any("hook" in section["title"].lower() for section in sections)
    has_conclusion = any("conclusion" in section["title"].lower() for section in sections)
    hook_bonus = 3 if has_hook else 0
    conclusion_bonus = 2 if has_conclusion else 0
    
    # Calculer le score final (clamp entre 30% et 85%)
    retention_score = base_retention + sections_bonus + hook_bonus + conclusion_bonus
    retention_score = max(30, min(85, retention_score))
    
    return {
        "percentage": round(retention_score),
        "factors": {
            "base_retention": round(base_retention, 1),
            "sections_bonus": round(sections_bonus, 1),
            "hook_bonus": hook_bonus,
            "conclusion_bonus": conclusion_bonus
        }
    }

def modify_script_with_ai(original_script: str, modification_request: str, user_context: dict = None) -> str:
    """Modifie un script existant selon les demandes spécifiques de l'utilisateur en utilisant Tavily pour enrichir le contenu."""
    # Extraire le sujet du script pour rechercher des informations supplémentaires
    script_lines = original_script.split('\n')
    topic = ""
    for line in script_lines[:10]:  # Regarder dans les 10 premières lignes pour trouver le sujet
        if ("[HOOK]" in line or "[INTRODUCTION]" in line) and len(line) > 10:
            topic = line.replace("[HOOK]", "").replace("[INTRODUCTION]", "").strip()
            break
    
    if not topic and len(script_lines) > 0:
        topic = script_lines[0].strip()
    
    print(f"Sujet détecté pour la recherche: {topic}")
    
    # Rechercher des informations supplémentaires liées à la demande de modification
    additional_info = ""
    if topic and TAVILY_AVAILABLE:
        print(f"Recherche d'informations supplémentaires sur Tavily pour enrichir la modification...")
        search_query = f"{topic} {modification_request}"
        additional_info = tavily_search(search_query, num_results=2)
        print(f"Informations supplémentaires récupérées ({len(additional_info)} caractères)")
    else:
        print("Tavily non disponible ou aucun sujet détecté, pas de recherche supplémentaire")
    
    # Extraire les informations du profil
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
        youtuber_name = user_context.get('youtuber_name', 'Non spécifié')
        channel_name = user_context.get('channel_name', 'Non spécifié')
        video_style = user_context.get('video_style', user_context.get('content_style', 'Non spécifié'))
        approach_style = user_context.get('approach_style', user_context.get('tone', 'professionnel'))
        target_audience = user_context.get('target_audience', user_context.get('audience_age', 'adultes'))
        language = user_context.get('language', 'français')
        content_type = user_context.get('content_type', 'général')
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
            style_guidance = "Garde un ton informatif et factuel. Assure-toi que les explications sont claires et pédagogiques."
        elif "divertissant" in video_style.lower():
            style_guidance = "Maintiens un ton énergique et divertissant. N'hésite pas à utiliser l'humour et des anecdotes engageantes."
        elif "tutoriel" in video_style.lower():
            style_guidance = "Conserve une structure claire avec des étapes bien définies. Assure-toi que les instructions sont précises."
        elif "vlog" in video_style.lower():
            style_guidance = "Garde le style conversationnel et personnel du script. Assure-toi que ça semble naturel et authentique."
            
    # Personnalisation pour l'audience
    audience_guidance = ""
    if target_audience and target_audience.lower() != "non spécifié":
        if "enfant" in target_audience.lower() or "jeune" in target_audience.lower():
            audience_guidance = "Garde un langage simple et des explications accessibles pour un jeune public."
        elif "professionnel" in target_audience.lower() or "business" in target_audience.lower():
            audience_guidance = "Maintiens un vocabulaire professionnel et des exemples pertinents pour un public d'affaires."
        elif "expert" in target_audience.lower():
            audience_guidance = "Conserve la profondeur technique et ne simplifie pas excessivement les concepts."
    
    # Assurer les mentions de marque
    branding_guidance = ""
    if youtuber_name and youtuber_name.lower() != "non spécifié" and channel_name and channel_name.lower() != "non spécifié":
        branding_guidance = f"Assure-toi que les références au créateur ('{youtuber_name}') et à la chaîne ('{channel_name}') sont correctement maintenues dans le script."
    
    # Adapter le prompt en fonction de la disponibilité des informations supplémentaires
    additional_info_section = ""
    if additional_info:
        additional_info_section = f"""
INFORMATIONS SUPPLÉMENTAIRES POUR ENRICHIR LE CONTENU:
{additional_info}
"""
    
    # Prompt de modification de script
    modification_prompt = f"""En tant qu'expert en rédaction de scripts YouTube, modifie le script suivant selon cette demande :

DEMANDE DE MODIFICATION:
{modification_request}

SCRIPT ORIGINAL:
{original_script}

CONTEXTE CRÉATEUR:
{user_context_str}
{additional_info_section}

Instructions:
1. Conserve la structure en sections (ex: [HOOK], [INTRODUCTION], etc.)
2. {style_guidance}
3. {audience_guidance}
4. {branding_guidance}
5. Intègre subtilement les nouvelles informations et données pertinentes des recherches supplémentaires
6. Assure-toi que les transitions restent fluides
7. Retourne uniquement le script modifié, sans commentaires ni explications
8. Assure-toi que le script reste captivant et adapté au format YouTube
9. Cite les sources si pertinent dans le contenu
10. Conserve ou améliore le call-to-action à la fin (invitation à s'abonner, liker, etc.)
"""

    print(f"Modification du script avec la demande : {modification_request[:100]}...")
    response = gemini_generate(modification_prompt)
    print(f"Script modifié généré ({len(response)} caractères)")
    
    return response

if __name__ == "__main__":
    main()
