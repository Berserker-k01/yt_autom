import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// Detection de l'environnement
const isProduction = window.location.hostname !== 'localhost';
const API_BASE = isProduction ? 'https://yt-autom.onrender.com' : 'http://localhost:5000';

// Création du contexte d'authentification
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effet pour vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si nous avons un cookie d'authentification
        const authCookie = Cookies.get('auth_token');
        if (!authCookie) {
          setLoading(false);
          return;
        }

        // Configurer les en-têtes avec le cookie d'authentification
        const config = {
          headers: {
            Authorization: `Bearer ${authCookie}`,
          },
          withCredentials: true,
        };

        // Requête pour récupérer les informations de l'utilisateur
        const response = await axios.get(`${API_BASE}/api/user`, config);
        setUser(response.data);
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        // En cas d'erreur, supprimer le cookie d'authentification
        Cookies.remove('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction d'inscription
  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(
        `${API_BASE}/api/register`,
        { username, email, password },
        { withCredentials: true }
      );

      // Si inscription réussie, on garde l'utilisateur en mémoire
      setUser(response.data);
      
      // Enregistrer le token dans un cookie
      if (response.data.token) {
        Cookies.set('auth_token', response.data.token, { expires: 7 }); // Cookie expire dans 7 jours
      }

      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(
        `${API_BASE}/api/login`,
        { email, password },
        { withCredentials: true }
      );

      // Si connexion réussie, on garde l'utilisateur en mémoire
      setUser(response.data);
      
      // Enregistrer le token dans un cookie
      if (response.data.token) {
        Cookies.set('auth_token', response.data.token, { expires: 7 }); // Cookie expire dans 7 jours
      }

      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      await axios.post(`${API_BASE}/api/logout`, {}, { withCredentials: true });

      // Supprimer le cookie d'authentification
      Cookies.remove('auth_token');
      
      // Réinitialiser l'état de l'utilisateur
      setUser(null);
    } catch (err) {
      setError('Erreur lors de la déconnexion');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour enregistrer le profil utilisateur après inscription
  const setupProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${Cookies.get('auth_token')}`,
        },
        withCredentials: true,
      };

      const response = await axios.post(
        `${API_BASE}/api/profile/setup`,
        profileData,
        config
      );

      // Mettre à jour l'utilisateur avec le setup complété
      setUser(prev => ({
        ...prev,
        setupRequired: false,
        profile: response.data.profile
      }));

      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la configuration du profil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Valeurs exposées par le contexte
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    setupProfile,
    isAuthenticated: !!user,
    needsSetup: user?.setupRequired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};
