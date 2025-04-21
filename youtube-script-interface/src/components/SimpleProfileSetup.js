import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  
  // Vérifier si un profil existe déjà dans le localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setYoutuberName(profile.youtuber_name || '');
        setChannelName(profile.channel_name || '');
        setLanguage(profile.language || 'fr');
        setContentType(profile.content_type || 'tech');
        setAudienceAge(profile.audience_age || '18-24');
        setContentStyle(profile.content_style || 'informative');
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
      }
    }
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Créer l'objet profil
    const profileData = {
      youtuber_name: youtuberName,
      channel_name: channelName,
      language,
      content_type: contentType,
      audience_age: audienceAge,
      content_style: contentStyle
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
      
      // Rediriger vers le tableau de bord
      navigate('/dashboard');
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la sauvegarde du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="profile-setup-container">
      <div className="profile-card">
        <h2>Personnalisez votre expérience</h2>
        <p>Ces informations nous aideront à personnaliser vos scripts vidéo YouTube.</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="youtuberName">Votre nom de YouTubeur *</label>
            <input
              type="text"
              id="youtuberName"
              value={youtuberName}
              onChange={(e) => setYoutuberName(e.target.value)}
              required
              placeholder="Comment souhaitez-vous être appelé?"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="channelName">Nom de votre chaîne YouTube</label>
            <input
              type="text"
              id="channelName"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Le nom de votre chaîne YouTube"
            />
          </div>
          
          <div className="form-group">
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
          </div>
          
          <div className="form-group">
            <label htmlFor="contentType">Type de contenu</label>
            <select
              id="contentType"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="tech">Technologie</option>
              <option value="gaming">Jeux vidéo</option>
              <option value="lifestyle">Mode de vie</option>
              <option value="education">Éducation</option>
              <option value="entertainment">Divertissement</option>
              <option value="business">Business</option>
              <option value="other">Autre</option>
            </select>
          </div>
          
          <div className="form-group">
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
          </div>
          
          <div className="form-group">
            <label htmlFor="contentStyle">Style de contenu</label>
            <select
              id="contentStyle"
              value={contentStyle}
              onChange={(e) => setContentStyle(e.target.value)}
            >
              <option value="informative">Informatif</option>
              <option value="entertaining">Divertissant</option>
              <option value="educational">Éducatif</option>
              <option value="inspiring">Inspirant</option>
              <option value="controversial">Provocateur</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="profile-submit-btn"
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Enregistrer et continuer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimpleProfileSetup;
