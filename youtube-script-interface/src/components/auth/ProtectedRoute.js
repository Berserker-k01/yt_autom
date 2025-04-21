import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ requireSetup = false }) => {
  const { isAuthenticated, needsSetup, loading } = useAuth();

  // Pendant le chargement, afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur doit configurer son profil et que cette route l'exige
  if (needsSetup && !requireSetup) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Si l'utilisateur a déjà configuré son profil mais est sur la page de configuration
  if (!needsSetup && requireSetup) {
    return <Navigate to="/dashboard" replace />;
  }

  // Sinon, afficher le contenu protégé
  return <Outlet />;
};

export default ProtectedRoute;
