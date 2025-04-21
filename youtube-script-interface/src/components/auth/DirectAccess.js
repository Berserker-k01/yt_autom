import React from 'react';
import { useNavigate } from 'react-router-dom';

const DirectAccess = () => {
  const navigate = useNavigate();

  // Fonction pour accéder directement au tableau de bord
  const goToDashboard = () => {
    // Stocker un marqueur d'accès dans localStorage
    localStorage.setItem('ytautom_direct_access', 'granted');
    localStorage.setItem('ytautom_user', JSON.stringify({
      id: 1,
      username: 'utilisateur',
      email: 'utilisateur@example.com',
      profile: {
        channel_name: 'Ma Chaîne YouTube',
        youtuber_name: 'Créateur',
        setup_completed: true
      }
    }));
    
    // Rediriger vers le tableau de bord
    navigate('/dashboard-direct');
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
      maxWidth: '800px',
      margin: '0 auto',
      height: '70vh'
    }}>
      <div className="auth-card" style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: '#1e40af', 
          marginBottom: '15px',
          fontSize: '28px'
        }}>🚀 Accès Direct</h1>
        
        <p style={{ marginBottom: '25px', color: '#64748b', fontSize: '16px' }}>
          Cliquez sur le bouton ci-dessous pour accéder directement à l'application sans authentification.
        </p>

        <button 
          onClick={goToDashboard}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          Accéder à l'application
        </button>
        
        <div style={{ marginTop: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <p style={{ color: '#0c4a6e', fontSize: '14px', marginBottom: '0' }}>
            <strong>Note :</strong> Cette méthode d'accès contourne l'authentification et est fournie uniquement pour faciliter l'utilisation de l'application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DirectAccess;
