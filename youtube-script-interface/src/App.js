import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaMagic, FaChartLine, FaRobot, FaDownload, FaHistory, FaVideo, FaPlay, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './Scripty.css';

import { API_URL, getAuthHeaders, getCurrentUser, isAuthenticated, logout } from './utils/auth';

function App() {
  const [platform, setPlatform] = useState('youtube');
  const [theme, setTheme] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Platforms, 2: Topics, 3: Script, 4: Stats
  const [mainTab, setMainTab] = useState('creation'); // creation | video_iq | settings
  const [socialStats, setSocialStats] = useState(null);
  const [autoAiVideo, setAutoAiVideo] = useState(true);
  const [aiPromptLanguage, setAiPromptLanguage] = useState('fr');
  const [scriptSpeedMode, setScriptSpeedMode] = useState('fast'); // fast | deep

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  /* Smart Loader Component with Animation and Cycling Messages */
  const SmartLoader = ({ messages = ["Chargement..."] }) => {
    const [msgIndex, setMsgIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      // Cycle messages every 3 seconds
      const msgInterval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % messages.length);
      }, 3000);

      // Smooth progress bar simulation
      const progInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev; // Stall at 95%
          // Slower progress as it gets higher
          const increment = Math.max(0.5, (100 - prev) / 50);
          return prev + increment;
        });
      }, 200);

      return () => {
        clearInterval(msgInterval);
        clearInterval(progInterval);
      };
    }, [messages]);

    return (
      <div className="loader-container" style={{ flexDirection: 'column', gap: '20px' }}>
        <div className="spinner"></div>
        <div style={{ width: '100%', maxWidth: '300px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {messages[msgIndex]}
          </h3>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: 'var(--primary-gradient)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>
      </div>
    );
  };

  const handlePlatformSelect = (p) => {
    setPlatform(p);
    // Keep step 1 active to show input
    if (step !== 1) setStep(1);
  };

  const generateTopics = async () => {
    if (!theme) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-topics`, {
        theme,
        platform
      });
      setTopics(res.data.topics || []);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération des sujets");
    }
    setLoading(false);
  };

  // Video Analysis State
  const [videoUrl, setVideoUrl] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatQuery, setChatQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  // Video Gen State
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [videoGenLoading, setVideoGenLoading] = useState(false);
  const [savedScriptId, setSavedScriptId] = useState(null);
  const [aiVideoStatus, setAiVideoStatus] = useState(null);
  const [aiVideoAvailable, setAiVideoAvailable] = useState(false);
  // Thumbnail State
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [thumbLoading, setThumbLoading] = useState(false);

  // Platform specific options
  const [customOptions, setCustomOptions] = useState({
    duration: '',
    tone: 'Professionnel',
    cta: '', // Call to Action
    style: '' // Visual style
  });

  const handleCustomOptionChange = (field, value) => {
    setCustomOptions((prev) => {
      const next = { ...prev, [field]: value };
      try {
        localStorage.setItem('scripty_custom_options', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const persistAutoAiVideo = (value) => {
    setAutoAiVideo(value);
    try {
      localStorage.setItem('scripty_auto_ai_video', value ? 'true' : 'false');
    } catch (e) {
      console.warn(e);
    }
  };

  const persistAiPromptLanguage = (value) => {
    setAiPromptLanguage(value);
    try {
      localStorage.setItem('scripty_ai_prompt_language', value);
    } catch (e) {
      console.warn(e);
    }
  };

  const persistScriptSpeedMode = (value) => {
    setScriptSpeedMode(value);
    try {
      localStorage.setItem('scripty_script_speed_mode', value);
    } catch (e) {
      console.warn(e);
    }
  };

  const refreshVideoConfig = () => {
    axios.get(`${API_URL}/api/video/config`).then((r) => {
      setAiVideoAvailable(!!r.data?.ai_video_available);
    }).catch(() => setAiVideoAvailable(false));
  };

  useEffect(() => {
    try {
      const storedAuto = localStorage.getItem('scripty_auto_ai_video');
      if (storedAuto !== null) setAutoAiVideo(storedAuto === 'true');
      const storedLang = localStorage.getItem('scripty_ai_prompt_language');
      if (storedLang) setAiPromptLanguage(storedLang);
      const storedSpeed = localStorage.getItem('scripty_script_speed_mode');
      if (storedSpeed === 'fast' || storedSpeed === 'deep') setScriptSpeedMode(storedSpeed);
      const storedCo = localStorage.getItem('scripty_custom_options');
      if (storedCo) {
        const parsed = JSON.parse(storedCo);
        setCustomOptions((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn(e);
    }
    refreshVideoConfig();
  }, []);

  useEffect(() => {
    if (!savedScriptId || !isAuthenticated()) return;
    if (!aiVideoAvailable) return;
    const st = aiVideoStatus?.status;
    if (st === 'completed' || st === 'failed' || st === 'skipped') return;

    const id = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/scripts/${savedScriptId}`, { headers: getAuthHeaders() });
        const v = res.data.script?.extra_metadata?.ltx_video;
        if (v) {
          setAiVideoStatus(v);
        }
      } catch (e) {
        console.warn('poll script', e);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [savedScriptId, aiVideoAvailable, aiVideoStatus?.status]);

  useEffect(() => {
    if (!savedScriptId || aiVideoStatus?.status !== 'completed' || !isAuthenticated()) return undefined;
    let cancelled = false;
    let blobUrl = '';
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/video/ltx/result/${savedScriptId}?inline=1`, {
          headers: getAuthHeaders(),
          responseType: 'blob',
        });
        if (cancelled) return;
        blobUrl = URL.createObjectURL(r.data);
        setGeneratedVideoUrl(blobUrl);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [savedScriptId, aiVideoStatus?.status]);

  const getPlatformFields = () => {
    switch (platform) {
      case 'youtube':
        return (
          <div className="custom-options" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select className="modern-input" value={customOptions.tone} onChange={(e) => handleCustomOptionChange('tone', e.target.value)}>
              <option value="Professionnel">Ton: Professionnel</option>
              <option value="Divertissant">Ton: Divertissant</option>
              <option value="Éducatif">Ton: Éducatif</option>
              <option value="Storytelling">Ton: Storytelling</option>
            </select>
            <input
              type="text"
              className="modern-input"
              placeholder="Durée (ex: 10min)"
              value={customOptions.duration}
              onChange={(e) => handleCustomOptionChange('duration', e.target.value)}
            />
            <input
              type="text"
              className="modern-input"
              style={{ gridColumn: 'span 2' }}
              placeholder="Call to Action (ex: Abonnez-vous)"
              value={customOptions.cta}
              onChange={(e) => handleCustomOptionChange('cta', e.target.value)}
            />
          </div>
        );
      case 'tiktok':
        return (
          <div className="custom-options" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select className="modern-input" value={customOptions.style} onChange={(e) => handleCustomOptionChange('style', e.target.value)}>
              <option value="">Style de Hook</option>
              <option value="Visuel choc">Visuel Choc</option>
              <option value="Question polémique">Question Polémique</option>
              <option value="Avant/Après">Avant / Après</option>
            </select>
            <input
              type="text"
              className="modern-input"
              placeholder="Musique / Tendance"
              value={customOptions.tone} // Reusing tone field for trend
              onChange={(e) => handleCustomOptionChange('tone', e.target.value)}
            />
          </div>
        );
      case 'instagram':
        return (
          <div className="custom-options" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select className="modern-input" value={customOptions.style} onChange={(e) => handleCustomOptionChange('style', e.target.value)}>
              <option value="Reel">Format: Reel</option>
              <option value="Carrousel">Format: Carrousel</option>
              <option value="Story">Format: Story</option>
            </select>
            <select className="modern-input" value={customOptions.tone} onChange={(e) => handleCustomOptionChange('tone', e.target.value)}>
              <option value="Esthétique">Esthétique / Clean</option>
              <option value="Inspirant">Inspirant</option>
              <option value="Éducatif">Éducatif</option>
            </select>
          </div>
        );
      case 'facebook':
        return (
          <div className="custom-options" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select className="modern-input" value={customOptions.style} onChange={(e) => handleCustomOptionChange('style', e.target.value)}>
              <option value="Reel">Format: Reel (Court)</option>
              <option value="Long">Format: Vidéo (Longue)</option>
              <option value="Post">Format: Post Écrit</option>
            </select>
            <select className="modern-input" value={customOptions.tone} onChange={(e) => handleCustomOptionChange('tone', e.target.value)}>
              <option value="Communautaire">Communautaire / Engagement</option>
              <option value="Viral">Viral / Choc</option>
              <option value="Éducatif">Éducatif / Autorité</option>
            </select>
          </div>
        );
      default: return null;
    }
  };

  const generateScript = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setSavedScriptId(null);
    setAiVideoStatus(null);
    setGeneratedVideoUrl('');
    try {
      const authHeaders = getAuthHeaders();
      const topicTitle = typeof topic === 'string' ? topic : (topic?.title || theme);
      const research = topic?.key_points ? topic.key_points.join('\n') : '';

      if (authHeaders.Authorization) {
        const generationOptions = {
          ...customOptions,
          fast_mode: scriptSpeedMode === 'fast',
          deep_research: scriptSpeedMode === 'deep',
        };
        const res = await axios.post(
          `${API_URL}/api/scripts`,
          {
            topic: topicTitle,
            platform,
            research,
            metadata: { theme, custom_options: generationOptions, ai_language: aiPromptLanguage },
            custom_options: generationOptions,
            auto_generate_video: autoAiVideo,
          },
          { headers: { ...authHeaders, 'Content-Type': 'application/json' } }
        );
        const s = res.data.script;
        setScript(s.content);
        setSavedScriptId(s.id);
        const lv = s.extra_metadata?.ltx_video;
        if (lv) setAiVideoStatus(lv);
        if (res.data.ltx_notice) {
          console.info('Vidéo:', res.data.ltx_notice);
        }
      } else {
        const generationOptions = {
          ...customOptions,
          fast_mode: scriptSpeedMode === 'fast',
          deep_research: scriptSpeedMode === 'deep',
        };
        const res = await axios.post(`${API_URL}/generate-script`, {
          topic: topicTitle,
          platform,
          research,
          custom_options: generationOptions
        });
        setScript(res.data.script);
      }
      setMainTab('creation');
      setStep(3);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || error.response?.data?.message || "Erreur lors de la génération du script");
    }
    setLoading(false);
  };


  const exportScript = async () => {
    if (!script) return;
    try {
      const response = await axios.post(`${API_URL}/export-pdf`, {
        script,
        title: selectedTopic ? selectedTopic.title : 'Script',
        platform
      }, {
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `script_${platform}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export error:", error);
      alert("Erreur lors de l'exportation du PDF");
    }
  };

  // Real-time progress state
  const [progressMsg, setProgressMsg] = useState('');

  const analyzeVideo = async () => {
    if (!videoUrl) return;
    setAnalysisLoading(true);
    setProgressMsg("Initialisation...");

    // Generate UUID for tracking
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/analyze/status/${requestId}`);
        if (res.data.status && res.data.status !== 'unknown') {
          setProgressMsg(res.data.status);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);

    try {
      const res = await axios.post(`${API_URL}/api/analyze/process`, {
        url: videoUrl,
        request_id: requestId
      }, {
        headers: getAuthHeaders()
      });
      setAnalysisSummary(res.data.summary);
      setFileName(res.data.gemini_file_name);
      setVideoInfo(res.data.video_info);
      setChatHistory([{ role: 'ai', text: res.data.summary }]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse vidéo");
    } finally {
      clearInterval(pollInterval);
      setAnalysisLoading(false);
      setProgressMsg('');
    }
  };

  const generateVideo = async () => {
    if (!script) return;
    setMainTab('creation');
    setVideoGenLoading(true);
    setStep(6);
    const authHeaders = getAuthHeaders();
    try {
      if (authHeaders.Authorization && savedScriptId && aiVideoAvailable) {
        const lv = aiVideoStatus?.status;
        if (lv !== 'queued' && lv !== 'processing') {
          await axios.post(
            `${API_URL}/api/video/auto`,
            { script_id: savedScriptId },
            { headers: authHeaders }
          );
          setAiVideoStatus({ status: 'queued' });
        }
      } else if (authHeaders.Authorization && savedScriptId && !aiVideoAvailable) {
        alert("La vidéo IA n'est pas activée sur ce serveur (worker non configuré).");
        setStep(3);
      } else {
        const res = await axios.post(`${API_URL}/api/video/generate`, {
          script_text: script,
          platform: platform
        }, {
          headers: authHeaders
        });
        setGeneratedVideoUrl(API_URL + res.data.video_url);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Erreur lors de la génération vidéo.");
      setStep(3);
    }
    setVideoGenLoading(false);
  };

  const generateThumbnail = async () => {
    if (!script) return;
    setThumbLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/thumbnail/generate`, {
        script: script,
        title: selectedTopic ? selectedTopic.title : 'Video Scripty'
      }, {
        headers: getAuthHeaders()
      });
      if (res.data.success) {
        setThumbnailUrl(API_URL + res.data.imageUrl);
        setThumbnailPrompt(res.data.prompt_used);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur génération miniature");
    }
    setThumbLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatQuery) return;
    const userMsg = { role: 'user', text: chatQuery };
    setChatHistory(prev => [...prev, userMsg]);
    setChatQuery('');

    try {
      const res = await axios.post(`${API_URL}/api/analyze/chat`, {
        query: chatQuery,
        file_name: fileName
      }, {
        headers: getAuthHeaders()
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="scripty-app">
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Scripty<span style={{ fontSize: '1rem', verticalAlign: 'super' }}>AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Créez du contenu viral pour toutes vos plateformes</p>
        {isAuthenticated() && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Connecté : <strong style={{ color: '#e2e8f0' }}>{getCurrentUser()?.name || getCurrentUser()?.email || '…'}</strong>
            </span>
            <button
              type="button"
              className="nav-btn"
              style={{ padding: '8px 18px' }}
              onClick={() => logout()}
            >
              <FaSignOutAlt /> Déconnexion
            </button>
          </div>
        )}
      </header>

      <nav className="app-nav">
        <button
          type="button"
          className={`nav-btn ${mainTab === 'creation' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('creation');
            if (step === 5) setStep(1);
          }}
        >
          Création
        </button>
        <button
          type="button"
          className={`nav-btn ${mainTab === 'video_iq' ? 'active' : ''}`}
          onClick={() => {
            setMainTab('video_iq');
            setStep(5);
          }}
        >
          <FaRobot /> Video IQ
        </button>
        <button
          type="button"
          className={`nav-btn ${mainTab === 'settings' ? 'active' : ''}`}
          onClick={() => setMainTab('settings')}
        >
          <FaCog /> Paramètres
        </button>
      </nav>

      <div style={{ minHeight: '600px' }}>
        <AnimatePresence mode="wait">

          {mainTab === 'creation' && step === 1 && (
            <motion.div key="step1" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Choisissez votre plateforme</h2>
              <div className="platform-selector">
                <div className={`platform-btn youtube ${platform === 'youtube' ? 'active' : ''}`} onClick={() => handlePlatformSelect('youtube')}>
                  <FaYoutube className="icon" color="#FF0000" />
                  <span>YouTube</span>
                </div>
                <div className={`platform-btn tiktok ${platform === 'tiktok' ? 'active' : ''}`} onClick={() => handlePlatformSelect('tiktok')}>
                  <FaTiktok className="icon" color="#00f2ea" />
                  <span>TikTok</span>
                </div>
                <div className={`platform-btn instagram ${platform === 'instagram' ? 'active' : ''}`} onClick={() => handlePlatformSelect('instagram')}>
                  <FaInstagram className="icon" color="#d62976" />
                  <span>Instagram</span>
                </div>
                <div className={`platform-btn facebook ${platform === 'facebook' ? 'active' : ''}`} onClick={() => handlePlatformSelect('facebook')}>
                  <FaFacebook className="icon" color="#1877F2" />
                  <span>Facebook</span>
                </div>
              </div>

              <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '16px' }}>
                  Ton, style, vidéo IA automatique et formats : tout est dans l’onglet <strong>Paramètres</strong>.
                </p>
                <h3 style={{ marginTop: 0 }}>Quel est votre sujet ?</h3>
                <input
                  type="text"
                  className="modern-input"
                  placeholder="Ex: Intelligence Artificielle, Cuisine Facile..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />

                <button
                  className="gradient-btn"
                  onClick={() => generateScript({ title: theme, angle: 'Sujet utilisateur', estimated_duration: 'N/A', target_audience: 'General' })}
                  disabled={!theme || loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? (
                    <div style={{ padding: '0px' }}>Chargement...</div>
                  ) : <><FaMagic /> Générer le Script (Immédiat)</>}
                </button>

                {/* Show Full Page Loader if Loading Script */}
                {loading && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SmartLoader messages={[
                      "Recherche des tendances actuelles...",
                      "Analyse des meilleurs angles viraux...",
                      "Rédaction du script optimisé...",
                      "Ajout des hooks psychologiques...",
                      "Finalisation de votre contenu..."
                    ]} />
                  </div>
                )}
              </div>

              {/* Topics Grid Removed for Direct Workflow */}
            </motion.div>
          )}

          {mainTab === 'settings' && (
            <motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Paramètres</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 32px' }}>
                Tout ce qui concerne la génération et les options par défaut de vos scripts est regroupé ici.
              </p>

              <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto 24px' }}>
                <h3 style={{ marginTop: 0 }}>Vidéo IA</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  État du service :{' '}
                  <strong style={{ color: aiVideoAvailable ? '#4ade80' : '#f87171' }}>
                    {aiVideoAvailable ? 'disponible' : 'non disponible'}
                  </strong>
                </p>
                <button type="button" className="gradient-btn" style={{ width: 'auto', marginBottom: '20px' }} onClick={refreshVideoConfig}>
                  Rafraîchir le statut
                </button>
                {isAuthenticated() && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={autoAiVideo}
                      onChange={(e) => persistAutoAiVideo(e.target.checked)}
                    />
                    <span>Générer automatiquement une vidéo IA après chaque nouveau script (si votre offre le permet)</span>
                  </label>
                )}
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Langue des prompts vidéo IA
                  </label>
                  <select
                    className="modern-input"
                    value={aiPromptLanguage}
                    onChange={(e) => persistAiPromptLanguage(e.target.value)}
                    style={{ maxWidth: '260px' }}
                  >
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Vitesse de génération du script
                  </label>
                  <select
                    className="modern-input"
                    value={scriptSpeedMode}
                    onChange={(e) => persistScriptSpeedMode(e.target.value)}
                    style={{ maxWidth: '320px' }}
                  >
                    <option value="fast">Rapide (recommandé)</option>
                    <option value="deep">Approfondi (plus lent, plus de recherche)</option>
                  </select>
                </div>
                {!isAuthenticated() && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Connectez-vous pour activer la vidéo IA automatique à l’enregistrement du script.
                  </p>
                )}
              </div>

              <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto 24px' }}>
                <h3 style={{ marginTop: 0 }}>Formats selon le réseau</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Choisissez d’abord la plateforme ci-dessous : la vidéo IA utilisera le bon format (paysage YouTube, vertical pour TikTok / Reels, etc.) sans rien régler de plus.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <strong>YouTube</strong> : 16:9 · <strong>TikTok / Instagram / Facebook (Reels)</strong> : 9:16
                </p>
                <div className="platform-selector" style={{ marginBottom: '16px' }}>
                  <div className={`platform-btn youtube ${platform === 'youtube' ? 'active' : ''}`} onClick={() => handlePlatformSelect('youtube')}>
                    <FaYoutube className="icon" color="#FF0000" />
                    <span>YouTube</span>
                  </div>
                  <div className={`platform-btn tiktok ${platform === 'tiktok' ? 'active' : ''}`} onClick={() => handlePlatformSelect('tiktok')}>
                    <FaTiktok className="icon" color="#00f2ea" />
                    <span>TikTok</span>
                  </div>
                  <div className={`platform-btn instagram ${platform === 'instagram' ? 'active' : ''}`} onClick={() => handlePlatformSelect('instagram')}>
                    <FaInstagram className="icon" color="#d62976" />
                    <span>Instagram</span>
                  </div>
                  <div className={`platform-btn facebook ${platform === 'facebook' ? 'active' : ''}`} onClick={() => handlePlatformSelect('facebook')}>
                    <FaFacebook className="icon" color="#1877F2" />
                    <span>Facebook</span>
                  </div>
                </div>
                <h4 style={{ margin: '20px 0 8px' }}>Options par défaut pour vos scripts</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Ces choix sont enregistrés sur cet appareil et réutilisés à chaque génération.
                </p>
                {getPlatformFields()}
              </div>

              {isAuthenticated() && (
                <div className="glass-card" style={{ maxWidth: '720px', margin: '0 auto' }}>
                  <h3 style={{ marginTop: 0 }}>Compte</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Fermer votre session sur cet appareil. Vous pourrez vous reconnecter à tout moment.
                  </p>
                  <button type="button" className="nav-btn" style={{ padding: '10px 20px' }} onClick={() => logout()}>
                    <FaSignOutAlt /> Se déconnecter
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {mainTab === 'creation' && step === 2 && (
            <motion.div key="step2" initial="initial" animate="in" exit="out" variants={pageVariants}>
              {/* This step is actually integrated into step 1 in the simplified flow, but kept logic for structure if needed later. 
                     Currently, selecting a topic in step 1 goes directly to step 3 (Script) via generateScript function.
                     So step 2 is "skipped" visually or represents the Topic Selection state which is visible in step 1.
                 */}
            </motion.div>
          )}

          {mainTab === 'creation' && step === 3 && (
            <motion.div key="step3" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '20px' }}>← Retour</button>
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Script {platform === 'youtube' ? 'Vidéo' : 'Viral'}</h2>
                  <button className="gradient-btn" onClick={exportScript} style={{ width: 'auto', margin: 0, padding: '8px 16px', fontSize: '0.9rem' }}>
                    <FaDownload /> Exporter
                  </button>
                  <button className="gradient-btn" onClick={generateVideo} style={{ width: 'auto', margin: '0 0 0 10px', padding: '8px 16px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>
                    <FaVideo style={{ marginRight: '5px' }} />
                    {savedScriptId && aiVideoAvailable ? 'Créer ma vidéo IA' : 'Générer vidéo'}
                  </button>
                </div>
                {/* Editable Text Area */}
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '20px',
                    borderRadius: '10px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontFamily: 'monospace',
                    minHeight: '400px',
                    maxHeight: '600px',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    resize: 'vertical'
                  }}
                />
              </div>
            </motion.div>
          )}



          {mainTab === 'video_iq' && (
            <motion.div key="step5" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Analyse Vidéo (Video IQ)</h2>

              <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Collez le lien de la vidéo (YouTube, TikTok, FB, Insta...)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  <button className="gradient-btn" style={{ width: 'auto', marginTop: 0 }} onClick={analyzeVideo} disabled={analysisLoading || !videoUrl}>
                    {analysisLoading ? <div className="spinner" style={{ width: 20, height: 20 }}></div> : 'Analyser'}
                  </button>
                </div>

                {analysisLoading && (
                  <div style={{ margin: '40px 0' }}>
                    <SmartLoader messages={progressMsg ? [progressMsg] : [
                      "Connexion au serveur d'analyse...",
                      "Préparation de l'environnement...",
                    ]} />
                  </div>
                )}

                {analysisSummary && (
                  <div style={{ marginTop: '30px', animation: 'fadeIn 0.5s' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
                      <h4 style={{ marginTop: 0, color: '#4ade80' }}>⚡ Analyse Stratégique</h4>

                      {videoInfo && (
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', alignItems: 'center' }}>
                          <img src={videoInfo.thumbnail} alt="Thumbnail" style={{ width: '120px', borderRadius: '8px' }} />
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{videoInfo.title}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>👤 {videoInfo.author}</div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '0.9rem', color: '#60a5fa' }}>
                              <span>👁 {parseInt(videoInfo.views).toLocaleString()} vues</span>
                              <span>❤️ {parseInt(videoInfo.likes).toLocaleString()} likes</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {analysisSummary}
                    </div>

                    {/* Quick Prompts */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                      {['🔍 Analyser le Hook', '📝 Extraire le Script', '🚀 Pourquoi c\'est viral ?', '😡 Identifier les défauts'].map(q => (
                        <button
                          key={q}
                          onClick={() => { setChatQuery(q); sendChatMessage(); }}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Chat Interface */}
                    <div className="chat-box" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '15px', height: '400px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {chatHistory.map((msg, idx) => (
                          <div key={idx} style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                            padding: '10px 15px',
                            borderRadius: '15px',
                            maxWidth: '80%',
                            fontSize: '0.9rem'
                          }}>
                            <strong>{msg.role === 'user' ? 'Vous' : 'Gemini'}:</strong> {msg.text}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text"
                          className="modern-input"
                          placeholder="Posez une question sur la vidéo..."
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        />
                        <button className="gradient-btn" style={{ width: 'auto', padding: '0 20px' }} onClick={sendChatMessage}>Envoyer</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {mainTab === 'creation' && step === 6 && (
            <motion.div key="step6" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Studio de Production</h2>
              <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

                {(videoGenLoading || (aiVideoAvailable && savedScriptId && aiVideoStatus && !generatedVideoUrl && ['queued', 'processing', 'completed'].includes(aiVideoStatus.status))) ? (
                  <div style={{ padding: '40px' }}>
                    <SmartLoader messages={aiVideoAvailable && savedScriptId ? [
                      "🎬 Génération vidéo IA pour votre réseau…",
                      "🎯 Application du bon format (cadence, cadrage)…",
                      "✨ Rendu en cours sur le worker vidéo…",
                      "⏳ Encore un peu de patience…",
                    ] : [
                      "🎬 Silence, on tourne !",
                      "🔍 Recherche des meilleures vidéos stock (Pexels)...",
                      "🎙️ Enregistrement de la voix off (IA)...",
                      "🔧 Montage et synchronisation...",
                      "📝 Création des sous-titres dynamiques...",
                      "🚀 Exportation de votre vidéo..."
                    ]} />
                  </div>
                ) : (savedScriptId && aiVideoStatus?.status === 'failed') ? (
                  <div style={{ padding: '24px' }}>
                    <p>La vidéo IA n'a pas pu être générée.</p>
                    <p style={{ color: '#f87171', fontSize: '0.9rem' }}>{aiVideoStatus?.error}</p>
                    <button type="button" className="gradient-btn" style={{ width: 'auto', marginTop: '16px' }} onClick={() => setStep(3)}>Retour au script</button>
                  </div>
                ) : (savedScriptId && aiVideoStatus?.status === 'skipped') ? (
                  <div style={{ padding: '24px' }}>
                    <p>Vidéo IA non lancée : {aiVideoStatus?.reason || 'non disponible'}</p>
                    <button type="button" className="gradient-btn" style={{ width: 'auto', marginTop: '16px' }} onClick={() => setStep(3)}>Retour</button>
                  </div>
                ) : generatedVideoUrl ? (
                  <div style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: (platform === 'youtube' ? '56.25%' : '177.77%'), background: '#000', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                      <video
                        src={generatedVideoUrl}
                        controls
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                      <a href={generatedVideoUrl} download className="gradient-btn" style={{ width: 'auto', textDecoration: 'none' }}>
                        <FaDownload style={{ marginRight: '10px' }} /> Télécharger MP4
                      </a>
                      <button className="gradient-btn" style={{ width: 'auto', background: 'transparent', border: '1px solid white' }} onClick={() => setStep(3)}>
                        Retour au Script
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>Une erreur est survenue lors de la génération.</p>
                    <button className="gradient-btn" style={{ width: 'auto' }} onClick={() => setStep(3)}>Retour</button>
                  </div>
                )}

                {/* Thumbnail Section */}
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>🎨 Miniature IA</h3>
                    <button className="gradient-btn" style={{ width: 'auto', fontSize: '0.9rem', padding: '8px 16px', margin: 0 }} onClick={generateThumbnail} disabled={thumbLoading}>
                      {thumbLoading ? <div className="spinner" style={{ width: 20, height: 20 }}></div> : <><FaMagic style={{ marginRight: '8px' }} /> Générer</>}
                    </button>
                  </div>

                  {thumbLoading && (
                    <div style={{ margin: '20px 0' }}>
                      <SmartLoader messages={[
                        "Analyse du script pour le concept...",
                        "Rédaction du prompt artistique (Gemini)...",
                        "Génération de l'image (Flux/Diff)...",
                        "Correction des couleurs et contraste..."
                      ]} />
                    </div>
                  )}
                </div>

                {thumbnailUrl && (
                  <div style={{ animation: 'fadeIn 0.5s' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '10px' }}>
                      Prompt IA: "{thumbnailPrompt}"
                    </p>
                    <img src={thumbnailUrl} alt="Miniature générée" style={{ width: '100%', maxWidth: '1280px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} />
                    <br />
                    <a href={thumbnailUrl} download="thumbnail.jpg" className="gradient-btn" style={{ width: 'auto', marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}>
                      <FaDownload style={{ marginRight: '8px' }} /> Télécharger JPG
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
