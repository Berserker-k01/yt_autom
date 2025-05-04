import React, { useState } from 'react';

const ScriptEditor = ({ script, onSave, onCancel, onAiModify }) => {
  const [editedScript, setEditedScript] = useState(script || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiModifying, setIsAiModifying] = useState(false);
  
  // Fonction pour gérer les modifications manuelles
  const handleManualSave = () => {
    if (!editedScript.trim()) {
      alert("Le script ne peut pas être vide");
      return;
    }
    
    onSave(editedScript);
  };
  
  // Fonction pour demander une modification par l'IA
  const handleAiModify = async () => {
    if (!aiPrompt.trim()) {
      alert("Veuillez indiquer ce que l'IA doit modifier");
      return;
    }
    
    setIsAiModifying(true);
    
    try {
      await onAiModify(aiPrompt, editedScript);
      setAiPrompt(''); // Réinitialiser le champ après une demande réussie
    } catch (error) {
      console.error("Erreur lors de la modification par IA:", error);
      alert("Impossible de traiter votre demande. Veuillez réessayer.");
    } finally {
      setIsAiModifying(false);
    }
  };
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 24, color: '#1e40af', fontWeight: 700 }}>Édition du Script</h2>
        <hr style={{ margin: '20px 0' }} />
      </div>
      
      {/* Section de modification manuelle */}
      <div>
        <h3 style={{ fontSize: 20, marginBottom: '15px', color: '#1e40af' }}>
          Édition manuelle
        </h3>
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Contenu du script</label>
          <textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            placeholder="Modifiez le script ici..."
            style={{ 
              width: '100%', 
              minHeight: '300px', 
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
          <button 
            style={{ 
              padding: '10px 20px',
              marginRight: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#94a3b8',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={onCancel}
          >
            Annuler
          </button>
          <button 
            style={{ 
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1e40af)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onClick={handleManualSave}
            disabled={isSubmitting}
          >
            Sauvegarder
          </button>
        </div>
      </div>
      
      <hr style={{ margin: '30px 0' }} />
      
      {/* Section de modification par IA */}
      <div>
        <h3 style={{ fontSize: 20, marginBottom: '15px', color: '#7e22ce' }}>
          Modifier avec l'IA
        </h3>
        <p style={{ marginBottom: '15px', fontSize: '14px', color: '#64748b' }}>
          Décrivez les modifications souhaitées et l'IA mettra à jour le script en fonction de vos instructions.
        </p>
        
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Instructions pour l'IA</label>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ex: Ajoute plus de statistiques sur le sujet, Simplifie l'introduction, Rends le plus engageant..."
            style={{ 
              width: '100%', 
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <button
            style={{ 
              padding: '10px 20px',
              width: '100%',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #7e22ce, #6b21a8)',
              color: 'white',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={handleAiModify}
            disabled={isAiModifying}
          >
            <span style={{ marginRight: '8px' }}>🤖</span>
            {isAiModifying ? "Modification en cours..." : "Modifier avec l'IA"}
          </button>
        </div>
        
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            <strong>Suggestions:</strong> "Ajoute des exemples concrets", "Améliore la conclusion", 
            "Rends le ton plus conversationnel", "Ajoute des questions rhétoriques", "Inclus plus de statistiques récentes"
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;
