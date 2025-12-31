"""
Authentication routes for Scripty SaaS
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from backend.database import db
from backend.saas_models import User, Subscription
from backend.auth_utils import verify_email_token, generate_verification_token
from datetime import timedelta
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def is_valid_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip()
        
        # Validation
        if not email or not password or not name:
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not is_valid_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create user
        user = User(email=email, name=name)
        user.set_password(password)
        user.generate_verification_token()
        
        db.session.add(user)
        db.session.flush()  # Get user.id
        
        # Create free subscription
        try:
            subscription = Subscription(user_id=user.id, plan_type='free', status='active')
            db.session.add(subscription)
        except Exception as sub_error:
            print(f"Warning: Could not create subscription: {sub_error}")
            # Continue without subscription for now
        
        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            print(f"Database commit error: {commit_error}")
            raise
        
        # TODO: Send verification email
        verification_url = f"{request.host_url}api/auth/verify/{user.verification_token}"
        print(f"📧 Verification URL: {verification_url}")
        
        # Create tokens
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=1))
        refresh_token = create_refresh_token(identity=user.id, expires_delta=timedelta(days=7))
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
            'verification_required': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Registration error: {e}")
        print(f"Traceback: {error_trace}")
        return jsonify({
            'error': 'Registration failed',
            'message': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Create tokens
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=1))
        refresh_token = create_refresh_token(identity=user.id, expires_delta=timedelta(days=7))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed', 'message': str(e)}), 500

@auth_bp.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    """Verify user email"""
    try:
        success, user = verify_email_token(token)
        
        if success:
            return jsonify({
                'message': 'Email verified successfully',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid or expired token'}), 400
            
    except Exception as e:
        print(f"Verification error: {e}")
        return jsonify({'error': 'Verification failed'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id, expires_delta=timedelta(hours=1))
        
        return jsonify({'access_token': access_token}), 200
        
    except Exception as e:
        return jsonify({'error': 'Token refresh failed'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user_info():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    # JWT stateless, so just return success
    # Client should remove tokens from storage
    return jsonify({'message': 'Logged out successfully'}), 200
