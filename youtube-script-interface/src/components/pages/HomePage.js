import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Créez des scripts YouTube exceptionnels en quelques clics</h1>
        <p className="hero-subtitle">
          Notre outil utilise l'intelligence artificielle pour générer des scripts optimisés 
          pour votre chaîne YouTube, personnalisés selon votre style et votre audience.
        </p>
        <div className="hero-buttons">
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/register')}
          >
            Commencer gratuitement
          </button>
          <button 
            className="btn btn-outline btn-lg"
            onClick={() => navigate('/login')}
          >
            Se connecter
          </button>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Pourquoi utiliser notre générateur de scripts ?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Contenu unique</h3>
            <p>Scripts uniques générés selon votre niche et style personnel</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Gain de temps</h3>
            <p>Obtenez un script complet en quelques minutes au lieu de plusieurs heures</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Optimisé pour l'engagement</h3>
            <p>Contenus conçus pour maximiser les vues et l'engagement de votre audience</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Recherche intégrée</h3>
            <p>Analyse automatique des tendances et du potentiel des sujets</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <h2>Comment ça fonctionne</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Créez votre profil créateur</h3>
            <p>Renseignez votre style, votre audience et vos préférences</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Choisissez un thème</h3>
            <p>Sélectionnez le sujet général que vous souhaitez aborder</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Générez des idées</h3>
            <p>Recevez des suggestions de sujets adaptés à votre chaîne</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Obtenez votre script</h3>
            <p>Téléchargez un script complet personnalisé et prêt à l'emploi</p>
          </div>
        </div>
      </div>
      
      <div className="cta-section">
        <h2>Prêt à révolutionner votre création de contenu ?</h2>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => navigate('/register')}
        >
          Créer un compte maintenant
        </button>
      </div>
    </div>
  );
};

export default HomePage;
