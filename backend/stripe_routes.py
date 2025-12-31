"""
Stripe billing routes for Scripty SaaS
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.database import db
from backend.saas_models import User, Subscription
from backend.auth_utils import get_current_user
import stripe
import os
from datetime import datetime

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

billing_bp = Blueprint('billing', __name__, url_prefix='/api/billing')

PRICE_IDS = {
    'pro_monthly': os.getenv('STRIPE_PRICE_PRO_MONTHLY', 'price_xxx'),
    'enterprise_monthly': os.getenv('STRIPE_PRICE_ENTERPRISE_MONTHLY', 'price_yyy')
}

@billing_bp.route('/create-checkout', methods=['POST'])
@jwt_required()
def create_checkout():
    """Create Stripe checkout session"""
    try:
        user = get_current_user()
        data = request.get_json()
        plan = data.get('plan', 'pro')
        
        if plan not in ['pro', 'enterprise']:
            return jsonify({'error': 'Invalid plan'}), 400
        
        price_id = PRICE_IDS[f'{plan}_monthly']
        
        # Create or get Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={'user_id': user.id}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1
            }],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/pricing",
            metadata={
                'user_id': user.id,
                'plan': plan
            }
        )
        
        return jsonify({'checkout_url': session.url}), 200
        
    except Exception as e:
        print(f"Checkout error: {e}")
        return jsonify({'error': str(e)}), 500

@billing_bp.route('/portal', methods=['POST'])
@jwt_required()
def create_portal_session():
    """Create Stripe customer portal session"""
    try:
        user = get_current_user()
        
        if not user.stripe_customer_id:
            return jsonify({'error': 'No subscription found'}), 404
        
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{os.getenv('FRONTEND_URL')}/settings/billing"
        )
        
        return jsonify({'portal_url': session.url}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@billing_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        print(f"Webhook error: {e}")
        return jsonify({'error': str(e)}), 400
    
    # Handle events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_completed(session)
    
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription)
    
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_canceled(subscription)
    
    return jsonify({'success': True}), 200

def handle_checkout_completed(session):
    """Handle successful checkout"""
    user_id = session['metadata'].get('user_id')
    plan = session['metadata'].get('plan')
    subscription_id = session['subscription']
    
    user = User.query.get(user_id)
    if user and user.subscription:
        user.subscription.plan_type = plan
        user.subscription.stripe_subscription_id = subscription_id
        user.subscription.status = 'active'
        db.session.commit()
        print(f"✅ User {user_id} upgraded to {plan}")

def handle_subscription_updated(stripe_sub):
    """Handle subscription update"""
    subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_sub['id']).first()
    if subscription:
        subscription.status = stripe_sub['status']
        subscription.current_period_end = datetime.fromtimestamp(stripe_sub['current_period_end'])
        db.session.commit()

def handle_subscription_canceled(stripe_sub):
    """Handle subscription cancellation"""
    subscription = Subscription.query.filter_by(stripe_subscription_id=stripe_sub['id']).first()
    if subscription:
        subscription.plan_type = 'free'
        subscription.status = 'canceled'
        db.session.commit()
