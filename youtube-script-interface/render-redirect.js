// Fichier spécifique pour Render: résout les problèmes de routage SPA
// À inclure dans le processus de build pour Render

const fs = require('fs');
const path = require('path');

// S'assurer que le fichier _redirects existe et contient la configuration correcte
const redirectsPath = path.join(__dirname, 'build', '_redirects');
const redirectsContent = '/* /index.html 200';

// Écrire le fichier _redirects (ou le remplacer s'il existe déjà)
fs.writeFileSync(redirectsPath, redirectsContent);
console.log('✅ Fichier _redirects créé avec succès pour la redirection SPA');

// Créer un fichier 200.html qui est une copie de index.html
// Certains hébergeurs utilisent cette approche pour gérer les routes SPA
const indexPath = path.join(__dirname, 'build', 'index.html');
const notFoundPath = path.join(__dirname, 'build', '200.html');

if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath);
  fs.writeFileSync(notFoundPath, indexContent);
  console.log('✅ Fichier 200.html créé avec succès pour la gestion SPA');
} else {
  console.error('❌ Impossible de créer 200.html: index.html non trouvé');
}

console.log('🚀 Configuration Render terminée');
