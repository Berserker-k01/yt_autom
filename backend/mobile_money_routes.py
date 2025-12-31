"""
Routes de paiement Mobile Money pour Scripty SaaS
Intégration Flutterwave pour le contexte africain
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.database import db
from backend.saas_models import User, Subscription, Payment
from backend.auth_utils import get_current_user
import requests
import os
import hmac
import hashlib
import json
from datetime import datetime, timedelta

mobile_money_bp = Blueprint('mobile_money', __name__, url_prefix='/api/payment')

# Configuration Flutterwave
FLW_SECRET_KEY = os.getenv('FLW_SECRET_KEY')
FLW_PUBLIC_KEY = os.getenv('FLW_PUBLIC_KEY')
FLW_WEBHOOK_HASH = os.getenv('FLW_WEBHOOK_HASH')
FLW_BASE_URL = 'https://api.flutterwave.com/v3'

# Plans de tarification (en FCFA pour l'Afrique de l'Ouest, ou XAF)
PLANS = {
    'pro_monthly': {
        'amount': 12000,  # ~19 USD en FCFA
        'currency': 'XOF',  # FCFA (peut être changé en XAF, NGN, etc.)
        'name': 'Plan Pro Mensuel'
    },
    'enterprise_monthly': {
        'amount': 60000,  # ~99 USD en FCFA
        'currency': 'XOF',
        'name': 'Plan Enterprise Mensuel'
    }
}

# Support des opérateurs Mobile Money par pays
MOBILE_MONEY_PROVIDERS = {
    'SN': {  # Sénégal
        'orange': 'orange_money_senegal',
        'tigo': 'tigo_cash_senegal',
        'free': 'free_money_senegal'
    },
    'CI': {  # Côte d'Ivoire
        'orange': 'orange_money_ci',
        'mtn': 'mtn_momo_ci',
        'moov': 'moov_money_ci'
    },
    'CM': {  # Cameroun
        'orange': 'orange_money_cm',
        'mtn': 'mtn_momo_cm'
    },
    'GH': {  # Ghana
        'mtn': 'mtn_momo_ghana',
        'vodafone': 'vodafone_cash_ghana',
        'airtel': 'airtel_money_ghana'
    },
    'KE': {  # Kenya
        'mpesa': 'mpesa_kenya',
        'airtel': 'airtel_money_kenya'
    },
    'NG': {  # Nigeria
        'mtn': 'mtn_momo_nigeria',
        'airtel': 'airtel_money_nigeria'
    }
}

def verify_flutterwave_webhook(payload, signature):
    """Vérifie la signature du webhook Flutterwave"""
    if not FLW_WEBHOOK_HASH:
        return False
    
    computed_hash = hmac.new(
        FLW_WEBHOOK_HASH.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed_hash, signature)

@mobile_money_bp.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    """Initie un paiement Mobile Money"""
    try:
        user = get_current_user()
        data = request.get_json()
        
        plan = data.get('plan', 'pro')
        phone_number = data.get('phone_number')
        provider = data.get('provider')  # orange, mtn, mpesa, etc.
        country_code = data.get('country_code', 'SN')  # Code pays ISO (SN, CI, CM, etc.)
        
        if plan not in ['pro', 'enterprise']:
            return jsonify({'error': 'Plan invalide'}), 400
        
        if not phone_number:
            return jsonify({'error': 'Numéro de téléphone requis'}), 400
        
        if not provider:
            return jsonify({'error': 'Opérateur Mobile Money requis'}), 400
        
        plan_config = PLANS[f'{plan}_monthly']
        
        # Vérifier si l'utilisateur a déjà une souscription active
        if user.subscription and user.subscription.status == 'active':
            return jsonify({
                'error': 'Vous avez déjà une souscription active',
                'subscription': user.subscription.to_dict()
            }), 400
        
        # Créer une transaction Flutterwave
        headers = {
            'Authorization': f'Bearer {FLW_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        # Déterminer le provider Flutterwave selon le pays
        flw_provider = None
        if country_code in MOBILE_MONEY_PROVIDERS:
            country_providers = MOBILE_MONEY_PROVIDERS[country_code]
            flw_provider = country_providers.get(provider.lower())
        
        if not flw_provider:
            # Fallback: utiliser le provider tel quel
            flw_provider = provider
        
        # Préparer les données de paiement
        payment_data = {
            'tx_ref': f'scripty_{user.id}_{datetime.now().timestamp()}',
            'amount': plan_config['amount'],
            'currency': plan_config['currency'],
            'payment_options': 'mobilemoney',
            'redirect_url': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment/callback",
            'customer': {
                'email': user.email,
                'phonenumber': phone_number,
                'name': user.name or user.email
            },
            'customizations': {
                'title': f'Abonnement Scripty {plan_config["name"]}',
                'description': f'Abonnement mensuel au plan {plan.upper()}',
                'logo': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/logo.png"
            },
            'meta': {
                'user_id': user.id,
                'plan': plan,
                'provider': provider
            }
        }
        
        # Créer la transaction
        response = requests.post(
            f'{FLW_BASE_URL}/payments',
            headers=headers,
            json=payment_data
        )
        
        if response.status_code != 200:
            error_data = response.json()
            return jsonify({
                'error': 'Erreur lors de l\'initiation du paiement',
                'details': error_data.get('message', 'Erreur inconnue')
            }), 400
        
        result = response.json()
        
        if result['status'] != 'success':
            return jsonify({
                'error': 'Échec de l\'initiation du paiement',
                'details': result.get('message', 'Erreur inconnue')
            }), 400
        
        # Enregistrer la transaction en base
        payment = Payment(
            user_id=user.id,
            transaction_ref=payment_data['tx_ref'],
            amount=plan_config['amount'],
            currency=plan_config['currency'],
            plan_type=plan,
            status='pending',
            payment_method='mobile_money',
            provider=provider,
            phone_number=phone_number,
            flw_transaction_id=result['data'].get('id')
        )
        db.session.add(payment)
        db.session.commit()
        
        # Retourner les instructions de paiement
        payment_link = result['data'].get('link')
        
        return jsonify({
            'success': True,
            'payment_link': payment_link,
            'transaction_ref': payment_data['tx_ref'],
            'instructions': f'Vous allez recevoir une demande de paiement sur votre numéro {phone_number}. Veuillez confirmer le paiement.',
            'amount': plan_config['amount'],
            'currency': plan_config['currency']
        }), 200
        
    except Exception as e:
        print(f"Erreur initiation paiement: {e}")
        return jsonify({'error': str(e)}), 500

@mobile_money_bp.route('/verify/<transaction_ref>', methods=['GET'])
@jwt_required()
def verify_payment(transaction_ref):
    """Vérifie le statut d'une transaction"""
    try:
        user = get_current_user()
        
        # Récupérer la transaction depuis la base
        payment = Payment.query.filter_by(
            transaction_ref=transaction_ref,
            user_id=user.id
        ).first()
        
        if not payment:
            return jsonify({'error': 'Transaction introuvable'}), 404
        
        # Vérifier avec Flutterwave
        headers = {
            'Authorization': f'Bearer {FLW_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{FLW_BASE_URL}/transactions/{payment.flw_transaction_id}/verify',
            headers=headers
        )
        
        if response.status_code != 200:
            return jsonify({
                'status': payment.status,
                'message': 'Impossible de vérifier la transaction'
            }), 400
        
        result = response.json()
        
        if result['status'] == 'success' and result['data']['status'] == 'successful':
            # Paiement réussi
            if payment.status != 'completed':
                payment.status = 'completed'
                
                # Mettre à jour ou créer la souscription
                if not user.subscription:
                    subscription = Subscription(
                        user_id=user.id,
                        plan_type=payment.plan_type,
                        status='active',
                        payment_provider_id=str(flw_transaction_id),
                        current_period_end=datetime.utcnow() + timedelta(days=30)
                    )
                    db.session.add(subscription)
                else:
                    user.subscription.plan_type = payment.plan_type
                    user.subscription.status = 'active'
                    user.subscription.payment_provider_id = str(flw_transaction_id)
                    user.subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
                
                db.session.commit()
            
            return jsonify({
                'status': 'success',
                'message': 'Paiement confirmé avec succès',
                'subscription': user.subscription.to_dict() if user.subscription else None
            }), 200
        else:
            return jsonify({
                'status': payment.status,
                'message': 'Paiement en attente ou échoué'
            }), 200
        
    except Exception as e:
        print(f"Erreur vérification paiement: {e}")
        return jsonify({'error': str(e)}), 500

