import React, { useState } from 'react';
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
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageError, setImageError] = useState(null);
  
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
          
          {/* Bouton de génération d'images standard */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            disabled={isGeneratingImages}
            onClick={() => {
              setIsGeneratingImages(true);
              setImageError(null);
              
              fetch(`${API_BASE}/api/generate-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  script: script,
                  title: title || 'Script YouTube',
                  num_images: 3
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  // Afficher les images générées dans l'interface
                  setGeneratedImages(data.images || []);
                } else {
                  setImageError(data.message || "Erreur lors de la génération des images");
                }
              })
              .catch(err => {
                console.error("Erreur:", err);
                setImageError("Erreur lors de la génération des images");
              })
              .finally(() => {
                setIsGeneratingImages(false);
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: darkMode ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
              color: darkMode ? '#a78bfa' : '#7c3aed',
              border: `1px solid ${darkMode ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.2)'}`,
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              marginLeft: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            {isGeneratingImages ? "Génération..." : "Générer des images"}
          </motion.button>
          
          {/* Bouton de génération d'images avec Grok */}
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            disabled={isGeneratingImages}
            onClick={() => {
              setIsGeneratingImages(true);
              setImageError(null);
              
              fetch(`${API_BASE}/api/generate-grok-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  script: script,
                  title: title || 'Script YouTube',
                  num_images: 3
                })
              })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  // Afficher les images générées dans l'interface
                  setGeneratedImages(data.images || []);
                } else {
                  setImageError(data.message || "Erreur lors de la génération des images avec Grok");
                }
              })
              .catch(err => {
                console.error("Erreur:", err);
                setImageError("Erreur lors de la génération des images avec Grok");
              })
              .finally(() => {
                setIsGeneratingImages(false);
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: darkMode ? 'rgba(236, 72, 153, 0.2)' : 'rgba(236, 72, 153, 0.1)',
              color: darkMode ? '#f472b6' : '#ec4899',
              border: `1px solid ${darkMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}`,
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: isGeneratingImages ? 'wait' : 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              marginLeft: '12px',
              transition: 'all 0.2s ease',
              opacity: isGeneratingImages ? 0.7 : 1
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10"/>
              <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="M2 12h2"/>
              <path d="M20 12h2"/>
            </svg>
            {isGeneratingImages ? "Génération..." : "Générer avec Grok"}
          </motion.button>
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
      
      {/* Images générées */}
      {generatedImages && generatedImages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="generated-images-section"
          style={{
            marginTop: '25px',
            background: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#fff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
          }}
        >
          <h3 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: darkMode ? '#e5e7eb' : '#374151'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Images générées
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {generatedImages.map((image, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <img 
                  src={image.url} 
                  alt={`Image générée ${index + 1}`}
                  style={{ 
                    width: '100%', 
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`
                  }}
                />
                <a 
                  href={image.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                    color: darkMode ? '#60a5fa' : '#2563eb',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger
                </a>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Message d'erreur pour les images */}
      {imageError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="error-message"
          style={{
            marginTop: '15px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
            color: darkMode ? '#fca5a5' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {imageError}
        </motion.div>
      )}

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
