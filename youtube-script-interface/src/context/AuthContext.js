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

      console.log(`Tentative d'inscription à ${API_BASE}/api/register avec ${username}, ${email}`);
      const response = await axios.post(
        `${API_BASE}/api/register`,
        { username, email, password },
        { withCredentials: true }
      );

      console.log('Réponse inscription:', response.data);
      
      // Si inscription réussie, on garde l'utilisateur en mémoire
      if (response.data && response.data.user) {
        setUser(response.data.user);
        console.log('Utilisateur défini après inscription:', response.data.user);
      }

      return response.data;
    } catch (err) {
      console.error('Erreur d\'inscription:', err.response?.data || err.message);
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

      console.log(`Tentative de connexion à ${API_BASE}/api/login avec ${email}`);
      // Ajouter un délai pour s'assurer que les en-têtes sont correctement définies
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Montrer plus de détails sur la requête de connexion
      console.log('Envoi des données:', { email, password: '***mot de passe masqué***' });
      
      const response = await axios.post(
        `${API_BASE}/api/login`,
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Réponse complète:', response);
      console.log('Réponse connexion:', response.data);
      
      // Si connexion réussie, on garde l'utilisateur en mémoire
      if (response.data && response.data.user) {
        setUser(response.data.user);
        console.log('Utilisateur défini après connexion:', response.data.user);
      } else if (response.data) {
        // Si l'API ne renvoie pas l'objet user mais contient des données
        // Cela permet de gérer le cas où le backend renvoie directement les données utilisateur
        setUser(response.data);
        console.log('Utilisateur défini depuis les données brutes de la réponse:', response.data);
      }

      return response.data;
    } catch (err) {
      console.error('Erreur de connexion détaillée:', err);
      if (err.response) {
        console.error('Détails de l\'erreur:', {
          status: err.response.status,
          headers: err.response.headers,
          data: err.response.data
        });
      }
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

      console.log(`Configuration du profil avec: `, profileData);

      const response = await axios.post(
        `${API_BASE}/api/setup-profile`,  // URL corrigée pour correspondre au backend
        profileData,
        { withCredentials: true }
      );

      console.log('Réponse setup profil:', response.data);

      // Mettre à jour l'utilisateur avec le setup complété de manière plus claire
      const updatedUser = {
        ...(user || {}), // S'assurer que user existe
        setupRequired: false,
        profile: response.data.profile
      };
      
      console.log('Mise à jour de l\'utilisateur après configuration du profil:', updatedUser);
      setUser(updatedUser);

      // On pourrait aussi vérifier l'état après mise à jour
      setTimeout(() => {
        console.log('Utilisateur après mise à jour:', user);
      }, 100);

      return response.data;
    } catch (err) {
      console.error('Erreur de configuration profil:', err.response?.data || err.message);
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
    API_BASE // Exporte l'URL de l'API pour utilisation dans les composants
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
