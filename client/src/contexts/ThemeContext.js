import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { GlobalStyles } from '@mui/system';

const ThemeModeContext = createContext();

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};

function buildTheme(mode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      // Grayscale primary/secondary for black/white themed UI
      primary: { main: isDark ? '#374151' : '#111827', contrastText: isDark ? '#f8fafc' : '#ffffff' },
      secondary: { main: isDark ? '#6b7280' : '#9ca3af', contrastText: isDark ? '#f8fafc' : '#111827' },
      background: {
        default: isDark ? '#0f172a' : '#f5f7fb',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#334155',
      },
      divider: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.12)'
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(12px)'
          }
        }
      },
      MuiButton: {
        styleOverrides: { root: { textTransform: 'none', borderRadius: 10 } }
      }
    }
  });
}

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const value = useMemo(() => ({ mode, setMode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary
          },
          '::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.2)'
          }
        }} />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default ThemeModeProvider;
