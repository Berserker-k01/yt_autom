"""
Admin routes for Scripty SaaS
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.database import db
from backend.saas_models import User, Subscription, Script, UsageMetric
from backend.auth_utils import get_current_user
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    """Decorator to require admin role"""
    from functools import wraps
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_platform_stats():
    """Get global platform statistics"""
    try:
        # User stats
        total_users = User.query.count()
        verified_users = User.query.filter_by(email_verified=True).count()
        
        # Subscription stats
        free_users = Subscription.query.filter_by(plan_type='free').count()
        pro_users = Subscription.query.filter_by(plan_type='pro').count()
        enterprise_users = Subscription.query.filter_by(plan_type='enterprise').count()
        
        # Script stats
        total_scripts = Script.query.count()
        scripts_today = Script.query.filter(
            Script.created_at >= datetime.utcnow().date()
        ).count()
        
        # Monthly revenue (estimated)
        monthly_revenue = (pro_users * 19) + (enterprise_users * 99)
        
        # Recent signups (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_signups = User.query.filter(User.created_at >= week_ago).count()
        
        return jsonify({
            'users': {
                'total': total_users,
                'verified': verified_users,
                'recent_signups': recent_signups
            },
            'subscriptions': {
                'free': free_users,
                'pro': pro_users,
                'enterprise': enterprise_users
            },
            'scripts': {
                'total': total_scripts,
                'today': scripts_today
            },
            'revenue': {
                'monthly': monthly_revenue,
                'annual': monthly_revenue * 12
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_all_users():
    """List all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) | 
                (User.name.ilike(f'%{search}%'))
            )
        
        query = query.order_by(User.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = [{
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'is_admin': user.is_admin,
            'email_verified': user.email_verified,
            'created_at': user.created_at.isoformat(),
            'subscription': user.subscription.to_dict() if user.subscription else None,
            'scripts_count': Script.query.filter_by(user_id=user.id).count()
        } for user in pagination.items]
        
        return jsonify({
            'users': users,
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get usage stats
        scripts = Script.query.filter_by(user_id=user_id).order_by(Script.created_at.desc()).limit(10).all()
        
        month_start = datetime(datetime.utcnow().year, datetime.utcnow().month, 1)
        monthly_usage = UsageMetric.query.filter(
            UsageMetric.user_id == user_id,
            UsageMetric.timestamp >= month_start
        ).count()
        
        return jsonify({
            'user': user.to_dict(),
            'monthly_usage': monthly_usage,
            'recent_scripts': [s.to_dict() for s in scripts],
            'total_scripts': Script.query.filter_by(user_id=user_id).count()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/subscription', methods=['PUT'])
@admin_required
def update_user_subscription(user_id):
    """Manually update user subscription (admin override)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        new_plan = data.get('plan_type')
        
        if new_plan not in ['free', 'pro', 'enterprise']:
            return jsonify({'error': 'Invalid plan type'}), 400
        
        if user.subscription:
            user.subscription.plan_type = new_plan
            user.subscription.status = 'active'
        else:
            subscription = Subscription(user_id=user_id, plan_type=new_plan)
            db.session.add(subscription)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Subscription updated',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>/admin', methods=['PUT'])
@admin_required
def toggle_admin_role(user_id):
    """Toggle admin role for a user"""
    try:
        admin = get_current_user()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.id == admin.id:
            return jsonify({'error': 'Cannot modify your own admin status'}), 400
        
        user.is_admin = not user.is_admin
        db.session.commit()
        
        return jsonify({
            'message': f"Admin role {'granted to' if user.is_admin else 'revoked from'} {user.email}",
            'is_admin': user.is_admin
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user (hard delete)"""
    try:
        admin = get_current_user()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.id == admin.id:
            return jsonify({'error': 'Cannot delete yourself'}), 400
        
        if user.is_admin:
            return jsonify({'error': 'Cannot delete admin users'}), 403
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/activity', methods=['GET'])
@admin_required
def get_recent_activity():
    """Get recent platform activity"""
    try:
        # Recent scripts
        recent_scripts = Script.query.order_by(Script.created_at.desc()).limit(20).all()
        
        # Recent signups
        recent_users = User.query.order_by(User.created_at.desc()).limit(10).all()
        
        return jsonify({
            'recent_scripts': [{
                'id': s.id,
                'title': s.title,
                'platform': s.platform,
                'user_email': User.query.get(s.user_id).email if User.query.get(s.user_id) else 'Unknown',
                'created_at': s.created_at.isoformat()
            } for s in recent_scripts],
            'recent_users': [{
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'created_at': u.created_at.isoformat()
            } for u in recent_users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