@mobile_money_bp.route('/webhook', methods=['POST'])
def flutterwave_webhook():
    """Gère les webhooks Flutterwave"""
    try:
        payload = request.data.decode('utf-8')
        signature = request.headers.get('verif-hash')
        
        # Vérifier la signature
        if not verify_flutterwave_webhook(payload, signature):
            print("⚠️ Webhook signature invalide")
            return jsonify({'error': 'Signature invalide'}), 401
        
        data = json.loads(payload)
        event_type = data.get('event')
        
        if event_type == 'charge.completed':
            handle_payment_success(data['data'])
        elif event_type == 'charge.failed':
            handle_payment_failed(data['data'])
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        print(f"Erreur webhook: {e}")
        return jsonify({'error': str(e)}), 500

def handle_payment_success(data):
    """Gère un paiement réussi"""
    try:
        tx_ref = data.get('tx_ref')
        flw_transaction_id = data.get('id')
        
        # Trouver la transaction
        payment = Payment.query.filter_by(
            transaction_ref=tx_ref
        ).first()
        
        if not payment:
            print(f"⚠️ Transaction {tx_ref} introuvable")
            return
        
        # Mettre à jour l'ID de transaction Flutterwave si nécessaire
        if not payment.flw_transaction_id and flw_transaction_id:
            payment.flw_transaction_id = str(flw_transaction_id)
        
        if payment.status == 'completed':
            return  # Déjà traité
        
        # Mettre à jour le statut
        payment.status = 'completed'
        
        # Mettre à jour la souscription
        user = User.query.get(payment.user_id)
        if user:
            if not user.subscription:
                subscription = Subscription(
                    user_id=user.id,
                    plan_type=payment.plan_type,
                    status='active',
                    payment_provider_id=str(flw_transaction_id) if flw_transaction_id else None,
                    current_period_end=datetime.utcnow() + timedelta(days=30)
                )
                db.session.add(subscription)
            else:
                user.subscription.plan_type = payment.plan_type
                user.subscription.status = 'active'
                if flw_transaction_id:
                    user.subscription.payment_provider_id = str(flw_transaction_id)
                user.subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
            
            db.session.commit()
            print(f"✅ Paiement {tx_ref} confirmé pour l'utilisateur {user.id}")
        
    except Exception as e:
        print(f"Erreur traitement paiement réussi: {e}")

def handle_payment_failed(data):
    """Gère un paiement échoué"""
    try:
        tx_ref = data.get('tx_ref')
        payment = Payment.query.filter_by(transaction_ref=tx_ref).first()
        
        if payment:
            payment.status = 'failed'
            db.session.commit()
            print(f"❌ Paiement {tx_ref} échoué")
        
    except Exception as e:
        print(f"Erreur traitement paiement échoué: {e}")

@mobile_money_bp.route('/providers', methods=['GET'])
def get_providers():
    """Retourne la liste des opérateurs Mobile Money disponibles par pays"""
    country_code = request.args.get('country', 'SN')
    
    providers = MOBILE_MONEY_PROVIDERS.get(country_code, {})
    
    return jsonify({
        'country': country_code,
        'providers': providers
    }), 200

@mobile_money_bp.route('/history', methods=['GET'])
@jwt_required()
def get_payment_history():
    """Récupère l'historique des paiements de l'utilisateur"""
    try:
        user = get_current_user()
        
        payments = Payment.query.filter_by(user_id=user.id).order_by(
            Payment.created_at.desc()
        ).limit(20).all()
        
        return jsonify({
            'payments': [p.to_dict() for p in payments]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

