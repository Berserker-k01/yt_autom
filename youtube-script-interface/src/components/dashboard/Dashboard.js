import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [step, setStep] = useState(0);
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
  const [sources, setSources] = useState([]);
  const [profileInfo, setProfileInfo] = useState(null);

  // Détecter si nous sommes en production ou en développement local
  const isProduction = window.location.hostname !== 'localhost';
  const API_BASE = isProduction 
    ? 'https://yt-autom.onrender.com/' 
    : 'http://localhost:5000';
  
  // Charger le profil depuis le localStorage
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('ytautom_profile');
      if (savedProfile) {
        setProfileInfo(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
    
    fetchHistory();
  }, []);

  // Fonction pour récupérer l'historique
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Ajout du youtuber_name comme paramètre pour identifier l'utilisateur
      const youtuberName = profileInfo?.youtuber_name || '';
      const url = `${API_BASE}/topics-history${youtuberName ? `?user=${encodeURIComponent(youtuberName)}` : ''}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error('Erreur lors du chargement de l\'historique:', e);
      setError('Erreur lors du chargement de l\'historique.');
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
    setStep(0);
  };
  
  // Fonction pour revenir à l'étape précédente
  const goBack = () => {
    if (activeTab === 'history') {
      setActiveTab('search');
      return;
    }
    
    if (script) {
      setScript(null);
      setStep(1);
      return;
    }
    
    if (topics.length > 0) {
      setTopics([]);
      setSelectedTopic(null);
      setStep(0);
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
    setSources([]);
    
    try {
      // Inclure les informations du profil pour personnaliser les sujets
      const payload = { 
        theme,
        profile: profileInfo || {} 
      };
      
      const res = await fetch(`${API_BASE}/generate-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setTopics(data.topics || []);
      
      // Récupérer les sources si disponibles
      if (data.sources && Array.isArray(data.sources)) {
        setSources(data.sources);
      }
      
      // Passer à l'étape suivante
      setStep(1);
      
      // Mettre à jour l'historique après génération
      fetchHistory();
    } catch (e) {
      console.error('Erreur lors de la génération des sujets:', e);
      setError('Erreur lors de la génération des sujets. Veuillez réessayer.');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleGenerateScript = async (topic) => {
    setLoadingScript(true);
    setError(null);
    setScript(null);
    setPdfUrl(null);
    
    try {
      // Inclure les informations du profil pour personnaliser le script
      const payload = { 
        topic: topic.title, 
        research: '',
        profile: profileInfo || {},
        sources: sources
      };
      
      const res = await fetch(`${API_BASE}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      setScript(data.script || null);
      setSelectedTopic(topic);
      
      // Passer à l'étape finale
      setStep(2);
    } catch (e) {
      console.error('Erreur lors de la génération du script:', e);
      setError('Erreur lors de la génération du script. Veuillez réessayer.');
    } finally {
      setLoadingScript(false);
    }
  };

  const handleDownloadPDF = async () => {
    setError(null);
    try {
      setLoadingScript(true);
      
      // Préparer les données pour le PDF
      const pdfData = {
        script: script,
        profile: profileInfo || {},
        topic: selectedTopic?.title || '',
        sources: sources
      };
      
      const res = await fetch(`${API_BASE}/export-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify(pdfData),
        credentials: 'omit' // Ne pas envoyer de cookies pour éviter les restrictions CORS
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur PDF:', errorText);
        throw new Error(`Erreur PDF: ${res.status} ${res.statusText}`);
      }
      
      // Créer une URL pour le blob PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Télécharger automatiquement
      const a = document.createElement('a');
      a.href = url;
      a.download = `Script_${selectedTopic.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Erreur lors de la génération du PDF:', e);
      setError('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setLoadingScript(false);
    }
  };

  // Rendu des étapes du tableau de bord
  return (
    <div className="dashboard">
      {/* Barre d'étapes */}
      <div className="step-bar">
        {['1. Thème', '2. Sujets tendances', '3. Script & PDF'].map((label, idx) => {
          const status = idx < step ? 'completed' : idx === step ? 'active' : 'upcoming';
          
          return (
            <div 
              key={idx} 
              className={`step-indicator ${status}`}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Section de contenu principal */}
      <div className="dashboard-content">
        {/* Étape 0: Saisie du thème */}
        {step === 0 && (
          <div className="theme-input-section">
            <h2>Quel thème souhaitez-vous explorer?</h2>
            <p className="section-description">
              Entrez un thème général pour générer des idées de sujets YouTube tendances.
            </p>
            
            <div className="form-group">
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: Intelligence artificielle, Crypto-monnaies, Fitness..."
                className="theme-input"
              />
              <button 
                onClick={handleGenerateTopics} 
                disabled={loadingTopics || !theme.trim()}
                className="generate-btn"
              >
                {loadingTopics ? 'Génération en cours...' : 'Générer des idées'}
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="tabs-container">
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                  onClick={() => setActiveTab('search')}
                >
                  Recherche
                </button>
                <button 
                  className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  Historique
                </button>
              </div>
              
              {activeTab === 'history' && (
                <div className="history-section">
                  <h3>Vos recherches récentes</h3>
                  {loadingHistory ? (
                    <p>Chargement de l'historique...</p>
                  ) : history.topics && history.topics.length > 0 ? (
                    <ul className="history-list">
                      {history.topics.map((historyItem, idx) => (
                        <li key={idx} className="history-item">
                          <div className="history-theme">
                            <strong>Thème:</strong> {historyItem.theme}
                          </div>
                          <div className="history-time">
                            {new Date(historyItem.timestamp).toLocaleString()}
                          </div>
                          <button 
                            className="reuse-theme-btn"
                            onClick={() => {
                              setTheme(historyItem.theme);
                              setActiveTab('search');
                            }}
                          >
                            Réutiliser ce thème
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucun historique disponible.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Étape 1: Sélection du sujet */}
        {step === 1 && topics.length > 0 && (
          <div className="topics-section">
            <div className="section-header">
              <button onClick={goBack} className="back-btn">
                ← Retour
              </button>
              <h2>Sujets tendances pour "{theme}"</h2>
            </div>
            
            <div className="topics-grid">
              {topics.map((topic, idx) => (
                <div key={idx} className="topic-card">
                  <h3>{topic.title}</h3>
                  <p className="topic-score">
                    Score de tendance: <span className="score">{topic.score}</span>
                  </p>
                  <p className="topic-description">{topic.description}</p>
                  <button 
                    onClick={() => handleGenerateScript(topic)}
                    className="select-topic-btn"
                  >
                    Sélectionner ce sujet
                  </button>
                </div>
              ))}
            </div>
            
            {sources && sources.length > 0 && (
              <div className="sources-section">
                <h3>Sources utilisées</h3>
                <ul className="sources-list">
                  {sources.map((source, idx) => (
                    <li key={idx} className="source-item">
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.title || source.url}
                      </a>
                      {source.description && (
                        <p className="source-description">{source.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Affichage du script */}
        {step === 2 && script && (
          <div className="script-section">
            <div className="section-header">
              <button onClick={goBack} className="back-btn">
                ← Retour
              </button>
              <h2>Script pour "{selectedTopic.title}"</h2>
            </div>
            
            <div className="script-content">
              <div className="script-text">
                {script.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
              
              <div className="script-actions">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={loadingScript}
                  className="download-pdf-btn"
                >
                  {loadingScript ? 'Génération du PDF...' : 'Télécharger en PDF'}
                </button>
                <button onClick={resetAll} className="new-search-btn">
                  Nouvelle recherche
                </button>
              </div>
            </div>
            
            {pdfUrl && (
              <div className="pdf-success">
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  Le PDF a été généré avec succès !
                </div>
                <p className="success-info">
                  Si le téléchargement ne démarre pas automatiquement, cliquez sur le bouton ci-dessous.
                </p>
                <a 
                  href={pdfUrl} 
                  download 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="manual-download-btn"
                >
                  <span className="download-icon">💾</span> Télécharger le PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
