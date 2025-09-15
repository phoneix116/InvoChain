import React, { useEffect, useMemo } from 'react';
import { Box, Button, Card, CardContent, Typography, Chip, Stack, CircularProgress, Divider, Checkbox, FormControlLabel, Link } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import logo from '../assets/logo.png';
// No navigation needed; gating component handles transition to dashboard
import { AccountBalanceWallet, Google, CheckCircle, Logout } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import useUnifiedAuth from '../hooks/useUnifiedAuth';

const Login = ({ embedded = false }) => {
  const { user, isAuthenticated } = useAuth();
  const { isConnected, account } = useWallet();
  const { userInfo, loadUserInvoices } = useInvoice();
  const { unifiedSignIn, unifiedSignOut, signingIn, signingOut } = useUnifiedAuth();

  useEffect(() => {
    // Once wallet connects, load user profile/invoices
    if (isConnected && account) {
      loadUserInvoices();
    }
  }, [isConnected, account, loadUserInvoices]);

  const displayName = useMemo(() => userInfo?.name || user?.displayName || user?.email?.split('@')[0] || null, [userInfo, user]);

  // No redirect effect; ProtectedDashboard will swap this out automatically once authenticated

  return (
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: embedded ? 'auto' : 'calc(100vh - 64px)', mt: embedded ? 0 : -2, width: '100%', px: 2 }}>
      <Card sx={{
        width: '100%',
        maxWidth: 720,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 6,
        p: 0.5,
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(30,58,138,0.55), rgba(2,20,42,0.65) 45%, rgba(0,8,16,0.72))'
          : 'linear-gradient(135deg, rgba(219,234,254,0.8), rgba(224,242,254,0.75) 40%, rgba(241,245,249,0.8))',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? '0 24px 72px -18px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 20px 48px -16px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)'
      }}>
        <Box sx={{
          position: 'absolute', inset: 0,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(160deg, rgba(8,18,32,0.88), rgba(14,32,60,0.9) 55%, rgba(4,10,20,0.92))'
            : 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(236,244,255,0.92) 55%, rgba(247,250,252,0.95))',
          backdropFilter: 'blur(34px) saturate(170%)',
          WebkitBackdropFilter: 'blur(34px) saturate(170%)',
          borderRadius: 5,
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? 'inset 0 0 0 1px rgba(255,255,255,0.04), 0 10px 40px -8px rgba(0,0,0,0.7)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.4), 0 8px 32px -8px rgba(0,0,0,0.12)'
        }} />
        <CardContent sx={{ position: 'relative', zIndex: 1, px: { xs: 3.5, sm: 6 }, py: { xs: 4, sm: 6 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 1, width: '100%', pt: 1 }}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 260,
              height: 260,
              background: (theme) => theme.palette.mode === 'dark'
                ? 'radial-gradient(circle at 50% 50%, rgba(56,189,248,0.35), rgba(37,99,235,0.05) 60%, transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(96,165,250,0.45), rgba(191,219,254,0.15) 60%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none'
            }} />
            <Box component="img" src={logo} alt="Logo" sx={{ width: { xs: 140, sm: 170 }, height: { xs: 140, sm: 170 }, objectFit: 'contain', position: 'relative', zIndex: 1, filter: (theme) => theme.palette.mode === 'dark' ? 'drop-shadow(0 0 28px rgba(56,189,248,0.55)) drop-shadow(0 0 10px rgba(29,78,216,0.8))' : 'drop-shadow(0 0 14px rgba(96,165,250,0.45))' }} />
          </Box>

          {/* Unified action button */}
            <Button
              variant="contained"
              size="large"
              disabled={signingIn}
              onClick={unifiedSignIn}
              startIcon={signingIn ? <CircularProgress color="inherit" size={18} /> : <AccountBalanceWallet />}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                py: 1.4,
                fontSize: '1.05rem',
                borderRadius: 4,
                letterSpacing: 0.3,
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg,#0ea5e9,#1d4ed8,#0c4a6e)'
                  : 'linear-gradient(90deg,#1d4ed8,#3b82f6,#0ea5e9)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 10px 32px -4px rgba(56,189,248,0.45), 0 4px 12px -2px rgba(30,41,59,0.6)'
                  : '0 10px 28px -4px rgba(99,102,241,0.45), 0 4px 12px -2px rgba(30,41,59,0.25)',
                '&:hover': {
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 14px 40px -4px rgba(56,189,248,0.55), 0 6px 16px -2px rgba(30,41,59,0.7)'
                    : '0 14px 38px -4px rgba(99,102,241,0.55), 0 6px 16px -2px rgba(30,41,59,0.3)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all .35s cubic-bezier(.4,0,.2,1)'
              }}
            >
              {signingIn ? 'Linking session…' : 'Sign in with Wallet + Google'}
            </Button>

          {/* Provider status row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-start" alignItems="stretch" sx={{ mt: 1 }}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, px: 1.4, py: 1, borderRadius: 3, border: '1px solid', borderColor: isConnected ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.35)', bgcolor: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(30,58,138,0.25)', transition: 'all .3s ease' }}>
              <AccountBalanceWallet fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}</Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1, px: 1.4, py: 1, borderRadius: 3, border: '1px solid', borderColor: isAuthenticated ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.35)', bgcolor: isAuthenticated ? 'rgba(34,197,94,0.15)' : 'rgba(8,47,73,0.4)', transition: 'all .3s ease' }}>
              <GoogleIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{isAuthenticated ? (displayName ? `Google: ${displayName}` : 'Google Linked') : 'Google Not Linked'}</Typography>
            </Box>
          </Stack>

          {/* Session details */}
          {(account || user) && (
            <Box sx={{ mt: 1, p: 2.2, borderRadius: 3, position: 'relative', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(148,163,184,0.05))' : 'linear-gradient(135deg, rgba(0,0,0,0.03), rgba(148,163,184,0.06))', border: '1px solid', borderColor: 'rgba(148,163,184,0.25)', overflow: 'hidden' }}>
              <Divider textAlign="left" sx={{ mb: 1.5, '&::before, &::after': { borderColor: 'rgba(148,163,184,0.25)' } }}>Session</Divider>
              <Stack spacing={0.4}>
                <Typography variant="body2">Wallet: <b style={{ wordBreak: 'break-all' }}>{account || '—'}</b></Typography>
                <Typography variant="body2">Name: <b>{displayName || '—'}</b></Typography>
                <Typography variant="body2">Email: <b>{userInfo?.email || user?.email || '—'}</b></Typography>
              </Stack>
            </Box>
          )}

          {/* Footer actions */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mt: 1 }}>
            <FormControlLabel control={<Checkbox size="small" defaultChecked sx={{ p: 0.5 }} />} label={<Typography variant="caption" sx={{ fontWeight: 500 }}>Remember this device</Typography>} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Need an account?{' '}<Link underline="hover" sx={{ cursor: 'pointer', fontWeight: 600 }}>Create one</Link>
            </Typography>
          </Box>

          {isConnected && isAuthenticated && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={unifiedSignOut}
              startIcon={<Logout />}
              disabled={signingOut}
              sx={{ textTransform: 'none', fontWeight: 600, alignSelf: 'flex-start', mt: 1 }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
