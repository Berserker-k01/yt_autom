"""
Scripts routes for Scripty SaaS
"""
import os

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.database import db
from backend.saas_models import Script, UsageMetric
from backend.auth_utils import check_usage_limit, get_current_user
from datetime import datetime
import sys

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
        custom_options = data.get('custom_options') or (data.get('metadata', {}) or {}).get('custom_options', {})
        # Vidéo IA : activé par défaut si le worker LTX est configuré (pas besoin de connaître "LTX")
        runner_configured = bool(os.getenv('LTX_RUNNER_URL'))
        want_video = data.get('auto_generate_video', data.get('auto_ltx_video'))
        if want_video is None:
            want_video = runner_configured
        auto_ltx_video = bool(want_video)

        if not topic:
            return jsonify({'error': 'Topic is required'}), 400

        metadata = dict(data.get('metadata') or {})
        ltx_notice = None
        will_start_ltx = False
        if auto_ltx_video and runner_configured:
            can_ltx, ltx_msg = check_usage_limit(user.id, 'ltx_video_generated')
            if can_ltx:
                metadata['ltx_video'] = {
                    'status': 'queued',
                    'queued_at': datetime.utcnow().isoformat() + 'Z',
                }
                will_start_ltx = True
            else:
                metadata['ltx_video'] = {'status': 'skipped', 'reason': ltx_msg}
                ltx_notice = ltx_msg
        elif auto_ltx_video:
            metadata['ltx_video'] = {
                'status': 'skipped',
                'reason': 'LTX_RUNNER_URL not configured',
            }
            ltx_notice = metadata['ltx_video']['reason']

        # Generate script using main.py function
        script_content = generate_script(
            topic=topic,
            research=research,
            platform=platform,
            user_context={
                'youtuber_name': user.name,
                'channel_name': user.name
            },
            custom_options=custom_options,
        )

        if not script_content:
            return jsonify({'error': 'Script generation failed'}), 500

        # Save script
        script = Script(
            user_id=user.id,
            platform=platform,
            title=topic,
            content=script_content,
            extra_metadata=metadata,
        )

        db.session.add(script)

        # Log usage
        UsageMetric.log_action(
            user_id=user.id,
            action_type='script_generated',
            extra_metadata={'platform': platform, 'topic': topic}
        )

        db.session.commit()

        if will_start_ltx:
            try:
                from backend.tasks_ltx import enqueue_ltx_for_script

                enqueue_ltx_for_script(script.id)
            except Exception as exc:
                script = Script.query.get(script.id)
                if script:
                    meta = dict(script.extra_metadata or {})
                    meta["ltx_video"] = {
                        "status": "failed",
                        "error": f"Impossible de lancer la file d'attente: {exc}",
                    }
                    script.extra_metadata = meta
                    script.updated_at = datetime.utcnow()
                    db.session.commit()
                payload["ltx_notice"] = str(exc)

        payload = {
            'message': 'Script created successfully',
            'script': script.to_dict(),
        }
        if ltx_notice:
            payload['ltx_notice'] = ltx_notice
        return jsonify(payload), 201
        
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
            script.extra_metadata = data['metadata']
        
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
