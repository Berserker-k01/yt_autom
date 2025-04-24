import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { ProfileContext } from '../../context/ProfileContext';
import axios from 'axios';
import './ScriptEditor.css';

const ScriptEditor = ({ script, sources, topic, onSave }) => {
  const { profile } = useContext(ProfileContext);
  const [editedScript, setEditedScript] = useState(script || '');
  const [aiRequest, setAiRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState(null);
  const [savedRecently, setSavedRecently] = useState(false);
  const [aiModifying, setAiModifying] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  useEffect(() => {
    if (script) {
      setEditedScript(script);
      estimateReadingTime(script);
    }
  }, [script]);

  const handleScriptChange = (e) => {
    setEditedScript(e.target.value);
    setSavedRecently(false);
  };

  const handleSave = () => {
    estimateReadingTime(editedScript);
    onSave && onSave(editedScript);
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 3000);
  };

  const handleAiRequest = async () => {
    if (!aiRequest.trim()) {
      alert('Veuillez entrer une demande de modification');
      return;
    }

    setAiModifying(true);
    setIsLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/modify-script`, {
        script: editedScript,
        request: aiRequest,
        profile
      });

      if (response.data.modified_script) {
        setEditedScript(response.data.modified_script);
        if (response.data.estimated_reading_time) {
          setTimeEstimate(response.data.estimated_reading_time);
        }
        setAiRequest('');
      }
    } catch (error) {
      console.error('Erreur lors de la modification par IA:', error);
      alert('Erreur lors de la modification du script par l\'IA');
    } finally {
      setIsLoading(false);
      setAiModifying(false);
    }
  };

  const estimateReadingTime = async (text) => {
    if (!text.trim()) return;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/estimate-time`, {
        script: text
      });

      if (response.data.estimated_reading_time) {
        setTimeEstimate(response.data.estimated_reading_time);
      }
    } catch (error) {
      console.error('Erreur lors de l\'estimation du temps:', error);
    }
  };

  const formatTimeSection = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="script-editor-container">
      <div className="script-editor-header">
        <h3>Édition du script{topic ? `: ${topic}` : ''}</h3>
        {timeEstimate && (
          <div className="reading-time-display">
            <div className="time-badge">
              {timeEstimate.formatted_time}
              <span className="time-label">temps estimé</span>
            </div>
            <button 
              className="stats-toggle-btn"
              onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            >
              {showAdvancedStats ? 'Masquer les statistiques' : 'Voir les statistiques'}
            </button>
          </div>
        )}
      </div>

      {showAdvancedStats && timeEstimate && (
        <div className="script-statistics">
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-value">{timeEstimate.total_words}</div>
              <div className="stat-label">mots</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{timeEstimate.total_sentences}</div>
              <div className="stat-label">phrases</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{timeEstimate.sections_count}</div>
              <div className="stat-label">sections</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{timeEstimate.avg_sentence_length}</div>
              <div className="stat-label">mots/phrase</div>
            </div>
            <div className="stat-item retention-stat">
              <div className="stat-value">{timeEstimate.estimated_retention.percentage}%</div>
              <div className="stat-label">rétention estimée</div>
            </div>
          </div>
          
          <div className="sections-timeline">
            <h4>Timeline des sections</h4>
            <div className="timeline">
              {timeEstimate.sections.map((section, idx) => (
                <div key={idx} className="timeline-section" 
                     style={{width: `${(section.estimated_time / timeEstimate.total_seconds) * 100}%`}}>
                  <div className="section-title">{section.title}</div>
                  <div className="section-time">{formatTimeSection(section.estimated_time)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="editor-area">
        <textarea
          value={editedScript}
          onChange={handleScriptChange}
          placeholder="Le contenu du script apparaîtra ici..."
          disabled={isLoading}
          className="script-textarea"
        />
      </div>

      <div className="modification-tools">
        <div className="manual-tools">
          <button 
            onClick={handleSave} 
            disabled={isLoading || !editedScript.trim()}
            className={`save-btn ${savedRecently ? 'saved' : ''}`}
          >
            {savedRecently ? 'Enregistré ✓' : 'Enregistrer les modifications'}
          </button>
          
          <button 
            onClick={() => estimateReadingTime(editedScript)} 
            disabled={isLoading || !editedScript.trim()}
            className="estimate-btn"
          >
            Recalculer le temps
          </button>
        </div>

        <div className="ai-modification">
          <h4>Modifier avec l'IA</h4>
          <div className="ai-input-area">
            <textarea
              value={aiRequest}
              onChange={(e) => setAiRequest(e.target.value)}
              placeholder="Demandez une modification spécifique, par exemple: 'Raccourcir l'introduction', 'Ajouter plus de données chiffrées', 'Rendre le ton plus enthousiaste'..."
              disabled={isLoading}
              className="ai-request-input"
            />
            <button 
              onClick={handleAiRequest} 
              disabled={isLoading || !aiRequest.trim() || !editedScript.trim()}
              className="ai-modify-btn"
            >
              {isLoading ? 'En cours...' : 'Modifier avec l\'IA'}
            </button>
          </div>
        </div>
      </div>

      {sources && sources.length > 0 && (
        <div className="sources-section">
          <h4>Sources ({sources.length})</h4>
          <div className="sources-list">
            {sources.map((source, idx) => (
              <div key={idx} className="source-item">
                <span className="source-number">[{idx + 1}]</span>
                <a href={source} target="_blank" rel="noopener noreferrer" className="source-link">
                  {source}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {aiModifying && (
        <div className="ai-modifying-overlay">
          <div className="ai-modifying-message">
            <div className="spinner"></div>
            <p>L'IA modifie votre script...</p>
            <p className="ai-tip">Cela peut prendre jusqu'à 20 secondes selon la longueur du script.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
