import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const LoginSimple = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { API_BASE, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Utiliser la route simplifiée en contournant le système d'authentification complexe
      console.log(`Tentative de connexion simplifiée avec: ${email}`);
      
      const response = await fetch(`${API_BASE}/api/login-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Réponse connexion simplifiée:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }
      
      // Mettre à jour l'état utilisateur
      if (data.user) {
        setUser(data.user);
      }
      
      // Redirection directe au lieu d'utiliser navigate
      // Délai pour s'assurer que le state a le temps d'être mis à jour
      setTimeout(() => {
        if (data.user && data.user.setupRequired) {
          window.location.href = '/profile-setup-simple';
        } else {
          window.location.href = '/dashboard';
        }
      }, 300);
      
    } catch (err) {
      console.error('Erreur de connexion:', err.message);
      setError('Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Animation des champs du formulaire avec un délai progressif
  const formControls = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    })
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        <div className="auth-logo">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="logo-circle"
          >
            🎬
          </motion.div>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Connexion
        </motion.h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {error}
            </motion.div>
          )}
          
          <motion.div 
            className="form-group"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="email">Email ou Nom d'utilisateur</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Entrez votre email ou nom d'utilisateur"
              />
              <span className="input-icon">✉️</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="password">Mot de passe</label>
            <div className="input-with-icon">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
              />
              <span className="input-icon">🔒</span>
            </div>
          </motion.div>
          
          <motion.button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
            custom={2}
            initial="hidden"
            animate="visible"
            variants={formControls}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="button-loader">
                <span className="loader-dot"></span>
                <span className="loader-dot"></span>
                <span className="loader-dot"></span>
                <span>Connexion</span>
              </div>
            ) : 'Se connecter'}
          </motion.button>
        </form>
        
        <motion.div 
          className="auth-footer"
          custom={3}
          initial="hidden"
          animate="visible"
          variants={formControls}
        >
          <p>Pas encore de compte ? <span className="auth-link" onClick={() => navigate('/register-simple')}>S'inscrire</span></p>
          <motion.div 
            className="auth-divider"
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ delay: 0.5, duration: 0.8 }}
          ></motion.div>
          <p className="auth-tagline">Créez des scripts YouTube tendance en quelques clics</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginSimple;
