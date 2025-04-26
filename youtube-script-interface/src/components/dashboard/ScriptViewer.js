import React from 'react';
import { motion } from 'framer-motion';

const ScriptViewer = ({ 
  script, 
  pdfUrl, 
  sources = [], 
  title,
  userProfile,
  API_BASE,
  darkMode,
  onBack
}) => {
  
  // Fonction pour télécharger le PDF
  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="script-viewer"
      style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}
    >
      {/* En-tête du script */}
      <div className="script-header" style={{ marginBottom: '25px' }}>
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
            padding: '10px 0',
            cursor: 'pointer',
            marginBottom: '15px',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </motion.button>
        
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
          {title || 'Votre script'}
        </motion.h2>
        
        {/* Actions pour le script */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          {pdfUrl && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={handleDownloadPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                color: darkMode ? '#60a5fa' : '#2563eb',
                border: `1px solid ${darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Télécharger le PDF
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Contenu du script */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="script-content"
        style={{
          background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#fff',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          marginBottom: '30px'
        }}
      >
        <pre 
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'inherit',
            margin: 0,
            lineHeight: 1.6,
            color: darkMode ? '#e5e7eb' : '#374151',
            fontSize: '1rem'
          }}
        >
          {script}
        </pre>
      </motion.div>

      {/* Sources */}
      {sources && sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sources-section"
          style={{
            background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#fff',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          }}
        >
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600,
            marginTop: 0,
            marginBottom: '16px',
            color: darkMode ? '#fff' : '#1f2937'
          }}>
            Sources
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sources.map((source, index) => (
              <div 
                key={index}
                style={{
                  background: darkMode ? 'rgba(17, 24, 39, 0.5)' : '#f9fafb',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  borderLeft: `3px solid ${darkMode ? '#60a5fa' : '#3b82f6'}`,
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ fontWeight: 500, color: darkMode ? '#f3f4f6' : '#374151', marginBottom: '4px' }}>
                  {source.title || `Source ${index + 1}`}
                </div>
                {source.url && (
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      textDecoration: 'none',
                      wordBreak: 'break-all',
                      fontSize: '0.8125rem'
                    }}
                  >
                    {source.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScriptViewer;
