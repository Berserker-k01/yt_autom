import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Détermine l'URL de l'API selon l'environnement
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://yt-autom-api.onrender.com' 
  : 'http://localhost:5000';

const SimpleProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  
  // Informations du profil
  const [youtuberName, setYoutuberName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [language, setLanguage] = useState('');
  const [contentType, setContentType] = useState('');
  const [audienceAge, setAudienceAge] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  
  // Nouvelles options personnalisées par l'utilisateur
  const [customOptions, setCustomOptions] = useState({});
  
  // État pour vérifier si le profil a déjà été configuré
  const [profileAlreadyConfigured, setProfileAlreadyConfigured] = useState(false);
  
  // Vérifier si un profil existe déjà dans le localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    const isConfigured = localStorage.getItem('ytautom_profile_configured');
    const isAuthenticated = localStorage.getItem('ytautom_auth');
    
    // Vérifier si l'utilisateur a été redirigé depuis la déconnexion
    const fromLogout = sessionStorage.getItem('from_logout');
    
    // Ne pas considérer le profil comme configuré si l'utilisateur vient de se déconnecter
    // ou si l'authentification n'est pas présente
    if (isConfigured === 'true' && isAuthenticated === 'true' && !fromLogout) {
      setProfileAlreadyConfigured(true);
    } else {
      // Réinitialiser le flag après l'avoir utilisé
      sessionStorage.removeItem('from_logout');
      setProfileAlreadyConfigured(false);
    }
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setYoutuberName(profile.youtuber_name || '');
        setChannelName(profile.channel_name || '');
        setLanguage(profile.language || '');
        setContentType(profile.content_type || '');
        setAudienceAge(profile.audience_age || '');
        setContentStyle(profile.content_style || '');
        
        // Charger les options personnalisées si elles existent
        if (profile.custom_options) {
          setCustomOptions(profile.custom_options);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
      }
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);

    // Enregistrer les préférences utilisateur
    const userPreferences = {
      youtuber_name: youtuberName,
      channel_name: channelName,
      language,
      content_type: contentType,
      audience_age: audienceAge,
      content_style: contentStyle,
      custom_options: customOptions
    };

    // Enregistrer dans le localStorage
    localStorage.setItem('ytautom_profile', JSON.stringify(userPreferences));
    
    // IMPORTANT: Marquer que l'utilisateur a configuré son profil
    localStorage.setItem('ytautom_profile_configured', 'true');
    
    // Notifier les autres composants du changement
    window.dispatchEvent(new Event('auth_changed'));

    // Animation de succès
    setTimeout(() => {
      setLoading(false);
      // Rediriger vers le tableau de bord
      navigate('/dashboard');
    }, 1500);
  };
  
  // Vérifier si le profil a déjà été configuré et rediriger si nécessaire
  useEffect(() => {
    const profileConfigured = localStorage.getItem('ytautom_profile_configured') === 'true';
    const auth = localStorage.getItem('ytautom_auth') === 'true';
    const fromLogout = sessionStorage.getItem('from_logout') === 'true';
    
    // Si l'utilisateur vient de se déconnecter, ne pas rediriger
    if (fromLogout) {
      sessionStorage.removeItem('from_logout');
      return;
    }
    
    // Si l'utilisateur est authentifié et a déjà configuré son profil, rediriger vers le dashboard
    if (auth && profileConfigured) {
      console.log('Profil déjà configuré, redirection vers le dashboard...');
      navigate('/dashboard');
    }
  }, [navigate]);
  
  // Simples gestionnaires pour les champs de texte
  const handleContentTypeChange = (e) => {
    setContentType(e.target.value);
  };
  
  const handleContentStyleChange = (e) => {
    setContentStyle(e.target.value);
  };
  
  // Préférences personnalisées
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // Supprimer une préférence personnalisée
  const removeCustomOption = (key) => {
    setCustomOptions(prevOptions => {
      const updatedOptions = { ...prevOptions };
      delete updatedOptions[key];
      console.log('Options personnalisées après suppression:', updatedOptions);
      return updatedOptions;
    });
  };
  
  // Animation pour les groupes de formulaire
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

  if (profileAlreadyConfigured) {
    return (
      <div className={`profile-setup-container ${darkMode ? 'dark-mode' : ''}`} style={{
        backgroundColor: darkMode ? '#111827' : '#f9fafb',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        color: darkMode ? '#f9fafb' : '#1f2937',
      }}>
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            color: darkMode ? '#f9fafb' : '#1f2937',
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
          }}
        >
          <div className="success-icon">✓</div>
          <h2 style={{ color: darkMode ? '#e5e7eb' : '#1f2937' }}>Profil déjà configuré</h2>
          <p style={{ color: darkMode ? '#d1d5db' : '#6b7280' }}>Votre profil a déjà été configuré. Vous allez être redirigé vers le tableau de bord...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`profile-setup-container ${darkMode ? 'dark-mode' : ''}`} style={{
      backgroundColor: darkMode ? '#111827' : '#f9fafb',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: darkMode ? '#f9fafb' : '#1f2937',
    }}>
      <motion.div 
        className="profile-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
        style={{
          width: '100%',
          maxWidth: '700px',
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '24px',
            textAlign: 'center',
            color: darkMode ? '#f9fafb' : '#1f2937'
          }}
        >
          Configurez votre profil YouTubeur
        </motion.h2>
        
        {error && (
          <div className="error-message" style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
            color: darkMode ? '#fca5a5' : '#dc2626',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <motion.div 
            className="form-group"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="youtuberName">Votre nom de YouTubeur *</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="youtuberName"
                value={youtuberName}
                onChange={(e) => setYoutuberName(e.target.value)}
                required
                placeholder="Comment souhaitez-vous être appelé?"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">👤</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="channelName">Nom de votre chaîne YouTube</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Le nom de votre chaîne YouTube"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">📺</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="language">Langue principale</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Entrez votre langue principale (ex: Français, Anglais...)"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">🌐</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="contentType">Type de contenu</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="contentType"
                value={contentType}
                onChange={handleContentTypeChange}
                placeholder="Entrez votre type de contenu (ex: Technologie, Jeux vidéo...)"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">📊</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="audienceAge">Âge de votre audience cible</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="audienceAge"
                value={audienceAge}
                onChange={(e) => setAudienceAge(e.target.value)}
                placeholder="Entrez l'âge de votre audience (ex: 18-24, 25-34, Tous âges...)"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">👥</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={5}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="contentStyle">Style de contenu</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="contentStyle"
                value={contentStyle}
                onChange={handleContentStyleChange}
                placeholder="Entrez votre style de contenu (ex: Informatif, Divertissant...)"
                style={{
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`
                }}
              />
              <span className="input-icon">🎭</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="form-group custom-options-section"
            custom={6}
            initial="hidden"
            animate="visible"
            variants={formControls}
            style={{ 
              marginBottom: '20px',
              padding: '20px',
              borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.6)',
              border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
            }}
          >
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              color: darkMode ? '#f3f4f6' : '#111827',
              fontWeight: 500
            }}>
              Préférences personnalisées <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>(facultatif)</span>
            </label>
            
            <p style={{ 
              margin: '0 0 16px 0',
              fontSize: '0.875rem',
              color: darkMode ? '#d1d5db' : '#4b5563'
            }}>
              Ajoutez des préférences spécifiques qui seront prises en compte lors de la génération de contenu
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              {Object.keys(customOptions).length > 0 ? (
                Object.entries(customOptions).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.5)' : '#fff',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#e5e7eb'}`
                  }}>
                    <div style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: darkMode ? '#e5e7eb' : '#1f2937'
                    }}>
                      <strong>{key}:</strong> {value}
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeCustomOption(key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: darkMode ? '#ef4444' : '#dc2626',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        padding: '0 8px',
                        borderRadius: '4px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '10px 16px',
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.3)' : 'rgba(241, 245, 249, 0.6)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: darkMode ? '#9ca3af' : '#6b7280',
                  marginBottom: '10px'
                }}>
                  Aucune préférence personnalisée ajoutée
                </div>
              )}
            </div>
            
            <div className="custom-preferences-form" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.3)' : 'rgba(241, 245, 249, 0.6)',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <label style={{
                fontSize: '0.9rem',
                fontWeight: '500',
                color: darkMode ? '#d1d5db' : '#4b5563'
              }}>
                Ajouter une nouvelle préférence
              </label>
              
              <input
                type="text"
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                placeholder="Nom de la préférence"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937'
                }}
              />
              
              <input
                type="text"
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                placeholder="Valeur"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937'
                }}
              />
              
              <button 
                type="button"
                onClick={() => {
                  if (newCustomKey && newCustomValue) {
                    // Créer une copie de l'objet existant
                    const updatedOptions = { ...customOptions };
                    // Ajouter la nouvelle préférence
                    updatedOptions[newCustomKey] = newCustomValue;
                    // Mettre à jour l'état
                    setCustomOptions(updatedOptions);
                    // Afficher un message de confirmation
                    setFeedbackMessage(`Préférence "${newCustomKey}" ajoutée !`);
                    // Réinitialiser les champs
                    setNewCustomKey('');
                    setNewCustomValue('');
                    // Effacer le message après un délai
                    setTimeout(() => setFeedbackMessage(''), 3000);
                  }
                }}
                disabled={!newCustomKey || !newCustomValue}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: (!newCustomKey || !newCustomValue) ? '#60a5fa40' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '500',
                  cursor: (!newCustomKey || !newCustomValue) ? 'not-allowed' : 'pointer',
                  opacity: (!newCustomKey || !newCustomValue) ? 0.6 : 1
                }}
              >
                Ajouter cette préférence
              </button>
            </div>
            
            {feedbackMessage && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                color: darkMode ? '#34d399' : '#065f46',
                marginBottom: '20px',
                marginTop: '10px'
              }}>
                {feedbackMessage}
              </div>
            )}
          </motion.div>
          
          <motion.button 
            type="submit" 
            className="btn btn-primary btn-gradient btn-blue-purple w-100 btn-with-icon"
            disabled={loading}
            custom={7}
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
                <span>Chargement...</span>
              </div>
            ) : (
              <>
                Enregistrer et continuer
                <span className="btn-icon">→</span>
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default SimpleProfileSetup;
