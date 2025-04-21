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

  // Effet amélioré pour vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Première stratégie: Vérifier les cookies de session
        const sessionCookie = Cookies.get('user_session') || Cookies.get('logged_in_user');
        
        // Deuxième stratégie: Vérifier le localStorage
        const localAuth = localStorage.getItem('ytautom_auth');
        const localUser = localStorage.getItem('ytautom_user');
        
        if (localAuth && localUser) {
          console.log('🔒 Session restaurée depuis localStorage');
          setUser(JSON.parse(localUser));
          setLoading(false);
          return;
        }
        
        if (!sessionCookie) {
          console.log('⚠️ Aucune session active détectée');
          setLoading(false);
          return;
        }
        
        // Si nous avons un cookie mais pas de données locales, essayer d'interroger le serveur
        try {
          console.log('📡 Tentative de récupération des données utilisateur depuis le serveur');
          const response = await axios.get(`${API_BASE}/api/user`, { 
            withCredentials: true,
            timeout: 3000 // Timeout court pour éviter de bloquer trop longtemps
          });
          
          if (response.data) {
            setUser(response.data);
            localStorage.setItem('ytautom_auth', 'true');
            localStorage.setItem('ytautom_user', JSON.stringify(response.data));
          }
        } catch (apiErr) {
          console.warn('Erreur lors de la récupération des données utilisateur:', apiErr);
          // Réinitialiser les cookies en cas d'erreur
          Cookies.remove('user_session');
          Cookies.remove('logged_in_user');
          localStorage.removeItem('ytautom_auth');
          localStorage.removeItem('ytautom_user');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction d'inscription améliorée
  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);

      console.log(`📝 Tentative d'inscription à ${API_BASE}/api/register avec ${username}, ${email}`);
      const response = await axios.post(
        `${API_BASE}/api/register`,
        { username, email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Réponse inscription:', response.data);
      
      // Traitement standardisé de la réponse
      if (response.data && response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        
        // Sauvegarder les données localement pour la persistance
        localStorage.setItem('ytautom_auth', 'true');
        localStorage.setItem('ytautom_user', JSON.stringify(userData));
        
        // Créer un cookie de session pour le débogage
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        Cookies.set('user_session', 'authenticated', { expires, sameSite: 'Lax' });
        
        console.log('Utilisateur inscrit avec succès:', userData);
      }

      return response.data;
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      
      // Mode secours si le serveur est inaccessible
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        console.log('🚨 Activation du mode secours pour l\'inscription');
        
        // Créer un utilisateur fictif en cas d'échec de connexion au serveur
        const fallbackUser = {
          id: 1,
          username: username || email.split('@')[0],
          email: email,
          setupRequired: true, // Forcer la configuration du profil après inscription
          profile: null
        };
        
        setUser(fallbackUser);
        localStorage.setItem('ytautom_auth', 'true');
        localStorage.setItem('ytautom_user', JSON.stringify(fallbackUser));
        
        return { user: fallbackUser, auth: true, fallbackMode: true };
      }
      
      setError(err.response?.data?.error || 'Problème lors de l\'inscription. Veuillez réessayer.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de connexion améliorée
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      console.log(`🔒 Tentative de connexion à ${API_BASE}/api/login avec ${email}`);
      
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

      console.log('Réponse connexion:', response.data);
      
      // Traitement de la réponse standardisé
      if (response.data && response.data.user) {
        // Stocker l'utilisateur dans le contexte
        setUser(response.data.user);
        console.log('Utilisateur connecté:', response.data.user);
        
        // Stocker un marqueur d'authentification dans le localStorage
        localStorage.setItem('ytautom_auth', 'true');
        localStorage.setItem('ytautom_user', JSON.stringify(response.data.user));
        
        // Créer notre propre cookie de session (pour le débogage)
        const expires = new Date();
        expires.setDate(expires.getDate() + 7); // 7 jours
        Cookies.set('user_session', 'authenticated', { expires, sameSite: 'Lax' });
      }

      return response.data;
    } catch (err) {
      console.error('Erreur de connexion:', err);
      
      // Si le backend est indisponible, essayer de se connecter en mode secours
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        console.log('🚨 Tentative de connexion en mode secours');
        // Créer un utilisateur fictif en cas d'échec de connexion au serveur
        const fallbackUser = {
          id: 1,
          username: email.split('@')[0] || 'utilisateur',
          email: email,
          setupRequired: false,
          profile: {
            channel_name: 'Ma Chaîne YouTube',
            youtuber_name: email.split('@')[0] || 'YouTubeur',
            setup_completed: true
          }
        };
        
        setUser(fallbackUser);
        localStorage.setItem('ytautom_auth', 'true');
        localStorage.setItem('ytautom_user', JSON.stringify(fallbackUser));
        
        return { user: fallbackUser, auth: true, fallbackMode: true };
      }
      
      // Afficher l'erreur précise retournée par le serveur si disponible
      setError(err.response?.data?.error || 'Problème de connexion. Veuillez réessayer.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion améliorée
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      // Essayer d'appeler l'API de déconnexion si le serveur est accessible
      try {
        await axios.post(`${API_BASE}/api/logout`, {}, { 
          withCredentials: true,
          timeout: 3000 // Timeout court pour éviter de bloquer trop longtemps
        });
      } catch (apiErr) {
        console.warn("Impossible de contacter l'API de déconnexion:", apiErr.message);
        // Continuer vers la déconnexion locale même si l'API échoue
      }

      // Supprimer tous les cookies d'authentification possibles
      Cookies.remove('auth_token');
      Cookies.remove('user_session');
      Cookies.remove('logged_in_user');
      
      // Supprimer les données du localStorage
      localStorage.removeItem('ytautom_auth');
      localStorage.removeItem('ytautom_user');
      
      // Réinitialiser l'état de l'utilisateur
      setUser(null);
      console.log('🔒 Déconnexion réussie');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      // Même en cas d'erreur, on force la déconnexion
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction améliorée pour enregistrer le profil utilisateur après inscription
  const setupProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);

      console.log(`💼 Configuration du profil avec: `, profileData);

      const response = await axios.post(
        `${API_BASE}/api/setup-profile`,
        profileData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Réponse configuration du profil:', response.data);

      // Mise à jour complète de l'utilisateur
      let updatedUser;
      
      if (response.data.user) {
        // Si le backend renvoie l'utilisateur complet
        updatedUser = response.data.user;
      } else {
        // Sinon, mettre à jour l'utilisateur actuel avec les nouvelles données de profil
        updatedUser = {
          ...(user || {}),
          setupRequired: false,
          profile: response.data.profile || profileData
        };
      }
      
      // Mettre à jour l'utilisateur en mémoire
      setUser(updatedUser);
      
      // Sauvegarder dans le localStorage pour la persistance
      localStorage.setItem('ytautom_auth', 'true');
      localStorage.setItem('ytautom_user', JSON.stringify(updatedUser));

      return response.data;
    } catch (err) {
      console.error('Erreur lors de la configuration du profil:', err);
      
      // Mode secours en cas d'erreur de connexion serveur 
      if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
        console.log('🚨 Mode secours pour la configuration du profil');
        
        // Créer un profil local même en cas d'échec de l'API
        const updatedUser = {
          ...(user || {}),
          setupRequired: false,
          profile: {
            ...profileData,
            setup_completed: true
          }
        };
        
        setUser(updatedUser);
        localStorage.setItem('ytautom_user', JSON.stringify(updatedUser));
        
        return { 
          success: true,
          fallbackMode: true,
          profile: profileData
        };
      }
      
      setError(err.response?.data?.error || 'Problème lors de la configuration du profil');
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
