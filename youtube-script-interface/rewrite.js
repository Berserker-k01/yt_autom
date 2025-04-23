const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Logging pour le débogage
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir les fichiers statiques depuis le dossier build
app.use(express.static(path.join(__dirname, 'build')));

// Important: configurer les headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Règle cruciale: TOUTES les routes sont gérées par index.html
app.get('/*', function(req, res) {
  console.log(`Redirection SPA: ${req.url} -> index.html`);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur Express démarré sur le port ${PORT}`);
  console.log('Configuration SPA activée - toutes les routes sont redirigées vers index.html');
});
