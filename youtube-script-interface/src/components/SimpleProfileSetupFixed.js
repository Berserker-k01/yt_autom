import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Version simplifiée et corrigée du composant de configuration de profil
const SimpleProfileSetupFixed = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { darkMode } = useTheme();
  
  // Informations du profil
  const [youtuberName, setYoutuberName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [language, setLanguage] = useState('');
  const [contentType, setContentType] = useState('');
  const [audienceAge, setAudienceAge] = useState('');
  const [contentStyle, setContentStyle] = useState('');
  
  // Préférences personnalisées
  const [customOptions, setCustomOptions] = useState({});
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Vérifier si un profil existe déjà dans le localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    
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
  
  // Enregistrer le profil
  const handleSubmit = (e) => {
    e.preventDefault();
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
    localStorage.setItem('ytautom_profile_configured', 'true');
    
    // Notifier les autres composants
    window.dispatchEvent(new Event('auth_changed'));
    
    // Redirection
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };
  
  // Ajouter une préférence personnalisée
  const handleAddCustomOption = () => {
    if (customKey && customValue) {
      // Créer une copie pour éviter les mutations directes
      const newOptions = { ...customOptions };
      newOptions[customKey] = customValue;
      
      // Mettre à jour l'état
      setCustomOptions(newOptions);
      setFeedback(`Préférence "${customKey}" ajoutée !`);
      
      // Réinitialiser les champs
      setCustomKey('');
      setCustomValue('');
      
      // Effacer le feedback après 3 secondes
      setTimeout(() => setFeedback(''), 3000);
    }
  };
  
  // Supprimer une préférence personnalisée
  const handleRemoveCustomOption = (key) => {
    const newOptions = { ...customOptions };
    delete newOptions[key];
    setCustomOptions(newOptions);
  };
  
  return (
    <div style={{
      backgroundColor: darkMode ? '#111827' : '#f9fafb',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: darkMode ? '#f9fafb' : '#1f2937'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '24px',
          textAlign: 'center',
          color: darkMode ? '#f9fafb' : '#1f2937'
        }}>
          Configurez votre profil YouTubeur
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Champ Nom YouTubeur */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Votre nom de YouTubeur *
            </label>
            <input
              type="text"
              value={youtuberName}
              onChange={(e) => setYoutuberName(e.target.value)}
              required
              placeholder="Comment souhaitez-vous être appelé?"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Champ Nom de chaîne */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Nom de votre chaîne YouTube
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Le nom de votre chaîne YouTube"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Champ Langue */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Langue principale
            </label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Entrez votre langue principale (ex: Français, Anglais...)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Champ Type de contenu */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Type de contenu
            </label>
            <input
              type="text"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              placeholder="Entrez votre type de contenu (ex: Technologie, Jeux vidéo...)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Champ Âge de l'audience */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Âge de votre audience cible
            </label>
            <input
              type="text"
              value={audienceAge}
              onChange={(e) => setAudienceAge(e.target.value)}
              placeholder="Entrez l'âge de votre audience (ex: 18-24, 25-34, Tous âges...)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Champ Style de contenu */}
          <div style={{marginBottom: '16px'}}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}>
              Style de contenu
            </label>
            <input
              type="text"
              value={contentStyle}
              onChange={(e) => setContentStyle(e.target.value)}
              placeholder="Entrez votre style de contenu (ex: Informatif, Divertissant...)"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                color: darkMode ? '#f9fafb' : '#1f2937'
              }}
            />
          </div>
          
          {/* Section Préférences personnalisées */}
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            borderRadius: '10px',
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.6)',
            border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(226, 232, 240, 0.8)'}`
          }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: darkMode ? '#f3f4f6' : '#111827',
              fontWeight: 500
            }}>
              Préférences personnalisées <span style={{
                color: darkMode ? '#9ca3af' : '#6b7280',
                fontSize: '0.875rem'
              }}>(facultatif)</span>
            </label>
            
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '0.875rem',
              color: darkMode ? '#d1d5db' : '#4b5563'
            }}>
              Ajoutez des préférences spécifiques qui seront prises en compte lors de la génération de contenu
            </p>
            
            {/* Liste des préférences existantes */}
            <div style={{marginBottom: '16px'}}>
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
                      onClick={() => handleRemoveCustomOption(key)}
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
            
            {/* Formulaire d'ajout de préférences */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.3)' : 'rgba(241, 245, 249, 0.6)',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Nom de la préférence"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937'
                }}
              />
              
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Valeur"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : '#d1d5db'}`,
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
                  color: darkMode ? '#f9fafb' : '#1f2937'
                }}
              />
              
              <button
                type="button"
                onClick={handleAddCustomOption}
                disabled={!customKey || !customValue}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: (!customKey || !customValue) ? '#60a5fa40' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 500,
                  cursor: (!customKey || !customValue) ? 'not-allowed' : 'pointer',
                  opacity: (!customKey || !customValue) ? 0.6 : 1
                }}
              >
                Ajouter cette préférence
              </button>
              
              {feedback && (
                <div style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                  color: darkMode ? '#34d399' : '#065f46',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  {feedback}
                </div>
              )}
            </div>
          </div>
          
          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Enregistrement en cours...' : 'Enregistrer et continuer →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleProfileSetupFixed;
