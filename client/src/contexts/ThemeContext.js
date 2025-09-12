import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { GlobalStyles } from '@mui/system';
import { lightTheme, darkTheme, tokens } from '../theme/theme';

const ThemeModeContext = createContext();

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
};

const buildTheme = (mode) => (mode === 'dark' ? darkTheme : lightTheme);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'dark');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(() => {
    const t = buildTheme(mode);
    // attach tokens for component-level access (e.g., KPIStat uses theme.tokens)
    t.tokens = tokens;
    return t;
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')), tokens }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          'html, body, #root': {
            minHeight: '100%',
            height: 'auto',
            overflowX: 'hidden',
            overflowY: 'auto',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge legacy
          },
          'html::-webkit-scrollbar, body::-webkit-scrollbar, #root::-webkit-scrollbar': {
            width: 0,
            height: 0
          },
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            margin: 0,
            padding: 0
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
