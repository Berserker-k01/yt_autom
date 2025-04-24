import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// Composants d'étapes
import ThemeSelector from './ThemeSelector';
import TopicsList from './TopicsList';
import ScriptGenerator from './ScriptGenerator';

const ModernDashboard = () => {
  const navigate = useNavigate();
  const { theme, darkMode } = useTheme();
  const [step, setStep] = useState(0);
  const [themeInput, setThemeInput] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [sources, setSources] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfFileType, setPdfFileType] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({ topics: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // SOLUTION DE CONTOURNEMENT : URL codée en dur pour le déploiement
  const BACKEND_URL_PRODUCTION = 'https://yt-autom.onrender.com';
  
  // Détecter si nous sommes en production (déployé sur Render) ou en développement local
  const isProduction = window.location.hostname !== 'localhost';
  
  // Choisir l'URL de l'API en fonction de l'environnement
  const API_BASE = isProduction ? BACKEND_URL_PRODUCTION : 'http://localhost:5000';
  
  // Récupérer le profil utilisateur du localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('ytautom_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
      }
    } else {
      // Rediriger vers la page de configuration du profil si aucun profil n'est trouvé
      navigate('/profile');
    }
  }, [navigate]);

  // Récupérer l'historique des sujets générés
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fonction pour récupérer l'historique
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      console.log(`Tentative de récupération de l'historique depuis: ${API_BASE}/topics-history`);
      
      try {
        const res = await fetch(`${API_BASE}/topics-history`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Inclure les cookies pour l'authentification
        });
        
        if (!res.ok) {
          throw new Error(`Erreur de serveur: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Historique récupéré avec succès:', data);
        setHistory(data);
      } catch (fetchError) {
        console.warn('Échec de récupération depuis le serveur, utilisation de données simulées:', fetchError.message);
        
        // En cas d'erreur, utiliser des données simulées en local
        console.log('Utilisation de données d\'historique simulées');
        // Récupérer l'historique local si disponible
        const localHistory = localStorage.getItem('ytautom_history');
        
        if (localHistory) {
          try {
            const parsedHistory = JSON.parse(localHistory);
            setHistory(parsedHistory);
            console.log('Historique récupéré du localStorage:', parsedHistory);
          } catch (parseError) {
            console.error('Erreur lors du parsing de l\'historique local:', parseError);
            // Utiliser un historique par défaut
            createDefaultHistory();
          }
        } else {
          // Créer un historique par défaut si rien n'existe
          createDefaultHistory();
        }
      }
    } catch (e) {
      console.error('Erreur lors du chargement de l\'historique:', e);
      // Ne pas afficher d'erreur à l'utilisateur, simplement utiliser un historique vide
      setHistory({ topics: [] });
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Fonction pour créer un historique par défaut
  const createDefaultHistory = () => {
    const defaultHistory = {
      topics: []
    };
    setHistory(defaultHistory);
    // Sauvegarder dans localStorage pour une utilisation future
    localStorage.setItem('ytautom_history', JSON.stringify(defaultHistory));
  };
  
  // Fonction pour mettre à jour l'historique local après une génération réussie
  const updateLocalHistory = (theme) => {
    try {
      // Récupérer l'historique actuel
      const currentHistory = { ...history };
      
      // Ajouter le nouveau thème
      currentHistory.topics.unshift({
        id: Date.now().toString(),
        theme: theme,
        timestamp: new Date().toISOString()
      });
      
      // Limiter à 10 thèmes maximum
      if (currentHistory.topics.length > 10) {
        currentHistory.topics = currentHistory.topics.slice(0, 10);
      }
      
      // Mettre à jour l'état
      setHistory(currentHistory);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('ytautom_history', JSON.stringify(currentHistory));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'historique local:', error);
    }
  };

  // Réinitialiser tout
  const resetAll = () => {
    setThemeInput('');
    setTopics([]);
    setSelectedTopic(null);
    setScript(null);
    setPdfUrl(null);
    setPdfData(null);
    setSources([]);
    setError(null);
    setStep(0);
  };
  
  // Fonction pour revenir à l'étape précédente
  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      
      // Réinitialiser les données en fonction de l'étape
      if (step === 2) {
        setScript(null);
        setPdfUrl(null);
        setPdfData(null);
      } else if (step === 1) {
        setSelectedTopic(null);
        setTopics([]);
      }
    }
  };

  // Fonction pour générer des sujets
  const handleGenerateTopics = async () => {
    if (!themeInput) {
      setError('Veuillez entrer un thème pour générer des sujets.');
      return;
    }
    
    setLoadingTopics(true);
    setError(null);
    setTopics([]);
    setSelectedTopic(null);
    setScript(null);
    setPdfUrl(null);
    setPdfData(null);
    setSources([]);
    
    try {
      const res = await fetch(`${API_BASE}/generate-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: themeInput,
          profile_info: userProfile  // Renommer "profile" en "profile_info" pour correspondre au backend
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erreur de serveur: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTopics(data.topics || []);
      
      // Extraire les sources des sujets
      const allSources = data.topics?.flatMap(topic => topic.sources || []) || [];
      setSources([...new Set(allSources)]); // Éliminer les doublons
      
      // Passer à l'étape suivante
      setStep(1);
      
      // Mettre à jour l'historique après génération
      updateLocalHistory(themeInput);
    } catch (e) {
      console.error('Erreur lors de la génération des sujets:', e);
      setError(`Erreur lors de la génération des sujets: ${e.message}`);
    } finally {
      setLoadingTopics(false);
    }
  };

  // Fonction pour générer un script
  const handleGenerateScript = async (topic) => {
    setSelectedTopic(topic);
    setLoadingScript(true);
    setError(null);
    setScript(null);
    setPdfUrl(null);
    setPdfData(null);
    
    try {
      const res = await fetch(`${API_BASE}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topic.title, 
          research: '',
          profile_info: userProfile,
          sources: topic.sources || []
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erreur de serveur: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setScript(data.script || "");
      
      // Passer à l'étape suivante
      setStep(2);
    } catch (e) {
      console.error('Erreur lors de la génération du script:', e);
      setError(`Erreur lors de la génération du script: ${e.message}`);
    } finally {
      setLoadingScript(false);
    }
  };

  // Exporter le script en PDF
  const handleExportPDF = async () => {
    try {
      setPdfUrl(null);
      setPdfData(null);
      const response = await fetch(`${API_BASE}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          profile: userProfile,
          topic: selectedTopic ? selectedTopic.title : 'Script YouTube',
          sources: sources
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.file_data) {
          // Stocker les données du fichier encodées en base64
          setPdfData(data.file_data);
          setPdfFileName(data.file_name || "Script_YouTube.pdf");
          setPdfFileType(data.file_type || "application/pdf");
        } else if (data.pdf_url) {
          // Fallback pour l'ancienne méthode d'URL
          setPdfUrl(data.pdf_url);
        }
      } else {
        setError('Erreur lors de l\'export PDF: ' + (data.error || 'Erreur inconnue'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'export PDF: ' + error.message);
    }
  };

  // Fonction pour télécharger le PDF à partir des données base64
  const downloadFile = () => {
    if (pdfData) {
      try {
        // Convertir base64 en Blob
        const byteCharacters = atob(pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: pdfFileType });
        
        // Créer un URL pour le blob
        const url = window.URL.createObjectURL(blob);
        
        // Créer un lien et déclencher le téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        setError('Erreur lors du téléchargement du fichier: ' + error.message);
      }
    }
  };

  // Mettre à jour le script (utilisé par l'éditeur)
  const handleScriptUpdate = (updatedScript) => {
    setScript(updatedScript);
    // Réinitialiser l'URL et les données du PDF car le script a été modifié
    setPdfUrl(null);
    setPdfData(null);
  };

  // Animation pour les transitions entre étapes
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  // Rendu conditionnel en fonction de l'étape active
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <ThemeSelector 
            theme={themeInput}
            setTheme={setThemeInput}
            onGenerate={handleGenerateTopics}
            loading={loadingTopics}
            history={history}
            error={error}
            darkMode={darkMode}
          />
        );
      case 1:
        return (
          <TopicsList 
            topics={topics}
            onSelectTopic={handleGenerateScript}
            loading={loadingScript}
            error={error}
            sources={sources}
            darkMode={darkMode}
          />
        );
      case 2:
        return (
          <ScriptGenerator 
            script={script}
            selectedTopic={selectedTopic}
            onExportPDF={handleExportPDF}
            pdfUrl={pdfUrl}
            pdfData={pdfData}
            pdfFileName={pdfFileName}
            downloadFile={downloadFile}
            sources={sources}
            error={error}
            darkMode={darkMode}
            onScriptUpdate={handleScriptUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container" style={{
      background: darkMode ? theme.colors.background.default : theme.colors.background.gradient,
      minHeight: '100vh',
      padding: '20px',
      paddingTop: '80px'
    }}>
      <div className="dashboard-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Barre de progression */}
        <div className="step-progress" style={{
          marginBottom: '40px'
        }}>
          <div className="step-bar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            margin: '0 auto',
            maxWidth: '600px'
          }}>
            {['1. Thème', '2. Sujets tendances', '3. Script & PDF'].map((label, idx) => {
              const status = idx < step ? 'completed' : idx === step ? 'active' : 'upcoming';
              
              return (
                <div 
                  key={idx} 
                  className={`step-indicator ${status}`}
                  style={{
                    padding: '10px 20px',
                    borderRadius: theme.shape.buttonBorderRadius,
                    margin: '0 8px',
                    background: idx === step 
                      ? theme.colors.primary.gradient
                      : idx < step 
                        ? darkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe'
                        : darkMode ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
                    color: idx === step 
                      ? '#fff' 
                      : idx < step 
                        ? darkMode ? theme.colors.primary.light : theme.colors.primary.dark
                        : darkMode ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                    fontWeight: idx === step ? 700 : idx < step ? 600 : 400,
                    fontSize: '16px',
                    border: idx === step 
                      ? `2px solid ${darkMode ? theme.colors.primary.light : theme.colors.primary.dark}`
                      : '2px solid transparent',
                    boxShadow: idx === step ? theme.shadows.md : 'none',
                    transition: 'all 0.3s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    zIndex: 10 - idx
                  }}
                >
                  {/* Indicateur pour les étapes complétées */}
                  {idx < step && (
                    <span style={{ marginRight: '8px', fontSize: '14px' }}>✓</span>
                  )}
                  {label}
                </div>
              );
            })}
            
            {/* Ligne de connexion */}
            <div style={{
              position: 'absolute',
              height: '2px',
              background: darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
              top: '50%',
              width: '100%',
              zIndex: 1
            }} />
            
            {/* Ligne de progression */}
            <div style={{
              position: 'absolute',
              height: '2px',
              background: theme.colors.primary.main,
              top: '50%',
              width: `${step * 50}%`,
              zIndex: 1,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
        
        {/* En-tête avec boutons d'action */}
        <div className="dashboard-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              color: darkMode ? '#fff' : theme.colors.text.primary,
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '8px'
            }}
          >
            {step === 0 ? 'Créer du contenu YouTube' : 
             step === 1 ? 'Choisir un sujet tendance' : 
             'Votre script est prêt !'}
          </motion.h1>
          
          <div className="action-buttons" style={{
            display: 'flex',
            gap: '10px'
          }}>
            {step > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="btn-back"
                onClick={goBack}
                style={{
                  padding: '10px 20px',
                  borderRadius: theme.shape.buttonBorderRadius,
                  background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  color: darkMode ? '#fff' : theme.colors.text.primary,
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Retour
              </motion.button>
            )}
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-reset"
              onClick={resetAll}
              style={{
                padding: '10px 20px',
                borderRadius: theme.shape.buttonBorderRadius,
                background: theme.colors.grey[darkMode ? 700 : 200],
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: darkMode ? '#fff' : theme.colors.text.primary,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Recommencer
            </motion.button>
          </div>
        </div>
        
        {/* Contenu principal avec animation de transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.4 }}
            style={{
              background: darkMode ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.8)',
              borderRadius: theme.shape.borderRadius,
              padding: '30px',
              boxShadow: theme.shadows.lg,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModernDashboard;
