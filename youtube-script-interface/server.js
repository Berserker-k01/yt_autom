const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Activer la compression gzip pour améliorer les performances
app.use(compression());

// Améliorer la sécurité avec helmet
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour permettre le chargement des ressources externes
  crossOriginEmbedderPolicy: false,
}));

// Définir les en-têtes de cache appropriés
app.use((req, res, next) => {
  // Pour les fichiers statiques qui changent rarement (images, polices, etc.)
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|eot|ttf|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 an
  } else {
    // Pour les autres ressources, pas de mise en cache
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Servir les fichiers statiques depuis le répertoire build
app.use(express.static(path.join(__dirname, 'build'), {
  etag: true, // Activer les ETag pour une meilleure gestion du cache
}));

// Log pour le débogage des accès
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware pour vérifier si la requête est une requête d'API
const isApiRequest = (req) => {
  return req.url.startsWith('/api/') || req.url.startsWith('/generate-topics') || 
         req.url.startsWith('/generate-script') || req.url.startsWith('/export-pdf');
};

// Gérer les requêtes SPA tout en permettant les appels API
app.get('*', (req, res, next) => {
  // Si c'est une requête API, ne pas interférer
  if (isApiRequest(req)) {
    return next();
  }

  // Si le fichier demandé existe directement, le servir (comme les images, etc.)
  const filePath = path.join(__dirname, 'build', req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // Sinon, rediriger vers l'application SPA
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Erreur:`, err);
  res.status(500).send('Erreur serveur');
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Le serveur est lancé sur le port ${PORT}`);
  console.log(`Application accessible à l'adresse http://localhost:${PORT}`);
});
