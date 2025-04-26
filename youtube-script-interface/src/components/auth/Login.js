import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      console.log(`Tentative de connexion avec: ${email}`);
      const response = await login(email, password);
      console.log('Réponse connexion obtenue:', response);
      
      // Attendre un court instant avant de rediriger
      // Cela permet aux états de se mettre à jour correctement
      setTimeout(() => {
        // Déterminer où rediriger l'utilisateur
        if (response && response.user && response.user.setupRequired) {
          console.log('Redirection vers la page de configuration du profil');
          window.location.href = '/profile-setup'; // Utiliser window.location pour une redirection plus fiable
        } else {
          console.log('Redirection vers le tableau de bord');
          window.location.href = '/dashboard';
        }
      }, 300);
    } catch (err) {
      console.error('Erreur de connexion détaillée:', err);
      if (err.response) {
        console.error('Détails de la réponse d\'erreur:', err.response.status, err.response.data);
      }
      setError(err.response?.data?.error || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
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
          border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`,
        }}
      >
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '20px',
          textAlign: 'center',
          color: darkMode ? '#f9fafb' : '#1f2937'
        }}>Connexion</h2>
        
        <form onSubmit={handleSubmit}>
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
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                color: darkMode ? '#e5e7eb' : '#374151'
              }}
            >
              Email ou Nom d'utilisateur
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email ou nom d'utilisateur"
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
          
          <div className="form-group" style={{ marginBottom: '24px' }}>
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
              placeholder="Entrez votre mot de passe"
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="auth-footer" style={{
          marginTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            color: darkMode ? '#d1d5db' : '#6b7280',
            fontSize: '0.875rem'
          }}>
            Pas encore de compte ? {' '}
            <span 
              className="auth-link" 
              onClick={() => navigate('/register')}
              style={{
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              S'inscrire
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
