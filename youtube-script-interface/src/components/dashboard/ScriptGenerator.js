import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ScriptGenerator = ({ 
  script, 
  selectedTopic, 
  onExportPDF, 
  pdfUrl, 
  sources,
  error,
  darkMode
}) => {
  const [showFullScript, setShowFullScript] = useState(false);
  const [showSources, setShowSources] = useState(false);

  // Un extrait du script pour l'aperçu
  const scriptExcerpt = script && script.length > 500 
    ? script.substring(0, 500) + '...' 
    : script;

  // Fonction pour convertir les sauts de ligne en éléments JSX
  const formatText = (text) => {
    if (!text) return null;
    
    // Diviser le texte en lignes et créer des éléments de paragraphe
    return text.split('\n').map((line, index) => {
      // Si la ligne commence par #, considérer comme titre
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            margin: '20px 0 10px',
            color: darkMode ? '#fff' : '#111827' 
          }}>
            {line.substring(2)}
          </h1>
        );
      }
      
      // Si la ligne commence par ##, considérer comme sous-titre
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            margin: '18px 0 10px',
            color: darkMode ? '#fff' : '#1f2937' 
          }}>
            {line.substring(3)}
          </h2>
        );
      }
      
      // Si la ligne commence par ###, considérer comme sous-sous-titre
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} style={{ 
            fontSize: '1.3rem', 
            fontWeight: 600, 
            margin: '16px 0 8px',
            color: darkMode ? '#fff' : '#374151' 
          }}>
            {line.substring(4)}
          </h3>
        );
      }
      
      // Si c'est une ligne vide, ajouter un espace
      if (line.trim() === '') {
        return <div key={index} style={{ height: '0.5rem' }} />;
      }
      
      // Sinon, c'est un paragraphe normal
      return (
        <p key={index} style={{ 
          margin: '8px 0',
          lineHeight: 1.7,
          color: darkMode ? 'rgba(255, 255, 255, 0.9)' : '#374151'
        }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="script-generator">
      {/* Titre et description */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="section-header"
        style={{ marginBottom: '25px' }}
      >
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700,
          marginBottom: '10px',
          color: darkMode ? '#fff' : '#1f2937'
        }}>
          {selectedTopic ? selectedTopic.title : 'Script généré'}
        </h2>
        <p style={{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
          fontSize: '1rem',
          lineHeight: 1.6
        }}>
          Votre script est prêt ! Vous pouvez l'exporter en PDF ou le copier directement.
        </p>
      </motion.div>

      {/* Affichage des erreurs */}
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

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="script-actions"
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={onExportPDF}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(239, 68, 68, 0.7)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Exporter en PDF
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(script);
            // Feedback visuel temporaire (pourrait être remplacé par un toast)
            const btn = document.activeElement;
            const originalText = btn.textContent;
            btn.textContent = 'Copié !';
            setTimeout(() => {
              btn.textContent = originalText;
            }, 2000);
          }}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(16, 185, 129, 0.7)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Copier le script
        </button>
        
        <button
          onClick={() => setShowFullScript(!showFullScript)}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            background: darkMode ? 'rgba(59, 130, 246, 0.7)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showFullScript ? (
              <path d="M19 9l-7 7-7-7"></path>
            ) : (
              <path d="M5 15l7-7 7 7"></path>
            )}
          </svg>
          {showFullScript ? 'Afficher moins' : 'Afficher tout'}
        </button>
      </motion.div>

      {/* Affichage des sources */}
      {sources && sources.length > 0 && (
        <>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            onClick={() => setShowSources(!showSources)}
            style={{
              marginBottom: '15px',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: darkMode ? '#60a5fa' : '#2563eb',
              fontWeight: 500,
              cursor: 'pointer',
              padding: '8px 0'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {showSources ? (
                <polyline points="18 15 12 9 6 15"></polyline>
              ) : (
                <polyline points="6 9 12 15 18 9"></polyline>
              )}
            </svg>
            {showSources ? 'Masquer les sources' : 'Afficher les sources'}
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ 
              opacity: showSources ? 1 : 0,
              height: showSources ? 'auto' : 0
            }}
            transition={{ duration: 0.3 }}
            style={{
              overflow: 'hidden',
              marginBottom: showSources ? '20px' : 0
            }}
          >
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: darkMode ? 'rgba(31, 41, 55, 0.7)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: '12px',
                color: darkMode ? '#fff' : '#1e3a8a'
              }}>
                Sources utilisées ({sources.length})
              </h3>
              <ul style={{
                listStyleType: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {sources.map((source, index) => (
                  <li key={index} style={{
                    fontSize: '0.9rem',
                    color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#4b5563',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <span style={{ color: darkMode ? '#60a5fa' : '#2563eb', marginRight: '4px' }}>[{index + 1}]</span>
                    <a 
                      href={source.startsWith('http') ? source : `https://www.google.com/search?q=${encodeURIComponent(source)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: darkMode ? '#60a5fa' : '#2563eb',
                        textDecoration: 'none',
                        wordBreak: 'break-word'
                      }}
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}

      {/* Affichage du script */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="script-preview"
        style={{
          marginTop: '20px',
          background: darkMode ? 'rgba(31, 41, 55, 0.7)' : '#fff',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}`,
          maxHeight: showFullScript ? 'none' : '400px',
          overflow: showFullScript ? 'visible' : 'hidden',
          position: 'relative'
        }}
      >
        {!showFullScript && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100px',
            background: `linear-gradient(to bottom, transparent, ${darkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'})`,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            pointerEvents: 'none'
          }}/>
        )}
        
        {/* Rendu du script */}
        <div className="script-content" style={{
          color: darkMode ? '#fff' : '#1f2937',
          fontSize: '1rem',
          lineHeight: 1.7
        }}>
          {formatText(showFullScript ? script : scriptExcerpt)}
        </div>
        
        {!showFullScript && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowFullScript(true)}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: darkMode ? 'rgba(59, 130, 246, 0.7)' : '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              zIndex: 10
            }}
          >
            Afficher plus
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default ScriptGenerator;
