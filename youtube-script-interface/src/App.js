import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaYoutube, FaTiktok, FaInstagram, FaMagic, FaChartLine, FaRobot, FaDownload, FaHistory } from 'react-icons/fa';
import './Scripty.css';

// Configuration de l'API
const API_URL = 'http://localhost:5000';

function App() {
  const [platform, setPlatform] = useState('youtube');
  const [theme, setTheme] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Platforms, 2: Topics, 3: Script, 4: Stats
  const [socialStats, setSocialStats] = useState(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const handlePlatformSelect = (p) => {
    setPlatform(p);
    setStep(2);
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

  const generateScript = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/generate-script`, {
        topic: topic.title,
        platform,
        research: topic.key_points ? topic.key_points.join('\n') : ''
      });
      setScript(res.data.script);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du script");
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      // En prod, ce serait un vrai appel. Ici c'est un mock du backend.
      const res = await axios.get(`${API_URL}/api/social/metrics`);
      setSocialStats(res.data);
      setStep(4);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="scripty-app">
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          Scripty<span style={{ fontSize: '1rem', verticalAlign: 'super' }}>AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Créez du contenu viral pour toutes vos plateformes</p>
      </header>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
        <button className={`gradient-btn ${step !== 4 ? '' : 'outline'}`} style={{ width: 'auto' }} onClick={() => setStep(1)}>Création</button>
        <button className={`gradient-btn ${step === 4 ? '' : 'outline'}`} style={{ width: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={fetchStats}>
          <FaChartLine style={{ marginRight: '8px' }} /> Social Tracker
        </button>
      </nav>

      <div style={{ minHeight: '600px' }}>
        <AnimatePresence mode="wait">

          {step === 1 && (
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
              </div>

              <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
                  onClick={generateTopics}
                  disabled={!theme || loading}
                >
                  {loading ? 'Recherche en cours...' : <><FaMagic /> Générer des idées</>}
                </button>
              </div>

              {topics.length > 0 && (
                <div style={{ maxWidth: '800px', margin: '40px auto' }}>
                  <h3 style={{ textAlign: 'center' }}>Idées tendances pour {platform}</h3>
                  <div className="stats-grid">
                    {topics.map((t, i) => (
                      <div key={i} className="glass-card" style={{ cursor: 'pointer', textAlign: 'left' }} onClick={() => generateScript(t)}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-blue)' }}>{t.title}</h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.angle}</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '0.8rem' }}>
                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>⏱ {t.estimated_duration}</span>
                          <span style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '4px 8px', borderRadius: '4px' }}>🎯 {t.target_audience}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial="initial" animate="in" exit="out" variants={pageVariants}>
              {/* This step is actually integrated into step 1 in the simplified flow, but kept logic for structure if needed later. 
                     Currently, selecting a topic in step 1 goes directly to step 3 (Script) via generateScript function.
                     So step 2 is "skipped" visually or represents the Topic Selection state which is visible in step 1.
                 */}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '20px' }}>← Retour</button>
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Script {platform === 'youtube' ? 'Vidéo' : 'Viral'}</h2>
                  <button className="gradient-btn" style={{ width: 'auto', margin: 0, padding: '8px 16px', fontSize: '0.9rem' }}>
                    <FaDownload /> Exporter
                  </button>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '10px', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontFamily: 'monospace', maxHeight: '600px', overflowY: 'auto' }}>
                  {script}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && socialStats && (
            <motion.div key="step4" initial="initial" animate="in" exit="out" variants={pageVariants}>
              <h2 style={{ textAlign: 'center' }}>Tableau de Bord</h2>
              <div className="stats-grid">
                <div className="glass-card stat-item">
                  <div className="stat-value">{socialStats.overview.total_views}</div>
                  <div className="stat-label">Vues Totales</div>
                </div>
                <div className="glass-card stat-item">
                  <div className="stat-value">{socialStats.overview.total_followers}</div>
                  <div className="stat-label">Followers</div>
                </div>
                <div className="glass-card stat-item">
                  <div className="stat-value">{socialStats.overview.engagement_rate}</div>
                  <div className="stat-label">Engagement</div>
                </div>
              </div>

              <h3 style={{ marginTop: '40px' }}>Détail par plateforme</h3>
              <div className="stats-grid">
                {Object.entries(socialStats.platforms).map(([key, data]) => (
                  <div key={key} className="glass-card">
                    <h4 style={{ textTransform: 'capitalize', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>{key}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                      <span>Followers</span>
                      <span style={{ fontWeight: 'bold' }}>{data.followers}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                      <span>Vues</span>
                      <span style={{ fontWeight: 'bold' }}>{data.views}</span>
                    </div>
                    <div style={{ color: '#4ade80', fontSize: '0.9rem', textAlign: 'right' }}>{data.trend} cette semaine</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
