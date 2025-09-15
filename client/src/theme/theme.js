import { createTheme } from '@mui/material/styles';

// Neutral scale helper
const neutral = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A'
};

const baseTypography = {
  fontFamily: 'Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.02em' },
  h3: { fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.01em' },
  h4: { fontWeight: 700, fontSize: '1.375rem' },
  h5: { fontWeight: 600, fontSize: '1.125rem' },
  h6: { fontWeight: 600, fontSize: '1rem' },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  body1: { fontSize: '0.95rem' },
  body2: { fontSize: '0.85rem' },
  caption: { fontSize: '0.75rem', color: neutral[500] },
  mono: { fontFamily: 'JetBrains Mono, Source Code Pro, monospace' }
};

const commonStatus = {
  paid: { main: '#16A34A', contrastText: '#FFFFFF' },
  pending: { main: '#D97706', contrastText: '#FFFFFF' },
  disputed: { main: '#DC2626', contrastText: '#FFFFFF' },
  resolved: { main: '#22C55E', contrastText: '#FFFFFF' },
  overdue: { main: '#DC2626', contrastText: '#FFFFFF' },
  cancelled: { main: neutral[500], contrastText: '#FFFFFF' },
  created: { main: '#D97706', contrastText: '#FFFFFF' }
};

const shape = { borderRadius: 12 };

function extendShadows(base, filler) {
  const arr = [...base];
  while (arr.length < 25) arr.push(filler);
  return arr;
}

const shadowsLight = extendShadows([
  'none',
  '0 1px 2px rgba(0,0,0,0.06)',
  '0 1px 4px rgba(0,0,0,0.08)',
  '0 2px 6px rgba(0,0,0,0.10)',
  '0 4px 12px rgba(0,0,0,0.12)',
  '0 6px 18px rgba(0,0,0,0.14)',
  '0 8px 24px rgba(0,0,0,0.16)'
], '0 8px 24px rgba(0,0,0,0.16)');

const shadowsDark = extendShadows([
  'none',
  '0 1px 2px rgba(0,0,0,0.4)',
  '0 2px 4px rgba(0,0,0,0.45)',
  '0 4px 10px rgba(0,0,0,0.5)',
  '0 6px 16px rgba(0,0,0,0.55)',
  '0 8px 22px rgba(0,0,0,0.6)',
  '0 12px 32px rgba(0,0,0,0.65)'
], '0 12px 32px rgba(0,0,0,0.65)');

const components = (mode) => ({
  MuiButton: {
    styleOverrides: {
      root: { textTransform: 'none', borderRadius: 10, fontWeight: 600 },
      containedPrimary: { boxShadow: mode === 'dark' ? '0 6px 14px rgba(0,0,0,0.5)' : '0 4px 10px rgba(0,0,0,0.15)' }
    }
  },
  MuiCard: {
    styleOverrides: { root: { backdropFilter: 'blur(16px)', position: 'relative' } }
  },
  MuiChip: {
    styleOverrides: { root: { fontWeight: 600, letterSpacing: 0.25 } }
  },
  MuiTooltip: {
    styleOverrides: { tooltip: { fontSize: '0.7rem', borderRadius: 8 } }
  }
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1F4B8F', contrastText: '#FFFFFF', dark: '#163A70', light: '#60A5FA' },
  // Unified pure white background so all surfaces match exactly (requested)
  background: { default: '#FFFFFF', paper: '#FFFFFF', subtle: '#FFFFFF' },
    text: { primary: neutral[900], secondary: neutral[600], disabled: neutral[400] },
    divider: neutral[200],
    neutral,
    status: commonStatus,
  gradient: { brand: 'none' }
  },
  shape,
  typography: baseTypography,
  shadows: shadowsLight,
  components: components('light')
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#60A5FA', contrastText: '#0F172A', dark: '#3B82F6', light: '#93C5FD' },
  // Unified pure black background so all surfaces match exactly (requested)
  background: { default: '#000000', paper: '#000000', subtle: '#000000' },
    text: { primary: neutral[50], secondary: neutral[400], disabled: neutral[600] },
    divider: 'rgba(148,163,184,0.2)',
    neutral,
    status: commonStatus,
  gradient: { brand: 'none' }
  },
  shape,
  typography: baseTypography,
  shadows: shadowsDark,
  components: components('dark')
});

// Reusable sx helper tokens (exported as a plain object)
export const tokens = {
  cardBase: (theme) => ({
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius * 0.75,
    boxShadow: theme.palette.mode === 'dark' ? '0 10px 25px rgba(0,0,0,0.35)' : '0 6px 18px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(20px)'
  }),
  pageBackground: (theme) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.default,
    minHeight: '100vh'
  }),
  kpiCard: (theme) => ({
    ...tokens.cardBase(theme),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: `linear-gradient(90deg,transparent,${theme.palette.primary.main},transparent)`
    }
  }),
  glassPanel: (theme) => ({
    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(22px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius
  })
};

// Stronger “liquid glass” look for cards
export const glassCard = (theme) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.03) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.75) 100%)',
  backdropFilter: 'blur(28px) saturate(120%)',
  WebkitBackdropFilter: 'blur(28px) saturate(120%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : 'rgba(203,213,225,0.6)'}`,
  borderRadius: theme.shape.borderRadius * 0.9,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 20px 50px rgba(0,0,0,0.45)'
    : '0 12px 30px rgba(0,0,0,0.12)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: theme.palette.mode === 'dark'
      ? 'radial-gradient(1000px 300px at -10% -10%, rgba(255,255,255,0.06) 0%, transparent 60%), radial-gradient(800px 240px at 120% -20%, rgba(255,255,255,0.04) 0%, transparent 60%)'
      : 'radial-gradient(1000px 300px at -10% -10%, rgba(255,255,255,0.6) 0%, transparent 60%), radial-gradient(800px 240px at 120% -20%, rgba(255,255,255,0.45) 0%, transparent 60%)',
    pointerEvents: 'none'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)'
  }
});
