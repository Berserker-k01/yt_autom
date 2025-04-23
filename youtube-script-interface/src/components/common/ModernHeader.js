import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ModernHeader = () => {
  const navigate = useNavigate();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Récupérer le profil utilisateur du localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
      }
    }
  }, []);

  // Gérer la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('ytautom_auth');
    navigate('/login');
  };

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header 
      className="app-header"
      style={{
        background: darkMode ? theme.colors.background.paper : 'rgba(255, 255, 255, 0.95)',
        color: theme.colors.text.primary,
        borderBottom: `1px solid ${theme.colors.divider}`,
        backdropFilter: 'blur(10px)',
        boxShadow: theme.shadows.sm
      }}
    >
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* Logo et titre */}
        <motion.div 
          className="logo-container"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: theme.colors.primary.main }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
            <span style={{ 
              marginLeft: '10px', 
              fontWeight: 700, 
              fontSize: '1.25rem',
              background: theme.colors.primary.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              YT Autom
            </span>
          </Link>
        </motion.div>

        {/* Menu pour mobile */}
        <div className="mobile-menu-button" 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ 
            display: 'none',
            cursor: 'pointer',
            zIndex: 100,
            '@media (max-width: 768px)': {
              display: 'block'
            }
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12"></path>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </div>

        {/* Actions principales */}
        <motion.div 
          className={`header-actions ${menuOpen ? 'menu-open' : ''}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '20px',
            '@media (max-width: 768px)': {
              position: 'fixed',
              top: menuOpen ? '0' : '-100%',
              left: '0',
              width: '100%',
              height: '100vh',
              flexDirection: 'column',
              justifyContent: 'center',
              background: darkMode ? theme.colors.background.default : theme.colors.background.paper,
              transition: 'top 0.3s ease',
              zIndex: 90
            }
          }}
        >
          {/* Bouton du tableau de bord */}
          <Link 
            to="/dashboard" 
            className="nav-link"
            style={{ 
              color: theme.colors.text.primary,
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: theme.shape.borderRadius,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              ':hover': {
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
            onClick={() => setMenuOpen(false)}
          >
            Tableau de bord
          </Link>

          {/* Bouton de profil */}
          <Link 
            to="/profile" 
            className="nav-link"
            style={{ 
              color: theme.colors.text.primary,
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: theme.shape.borderRadius,
              fontWeight: 500,
              transition: 'all 0.2s ease',
              ':hover': {
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
            onClick={() => setMenuOpen(false)}
          >
            Profil
          </Link>

          {/* Bouton pour basculer le mode sombre */}
          <button
            onClick={toggleDarkMode}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.text.primary,
              transition: 'all 0.2s ease',
              ':hover': {
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            {darkMode ? (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Avatar et nom d'utilisateur */}
          {userProfile && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: theme.shape.borderRadius,
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: theme.colors.primary.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {userProfile.youtuber_name ? userProfile.youtuber_name.charAt(0).toUpperCase() : '?'}
              </div>
              <span style={{ fontWeight: 500 }}>
                {userProfile.youtuber_name || 'Utilisateur'}
              </span>
            </div>
          )}

          {/* Bouton de déconnexion */}
          <button 
            onClick={handleLogout}
            className="btn-primary"
            style={{ 
              background: theme.colors.error.main,
              color: theme.colors.error.contrastText,
              padding: '8px 16px',
              borderRadius: theme.shape.buttonBorderRadius,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              ':hover': {
                background: theme.colors.error.dark
              }
            }}
          >
            Déconnexion
          </button>
        </motion.div>
      </div>
    </header>
  );
};

export default ModernHeader;
