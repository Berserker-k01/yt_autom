import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation simple
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await register(username, email, password);
      navigate('/profile'); // Rediriger vers la page de profil
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      setError(err.response?.data?.error || 'Échec de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Méthode d'inscription simplifiée pour la démo
  const handleSimpleRegister = (e) => {
    e.preventDefault();
    
    // Validation simple
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    setTimeout(() => {
      // Sauvegarder les identifiants en localStorage (pour la démo, pas sécurisé en production)
      localStorage.setItem('ytautom_username', username);
      localStorage.setItem('ytautom_password', password);
      localStorage.setItem('ytautom_email', email || username);
      
      // Créer un état utilisateur temporaire
      localStorage.setItem('ytautom_user', JSON.stringify({
        username: username,
        email: email || username
      }));
      
      // Redirection avec remplacement de l'historique pour éviter les problèmes de navigation
      navigate('/profile', { replace: true });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-container" style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: darkMode ? '#111827' : '#f9fafb',
      color: darkMode ? '#f9fafb' : '#1f2937'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card" 
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '32px',
          borderRadius: '12px',
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
        }}
      >
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '20px',
          textAlign: 'center',
          color: darkMode ? '#f9fafb' : '#1f2937'
        }}>Créer un compte</h2>
        
        <form onSubmit={handleSimpleRegister}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="error-message"
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                color: darkMode ? '#fca5a5' : '#dc2626',
                marginBottom: '20px'
              }}
            >
              {error}
            </motion.div>
          )}
          
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="username"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: darkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choisissez un nom d'utilisateur"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: darkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Email (optionnel)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: darkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Créez un mot de passe"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label 
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: darkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirmez votre mot de passe"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? '#111827' : '#ffffff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        
        <div style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            color: darkMode ? '#d1d5db' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Vous avez déjà un compte ?{' '}
            <span 
              onClick={() => navigate('/login')}
              style={{
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Se connecter
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
