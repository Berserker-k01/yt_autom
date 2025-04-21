import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DirectDashboard = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('');
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0); // 0: thème, 1: sujets, 2: script
  
  // Vérifier si l'utilisateur a un accès direct
  useEffect(() => {
    if (!localStorage.getItem('ytautom_direct_access')) {
      navigate('/direct-access');
    }
  }, [navigate]);

  // SOLUTION DE CONTOURNEMENT : URL codée en dur pour le déploiement
  const BACKEND_URL_PRODUCTION = 'https://yt-autom.onrender.com/';
  
  // Détecter si nous sommes en production (déployé sur Render) ou en développement local
  const isProduction = window.location.hostname !== 'localhost';
  
  // Choisir l'URL de l'API en fonction de l'environnement
  const API_BASE = isProduction ? BACKEND_URL_PRODUCTION : 'http://localhost:5000';
  
  // Log pour débugger l'URL de l'API
  console.log('Environnement:', isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT');
  console.log('API URL utilisée:', API_BASE);

  const handleGenerateTopics = async () => {
    if (!theme) {
      setError("Veuillez entrer un thème");
      return;
    }
    
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
        body: JSON.stringify({ theme, num_topics: 5 })
      });
      
      const data = await res.json();
      if (res.ok) {
        setTopics(data.topics || []);
        setStep(1); // Avancer à l'étape des sujets
      } else {
        setError(data.error || "Erreur lors de la génération des sujets");
      }
    } catch (e) {
      console.error("Erreur:", e);
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleGenerateScript = async (topic) => {
    setSelectedTopic(topic);
    setLoadingScript(true);
    setError(null);
    setScript(null);
    setPdfUrl(null);
    
    try {
      const res = await fetch(`${API_BASE}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: topic.title, 
          research: topic.research || '',
          sources: topic.sources || []
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setScript(data.script || '');
        setStep(2); // Avancer à l'étape du script
      } else {
        setError(data.error || "Erreur lors de la génération du script");
      }
    } catch (e) {
      console.error("Erreur:", e);
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setLoadingScript(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!script) {
      setError("Aucun script à exporter");
      return;
    }
    
    setError(null);
    try {
      setLoadingScript(true);
      
      const res = await fetch(`${API_BASE}/export-pdf`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify({ 
          script,
          sources: selectedTopic?.sources || []
        }),
        credentials: 'omit' // Éviter les problèmes CORS
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erreur PDF: ${res.status} ${errorText}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Créer un lien pour télécharger
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `script_${selectedTopic.title.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (e) {
      console.error("Erreur lors du téléchargement du PDF:", e);
      setError("Erreur lors du téléchargement du PDF: " + e.message);
    } finally {
      setLoadingScript(false);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setScript(null);
      setPdfUrl(null);
    } else if (step === 1) {
      setStep(0);
      setTopics([]);
      setSelectedTopic(null);
    }
  };

  // Déconnexion (retour à la page d'accès direct)
  const logout = () => {
    localStorage.removeItem('ytautom_direct_access');
    localStorage.removeItem('ytautom_user');
    navigate('/direct-access');
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* En-tête */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '15px',
        background: 'linear-gradient(135deg, #2563eb, #1e40af)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h1 style={{ margin: 0 }}>🎬 Générateur de Scripts YouTube</h1>
        <button 
          onClick={logout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Déconnexion
        </button>
      </header>

      {/* Indicateur d'étapes */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px'
      }}>
        {['1. Thème', '2. Sujets', '3. Script & PDF'].map((label, idx) => (
          <div 
            key={idx}
            style={{
              padding: '10px 20px',
              margin: '0 10px',
              background: idx === step 
                ? 'linear-gradient(135deg, #2563eb, #1e40af)' 
                : idx < step ? '#dbeafe' : '#f1f5f9',
              color: idx === step ? 'white' : idx < step ? '#1e40af' : '#64748b',
              borderRadius: '20px',
              fontWeight: idx === step ? 'bold' : 'normal'
            }}
          >
            {idx < step && '✓ '}{label}
          </div>
        ))}
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div style={{ 
          padding: '12px 20px', 
          background: '#fee2e2', 
          color: '#b91c1c',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Contenu principal selon l'étape */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <h2>Entrez un thème pour votre vidéo YouTube</h2>
            <input 
              type="text"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="Ex: Technologie, Santé, Finance..."
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '12px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                marginBottom: '20px'
              }}
            />
            <button 
              onClick={handleGenerateTopics}
              disabled={loadingTopics || !theme}
              style={{
                background: loadingTopics || !theme ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: loadingTopics || !theme ? 'not-allowed' : 'pointer'
              }}
            >
              {loadingTopics ? 'Génération en cours...' : 'Générer des sujets tendance'}
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={goBack}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  marginRight: '15px',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <h2 style={{ margin: 0 }}>Sujets proposés pour "{theme}"</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {topics.map((topic, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <h3 style={{ color: '#1e40af', marginTop: 0 }}>{topic.title}</h3>
                  <p>{topic.angle || 'Pas de description disponible'}</p>
                  <button 
                    onClick={() => handleGenerateScript(topic)}
                    disabled={loadingScript}
                    style={{
                      background: loadingScript ? '#94a3b8' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      width: '100%',
                      cursor: loadingScript ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {selectedTopic === topic && loadingScript ? 'Génération...' : 'Choisir ce sujet'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <button 
                onClick={goBack}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  marginRight: '15px',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
              <h2 style={{ margin: 0 }}>Script pour "{selectedTopic?.title}"</h2>
            </div>
            
            <div 
              style={{ 
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            >
              {script}
            </div>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={loadingScript || !script}
              style={{
                background: loadingScript || !script ? '#94a3b8' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: loadingScript || !script ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              {loadingScript ? 'Génération du PDF...' : 'Télécharger en PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectDashboard;
