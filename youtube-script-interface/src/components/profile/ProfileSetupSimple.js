import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProfileSetupSimple = () => {
  const [formData, setFormData] = useState({
    channel_name: '',
    youtuber_name: '',
    video_style: '',
    approach_style: '',
    target_audience: '',
    video_length: '10-15 minutes'
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setupProfile, API_BASE } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      console.log('Soumission du formulaire de profil:', formData);
      
      // Envoi direct au backend sans passer par le contexte d'authentification
      const response = await fetch(`${API_BASE}/api/setup-profile-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Réponse de configuration du profil:', data);
      
      // Indiquer le succès
      setSuccess(true);
      
      // Forcer la redirection après un court délai
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      
    } catch (err) {
      console.error('Erreur lors de la configuration du profil:', err);
      setError('Erreur lors de la configuration du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Si le processus a réussi, afficher un message de succès avant la redirection
  if (success) {
    return (
      <div className="success-container">
        <div className="success-message">
          <h2>Profil configuré avec succès!</h2>
          <p>Redirection vers le tableau de bord...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <h2>Configuration de votre profil Créateur</h2>
        <p className="setup-info">
          Ces informations nous permettront de personnaliser les scripts générés selon votre style et votre audience.
        </p>
        
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="channel_name">Nom de votre chaîne YouTube</label>
            <input
              type="text"
              id="channel_name"
              name="channel_name"
              value={formData.channel_name}
              onChange={handleChange}
              required
              placeholder="ex: Tech Master"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="youtuber_name">Votre nom/pseudo de YouTubeur</label>
            <input
              type="text"
              id="youtuber_name"
              name="youtuber_name"
              value={formData.youtuber_name}
              onChange={handleChange}
              required
              placeholder="ex: Alex"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="video_style">Style de vos vidéos</label>
            <textarea
              id="video_style"
              name="video_style"
              value={formData.video_style}
              onChange={handleChange}
              required
              placeholder="Décrivez le style général de vos vidéos (informatif, humoristique, tutoriel, storytelling, etc.)"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="approach_style">Votre approche personnelle</label>
            <textarea
              id="approach_style"
              name="approach_style"
              value={formData.approach_style}
              onChange={handleChange}
              required
              placeholder="Comment abordez-vous vos sujets ? (ton conversationnel, pédagogique, direct, dynamique, etc.)"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="target_audience">Public cible</label>
            <input
              type="text"
              id="target_audience"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              required
              placeholder="ex: Jeunes adultes 18-35 ans intéressés par la technologie"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="video_length">Durée habituelle de vos vidéos</label>
            <select
              id="video_length"
              name="video_length"
              value={formData.video_length}
              onChange={handleChange}
              required
            >
              <option value="moins de 5 minutes">Moins de 5 minutes</option>
              <option value="5-10 minutes">5-10 minutes</option>
              <option value="10-15 minutes">10-15 minutes</option>
              <option value="15-20 minutes">15-20 minutes</option>
              <option value="plus de 20 minutes">Plus de 20 minutes</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Configuration en cours...' : 'Terminer la configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupSimple;
