import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterSimple = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { API_BASE, setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation de base
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      // Simuler l'inscription en utilisant la route de connexion simplifiée
      // Dans cette version temporaire, l'inscription est fondamentalement la même que la connexion
      console.log(`Tentative d'inscription simplifiée avec: ${email}`);
      
      const response = await fetch(`${API_BASE}/api/login-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Réponse inscription simplifiée:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }
      
      // Mettre à jour l'état utilisateur avec setupRequired à true pour forcer la redirection vers la configuration du profil
      if (data.user) {
        const userWithSetupRequired = {
          ...data.user,
          setupRequired: true
        };
        setUser(userWithSetupRequired);
      }
      
      // Délai court pour permettre la mise à jour de l'état
      setTimeout(() => {
        console.log('Redirection vers la configuration du profil');
        window.location.href = '/profile-setup-simple';
      }, 300);
      
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      setError('Échec de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Créer un compte</h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Choisissez un nom d'utilisateur"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email"
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
              placeholder="Créez un mot de passe sécurisé"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirmez votre mot de passe"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Déjà inscrit ? <span className="auth-link" onClick={() => navigate('/login-simple')}>Se connecter</span></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSimple;
