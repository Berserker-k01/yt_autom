import React from 'react';
import { motion } from 'framer-motion';

const ThemeSelector = ({ 
  theme, 
  setTheme, 
  onGenerate, 
  loading, 
  history, 
  error,
  darkMode
}) => {
  // Suggestions de thèmes populaires
  const popularThemes = [
    "Intelligence artificielle",
    "Développement personnel",
    "Technologies émergentes",
    "Finance personnelle",
    "Santé et bien-être",
    "Cybersécurité"
  ];

  return (
    <div className="theme-selector">
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
          Quel thème souhaitez-vous explorer ?
        </h2>
        <p style={{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
          fontSize: '1rem',
          lineHeight: 1.6
        }}>
          Entrez un thème pour générer des sujets de vidéos YouTube tendance et optimisés pour l'engagement.
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

      {/* Formulaire d'entrée du thème */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="theme-input-container"
        style={{ marginBottom: '30px' }}
      >
        <div className="input-with-button" style={{
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Ex: Développement personnel, Intelligence artificielle..."
            style={{
              flex: 1,
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '1rem',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
              background: darkMode ? 'rgba(17, 24, 39, 0.8)' : '#fff',
              color: darkMode ? '#fff' : '#111827',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease'
            }}
          />
          <button
            onClick={onGenerate}
            disabled={loading || !theme}
            style={{
              padding: '16px 30px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              cursor: loading || !theme ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading || !theme ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <span className="loading-spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: '#fff',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Génération...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
                Générer
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Suggestions de thèmes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="theme-suggestions"
        style={{ marginBottom: '40px' }}
      >
        <h3 style={{
          fontSize: '1rem',
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
          marginBottom: '12px',
          fontWeight: 500
        }}>
          Suggestions populaires
        </h3>
        <div className="suggestions-list" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {popularThemes.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(item)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: 'none',
                color: darkMode ? '#fff' : '#2563eb',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {item}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Historique des recherches récentes */}
      {history && history.topics && history.topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="search-history"
        >
          <div className="history-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{
              fontSize: '1rem',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
              fontWeight: 500
            }}>
              Recherches récentes
            </h3>
          </div>
          <div className="history-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {history.topics.slice(0, 5).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="history-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: darkMode ? 'rgba(31, 41, 55, 0.7)' : '#fff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  cursor: 'pointer',
                  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}`,
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setTheme(item.theme)}
                whileHover={{ scale: 1.02, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? 'rgba(255, 255, 255, 0.5)' : '#6b7280'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span style={{
                    color: darkMode ? '#fff' : '#111827',
                    fontWeight: 500
                  }}>
                    {item.theme}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  color: darkMode ? 'rgba(255, 255, 255, 0.5)' : '#6b7280'
                }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ThemeSelector;
