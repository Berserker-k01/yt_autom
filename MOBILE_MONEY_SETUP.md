# 📱 Configuration Mobile Money avec Flutterwave

Ce guide explique comment configurer le système de paiement Mobile Money pour Scripty SaaS.

## 🎯 Vue d'ensemble

Le système utilise **Flutterwave** pour gérer les paiements Mobile Money en Afrique. Flutterwave supporte :
- Orange Money (Sénégal, Côte d'Ivoire, Cameroun)
- MTN Mobile Money (Ghana, Nigeria, Cameroun, Côte d'Ivoire)
- M-Pesa (Kenya)
- Airtel Money
- Moov Money
- Et bien d'autres opérateurs selon les pays

## 🔧 Configuration

### 1. Créer un compte Flutterwave

1. Allez sur https://flutterwave.com
2. Créez un compte (gratuit)
3. Accédez au Dashboard
4. Allez dans **Settings > API Keys**

### 2. Récupérer les clés API

Vous aurez besoin de :
- **Secret Key** (FLWSECK_TEST_... pour le test, FLWSECK_... pour la production)
- **Public Key** (FLWPUBK_TEST_... pour le test, FLWPUBK_... pour la production)

### 3. Configurer le Webhook

1. Dans le Dashboard Flutterwave, allez dans **Settings > Webhooks**
2. Ajoutez une URL de webhook : `https://votre-domaine.com/api/payment/webhook`
3. Sélectionnez les événements :
   - `charge.completed`
   - `charge.failed`
4. Copiez le **Webhook Hash** généré

### 4. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Flutterwave Mobile Money
FLW_SECRET_KEY=FLWSECK_TEST_votre_cle_secrete
FLW_PUBLIC_KEY=FLWPUBK_TEST_votre_cle_publique
FLW_WEBHOOK_HASH=votre_webhook_hash
```

### 5. Configuration des prix

Les prix sont configurés dans `backend/mobile_money_routes.py` :

```python
PLANS = {
    'pro_monthly': {
        'amount': 12000,  # En FCFA (XOF)
        'currency': 'XOF',
        'name': 'Plan Pro Mensuel'
    },
    'enterprise_monthly': {
        'amount': 60000,  # En FCFA (XOF)
        'currency': 'XOF',
        'name': 'Plan Enterprise Mensuel'
    }
}
```

**Note** : Vous pouvez changer la devise selon votre pays :
- XOF (FCFA) pour l'Afrique de l'Ouest
- XAF (FCFA) pour l'Afrique Centrale
- NGN (Naira) pour le Nigeria
- GHS (Cedi) pour le Ghana
- KES (Shilling) pour le Kenya

## 🌍 Pays et opérateurs supportés

Le système supporte actuellement ces pays et opérateurs :

| Pays | Code | Opérateurs |
|------|------|------------|
| Sénégal | SN | Orange Money, Tigo Cash, Free Money |
| Côte d'Ivoire | CI | Orange Money, MTN Mobile Money, Moov Money |
| Cameroun | CM | Orange Money, MTN Mobile Money |
| Ghana | GH | MTN Mobile Money, Vodafone Cash, Airtel Money |
| Kenya | KE | M-Pesa, Airtel Money |
| Nigeria | NG | MTN Mobile Money, Airtel Money |

Pour ajouter d'autres pays/opérateurs, modifiez `MOBILE_MONEY_PROVIDERS` dans `backend/mobile_money_routes.py`.

## 🧪 Test en mode développement

1. Utilisez les clés de test Flutterwave (commencent par `FLWSECK_TEST_`)
2. Pour tester un paiement, utilisez ces numéros de test :
   - **Orange Money** : +221 77 123 45 67
   - **MTN Mobile Money** : +233 24 123 4567
   - **M-Pesa** : +254 712 123 456

3. Le paiement sera simulé et vous recevrez une confirmation

## 🚀 Passage en production

1. Remplacez les clés de test par les clés de production
2. Configurez le webhook avec votre URL de production
3. Testez avec un petit montant d'abord
4. Vérifiez que les webhooks sont bien reçus

## 📊 Endpoints API

### Initier un paiement
```bash
POST /api/payment/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "pro",
  "phone_number": "+221 77 123 45 67",
  "provider": "orange",
  "country_code": "SN"
}
```

### Vérifier un paiement
```bash
GET /api/payment/verify/<transaction_ref>
Authorization: Bearer <token>
```

### Obtenir les opérateurs disponibles
```bash
GET /api/payment/providers?country=SN
```

### Historique des paiements
```bash
GET /api/payment/history
Authorization: Bearer <token>
```

## 🔒 Sécurité

- Les webhooks sont vérifiés via signature HMAC
- Les tokens JWT sont requis pour toutes les opérations
- Les numéros de téléphone sont validés
- Les transactions sont enregistrées en base de données

## 🐛 Dépannage

### Le webhook n'est pas reçu
- Vérifiez que l'URL est accessible publiquement
- Vérifiez le Webhook Hash dans les variables d'environnement
- Consultez les logs du serveur

### Le paiement échoue
- Vérifiez que le numéro de téléphone est au bon format
- Vérifiez que l'opérateur est disponible dans le pays sélectionné
- Consultez les logs Flutterwave dans le Dashboard

### La souscription n'est pas activée
- Vérifiez que le webhook `charge.completed` est bien reçu
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez manuellement le statut dans Flutterwave Dashboard

## 📞 Support

Pour plus d'aide :
- Documentation Flutterwave : https://developer.flutterwave.com/docs
- Support Flutterwave : support@flutterwave.com
- Issues GitHub : Ouvrez une issue sur le dépôt

