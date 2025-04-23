// Thème global pour l'application
const theme = {
  colors: {
    primary: {
      main: '#2563eb',
      dark: '#1e40af',
      light: '#60a5fa',
      gradient: 'linear-gradient(135deg, #2563eb, #1e40af)',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      contrastText: '#ffffff'
    },
    success: {
      main: '#10b981',
      dark: '#059669',
      light: '#34d399',
      contrastText: '#ffffff'
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
      light: '#f87171',
      contrastText: '#ffffff'
    },
    warning: {
      main: '#f59e0b',
      dark: '#d97706',
      light: '#fbbf24',
      contrastText: '#ffffff'
    },
    info: {
      main: '#3b82f6',
      dark: '#2563eb',
      light: '#60a5fa',
      contrastText: '#ffffff'
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    },
    text: {
      primary: '#111827',
      secondary: '#4b5563',
      disabled: '#9ca3af',
      hint: '#6b7280'
    },
    background: {
      paper: '#ffffff',
      default: '#f3f4f6',
      gradient: 'linear-gradient(135deg, #f0f5ff, #e2eafc)'
    },
    divider: '#e5e7eb'
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600
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
      textTransform: 'none'
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },
  spacing: (factor) => `${0.25 * factor}rem`,
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px'
  },
  shape: {
    borderRadius: '0.5rem',
    buttonBorderRadius: '0.5rem'
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
  }
};

export default theme;
