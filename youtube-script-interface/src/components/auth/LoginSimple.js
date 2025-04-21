import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email ou Nom d'utilisateur</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email ou nom d'utilisateur"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Entrez votre mot de passe"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Pas encore de compte ? <span className="auth-link" onClick={() => navigate('/register-simple')}>S'inscrire</span></p>
        </div>
      </div>
    </div>
  );
};

export default LoginSimple;
