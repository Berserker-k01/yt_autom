const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le répertoire build
app.use(express.static(path.join(__dirname, 'build')));

// Gérer les requêtes SPA en redirigeant toutes les requêtes vers index.html
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Le serveur est lancé sur le port ${PORT}`);
});
