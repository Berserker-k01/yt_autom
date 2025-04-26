import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ScriptViewer from './ScriptViewer';

const DirectScriptGenerator = ({ 
  userProfile, 
  API_BASE, 
  darkMode,
  onBack,
  onScriptGenerated
}) => {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [script, setScript] = useState(null);
  const [sources, setSources] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!idea.trim()) {
      setError('Veuillez entrer votre idée de script.');
      return;
    }
    
    setError(null);
    setLoading(true);
    setScript(null);
    setPdfUrl(null);
    setSources([]);
    
    try {
      const res = await fetch(`${API_BASE}/generate-direct-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea: idea.trim(),
          profile: userProfile
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
      setPdfUrl(data.pdf_url || null);
      setSources(data.sources || []);
      
      // Informer le composant parent que le script a été généré
      if (onScriptGenerated) {
        onScriptGenerated({
          script: data.script,
          pdfUrl: data.pdf_url,
          sources: data.sources,
          title: idea
        });
      }
      
    } catch (e) {
      console.error('Erreur lors de la génération du script:', e);
      setError(`Erreur lors de la génération du script: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Si un script est généré, l'afficher
  if (script) {
    return (
      <ScriptViewer 
        script={script} 
        pdfUrl={pdfUrl} 
        sources={sources}
        title={idea}
        userProfile={userProfile}
        API_BASE={API_BASE}
        darkMode={darkMode}
        onBack={() => {
          setScript(null);
          setPdfUrl(null);
          setSources([]);
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="direct-script-generator"
      style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}
    >
      <div className="section-header" style={{ marginBottom: '25px' }}>
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ 
            fontSize: '1.75rem', 
            fontWeight: 700,
            marginBottom: '10px',
            color: darkMode ? '#fff' : '#1f2937'
          }}
        >
          Transformer votre idée en script
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ 
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
            fontSize: '1rem',
            lineHeight: 1.6
          }}
        >
          Entrez votre idée et nous la transformerons directement en script complet adapté à votre profil YouTubeur.
        </motion.p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-message"
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            background: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
            color: darkMode ? '#fca5a5' : '#dc2626',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
        }}
      >
        <div>
          <label
            htmlFor="idea-input"
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 500,
              color: darkMode ? '#e5e7eb' : '#374151'
            }}
          >
            Votre idée de vidéo
          </label>
          <textarea
            id="idea-input"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Ex: Comment l'IA transforme les métiers du marketing en 2025"
            rows={4}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db'}`,
              background: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
              color: darkMode ? '#fff' : '#1f2937',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          <p style={{ 
            fontSize: '0.875rem', 
            marginTop: '8px',
            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#6b7280'
          }}>
            Soyez précis et détaillé pour obtenir un meilleur script.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#d1d5db'}`,
              background: 'transparent',
              color: darkMode ? '#e5e7eb' : '#4b5563',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Retour
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '8px',
              background: loading 
                ? (darkMode ? 'rgba(37, 99, 235, 0.5)' : 'rgba(59, 130, 246, 0.5)') 
                : (darkMode ? '#2563eb' : '#3b82f6'),
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" />
                </svg>
                Génération en cours...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Générer le script
              </>
            )}
          </button>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ 
          marginTop: '30px',
          padding: '20px', 
          borderRadius: '12px',
          background: darkMode ? 'rgba(30, 41, 59, 0.3)' : 'rgba(243, 244, 246, 0.7)',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : '#e5e7eb'}`
        }}
      >
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '12px',
          color: darkMode ? '#e5e7eb' : '#1f2937'
        }}>
          Conseils pour de meilleurs résultats
        </h3>
        <ul style={{ 
          listStyleType: 'disc', 
          paddingLeft: '20px',
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563'
        }}>
          <li style={{ marginBottom: '8px' }}>Soyez spécifique sur le sujet et l'angle que vous souhaitez explorer</li>
          <li style={{ marginBottom: '8px' }}>Incluez des mots-clés importants pour votre niche</li>
          <li style={{ marginBottom: '8px' }}>Précisez le format (tutoriel, vlog, analyse, etc.) si vous avez une préférence</li>
          <li>Indiquez si vous souhaitez des points de vue particuliers ou des faits spécifiques à inclure</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default DirectScriptGenerator;
