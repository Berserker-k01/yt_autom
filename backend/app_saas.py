"""
Scripty SaaS - Main Application
Complete Flask app with JWT auth, PostgreSQL, and all SaaS features
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key_change_in_production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', app.config['SECRET_KEY'])
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)

# CORS configuration
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
CORS(app, 
     resources={r"/api/*": {"origins": [frontend_url, "*"]}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type"])

# Initialize JWT
jwt = JWTManager(app)

# Import models before init_db to register them with SQLAlchemy
from backend import saas_models

# Initialize database
from backend.database import init_db
init_db(app)

# Register blueprints
from backend.auth_routes import auth_bp
from backend.scripts_routes import scripts_bp
from backend.mobile_money_routes import mobile_money_bp
from backend.admin_routes import admin_bp

app.register_blueprint(auth_bp)
app.register_blueprint(scripts_bp)
app.register_blueprint(mobile_money_bp)
app.register_blueprint(admin_bp)

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Scripty SaaS API',
        'version': '2.0.0'
    }), 200

# Root route
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'Scripty SaaS API',
        'version': '2.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'scripts': '/api/scripts',
            'docs': 'Coming soon'
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'error': 'Token expired',
        'message': 'Please refresh your token'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'message': 'Please login again'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': 'Please provide a valid token'
    }), 401

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', '0') == '1'
    
    print(f"""
    🚀 Scripty SaaS API Starting...
    📍 Port: {port}
    🔧 Debug: {debug}
    🗄️  Database: PostgreSQL
    🔐 Auth: JWT
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
