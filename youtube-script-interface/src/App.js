import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

// Composants d'authentification
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Composants de pages
import HomePage from './components/pages/HomePage';
import ProfileSetup from './components/profile/ProfileSetup';
import Header from './components/common/Header';

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

  // SOLUTION DE CONTOURNEMENT : URL codée en dur pour le déploiement
  const BACKEND_URL_PRODUCTION = 'https://yt-autom.onrender.com/';
  
  // Détecter si nous sommes en production (déployé sur Render) ou en développement local
  const isProduction = window.location.hostname !== 'localhost';
  
  // Choisir l'URL de l'API en fonction de l'environnement
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
      const res = await fetch(`${API_BASE}/topics-history`);
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
          'Accept': 'application/pdf'
        },
        body: JSON.stringify({ script }),
        credentials: 'omit' // Ne pas envoyer de cookies pour éviter les restrictions CORS
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur PDF:', errorText);
        throw new Error(`Erreur PDF: ${res.status} ${res.statusText}`);
      }
      
      const blob = await res.blob();
      // Vérifier le type de contenu reçu
      console.log('Type de contenu reçu:', blob.type);
      // Même si le type n'est pas application/pdf, on continue car
      // parfois le type est vide mais le contenu est quand même un PDF
      
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Téléchargement automatique avec nom de fichier dynamique
      const fileName = `script_${selectedTopic ? selectedTopic.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') : 'video'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      
      try {
        // Créer un élément <a> invisible et cliquer dessus pour déclencher le téléchargement
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        
        // Petit délai avant de cliquer
        setTimeout(() => {
          a.click();
          // Nettoyage après un court délai
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url); // Libérer la mémoire
          }, 200);
        }, 100);
      } catch (downloadError) {
        console.error('Erreur lors du téléchargement:', downloadError);
        // L'URL est toujours disponible dans pdfUrl pour un téléchargement manuel
      }
    } catch (e) {
      console.error('Erreur complète:', e);
      setError('Erreur lors du téléchargement du PDF: ' + e.message);
    } finally {
      setLoadingScript(false);
    }
  };

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
              fontSize: 15,
              fontWeight: 600,
              background: activeTab === 'history' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4f46e5, #3730a3)',
              color: 'white',
              border: 'none',
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
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
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
            
            {/* Script comme texte préformaté avec sections */}
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
                      <div key={i} className="script-section-title">
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 25 }}>
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
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="app-main">
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Route protégée pour la configuration du profil */}
              <Route element={<ProtectedRoute requireSetup={true} />}>
                <Route path="/profile-setup" element={<ProfileSetup />} />
              </Route>
              
              {/* Routes protégées nécessitant une authentification */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              
              {/* Redirection des routes inconnues */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} YouTube Script Generator | Tous droits réservés</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
