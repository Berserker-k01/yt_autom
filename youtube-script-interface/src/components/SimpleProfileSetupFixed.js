import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

// Détermine l'URL de l'API selon l'environnement
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://yt-autom-api.onrender.com' 
  : 'http://localhost:5000';

const SimpleProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Informations du profil
  const [youtuberName, setYoutuberName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [language, setLanguage] = useState('fr');
  const [contentType, setContentType] = useState('tech');
  const [audienceAge, setAudienceAge] = useState('18-24');
  const [contentStyle, setContentStyle] = useState('informative');
  
  // Nouvelles options personnalisées par l'utilisateur
  const [customOptions, setCustomOptions] = useState({});
  const [showCustomInput, setShowCustomInput] = useState({});
  const [customContentType, setCustomContentType] = useState('');
  const [customContentStyle, setCustomContentStyle] = useState('');
  
  // État pour vérifier si le profil a déjà été configuré
  const [profileAlreadyConfigured, setProfileAlreadyConfigured] = useState(false);
  
  // Vérifier si un profil existe déjà dans le localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    const isConfigured = localStorage.getItem('ytautom_profile_configured');
    
    if (isConfigured === 'true') {
      setProfileAlreadyConfigured(true);
    }
    
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setYoutuberName(profile.youtuber_name || '');
        setChannelName(profile.channel_name || '');
        setLanguage(profile.language || 'fr');
        
        // Gestion des types personnalisés
        if (profile.content_type && profile.content_type.startsWith('custom_')) {
          setContentType('other');
          setCustomContentType(profile.content_type.replace('custom_', ''));
          setShowCustomInput(prev => ({ ...prev, contentType: true }));
        } else {
          setContentType(profile.content_type || 'tech');
        }
        
        setAudienceAge(profile.audience_age || '18-24');
        
        // Gestion des styles personnalisés
        if (profile.content_style && profile.content_style.startsWith('custom_')) {
          setContentStyle('other');
          setCustomContentStyle(profile.content_style.replace('custom_', ''));
          setShowCustomInput(prev => ({ ...prev, contentStyle: true }));
        } else {
          setContentStyle(profile.content_style || 'informative');
        }
        
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
    
    // Gérer les valeurs personnalisées
    let finalContentType = contentType;
    if (contentType === 'other' && customContentType) {
      finalContentType = `custom_${customContentType}`;
    }
    
    let finalContentStyle = contentStyle;
    if (contentStyle === 'other' && customContentStyle) {
      finalContentStyle = `custom_${customContentStyle}`;
    }
    
    // Créer l'objet profil
    const profileData = {
      youtuber_name: youtuberName,
      channel_name: channelName,
      language,
      content_type: finalContentType,
      audience_age: audienceAge,
      content_style: finalContentStyle,
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
  
  // Gérer les changements dans les sélections pour afficher les champs personnalisés
  const handleContentTypeChange = (e) => {
    const value = e.target.value;
    setContentType(value);
    setShowCustomInput(prev => ({ ...prev, contentType: value === 'other' }));
  };
  
  const handleContentStyleChange = (e) => {
    const value = e.target.value;
    setContentStyle(value);
    setShowCustomInput(prev => ({ ...prev, contentStyle: value === 'other' }));
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
      <div className="profile-setup-container">
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="success-icon">✓</div>
          <h2>Profil déjà configuré</h2>
          <p>Votre profil a déjà été configuré. Vous allez être redirigé vers le tableau de bord...</p>
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
    <div className="profile-setup-container">
      <motion.div 
        className="profile-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Personnalisez votre expérience
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Ces informations nous aideront à personnaliser vos scripts vidéo YouTube.
        </motion.p>
        
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
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
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="es">Espagnol</option>
              <option value="de">Allemand</option>
            </select>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={3}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="contentType">Type de contenu</label>
            <select
              id="contentType"
              value={contentType}
              onChange={handleContentTypeChange}
            >
              <option value="tech">Technologie</option>
              <option value="gaming">Jeux vidéo</option>
              <option value="lifestyle">Mode de vie</option>
              <option value="education">Éducation</option>
              <option value="entertainment">Divertissement</option>
              <option value="business">Business</option>
              <option value="other">Autre (personnalisé)</option>
            </select>
            
            {showCustomInput.contentType && (
              <motion.div 
                className="custom-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  value={customContentType}
                  onChange={(e) => setCustomContentType(e.target.value)}
                  placeholder="Précisez votre type de contenu"
                  className="custom-field"
                />
              </motion.div>
            )}
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={4}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="audienceAge">Âge de votre audience cible</label>
            <select
              id="audienceAge"
              value={audienceAge}
              onChange={(e) => setAudienceAge(e.target.value)}
            >
              <option value="13-17">13-17 ans</option>
              <option value="18-24">18-24 ans</option>
              <option value="25-34">25-34 ans</option>
              <option value="35-44">35-44 ans</option>
              <option value="45+">45 ans et plus</option>
            </select>
          </motion.div>
          
          <motion.div 
            className="form-group"
            custom={5}
            initial="hidden"
            animate="visible"
            variants={formControls}
          >
            <label htmlFor="contentStyle">Style de contenu</label>
            <select
              id="contentStyle"
              value={contentStyle}
              onChange={handleContentStyleChange}
            >
              <option value="informative">Informatif</option>
              <option value="entertaining">Divertissant</option>
              <option value="educational">Éducatif</option>
              <option value="inspiring">Inspirant</option>
              <option value="controversial">Provocateur</option>
              <option value="other">Autre (personnalisé)</option>
            </select>
            
            {showCustomInput.contentStyle && (
              <motion.div 
                className="custom-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <input
                  type="text"
                  value={customContentStyle}
                  onChange={(e) => setCustomContentStyle(e.target.value)}
                  placeholder="Précisez votre style de contenu"
                  className="custom-field"
                />
              </motion.div>
            )}
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
