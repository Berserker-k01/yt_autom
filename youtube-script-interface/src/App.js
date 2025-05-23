import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Importation des composants personnalisés
import SimpleProfileSetup from './components/SimpleProfileSetup';
import SimpleProfileSetupFixed from './components/SimpleProfileSetupFixed';
import ModernHeader from './components/common/ModernHeader';
import ModernDashboard from './components/dashboard/ModernDashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ScriptEditor from './components/ScriptEditor'; // Importation du composant ScriptEditor

function StepBar({ step }) {
  const steps = [
    '1. Thème',
    '2. Sujets tendances',
    '3. Script & PDF'
  ];
  return (
    <div className="step-bar">
      {steps.map((label, idx) => {
        // Déterminer l'état de cette étape (terminée, active, ou à venir)
        const status = idx < step ? 'completed' : idx === step ? 'active' : 'upcoming';
        
        return (
          <div 
            key={idx} 
            className={`step-indicator ${status}`}
            style={{
              padding: '10px 20px',
              borderRadius: 24,
              margin: '0 8px',
              background: idx === step 
                ? 'linear-gradient(135deg, #2563eb, #1e40af)' 
                : idx < step 
                  ? '#dbeafe' 
                  : '#f1f5f9',
              color: idx === step ? '#fff' : idx < step ? '#1e40af' : '#64748b',
              fontWeight: idx === step ? 700 : idx < step ? 600 : 400,
              fontSize: 16,
              border: idx === step ? '2px solid #1e40af' : '2px solid transparent',
              boxShadow: idx === step ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.3s',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Indicateur pour les étapes complétées */}
            {idx < step && (
              <span style={{ marginRight: 8, fontSize: 14 }}>✔️</span>
            )}
            {label}
          </div>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const [theme, setTheme] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' ou 'history'
  const [history, setHistory] = useState({topics: []});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editMode, setEditMode] = useState(false); // Nouvel état pour gérer le mode d'édition
  const [isModifyingWithAi, setIsModifyingWithAi] = useState(false); // Pour les modifications avec l'IA
  const [generatedImages, setGeneratedImages] = useState([]); // Nouvel état pour les images générées
  const [isGeneratingImages, setIsGeneratingImages] = useState(false); // État pour le chargement des images

  // SOLUTION DE CONTOURNEMENT : URL codée en dur pour le déploiement
  const BACKEND_URL_PRODUCTION = 'https://yt-autom.onrender.com';
  
  // Détecter si nous sommes en production (déployé sur Render) ou en développement local
  const isProduction = window.location.hostname !== 'localhost';
  
  // Choisir l'URL de l'API en fonction de l'environnement
  // S'assurer qu'il n'y a pas de '/' à la fin pour éviter les double-slash dans les URL
  const API_BASE = isProduction ? BACKEND_URL_PRODUCTION : 'http://localhost:5000';
  
  // Log pour débugger l'URL de l'API
  console.log('Environnement:', isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT');
  console.log('API URL utilisée:', API_BASE);
  
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fonction pour récupérer l'historique
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Afficher l'URL complète pour le débogage
      console.log(`Tentative de récupération de l'historique depuis: ${API_BASE}/topics-history`);
      
      // En mode développement, simuler des données d'historique si l'API échoue
      try {
        const res = await fetch(`${API_BASE}/topics-history`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) {
          throw new Error(`Erreur de serveur: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Historique récupéré avec succès:', data);
        setHistory(data);
      } catch (fetchError) {
        console.warn('Échec de récupération depuis le serveur, utilisation de données simulées:', fetchError.message);
        
        // Si en développement, utiliser des données simulées
        if (window.location.hostname === 'localhost') {
          console.log('Utilisation de données d\'historique simulées');
          const mockHistory = {
            topics: [
              { id: '1', title: 'Les nouvelles fonctionnalités de l\'IA en 2025', score: 92, date: new Date().toISOString() },
              { id: '2', title: 'Comment optimiser son temps d\'écran', score: 85, date: new Date().toISOString() },
              { id: '3', title: 'Les meilleurs gadgets technologiques de l\'année', score: 78, date: new Date().toISOString() }
            ]
          };
          setHistory(mockHistory);
        } else {
          throw fetchError; // En production, propager l'erreur
        }
      }
    } catch (e) {
      console.error('Erreur lors du chargement de l\'historique:', e);
      setError('Erreur lors du chargement de l\'historique. Veuillez réessayer.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const resetAll = () => {
    setTheme('');
    setTopics([]);
    setSelectedTopic(null);
    setScript(null);
    setPdfUrl(null);
    setError(null);
    setActiveTab('search');
  };
  
  // Fonction pour revenir à l'étape précédente
  const goBack = () => {
    // Si on est dans l'historique, revenir à la recherche
    if (activeTab === 'history') {
      setActiveTab('search');
      return;
    }
    
    // Si on a un script, revenir à la sélection de sujet
    if (script) {
      setScript(null);
      return;
    }
    
    // Si on a des sujets, revenir à la saisie du thème
    if (topics.length > 0) {
      setTopics([]);
      setSelectedTopic(null);
      return;
    }
  };

  const handleGenerateTopics = async () => {
    setLoadingTopics(true);
    setError(null);
    setTopics([]);
    setSelectedTopic(null);
    setScript(null);
    setPdfUrl(null);
    try {
      const res = await fetch(`${API_BASE}/generate-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      const data = await res.json();
      setTopics(data.topics || []);
      // Mettre à jour l'historique après génération
      fetchHistory();
    } catch (e) {
      setError('Erreur lors de la génération des sujets.');
    }
    setLoadingTopics(false);
  };

  const handleGenerateScript = async (topic) => {
    setLoadingScript(true);
    setError(null);
    setScript(null);
    setPdfUrl(null);
    try {
      const res = await fetch(`${API_BASE}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.title, research: '' })
      });
      const data = await res.json();
      setScript(data.script || null);
      setSelectedTopic(topic);
    } catch (e) {
      setError('Erreur lors de la génération du script.');
    }
    setLoadingScript(false);
  };

  const handleDownloadPDF = async () => {
    setError(null);
    try {
      // Afficher un message de chargement
      setLoadingScript(true);
      console.log('Envoi du script pour PDF:', script);
      
      // Désactiver les credentials pour l'API PDF qui utilise des headers CORS spécifiques
      const res = await fetch(`${API_BASE}/export-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' // Changer pour accepter JSON au lieu de PDF directement
        },
        body: JSON.stringify({ 
          script, 
          topic: selectedTopic ? selectedTopic.title : 'Script YouTube',
          profile: { 
            youtuber_name: localStorage.getItem('youtuber_name') || 'YouTuber', 
            channel_name: localStorage.getItem('channel_name') || 'Ma Chaîne' 
          }
        }),
        credentials: 'omit' // Ne pas envoyer de cookies pour éviter les restrictions CORS
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur PDF:', errorText);
        throw new Error(`Erreur PDF: ${res.status} ${res.statusText}`);
      }
      
      // Récupérer les données au format JSON
      const data = await res.json();
      
      // Mettre à jour l'URL du PDF pour le téléchargement
      if (data.pdfPath) {
        const pdfUrl = `${API_BASE}/download-file?path=${encodeURIComponent(data.pdfPath)}`;
        console.log('URL du PDF généré:', pdfUrl);
        
        // Ouvrir le PDF dans un nouvel onglet
        window.open(pdfUrl, '_blank');
        
        // Mettre à jour l'état avec l'URL du PDF
        setPdfUrl(pdfUrl);
      } else {
        throw new Error('Aucun chemin PDF reçu du serveur');
      }
    } catch (e) {
      console.error('Erreur lors de la génération du PDF:', e);
      setError(`Erreur lors de la génération du PDF: ${e.message}`);
    } finally {
      setLoadingScript(false);
    }
  };

  // Note: La fonction handleAiModifyScript est définie un peu plus loin dans le code.

  // Permet de sélectionner un sujet depuis l'historique
  const selectTopicFromHistory = (topic) => {
    setSelectedTopic(topic);
    setTopics([topic]); // Mettre le sujet sélectionné dans la liste des sujets
    setActiveTab('search'); // Revenir à l'onglet de recherche
  };

  // Déterminer l'étape actuelle
  let step = 0;
  if (activeTab === 'search') {
    if (topics.length > 0) step = 1;
    if (selectedTopic) step = 2;
    if (script) step = 2;
  } else {
    // En mode historique
    step = 0; // On montre juste l'historique
  }

  // Fonction pour activer le mode d'édition manuelle du script
  const handleEditScript = () => {
    setEditMode(true);
  };

  // Fonction pour sauvegarder les modifications manuelles
  const handleSaveEditedScript = (editedContent) => {
    setScript(editedContent);
    setEditMode(false);
  };

  // Fonction pour annuler l'édition
  const handleCancelEdit = () => {
    setEditMode(false);
  };

  // Fonction pour demander une modification par l'IA
  const handleAiModifyScript = async (modificationRequest, currentScriptContent) => {
    setError(null);
    setIsModifyingWithAi(true);
    
    try {
      const res = await fetch(`${API_BASE}/modify-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: currentScriptContent || script,
          request: modificationRequest,
          profile: {
            youtuber_name: localStorage.getItem('youtuber_name') || 'YouTuber',
            channel_name: localStorage.getItem('channel_name') || 'Ma Chaîne',
            content_style: localStorage.getItem('content_style') || 'informative',
            tone: localStorage.getItem('tone') || 'professionnel',
            target_audience: localStorage.getItem('target_audience') || 'adultes'
          }
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erreur serveur: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Mettre à jour le script avec la version modifiée
      setScript(data.modified_script);
      
      return data.modified_script;
    } catch (e) {
      setError(`Erreur lors de la modification du script: ${e.message}`);
      throw e;
    } finally {
      setIsModifyingWithAi(false);
    }
  };

  // Fonction pour générer des images basées sur le script
  const handleGenerateImages = async () => {
    if (!script || isGeneratingImages) return;
    
    setError(null);
    setIsGeneratingImages(true);
    
    try {
      const res = await fetch(`${API_BASE}/api/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script,
          title: selectedTopic ? selectedTopic.title : 'Script YouTube',
          num_images: 3
        })
      });
      
      if (!res.ok) {
        throw new Error(`Erreur serveur: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Mettre à jour les images générées
      setGeneratedImages(data.images || []);
      
      return data.images;
    } catch (e) {
      setError(`Erreur lors de la génération d'images: ${e.message}`);
      console.error('Erreur complète:', e);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="theme-tabs">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}>
          Nouveau script <span role="img" aria-label="create">📝</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('history');
            fetchHistory();
          }}>
          Historique <span role="img" aria-label="history">📜</span>
        </button>
      </div>
      {/* Header avec bouton Historique dans le coin supérieur droit */}
      <div className="app-header" style={{ position: 'relative', marginBottom: 30 }}>
        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
          <button 
            onClick={() => { 
              fetchHistory();
              setActiveTab(activeTab === 'history' ? 'search' : 'history');
            }}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 18px', 
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            <span style={{ marginRight: 10, fontSize: 19 }}>{activeTab === 'history' ? '⬅️' : '📚'}</span>
            {activeTab === 'history' ? 'Retour à la recherche' : 'Voir l\'historique'}
          </button>
        </div>
        
        <div style={{ padding: '15px 0' }}>
          <StepBar step={step} />
          
          <h1 style={{ 
            textAlign: 'center', 
            fontSize: '32px',
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: 20,
            marginBottom: 10,
            fontWeight: 800,
            letterSpacing: '-0.5px'
          }}>
            🎬 Générateur YouTube Tendance
          </h1>
          
          <p style={{ 
            textAlign: 'center', 
            color: '#64748b', 
            marginBottom: 32,
            fontSize: '16px',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.5
          }}>
            Génère des sujets d'actualité, rédige un script professionnel et télécharge-le en PDF en 3 étapes simples.
          </p>
        </div>
      </div>
      
      {error && (
        <div className="error-message" style={{ 
          color: '#e11d48', 
          marginBottom: 20, 
          textAlign: 'center',
          background: '#fee2e2',
          padding: '12px 20px',
          borderRadius: 8,
          border: '1px solid #fecaca',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span style={{ fontWeight: 600, marginRight: 6 }}>⚠️</span>
          {error}
        </div>
      )}
      {activeTab === 'history' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 25, justifyContent: 'space-between', padding: '0 20px' }}>
            <button 
              onClick={goBack}
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                border: 'none',
                borderRadius: 25,
                padding: '12px 22px',
                marginRight: 15,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                boxShadow: '0 4px 10px rgba(217, 119, 6, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(217, 119, 6, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(217, 119, 6, 0.3)';
              }}
            >
              <span style={{ marginRight: 8, fontSize: 16 }}>⬅️</span> Retour à la création
            </button>
            <h2 style={{ 
              color: '#1e3a8a', 
              margin: 0, 
              fontSize: 24, 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>📚 Historique des sujets générés</h2>
          </div>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 20 }}>Chargement de l'historique...</div>
          ) : history.topics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Aucun historique disponible.</div>
          ) : (
            <div style={{ maxHeight: '650px', overflowY: 'auto', padding: '10px 0' }}>
              {history.topics.map((entry, entryIdx) => (
                <div 
                  key={entryIdx} 
                  className="history-item card" 
                  style={{ 
                    marginBottom: 25, 
                    background: 'white', 
                    padding: 20, 
                    borderRadius: 16, 
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' 
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 15,
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: 10
                  }}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <span style={{ 
                        background: 'linear-gradient(135deg, #2563eb, #1e40af)', 
                        color: 'white',
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                        fontSize: 16
                      }}>
                        🔍
                      </span>
                      <h3 style={{ margin: 0, color: '#1e40af', fontWeight: 700 }}>{entry.theme}</h3>
                    </div>
                    <div style={{ 
                      color: '#64748b', 
                      fontSize: 14,
                      background: '#f1f5f9',
                      padding: '4px 10px',
                      borderRadius: 20,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <span style={{ marginRight: 4 }}>📅</span> {entry.timestamp}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {entry.topics.map((topic, topicIdx) => (
                      <div 
                        key={topicIdx} 
                        style={{ 
                          background: 'linear-gradient(to bottom, #f8fafc, #eff6ff)', 
                          borderRadius: 12, 
                          padding: 14, 
                          flex: '1 1 250px',
                          maxWidth: '100%',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          marginBottom: 8,
                          border: '1px solid #dbeafe',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#1e40af', 
                          marginBottom: 6, 
                          fontSize: 15,
                          lineHeight: 1.3 
                        }}>
                          {topic.title}
                        </div>
                        
                        <div style={{ 
                          fontSize: 14, 
                          color: '#475569', 
                          marginBottom: 6,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {topic.angle}
                        </div>
                        
                        <button 
                          onClick={() => selectTopicFromHistory(topic)} 
                          className="btn btn-success"
                          style={{ 
                            padding: '8px 12px', 
                            borderRadius: 8, 
                            marginTop: 'auto',
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%'
                          }}
                        >
                          <span style={{ marginRight: 6 }}>➤</span> Utiliser ce sujet
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="Entrez un thème (ex: Tech, Sport, Actu...)"
            style={{ padding: 12, width: '90%', maxWidth: 400, fontSize: 18, borderRadius: 8, border: '1px solid #bbb', marginBottom: 24 }}
            autoFocus
          />
          <button
            onClick={handleGenerateTopics}
            style={{ padding: '12px 36px', fontSize: 18, borderRadius: 8, background: '#007bff', color: '#fff', border: 'none', fontWeight: 600, cursor: !theme || loadingTopics ? 'not-allowed' : 'pointer', opacity: !theme || loadingTopics ? 0.6 : 1 }}
            disabled={loadingTopics || !theme}
          >
            {loadingTopics ? 'Recherche en cours...' : 'Générer les sujets'}
          </button>
        </div>
      )}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <button 
              onClick={goBack}
              style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: 20,
                padding: '6px 12px',
                marginRight: 10,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: 4 }}>⬅️</span> Retour
            </button>
            <h2 style={{ color: '#222', margin: 0 }}>Sujets tendances proposés</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {topics.map((t, idx) => (
              <div 
                key={idx} 
                className="card"
                style={{ 
                  background: 'linear-gradient(to bottom, #ffffff, #f0f9ff)', 
                  borderRadius: 16, 
                  padding: 20, 
                  width: 290, 
                  marginBottom: 16, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start',
                  border: '1px solid #dbeafe',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -4px rgba(37, 99, 235, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                {/* Indicateur de pertinence */}
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                    color: 'white',
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderBottomLeftRadius: 12,
                    letterSpacing: '0.5px'
                  }}
                >
                  Tendance {5 - idx}/5
                </div>
                
                <div style={{ fontWeight: 700, fontSize: 18, color: '#1e40af', marginBottom: 12, marginTop: 10 }}>{t.title}</div>
                
                <div style={{ 
                  padding: '8px', 
                  background: '#dbeafe', 
                  borderRadius: 8, 
                  marginBottom: 12,
                  width: '100%'
                }}>
                  <div style={{ color: '#1e40af', fontSize: 15, marginBottom: 6, fontWeight: 600 }}>Angle</div>
                  <div style={{ color: '#1e3a8a', fontSize: 14 }}>{t.angle}</div>
                </div>
                
                <div style={{ 
                  padding: '8px', 
                  background: '#f1f5f9', 
                  borderRadius: 8, 
                  marginBottom: 12,
                  width: '100%'
                }}>
                  <div style={{ color: '#475569', fontSize: 15, marginBottom: 6, fontWeight: 600 }}>Pourquoi c'est intéressant</div>
                  <div style={{ color: '#334155', fontSize: 14 }}>{t.why_interesting}</div>
                </div>
                
                <button
                  className="btn btn-success"
                  style={{ 
                    marginTop: 'auto', 
                    padding: '10px 18px', 
                    fontSize: 16, 
                    borderRadius: 10, 
                    width: '100%',
                    fontWeight: 600,
                    opacity: loadingScript ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleGenerateScript(t)}
                  disabled={loadingScript}
                >
                  {loadingScript ? (
                    <>
                      <span className="loading-spinner" style={{ marginRight: 8 }}>⏳</span> Génération...
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: 8 }}>🖋️</span> Choisir ce sujet
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
            <button onClick={resetAll} style={{ background: '#eee', color: '#444', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 15, cursor: 'pointer', marginRight: 10 }}>🔄 Recommencer</button>
          </div>
        </div>
      )}
      {step === 2 && script && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <button 
              onClick={goBack}
              style={{ 
                background: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: 20,
                padding: '6px 12px',
                marginRight: 10,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ marginRight: 4 }}>⬅️</span> Retour
            </button>
            <h2 style={{ color: '#222', margin: 0 }}>Script détaillé pour : <span style={{ color: '#007bff' }}>{selectedTopic ? selectedTopic.title : 'Votre vidéo'}</span></h2>
          </div>
          <div className="script-container card" style={{ 
            padding: 25, 
            borderRadius: 16, 
            textAlign: 'left', 
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
            background: 'white',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {/* Badges d'information */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: 6 }}>📅</span> {new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
              </div>
              
              <div style={{ 
                background: '#f0fdf4',
                color: '#166534',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #dcfce7'
              }}>
                <span style={{ marginRight: 6 }}>📺</span> Format vidéo
              </div>
              
              <div style={{ 
                background: '#eff6ff',
                color: '#1e3a8a',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #dbeafe'
              }}>
                <span style={{ marginRight: 6 }}>⏰</span> Durée: ~15 min
              </div>
            </div>

            {/* Méta-informations */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 15, 
              marginBottom: 20,
              background: '#f8fafc',
              padding: 16,
              borderRadius: 10
            }}>
              <div>
                <div style={{ color: '#475569', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>Public cible</div>
                <div style={{ color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 6 }}>📊</span> Général / YouTube
                </div>
              </div>
              
              <div>
                <div style={{ color: '#475569', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>Format</div>
                <div style={{ color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 6 }}>🎥</span> Podcast / Talk
                </div>
              </div>
              
              <div>
                <div style={{ color: '#475569', fontSize: 14, marginBottom: 4, fontWeight: 600 }}>SEO</div>
                <div style={{ color: '#1e293b', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: 6 }}>🔍</span> Optimisé
                </div>
              </div>
            </div>
            
            <h3 style={{ 
              color: '#1e40af', 
              marginBottom: 16, 
              fontSize: 18,
              borderBottom: '2px solid #dbeafe',
              paddingBottom: 8
            }}>
              <span style={{ marginRight: 8 }}>💬</span> Script détaillé
            </h3>
            
            {/* Script comme texte préformaté ou éditable selon le mode */}
            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <textarea
                  className="script-editor"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  style={{ 
                    width: '100%', 
                    minHeight: '400px',
                    padding: 18,
                    lineHeight: 1.6,
                    border: '2px solid #3b82f6',
                    borderRadius: 8,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      color: '#475569',
                      fontWeight: 600
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSaveEditedScript(script)}
                    style={{
                      padding: '8px 16px',
                      background: '#22c55e',
                      border: 'none',
                      borderRadius: 8,
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              <div className="script-preview" style={{ 
                maxHeight: '400px', 
                overflowY: 'auto', 
                padding: 18,
                lineHeight: 1.6
              }}>
                {typeof script === 'string' ? 
                  // Format le script texte en paragraphes lisibles avec mise en forme des titres
                  script.split('\n').map((line, i) => {
                    // Détecter les titres de section [TITRE]
                    if (line.trim().startsWith('[') && line.trim().includes(']')) {
                      return (
                        <div key={i} className="script-section-title" style={{ fontWeight: 'bold', color: '#1e40af', marginTop: 16 }}>
                          {line}
                        </div>
                      );
                    } else {
                      return <div key={i} style={{ marginBottom: 10 }}>{line}</div>;
                    }
                  })
                : 
                  // Fallback pour les anciens scripts en JSON
                  JSON.stringify(script, null, 2)
                }
              </div>
            )}
            
            <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <h3 style={{ color: '#1e40af', marginBottom: 12, fontSize: 16 }}>
                <span style={{ marginRight: 6 }}>📊</span> Méta-données marketing
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#475569', marginBottom: 4 }}>Calls to action</div>
                  <div style={{ color: '#334155', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 6 }}>👍</span> Liker, commenter, s'abonner
                  </div>
                </div>
                
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#475569', marginBottom: 4 }}>Description</div>
                  <div style={{ color: '#334155', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 6 }}>📝</span> Générée automatiquement
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 25, gap: 15 }}>
            {/* Bouton pour éditer manuellement le script */}
            <button 
              onClick={handleEditScript} 
              className="btn btn-secondary"
              style={{ 
                fontSize: 18, 
                padding: '14px 38px', 
                borderRadius: 12, 
                fontWeight: 700, 
                background: '#22c55e',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                opacity: editMode ? 0.6 : 1,
                cursor: editMode ? 'not-allowed' : 'pointer'
              }}
              disabled={editMode}
            >
              <span style={{ marginRight: 10, fontSize: 22 }}>✏️</span> Éditer manuellement
            </button>
            
            {/* Bouton pour modifier le script avec l'IA */}
            <button 
              onClick={() => {
                // Ouvrir une boîte de dialogue pour demander les instructions de modification
                const modificationInstructions = prompt('Entrez vos instructions pour modifier le script (ex: "Rendre plus long", "Ajouter plus d\'exemples", "Ton plus conversationnel", etc.):')
                
                // Si l'utilisateur a fourni des instructions, appeler la fonction de modification
                if (modificationInstructions && modificationInstructions.trim()) {
                  setIsModifyingWithAi(true)
                  handleAiModifyScript(modificationInstructions, script)
                    .then(() => {
                      alert('Script modifié avec succès!')
                    })
                    .catch(err => {
                      alert(`Erreur lors de la modification: ${err.message}`)
                    })
                    .finally(() => {
                      setIsModifyingWithAi(false)
                    })
                }
              }} 
              className="btn btn-secondary"
              style={{ 
                fontSize: 18, 
                padding: '14px 38px', 
                borderRadius: 12, 
                fontWeight: 700, 
                background: '#6366f1',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                cursor: isModifyingWithAi || editMode ? 'not-allowed' : 'pointer',
                opacity: isModifyingWithAi || editMode ? 0.7 : 1
              }}
              disabled={isModifyingWithAi || editMode}
            >
              {isModifyingWithAi ? (
                <>
                  <span style={{ marginRight: 10, fontSize: 22 }}>⏳</span> Modification en cours...
                </>
              ) : (
                <>
                  <span style={{ marginRight: 10, fontSize: 22 }}>🤖</span> Modifier avec Claude
                </>
              )}
            </button>
            
            {/* Bouton pour télécharger le PDF */}
            <button 
              onClick={handleDownloadPDF} 
              className="btn btn-primary"
              style={{ 
                fontSize: 18, 
                padding: '14px 38px', 
                borderRadius: 12, 
                fontWeight: 700, 
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                transform: 'skewX(-20deg)',
                transformOrigin: 'top left',
                animation: 'shine 2s infinite'
              }} />
              <span style={{ marginRight: 10, fontSize: 22 }}>📥</span> Télécharger le PDF
            </button>
            <button 
              onClick={resetAll} 
              className="btn btn-secondary"
              style={{ 
                marginLeft: 18, 
                padding: '10px 20px', 
                fontSize: 15,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <span style={{ marginRight: 6, fontSize: 16 }}>🔄</span> 
              Recommencer
            </button>
            <button 
              onClick={handleEditScript} 
              className="btn btn-secondary"
              style={{ 
                marginLeft: 18, 
                padding: '10px 20px', 
                fontSize: 15,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <span style={{ marginRight: 6, fontSize: 16 }}>📝</span> 
              Éditer le script
            </button>
            <button 
              onClick={handleGenerateImages} 
              className="btn btn-secondary"
              style={{ 
                marginLeft: 18, 
                padding: '10px 20px', 
                fontSize: 15,
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <span style={{ marginRight: 6, fontSize: 16 }}>📸</span> 
              Générer des images
            </button>
          </div>
          
          {/* Style pour l'animation de brillance */}
          <style jsx>{`
            @keyframes shine {
              0% { transform: translateX(-100%) skewX(-20deg); }
              100% { transform: translateX(200%) skewX(-20deg); }
            }
          `}</style>
        </div>
      )}
      {pdfUrl && (
        <div style={{ 
          marginTop: 20, 
          textAlign: 'center',
          background: '#f0fdf4',
          borderRadius: 12,
          padding: '15px',
          border: '1px solid #bbf7d0',
          maxWidth: '80%',
          margin: '20px auto',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{ color: '#166534', fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
            <span style={{ marginRight: 8, fontSize: 22 }}>✅</span>
            Le PDF a été généré avec succès !
          </div>
          <p style={{ color: '#14532d', marginBottom: 12, fontSize: 15 }}>
            Si le téléchargement ne démarre pas automatiquement, cliquez sur le bouton ci-dessous.
          </p>
          <a 
            href={pdfUrl} 
            download 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-success"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <span style={{ marginRight: 8 }}>💾</span> Télécharger le PDF
          </a>
        </div>
      )}
      {script && editMode && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' }}>
          <ScriptEditor 
            script={script}
            onSave={handleSaveEditedScript}
            onCancel={handleCancelEdit}
            onAiModify={handleAiModifyScript}
          />
        </div>
      )}
      {generatedImages.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)', marginTop: 25 }}>
          <h2 style={{ color: '#1e40af', marginBottom: 12, fontSize: 18 }}>
            <span style={{ marginRight: 6 }}>📸</span> Images générées
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {generatedImages.map((image, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <img 
                  src={image.url} 
                  alt={`Image générée ${idx + 1}`} 
                  style={{ 
                    width: 250, 
                    height: 200, 
                    borderRadius: 10, 
                    objectFit: 'cover', 
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #dbeafe'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                  <a 
                    href={image.url}
                    download={`image_${idx+1}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span style={{ marginRight: 5 }}>⬇️</span> Télécharger
                  </a>
                </div>
                <p style={{ 
                  marginTop: 6, 
                  fontSize: 14, 
                  color: '#4b5563',
                  fontWeight: 500 
                }}>
                  Image {idx + 1}
                </p>
              </div>
            ))}
          </div>
          <div style={{ 
            textAlign: 'center', 
            marginTop: 16, 
            background: '#f0f9ff', 
            padding: 10, 
            borderRadius: 8,
            border: '1px solid #dbeafe',
            color: '#1e3a8a',
            fontSize: 14
          }}>
            <p>Ces images sont générées par Grok AI basées sur le contenu de votre script.</p>
            <p>Elles peuvent être utilisées comme miniatures ou illustrations pour votre vidéo YouTube.</p>
          </div>
        </div>
      )}
      {isGeneratingImages && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 20, 
          padding: 15, 
          borderRadius: 10, 
          background: '#eff6ff',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ fontSize: 18, marginBottom: 10, color: '#1e40af' }}>
            <span role="img" aria-label="loading" style={{ marginRight: 10, fontSize: 24 }}>⏳</span>
            Génération d'images en cours...
          </div>
          <p style={{ color: '#3b82f6' }}>Cela peut prendre jusqu'à 30 secondes.</p>
        </div>
      )}
    </div>
  );
}

function App() {
  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    const auth = localStorage.getItem('ytautom_auth');
    return auth === 'true';
  };

  // Rediriger vers la page d'authentification si non connecté
  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <HashRouter>
            <ModernHeader />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/profile" element={<SimpleProfileSetupFixed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <ModernDashboard />
                  </PrivateRoute>
                } 
              />
              {/* Route de capture pour les pages non trouvées */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </HashRouter>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
