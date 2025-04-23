import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TopicsList = ({ 
  topics, 
  onSelectTopic, 
  loading, 
  error,
  sources,
  darkMode
}) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [showSources, setShowSources] = useState(false);

  // Animation pour les cartes de sujets
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4
      }
    }),
    hover: {
      y: -5,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
    }
  };

  // Calculer un score d'engagement pour chaque sujet (pour le tri)
  const getEngagementScore = (topic) => {
    let score = 0;
    if (topic.timeliness === 'very_recent') score += 30;
    else if (topic.timeliness === 'recent') score += 20;
    
    if (topic.factual_accuracy === 'high') score += 30;
    else if (topic.factual_accuracy === 'medium') score += 20;
    
    // Ajouter des points pour la longueur des points clés
    score += (topic.key_points?.length || 0) * 5;
    
    // Ajouter des points pour les sources
    score += (topic.sources?.length || 0) * 10;
    
    return score;
  };

  // Trier les sujets par score d'engagement
  const sortedTopics = [...topics].sort((a, b) => getEngagementScore(b) - getEngagementScore(a));

  return (
    <div className="topics-list">
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
          {topics.length} sujets tendance ont été générés
        </h2>
        <p style={{ 
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
          fontSize: '1rem',
          lineHeight: 1.6
        }}>
          Sélectionnez un sujet pour générer un script complet et détaillé.
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

      {/* Affichage des sources */}
      {sources && sources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: showSources ? 1 : 0,
            height: showSources ? 'auto' : 0
          }}
          transition={{ duration: 0.3 }}
          style={{
            overflow: 'hidden',
            marginBottom: '20px'
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
              {sources.slice(0, 5).map((source, index) => (
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
              {sources.length > 5 && (
                <li style={{ color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Et {sources.length - 5} autres sources...
                </li>
              )}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Bouton pour afficher/masquer les sources */}
      {sources && sources.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => setShowSources(!showSources)}
          style={{
            marginBottom: '20px',
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
          {showSources ? 'Masquer les sources' : 'Afficher les sources utilisées'}
        </motion.button>
      )}

      {/* Liste des sujets */}
      <div className="topics-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px'
      }}>
        {sortedTopics.map((topic, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className="topic-card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              background: darkMode ? 'rgba(31, 41, 55, 0.8)' : '#fff',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              cursor: 'pointer',
              border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}`,
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
            onClick={() => {
              if (expandedTopic === index) {
                onSelectTopic(topic);
              } else {
                setExpandedTopic(index);
              }
            }}
          >
            {/* Score d'engagement */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
              color: darkMode ? '#34d399' : '#059669',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {getEngagementScore(topic)}
            </div>

            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: darkMode ? '#fff' : '#111827',
              marginBottom: '12px',
              lineHeight: 1.4
            }}>
              {topic.title}
            </h3>

            <div className="topic-badges" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {topic.timeliness === 'very_recent' && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  color: darkMode ? '#fca5a5' : '#dc2626'
                }}>
                  Très récent
                </span>
              )}
              {topic.factual_accuracy === 'high' && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  color: darkMode ? '#34d399' : '#059669'
                }}>
                  Fiabilité élevée
                </span>
              )}
              <span style={{
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 500,
                background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                color: darkMode ? '#93c5fd' : '#2563eb'
              }}>
                {topic.estimated_duration || '15-20 min'}
              </span>
            </div>

            <p style={{
              fontSize: '0.9rem',
              color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
              marginBottom: '16px',
              lineHeight: 1.6,
              flex: 1
            }}>
              {topic.angle || topic.why_interesting}
            </p>

            {/* Points clés (visibles uniquement si la carte est étendue) */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: expandedTopic === index ? 1 : 0,
                height: expandedTopic === index ? 'auto' : 0
              }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', marginBottom: expandedTopic === index ? '16px' : 0 }}
            >
              <div style={{
                background: darkMode ? 'rgba(17, 24, 39, 0.5)' : 'rgba(243, 244, 246, 0.8)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginBottom: '8px',
                  color: darkMode ? '#fff' : '#111827'
                }}>
                  Points clés à aborder:
                </h4>
                <ul style={{
                  paddingLeft: '20px',
                  margin: 0,
                  fontSize: '0.85rem',
                  color: darkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151'
                }}>
                  {topic.key_points?.slice(0, 3).map((point, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{point}</li>
                  ))}
                  {topic.key_points?.length > 3 && (
                    <li style={{ fontStyle: 'italic' }}>Et {topic.key_points.length - 3} autres points...</li>
                  )}
                </ul>
              </div>
            </motion.div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTopic(topic);
              }}
              disabled={loading}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: darkMode ? 'rgba(37, 99, 235, 0.7)' : 'linear-gradient(135deg, #2563eb, #1e40af)',
                color: '#fff',
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: '#fff',
                    animation: 'spin 1s linear infinite'
                  }}></span>
                  Génération...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                  Choisir et générer un script
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TopicsList;
