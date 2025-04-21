import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SimpleHeader.css';

const SimpleHeader = () => {
  const [youtuberName, setYoutuberName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Récupérer le profil depuis le localStorage
    try {
      const savedProfile = localStorage.getItem('ytautom_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setYoutuberName(profile.youtuber_name || 'Utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  }, []);

  const handleProfileClick = () => {
    // Ouvrir/fermer le menu
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    // Juste effacer le profil (pas de déconnexion complète)
    localStorage.removeItem('ytautom_profile');
    window.location.href = '/profile'; // Rediriger vers la page de profil
  };

  const handleEditProfile = () => {
    // Rediriger vers la page de profil pour modifications
    window.location.href = '/profile';
  };

  return (
    <header className="simple-header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/dashboard" className="logo-link">
            <h1><span className="youtube-text">YouTube</span> Script Generator</h1>
          </Link>
        </div>
        
        <div className="profile-section">
          {youtuberName ? (
            <div className="profile-menu-container">
              <button 
                className="profile-button" 
                onClick={handleProfileClick}
              >
                <div className="profile-avatar">
                  {youtuberName.charAt(0).toUpperCase()}
                </div>
                <span className="profile-name">{youtuberName}</span>
              </button>
              
              {menuOpen && (
                <div className="profile-dropdown">
                  <button onClick={handleEditProfile} className="dropdown-item">
                    <span className="item-icon">✏️</span>
                    Modifier le profil
                  </button>
                  <button onClick={handleLogout} className="dropdown-item">
                    <span className="item-icon">🚪</span>
                    Changer d'utilisateur
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/profile" className="setup-profile-link">
              Configurer votre profil
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
