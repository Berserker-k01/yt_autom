import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

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
          <p>Pas encore de compte ? <span className="auth-link" onClick={() => navigate('/register')}>S'inscrire</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
