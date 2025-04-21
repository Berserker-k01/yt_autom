import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-logo" onClick={() => navigate('/')}>
        <span role="img" aria-label="video icon">🎬</span> YouTube Script Generator
      </div>

      <div className="header-nav">
        {isAuthenticated ? (
          <>
            <span className="user-welcome">Bonjour, {user.username}</span>
            <button 
              className="btn btn-outline" 
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-outline" 
              onClick={() => navigate('/login')}
            >
              Connexion
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/register')}
            >
              S'inscrire
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
