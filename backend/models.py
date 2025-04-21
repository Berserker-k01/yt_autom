from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    """Modèle pour les utilisateurs du système."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relation avec le profil
    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Génère un hash pour le mot de passe"""
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        """Vérifie le mot de passe"""
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'


class UserProfile(db.Model):
    """Modèle pour les préférences de l'utilisateur concernant ses vidéos YouTube."""
    __tablename__ = 'user_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Informations de base
    channel_name = db.Column(db.String(100), nullable=True)
    youtuber_name = db.Column(db.String(100), nullable=True)
    
    # Style et préférences
    video_style = db.Column(db.Text, nullable=True)  # Description du style de vidéo
    approach_style = db.Column(db.Text, nullable=True)  # Approche préférée
    target_audience = db.Column(db.String(255), nullable=True)  # Public cible
    video_length = db.Column(db.String(50), nullable=True)  # Préférence de durée
    
    # Statut du formulaire
    setup_completed = db.Column(db.Boolean, default=False)  # Indique si le formulaire initial a été rempli
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserProfile for {self.user_id}>'
