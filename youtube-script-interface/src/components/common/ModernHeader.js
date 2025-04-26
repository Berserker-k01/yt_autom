import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const ModernHeader = () => {
  const navigate = useNavigate();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Vérifier l'état d'authentification et récupérer le profil utilisateur
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('ytautom_auth');
      setIsAuthenticated(auth === 'true');
      
      const savedProfile = localStorage.getItem('ytautom_profile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
        } catch (error) {
          console.error('Erreur lors de la récupération du profil:', error);
        }
      }
    };
    
    // Vérifier au chargement
    checkAuth();
    
    // Ajouter un event listener pour les changements de stockage et l'événement personnalisé
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth_changed', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth_changed', checkAuth);
    };
  }, []);

  // Gérer la déconnexion
  const handleLogout = () => {
    // Supprimer les données d'authentification mais garder le profil
    localStorage.removeItem('ytautom_auth');
    
    // Marquer que l'utilisateur vient de se déconnecter pour éviter la redirection automatique
    sessionStorage.setItem('from_logout', 'true');
    
    // Mettre à jour l'état local
    setIsAuthenticated(false);
    
    // Notifier les autres composants du changement d'état
    window.dispatchEvent(new Event('auth_changed'));
    
    // Rediriger vers la page de connexion
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
      <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
        {/* Logo et titre */}
        <motion.div 
          className="logo-container"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <Link to={isAuthenticated ? "/dashboard" : "/"} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
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
            gap: '16px',
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
          {/* Afficher les boutons selon l'état d'authentification */}
          {isAuthenticated ? (
            <>
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
                }}
                onClick={() => setMenuOpen(false)}
              >
                Profil
              </Link>
              
              {/* Affichage du nom d'utilisateur si disponible */}
              {userProfile && userProfile.youtuber_name && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(249, 250, 251, 0.8)',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.8)'}`,
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}>
                    {userProfile.youtuber_name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{
                    color: darkMode ? '#e5e7eb' : '#374151',
                    fontWeight: 500,
                    fontSize: '0.9rem'
                  }}>
                    {userProfile.youtuber_name}
                  </span>
                </div>
              )}
              
              {/* Bouton de déconnexion */}
              <button 
                onClick={handleLogout}
                style={{
                  background: darkMode ? 'rgba(220, 38, 38, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  color: darkMode ? '#f87171' : '#dc2626',
                  border: `1px solid ${darkMode ? 'rgba(220, 38, 38, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                  padding: '8px 16px',
                  borderRadius: theme.shape.borderRadius,
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              {/* Bouton de connexion */}
              <Link 
                to="/login" 
                className="nav-link"
                style={{ 
                  background: darkMode ? 'rgba(37, 99, 235, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  color: darkMode ? '#60a5fa' : '#2563eb',
                  border: `1px solid ${darkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                  padding: '8px 16px',
                  borderRadius: theme.shape.borderRadius,
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setMenuOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Se connecter
              </Link>
              
              {/* Bouton d'inscription */}
              <Link 
                to="/register" 
                className="nav-link"
                style={{ 
                  background: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                  color: darkMode ? '#34d399' : '#059669',
                  border: `1px solid ${darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.3)'}`,
                  padding: '8px 16px',
                  borderRadius: theme.shape.borderRadius,
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setMenuOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                S'inscrire
              </Link>
            </>
          )}

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
        </motion.div>
      </div>
    </header>
  );
};

export default ModernHeader;
