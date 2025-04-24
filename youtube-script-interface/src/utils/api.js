/**
 * Utilitaires pour les appels API
 * Optimisés pour la génération de contenu YouTube avec Gemini et SerpAPI
 */
import axios from 'axios';

// Déterminer l'URL de base en fonction de l'environnement
const API_BASE = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL || 'https://youtube-script-generator.onrender.com'
  : 'http://localhost:5000';

// Instance Axios configurée avec des paramètres optimaux
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30s de timeout pour les opérations d'IA potentiellement longues
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Intercepteur pour la gestion globale des erreurs
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log détaillé des erreurs
    console.error('Erreur API:', {
      endpoint: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Messages d'erreur personnalisés
    let errorMessage = 'Une erreur est survenue';
    
    if (error.response) {
      // Le serveur a répondu avec un code d'erreur
      if (error.response.status === 404) {
        errorMessage = 'Le service demandé n\'est pas disponible';
      } else if (error.response.status === 500) {
        errorMessage = 'Erreur du serveur, veuillez réessayer plus tard';
      } else if (error.response.data?.error) {
        errorMessage = error.response.data.error;
      }
    } else if (error.request) {
      // Pas de réponse reçue, problème de connexion
      errorMessage = 'Impossible de se connecter au serveur, vérifiez votre connexion';
    }
    
    return Promise.reject({ ...error, userMessage: errorMessage });
  }
);

// Fonctions d'API pour chaque endpoint principal
export const topicsApi = {
  // Génération de sujets YouTube avec Gemini API
  generateTopics: async (theme, profile = {}) => {
    try {
      const response = await apiClient.post('/generate-topics', { 
        theme, 
        profile 
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération des sujets:', error);
      throw error;
    }
  },
  
  // Récupération de l'historique des sujets
  getHistory: async () => {
    try {
      const response = await apiClient.get('/topics-history');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
};

export const scriptApi = {
  // Génération de scripts avec les sources
  generateScript: async (topic, research, profile = {}, sources = []) => {
    try {
      const response = await apiClient.post('/generate-script', { 
        topic, 
        research, 
        profile,
        sources
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du script:', error);
      throw error;
    }
  },
  
  // Export du script en PDF avec les sources indexées
  exportToPdf: async (script, topic, profile = {}, sources = []) => {
    try {
      const response = await apiClient.post('/export-pdf', {
        script,
        topic,
        profile,
        sources
      }, {
        responseType: 'blob' // Important pour les fichiers binaires
      });
      
      // Créer et télécharger le fichier PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      return {
        blobUrl: url,
        fileName: `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`
      };
    } catch (error) {
      console.error('Erreur lors de l\'export en PDF:', error);
      throw error;
    }
  }
};

export const profileApi = {
  // Sauvegarde du profil
  saveProfile: async (profileData) => {
    try {
      const response = await apiClient.post('/api/save-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      throw error;
    }
  }
};

export default {
  topicsApi,
  scriptApi,
  profileApi
};
