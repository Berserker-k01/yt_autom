// Serveur Express optimisé pour Render avec gestion SPA robuste
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Activer les logs détaillés
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configuration CORS pour les requêtes API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Servir les fichiers statiques du build
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Liste des extensions que nous savons être des fichiers statiques
const staticFileExtensions = [
  '.js', '.css', '.json', '.ico', '.png', '.jpg', '.jpeg', '.gif', 
  '.svg', '.woff', '.woff2', '.ttf', '.eot', '.map'
];

// Fonction pour détecter si une URL est probablement un fichier statique
const isStaticFileRequest = (url) => {
  return staticFileExtensions.some(ext => url.endsWith(ext));
};

// Middleware de diagnostic pour les requêtes statiques non trouvées
app.use((req, res, next) => {
  const isStaticRequest = isStaticFileRequest(req.url);
  
  if (isStaticRequest) {
    const filePath = path.join(buildPath, req.url);
    console.log(`[DIAGNOSTIC] Requête de fichier statique: ${req.url}`);
    console.log(`[DIAGNOSTIC] Chemin complet: ${filePath}`);
  }
  
  next();
});

// Toute autre requête doit être traitée par React Router
app.get('*', (req, res) => {
  console.log(`[SPA] Redirection de ${req.url} vers index.html`);
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Gestionnaire d'erreurs
app.use((err, req, res, next) => {
  console.error(`[ERREUR] ${err.message}`);
  res.status(500).send('Erreur interne du serveur');
});

app.listen(PORT, () => {
  console.log(`==== Serveur YT Autom démarré sur le port ${PORT} ====`);
  console.log(`Date de démarrage: ${new Date().toISOString()}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Dossier build: ${buildPath}`);
});
