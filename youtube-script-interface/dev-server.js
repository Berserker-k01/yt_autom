const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier build
app.use(express.static(path.join(__dirname, 'build')));

// Log toutes les requêtes pour le débogage
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configurer les headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Toutes les requêtes qui ne correspondent pas à un fichier statique sont dirigées vers index.html
// C'est la clé pour une application React Router avec des routes client-side
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur de développement démarré sur http://localhost:${PORT}`);
  console.log('✅ Configuration SPA activée - toutes les routes sont redirigées vers index.html');
});
