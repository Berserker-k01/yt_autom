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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Toutes les valeurs sont maintenant directement utilisées telles quelles
    
    // Créer l'objet profil
    const profileData = {
      youtuber_name: youtuberName,
      channel_name: channelName,
      language,
      content_type: contentType,
      audience_age: audienceAge,
      content_style: contentStyle,
      custom_options: customOptions
    };
    
    try {
      // Envoyer au backend si disponible
      try {
        const response = await axios.post(
          `${API_BASE}/api/save-profile`,
          profileData,
          { timeout: 3000 }
        );
        console.log('Profil enregistré sur le serveur:', response.data);
      } catch (apiError) {
        console.warn('Impossible de sauvegarder sur le serveur, utilisation du mode local:', apiError.message);
      }
      
      // Toujours sauvegarder localement
      localStorage.setItem('ytautom_profile', JSON.stringify(profileData));
      localStorage.setItem('ytautom_auth', 'true');
      localStorage.setItem('ytautom_profile_configured', 'true'); // Marquer le profil comme configuré
      
      // Rediriger vers le tableau de bord
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  // Simples gestionnaires pour les champs de texte
  const handleContentTypeChange = (e) => {
    setContentType(e.target.value);
  };
  
  const handleContentStyleChange = (e) => {
    setContentStyle(e.target.value);
  };
  
  // Ajouter une nouvelle préférence personnalisée
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  
  const addCustomOption = () => {
    if (newCustomKey && newCustomValue) {
      setCustomOptions(prev => ({ 
        ...prev, 
        [newCustomKey]: newCustomValue 
      }));
      setNewCustomKey('');
      setNewCustomValue('');
    }
  };
  
  // Supprimer une préférence personnalisée
  const removeCustomOption = (key) => {
    const updatedOptions = { ...customOptions };
    delete updatedOptions[key];
    setCustomOptions(updatedOptions);
  };
  
  // Rediriger vers le tableau de bord si le profil est déjà configuré
  useEffect(() => {
    if (profileAlreadyConfigured) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileAlreadyConfigured, navigate]);
  
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
        padding: '20px'
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
      padding: '20px'
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
          >
            <label>Préférences personnalisées <span className="optional-label">(facultatif)</span></label>
            <p className="custom-options-info">Ajoutez des préférences spécifiques qui seront prises en compte lors de la génération de contenu</p>
            
            <div className="custom-options-list">
              {Object.entries(customOptions).map(([key, value]) => (
                <div className="custom-option-item" key={key}>
                  <div className="custom-option-content">
                    <strong>{key}:</strong> {value}
                  </div>
                  <button 
                    type="button" 
                    className="remove-option-btn" 
                    onClick={() => removeCustomOption(key)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="add-custom-option">
              <div className="custom-option-inputs">
                <input
                  type="text"
                  value={newCustomKey}
                  onChange={(e) => setNewCustomKey(e.target.value)}
                  placeholder="Nom de la préférence"
                  className="custom-key-input"
                />
                <input
                  type="text"
                  value={newCustomValue}
                  onChange={(e) => setNewCustomValue(e.target.value)}
                  placeholder="Valeur"
                  className="custom-value-input"
                />
              </div>
              <button 
                type="button" 
                className="add-option-btn btn-gradient btn-blue-purple" 
                onClick={addCustomOption}
                disabled={!newCustomKey || !newCustomValue}
              >
                Ajouter
              </button>
            </div>
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
