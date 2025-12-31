"""
Scripts routes for Scripty SaaS
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database import db
from backend.saas_models import Script, UsageMetric
from backend.auth_utils import get_current_user, check_usage_limit
from datetime import datetime
import sys
import os

# Import generation functions from main.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import generate_topics, generate_script

scripts_bp = Blueprint('scripts', __name__, url_prefix='/api/scripts')

@scripts_bp.route('', methods=['GET'])
@jwt_required()
def list_scripts():
    """Get all scripts for current user"""
    try:
        user = get_current_user()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        platform = request.args.get('platform')
        
        query = Script.query.filter_by(user_id=user.id)
        
        if platform:
            query = query.filter_by(platform=platform)
        
        query = query.order_by(Script.created_at.desc())
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'scripts': [script.to_dict() for script in pagination.items],
            'total': pagination.total,
            'page': pagination.page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scripts_bp.route('/<int:script_id>', methods=['GET'])
@jwt_required()
def get_script(script_id):
    """Get a specific script"""
    try:
        user = get_current_user()
        script = Script.query.filter_by(id=script_id, user_id=user.id).first()
        
        if not script:
            return jsonify({'error': 'Script not found'}), 404
        
        return jsonify({'script': script.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@scripts_bp.route('', methods=['POST'])
@jwt_required()
def create_script():
    """Generate and save a new script"""
    try:
        user = get_current_user()
        
        # Check usage limit
        can_generate, message = check_usage_limit(user.id, 'script_generated')
        if not can_generate:
            return jsonify({'error': message, 'upgrade_required': True}), 403
        
        data = request.get_json()
        topic = data.get('topic')
        platform = data.get('platform', 'youtube')
        research = data.get('research', '')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        # Generate script using main.py function
        script_content = generate_script(
            topic=topic,
            research=research,
            platform=platform,
            user_context={
                'youtuber_name': user.name,
                'channel_name': user.name
            }
        )
        
        if not script_content:
            return jsonify({'error': 'Script generation failed'}), 500
        
        # Save script
        script = Script(
            user_id=user.id,
            platform=platform,
            title=topic,
            content=script_content,
            metadata=data.get('metadata', {})
        )
        
        db.session.add(script)
        
        # Log usage
        UsageMetric.log_action(
            user_id=user.id,
            action_type='script_generated',
            metadata={'platform': platform, 'topic': topic}
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Script created successfully',
            'script': script.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Script creation error: {e}")
        return jsonify({'error': 'Script creation failed', 'message': str(e)}), 500

@scripts_bp.route('/<int:script_id>', methods=['PUT'])
@jwt_required()
def update_script(script_id):
    """Update a script"""
    try:
        user = get_current_user()
        script = Script.query.filter_by(id=script_id, user_id=user.id).first()
        
        if not script:
            return jsonify({'error': 'Script not found'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            script.title = data['title']
        if 'content' in data:
            script.content = data['content']
        if 'metadata' in data:
            script.metadata = data['metadata']
        
        script.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Script updated successfully',
            'script': script.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@scripts_bp.route('/<int:script_id>', methods=['DELETE'])
@jwt_required()
def delete_script(script_id):
    """Delete a script"""
    try:
        user = get_current_user()
        script = Script.query.filter_by(id=script_id, user_id=user.id).first()
        
        if not script:
            return jsonify({'error': 'Script not found'}), 404
        
        db.session.delete(script)
        db.session.commit()
        
        return jsonify({'message': 'Script deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@scripts_bp.route('/usage', methods=['GET'])
@jwt_required()
def get_usage():
    """Get usage statistics for current user"""
    try:
        user = get_current_user()
        
        # Current month usage
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        script_count = UsageMetric.query.filter(
            UsageMetric.user_id == user.id,
            UsageMetric.action_type == 'script_generated',
            UsageMetric.timestamp >= month_start
        ).count()
        
        # Get plan limits
        plan_limits = {
            'free': 5,
            'pro': 100,
            'enterprise': float('inf')
        }
        
        plan_type = user.subscription.plan_type if user.subscription else 'free'
        limit = plan_limits.get(plan_type, 5)
        
        return jsonify({
            'current_usage': script_count,
            'limit': limit if limit != float('inf') else 'unlimited',
            'percentage': (script_count / limit * 100) if limit != float('inf') else 0,
            'plan': plan_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
