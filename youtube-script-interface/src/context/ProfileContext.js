import React, { createContext, useState, useContext, useEffect } from 'react';

// Créer le contexte de profil
const ProfileContext = createContext();

// Fonction pour récupérer l'URL de l'API selon l'environnement
const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? 'https://yt-autom-api.onrender.com' 
    : 'http://localhost:5000';
};

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = getApiBaseUrl();

  // Charger le profil depuis le localStorage au démarrage
  useEffect(() => {
    const loadProfile = () => {
      try {
        const savedProfile = localStorage.getItem('ytautom_profile');
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Sauvegarder le profil
  const saveProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);

      // Essayer d'envoyer au backend si disponible
      try {
        const response = await fetch(`${API_BASE}/api/save-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
          timeout: 3000
        });
        
        const data = await response.json();
        console.log('Profil enregistré sur le serveur:', data);
      } catch (apiError) {
        console.warn('Impossible de sauvegarder sur le serveur:', apiError.message);
        // Continuer quand même, car on utilise principalement le localStorage
      }

      // Toujours sauvegarder localement
      localStorage.setItem('ytautom_profile', JSON.stringify(profileData));
      
      // Mettre à jour l'état
      setProfile(profileData);
      
      return { success: true, profile: profileData };
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du profil:', err);
      setError('Problème lors de la sauvegarde du profil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Effacer le profil (rarement utilisé mais utile)
  const clearProfile = () => {
    localStorage.removeItem('ytautom_profile');
    setProfile(null);
  };

  const value = {
    profile,
    loading,
    error,
    saveProfile,
    clearProfile,
    isProfileSet: !!profile,
    API_BASE
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte de profil
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile doit être utilisé à l\'intérieur d\'un ProfileProvider');
  }
  return context;
};
