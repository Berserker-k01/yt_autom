# 🔧 Guide de dépannage - Problème de création de compte

## Problème : Le compte ne se crée pas et ça continue de charger

### Solutions à essayer :

#### 1. Vérifier que le backend est démarré
```bash
# Dans le dossier backend
cd backend
python app_saas.py
```

Vous devriez voir :
```
🚀 Scripty SaaS API Starting...
📍 Port: 5000
```

#### 2. Vérifier l'URL de l'API
- En développement : `http://localhost:5000`
- En production : Votre URL de déploiement (ex: `https://yt-autom.onrender.com`)

Le frontend détecte automatiquement l'environnement, mais vous pouvez forcer l'URL avec :
```bash
# Dans le dossier youtube-script-interface
REACT_APP_API_URL=http://localhost:5000 npm start
```

#### 3. Vérifier la console du navigateur
Ouvrez la console (F12) et regardez les erreurs :
- Erreurs CORS
- Erreurs de connexion
- Erreurs de timeout

#### 4. Vérifier la base de données
Assurez-vous que PostgreSQL est démarré et que les tables sont créées :
```bash
# Vérifier que la base de données est accessible
psql -U postgres -d scripty_dev
```

#### 5. Vérifier les logs du backend
Regardez les logs du serveur Flask pour voir les erreurs :
- Erreurs de base de données
- Erreurs de validation
- Erreurs de création de subscription

#### 6. Tester l'endpoint directement
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test1234"
  }'
```

### Améliorations apportées :

1. ✅ **Timeout de 10 secondes** - La requête ne restera pas bloquée indéfiniment
2. ✅ **Meilleure gestion d'erreurs** - Messages d'erreur plus clairs
3. ✅ **Logs console** - Pour déboguer facilement
4. ✅ **Gestion d'erreur pour subscription** - Ne bloque plus si la subscription échoue
5. ✅ **Détection automatique de l'environnement** - URL API adaptée selon dev/prod

### Messages d'erreur courants :

- **"La requête a pris trop de temps"** → Le backend n'est pas accessible
- **"Impossible de contacter le serveur"** → Vérifiez que le backend est démarré
- **"Email already registered"** → L'email est déjà utilisé
- **"Missing required fields"** → Vérifiez que tous les champs sont remplis

### Si le problème persiste :

1. Vérifiez les logs du backend dans le terminal
2. Vérifiez la console du navigateur (F12)
3. Vérifiez que la base de données est bien configurée
4. Vérifiez les variables d'environnement dans `.env`


