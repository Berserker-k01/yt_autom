import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ScriptEditor from '../script/ScriptEditor';

const ScriptGenerator = ({ 
  script, 
  onScriptUpdate,
  selectedTopic, 
  onExportPDF, 
  pdfUrl, 
  pdfData,
  pdfFileName,
  downloadFile,
  sources,
  error,
  darkMode
}) => {
  const [showFullScript, setShowFullScript] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

      // Si la ligne contient [SECTION], la formater comme une section
      if (line.includes('[') && line.includes(']')) {
        return (
          <h3 key={index} style={{ 
            fontSize: '1.3rem', 
            fontWeight: 600, 
            margin: '15px 0 10px',
            color: darkMode ? '#d1d5db' : '#374151',
            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.8)',
            padding: '8px 12px',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            {line}
          </h3>
        );
      }
      
      // Ligne vide
      if (!line.trim()) {
        return <div key={index} style={{ height: '12px' }}></div>;
      }
      
      // Ligne normale
      return (
        <p key={index} style={{ 
          margin: '8px 0', 
          lineHeight: 1.6,
          color: darkMode ? '#e5e7eb' : '#374151'
        }}>
          {line}
        </p>
      );
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setShowFullScript(true);
  };

  const handleScriptUpdate = (updatedScript) => {
    if (onScriptUpdate) {
      onScriptUpdate(updatedScript);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{ 
        width: '100%',
        backgroundColor: darkMode ? '#111827' : '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        marginBottom: '30px',
        border: darkMode ? '1px solid #1f2937' : '1px solid #e5e7eb'
      }}
    >
      {error ? (
        <div style={{ 
          color: '#ef4444', 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: darkMode ? '#292524' : '#fef2f2',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>Erreur lors de la génération du script</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {selectedTopic && (
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ 
                fontSize: '1.8rem', 
                fontWeight: 700, 
                color: darkMode ? '#f3f4f6' : '#111827',
                marginTop: 0
              }}>
                {selectedTopic.title}
              </h2>
              <p style={{ 
                color: darkMode ? '#9ca3af' : '#4b5563',
                marginBottom: '15px', 
                fontSize: '1.1rem'
              }}>
                {selectedTopic.angle}
              </p>
            </div>
          )}

          {!isEditing ? (
            // Mode aperçu du script
            <div>
              {script ? (
                <div>
                  <div style={{ 
                    backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                  }}>
                    {showFullScript ? formatText(script) : formatText(scriptExcerpt)}

                    {!showFullScript && script && script.length > 500 && (
                      <button
                        onClick={() => setShowFullScript(true)}
                        style={{ 
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: darkMode ? '#60a5fa' : '#2563eb',
                          fontWeight: 500,
                          cursor: 'pointer',
                          padding: '10px 0',
                          marginTop: '10px',
                          fontSize: '1rem'
                        }}
                      >
                        Voir le script complet →
                      </button>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    gap: '10px', 
                    flexWrap: 'wrap',
                    marginBottom: '20px'
                  }}>
                    <button
                      onClick={handleEditClick}
                      style={{ 
                        backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                        color: darkMode ? '#e5e7eb' : '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                      Éditer le script
                    </button>

                    {sources && sources.length > 0 && (
                      <button
                        onClick={() => setShowSources(!showSources)}
                        style={{ 
                          backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                          color: darkMode ? '#e5e7eb' : '#1f2937',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        {showSources ? 'Masquer les sources' : `Voir les sources (${sources.length})`}
                      </button>
                    )}

                    <button
                      onClick={onExportPDF}
                      style={{ 
                        backgroundColor: darkMode ? '#2563eb' : '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Générer et télécharger le PDF
                    </button>
                  </div>

                  {(pdfData || pdfUrl) && (
                    <div style={{ 
                      backgroundColor: darkMode ? '#374151' : '#f0f9ff',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                      border: darkMode ? '1px solid #4b5563' : '1px solid #bae6fd'
                    }}>
                      <div style={{ color: darkMode ? '#e5e7eb' : '#0c4a6e' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: 500 }}>
                          🎉 Votre PDF est prêt !
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                          Cliquez sur le bouton pour télécharger.
                        </p>
                      </div>
                      
                      {pdfData ? (
                        <button 
                          onClick={downloadFile}
                          style={{
                            backgroundColor: darkMode ? '#2563eb' : '#0284c7',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Télécharger {pdfFileName ? pdfFileName.split('.').pop().toUpperCase() : 'PDF'}
                        </button>
                      ) : pdfUrl && (
                        <a 
                          href={`${process.env.REACT_APP_API_URL || (window.location.origin.includes('localhost') ? 'http://localhost:5000' : 'https://yt-autom.onrender.com')}${pdfUrl}`}
                          download={pdfFileName || "script_youtube.pdf"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: darkMode ? '#2563eb' : '#0284c7',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Télécharger le PDF
                        </a>
                      )}
                    </div>
                  )}

                  {showSources && sources && sources.length > 0 && (
                    <div style={{ 
                      backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
                      padding: '20px',
                      borderRadius: '8px',
                      border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                    }}>
                      <h3 style={{ 
                        margin: '0 0 15px 0', 
                        color: darkMode ? '#f3f4f6' : '#1f2937',
                        fontSize: '1.2rem'
                      }}>
                        Sources ({sources.length})
                      </h3>
                      <ul style={{ 
                        listStyleType: 'none',
                        padding: 0,
                        margin: 0
                      }}>
                        {sources.map((source, index) => (
                          <li key={index} style={{ 
                            marginBottom: '12px',
                            paddingBottom: '12px',
                            borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                            color: darkMode ? '#d1d5db' : '#4b5563',
                            fontSize: '0.95rem'
                          }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <div style={{ 
                                fontWeight: 700, 
                                color: darkMode ? '#60a5fa' : '#2563eb',
                                minWidth: '25px'
                              }}>
                                [{index + 1}]
                              </div>
                              <a 
                                href={source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  color: darkMode ? '#93c5fd' : '#2563eb',
                                  textDecoration: 'none',
                                  wordBreak: 'break-all'
                                }}
                              >
                                {source}
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px',
                  backgroundColor: darkMode ? '#1f2937' : '#f9fafb',
                  borderRadius: '8px',
                  color: darkMode ? '#9ca3af' : '#6b7280'
                }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
                    Générer un script pour ce sujet
                  </p>
                  <p style={{ fontSize: '0.95rem', margin: 0 }}>
                    Une fois le script généré, vous pourrez l'éditer et l'exporter en PDF.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Mode édition du script avec le nouveau composant ScriptEditor
            <ScriptEditor 
              script={script}
              sources={sources}
              topic={selectedTopic?.title}
              onSave={(updatedScript) => {
                handleScriptUpdate(updatedScript);
                setIsEditing(false);
              }}
            />
          )}
        </>
      )}
    </motion.div>
  );
};

export default ScriptGenerator;
