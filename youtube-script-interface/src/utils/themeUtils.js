/**
 * Utilitaires de gestion des thèmes et styles
 * Pour optimiser l'apparence et les performances visuelles
 */

// Palettes de couleurs optimisées
export const colorPalettes = {
  light: {
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      accent: '#f1f5f9'
    },
    text: {
      primary: '#334155',
      secondary: '#64748b',
      disabled: '#94a3b8',
      hint: '#94a3b8'
    },
    divider: '#e2e8f0',
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626'
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706'
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669'
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7'
    }
  },
  dark: {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
      gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
    },
    secondary: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981',
      contrastText: '#ffffff'
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      accent: '#334155'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#94a3b8',
      hint: '#94a3b8'
    },
    divider: '#334155',
    error: {
      main: '#f87171',
      light: '#fca5a5',
      dark: '#ef4444'
    },
    warning: {
      main: '#fbbf24',
      light: '#fcd34d',
      dark: '#f59e0b'
    },
    success: {
      main: '#34d399',
      light: '#6ee7b7',
      dark: '#10b981'
    },
    info: {
      main: '#38bdf8',
      light: '#7dd3fc',
      dark: '#0ea5e9'
    }
  }
};

// Typographie optimisée
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em'
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.01em'
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.75,
    textTransform: 'none'
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.5,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }
};

// Styles communs
export const commonStyles = {
  cardStyles: {
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '1.5rem',
    transition: 'all 0.2s ease-in-out',
  },
  buttonStyles: {
    borderRadius: '8px',
    fontWeight: 600,
    transition: 'all 0.2s ease-in-out',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionDurations: {
    short: '0.15s',
    standard: '0.3s',
    complex: '0.5s'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  shape: {
    borderRadius: 8
  }
};

// Utilitaire pour combiner le thème et les préférences
export const createTheme = (mode = 'light', overrides = {}) => {
  const palette = mode === 'dark' ? colorPalettes.dark : colorPalettes.light;
  
  return {
    colors: palette,
    typography,
    shape: commonStyles.shape,
    shadows: commonStyles.shadows,
    ...commonStyles,
    ...overrides
  };
};

// Utilitaire pour générer un style CSS adaptatif basé sur une taille d'écran
export const responsiveStyle = (property, defaultValue, breakpoints = {}) => {
  return {
    [property]: defaultValue,
    '@media (max-width: 768px)': breakpoints.tablet ? { [property]: breakpoints.tablet } : {},
    '@media (max-width: 480px)': breakpoints.mobile ? { [property]: breakpoints.mobile } : {},
    '@media (min-width: 1200px)': breakpoints.desktop ? { [property]: breakpoints.desktop } : {}
  };
};

export default {
  colorPalettes,
  typography,
  commonStyles,
  createTheme,
  responsiveStyle
};
