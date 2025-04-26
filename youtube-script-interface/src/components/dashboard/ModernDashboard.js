import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// Composants d'étapes
import ThemeSelector from './ThemeSelector';
import TopicsList from './TopicsList';
import ScriptGenerator from './ScriptGenerator';
import DirectScriptGenerator from './DirectScriptGenerator';

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
  const [showDirectScriptGenerator, setShowDirectScriptGenerator] = useState(false);

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
  
  // Mettre à jour l'historique local après une génération réussie
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
    setShowDirectScriptGenerator(false);
  };
  
  // Fonction pour revenir à l'étape précédente
  const goBack = () => {
    if (showDirectScriptGenerator) {
      setShowDirectScriptGenerator(false);
      return;
    }
    
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
          profile: userProfile  // Utiliser "profile" pour correspondre au backend
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
          profile: userProfile,  // Utiliser "profile" pour correspondre au backend
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

  // Télécharger le PDF à partir des données base64
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

  // Gérer un script généré directement
  const handleDirectScriptGenerated = (scriptData) => {
    setScript(scriptData.script);
    setPdfUrl(scriptData.pdfUrl);
    setSources(scriptData.sources);
    setSelectedTopic({ title: scriptData.title });
    setStep(2);
    setShowDirectScriptGenerator(false);
  };

  // Animation pour les transitions entre étapes
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  // Rendu conditionnel en fonction de l'étape
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
        return <div>Étape inconnue</div>;
    }
  };

  return (
    <div className="dashboard-container" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* En-tête avec titre et boutons d'action */}
      <div className="dashboard-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px'
      }}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            color: darkMode ? '#fff' : '#1f2937',
            fontSize: '1.875rem',
            fontWeight: 700
          }}
        >
          {showDirectScriptGenerator 
            ? 'Créer un script directement' 
            : step === 0 
              ? 'Créer du contenu YouTube' 
              : step === 1 
                ? 'Choisir un sujet tendance' 
                : 'Votre script est prêt !'}
        </motion.h1>
        
        <div className="action-buttons" style={{
          display: 'flex',
          gap: '10px'
        }}>
          {(step > 0 || showDirectScriptGenerator) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="btn-back"
              onClick={goBack}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: darkMode ? '#e5e7eb' : '#374151',
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
              padding: '10px 16px',
              borderRadius: '8px',
              background: darkMode ? 'rgba(107, 114, 128, 0.2)' : 'rgba(229, 231, 235, 0.7)',
              border: `1px solid ${
                darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.8)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: darkMode ? '#e5e7eb' : '#374151',
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

      {/* Barre d'étapes (visible seulement si on n'est pas en mode génération directe) */}
      {!showDirectScriptGenerator && (
        <div className="steps-container" style={{
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Étapes standard */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {['Thème', 'Sujets', 'Script'].map((label, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className={`step-box ${idx === step ? 'active' : idx < step ? 'completed' : ''}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: '24px',
                  cursor: idx < step ? 'pointer' : 'default',
                  background: idx === step 
                    ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                    : idx < step 
                      ? (darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)') 
                      : (darkMode ? 'rgba(107, 114, 128, 0.2)' : 'rgba(229, 231, 235, 0.5)'),
                  color: idx === step 
                    ? (darkMode ? '#3b82f6' : '#2563eb')
                    : idx < step 
                      ? (darkMode ? '#10b981' : '#047857')
                      : (darkMode ? '#9ca3af' : '#6b7280'),
                  border: `1px solid ${
                    idx === step 
                      ? (darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)')
                      : idx < step 
                        ? (darkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                        : (darkMode ? 'rgba(107, 114, 128, 0.2)' : 'rgba(229, 231, 235, 0.8)')
                  }`,
                  fontWeight: idx === step ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => {
                  // Permettre de revenir à une étape précédente
                  if (idx < step) {
                    setStep(idx);
                    
                    // Réinitialiser les données des étapes suivantes
                    if (idx < 1) {
                      setSelectedTopic(null);
                      setScript(null);
                    }
                    if (idx < 2) {
                      setScript(null);
                    }
                  }
                }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: idx === step 
                    ? (darkMode ? '#3b82f6' : '#2563eb')
                    : idx < step 
                      ? (darkMode ? '#10b981' : '#047857')
                      : (darkMode ? '#4b5563' : '#9ca3af'),
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {idx < step ? '✓' : idx + 1}
                </span>
                {label}
              </motion.div>
            ))}
          </div>
          
          {/* Option pour générer directement un script */}
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setShowDirectScriptGenerator(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '24px',
                border: `1px solid ${darkMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}`,
                background: darkMode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)',
                color: darkMode ? '#ec4899' : '#be185d',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Créer un script directement
            </button>
          </motion.div>
        </div>
      )}
      
      {/* Contenu principal avec animation de transition */}
      <AnimatePresence mode="wait">
        {showDirectScriptGenerator ? (
          <DirectScriptGenerator
            key="direct-script"
            userProfile={userProfile}
            API_BASE={API_BASE}
            darkMode={darkMode}
            onBack={() => setShowDirectScriptGenerator(false)}
            onScriptGenerated={handleDirectScriptGenerated}
          />
        ) : (
          <motion.div
            key={step}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30 
            }}
          >
            {renderStepContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernDashboard;
