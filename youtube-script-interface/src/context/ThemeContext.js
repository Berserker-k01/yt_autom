import React, { createContext, useContext, useState, useEffect } from 'react';
import theme from '../theme';

// Créer le contexte de thème
const ThemeContext = createContext();

// Hook personnalisé pour utiliser le thème
export const useTheme = () => useContext(ThemeContext);

// Provider du thème
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Vérifier si le mode sombre est déjà sauvegardé
  useEffect(() => {
    const savedMode = localStorage.getItem('ytautom_dark_mode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    } else {
      // Détecter la préférence du système
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
  }, []);

  // Sauvegarder la préférence de thème
  useEffect(() => {
    localStorage.setItem('ytautom_dark_mode', darkMode.toString());
    
    // Appliquer le mode sombre au document
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Modifier le thème en fonction du mode
  const currentTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      background: darkMode ? {
        paper: '#1f2937',
        default: '#111827',
        gradient: 'linear-gradient(135deg, #111827, #1f2937)'
      } : theme.colors.background,
      text: darkMode ? {
        primary: '#f9fafb',
        secondary: '#e5e7eb', 
        disabled: '#6b7280',
        hint: '#9ca3af'
      } : theme.colors.text
    }
  };

  // Fonction pour basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
