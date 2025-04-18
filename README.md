# 🎬 Automation YouTube Script

## Présentation

Automation YouTube Script est un outil d'automatisation conçu pour faciliter la création et la gestion de scripts pour vidéos YouTube. Il génère automatiquement des idées, analyse leur potentiel, crée des scripts détaillés et exporte le tout dans des formats professionnels. Idéal pour les créateurs de contenu souhaitant optimiser leur workflow et gagner du temps.

## Fonctionnalités principales
- Génération automatique d'idées de sujets basées sur vos thèmes
- Analyse du potentiel de chaque sujet (concurrence, monétisation, estimation des vues, public cible)
- Création de scripts détaillés et structurés pour YouTube
- Exportation professionnelle (PDF, JSON, SEO)
- Utilisation sécurisée des clés API via un fichier `.env`
- Interface simple en ligne de commande

## Prérequis
- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)
- Clés API (Anthropic Claude, Perplexity)

## Installation
1. Clonez le dépôt :
   ```bash
   git clone <URL_DU_DEPOT>
   cd Automation_yt_script
   ```
2. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

## Configuration
Avant d'utiliser le script, créez un fichier `.env` à la racine du projet avec vos clés API :
```env
ANTHROPIC_API_KEY=votre_clé_claude
PERPLEXITY_API_KEY=votre_clé_perplexity
```
> ⚠️ Ne partagez jamais votre fichier `.env` publiquement.

## Utilisation (mode ligne de commande)
Lancez le script principal :
```bash
python main.py
```
Suivez les instructions à l'écran :
- Entrez votre thème
- Choisissez un sujet parmi les suggestions
- Récupérez votre script généré dans le dossier `output`

---

## 🚀 Déploiement et utilisation de l'interface web

Le projet propose aussi une interface web moderne (React) connectée à un backend Python (Flask) pour une expérience complète.

### 1. Installation du backend (API Flask)

Depuis le dossier `backend` :
```bash
cd backend
pip install -r requirements.txt
```

Lancez le serveur Flask (API) :
```bash
python app.py
```
Cela démarre l'API sur http://localhost:5000

Endpoints exposés :
- `POST /generate-topics` : Génère des sujets tendances à partir d’un thème (JSON: `{ theme: "..." }`)
- `POST /generate-script` : Génère un script détaillé à partir d’un sujet (JSON: `{ topic: "...", research: "" }`)
- `POST /export-pdf` : Génère et retourne le PDF du script (JSON: `{ script: ... }`)

### 2. Installation et lancement du frontend (React)

Depuis le dossier `youtube-script-interface` :
```bash
cd youtube-script-interface
npm install
npm start
```

L'interface web s'ouvre sur http://localhost:3000

### 3. Utilisation via l'interface web
- Entrez un thème dans le champ prévu
- Cliquez sur "Générer les sujets" pour obtenir des sujets tendances
- Sélectionnez un sujet pour générer un script détaillé
- Visualisez le script structuré et téléchargez-le au format PDF

### 4. Organisation des dossiers
```
Automation_yt_script/
├── main.py                # Moteur IA Python (CLI)
├── requirements.txt       # Dépendances Python (CLI)
├── .env                   # Variables d'environnement (API keys)
├── backend/               # Backend Flask (API)
│   ├── app.py             # Serveur Flask
│   └── requirements.txt   # Dépendances backend
├── youtube-script-interface/ # Frontend React
│   ├── src/App.js         # Interface principale
│   └── ...
├── output/                # Scripts générés (PDF, JSON)
├── README.md              # Documentation
```

### 5. Conseils
- Assurez-vous que le backend (Flask) tourne avant de lancer le frontend React.
- Les clés API doivent être présentes dans `.env` à la racine du projet.
- Le frontend communique avec le backend via http://localhost:5000
- Pour un déploiement cloud, adapter les variables d'environnement et les ports si besoin.

---

## Structure du projet
```
Automation_yt_script/
├── main.py                # Script principal
├── requirements.txt       # Dépendances Python
├── .env                   # Variables d'environnement (à créer)
├── output/                # Scripts générés (PDF, JSON)
├── README.md              # Documentation
```

## Contribution
Les contributions sont les bienvenues ! Pour contribuer :
1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-nouvelle-fonctionnalite`)
3. Commitez vos changements (`git commit -am 'Ajout d'une nouvelle fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus d’informations.

## Contact
Pour toute question, suggestion ou bug :
- Ouvrez une issue sur le dépôt GitHub
- Contactez le mainteneur : [Votre Nom ou Pseudo](mailto:votre.email@example.com)
