"""
Authentication utilities for Scripty SaaS
"""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from backend.saas_models import User, Subscription
from backend.database import db
from datetime import datetime, timedelta
import secrets

def get_current_user():
    """Get current authenticated user"""
    user_id = get_jwt_identity()
    return User.query.get(user_id)

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Authentication required', 'message': str(e)}), 401
    return decorated_function

def plan_required(required_plan='free'):
    """Decorator to require specific subscription plan"""
    plan_hierarchy = {'free': 0, 'pro': 1, 'enterprise': 2}
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user = get_current_user()
                
                if not user or not user.subscription:
                    return jsonify({'error': 'Subscription required'}), 403
                
                user_plan_level = plan_hierarchy.get(user.subscription.plan_type, 0)
                required_plan_level = plan_hierarchy.get(required_plan, 0)
                
                if user_plan_level < required_plan_level:
                    return jsonify({
                        'error': 'Upgrade required',
                        'required_plan': required_plan,
                        'current_plan': user.subscription.plan_type
                    }), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        return decorated_function
    return decorator

def check_usage_limit(user_id, action_type):
    """Check if user has exceeded their usage limit"""
    from backend.saas_models import UsageMetric
    
    user = User.query.get(user_id)
    if not user or not user.subscription:
        return False, "No subscription found"
    
    plan_limits = {
        'free': {'script_generated': 5},
        'pro': {'script_generated': 100},
        'enterprise': {'script_generated': float('inf')}
    }
    
    plan_type = user.subscription.plan_type
    limit = plan_limits.get(plan_type, {}).get(action_type, 0)
    
    # Count usage this month
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    usage_count = UsageMetric.query.filter(
        UsageMetric.user_id == user_id,
        UsageMetric.action_type == action_type,
        UsageMetric.timestamp >= month_start
    ).count()
    
    if usage_count >= limit:
        return False, f"Monthly limit reached ({usage_count}/{limit})"
    
    return True, f"Usage: {usage_count}/{limit}"

def generate_verification_token():
    """Generate email verification token"""
    return secrets.token_urlsafe(32)

def verify_email_token(token):
    """Verify email verification token"""
    user = User.query.filter_by(verification_token=token).first()
    if user and not user.email_verified:
        user.email_verified = True
        user.verification_token = None
        db.session.commit()
        return True, user
    return False, None
