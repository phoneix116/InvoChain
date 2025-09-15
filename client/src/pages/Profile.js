import React, { useMemo } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { Navigate } from 'react-router-dom';

const Label = ({ children }) => (
  <Typography variant="body2" sx={(theme) => ({ color: theme.palette.text.secondary })}>{children}</Typography>
);

const Value = ({ children }) => (
  <Typography variant="body1" sx={(theme) => ({ color: theme.palette.text.primary, fontWeight: 600 })}>{children}</Typography>
);

export default function Profile() {
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { account, formatAddress, balance, network } = useWallet();
  const { userInfo } = useInvoice();

  // Hooks must run unconditionally at the top level
  const avatarLetter = useMemo(() => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return account ? account.slice(2, 3).toUpperCase() : '?';
  }, [user, account]);

  // Allow access if either Firebase is authenticated OR wallet is connected (wallet-first flow)
  if (!isAuthenticated && !account) return <Navigate to="/login" replace />;

  const verified = !!userInfo?.verifiedWallet; // retained for potential future use (no chip shown)
  const stats = userInfo?.stats || {};

  const isDark = theme.palette.mode === 'dark';

  // Use theme surfaces + subtle layered radial/linear accents instead of heavy solid gradient
  // Removed decorative page background per request; fall back to parent layout background
  const pageBackground = () => 'transparent';

  const glassCard = {
    background: isDark
      ? 'linear-gradient(180deg, rgba(30,41,59,0.78) 0%, rgba(17,24,39,0.60) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.84) 100%)',
    border: `1px solid ${isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.28)'}`,
    backdropFilter: 'blur(28px) saturate(160%)',
    WebkitBackdropFilter: 'blur(28px) saturate(160%)',
    boxShadow: isDark
      ? '0 20px 45px -12px rgba(0,0,0,0.55), 0 8px 24px -4px rgba(15,23,42,0.65)'
      : '0 8px 24px -8px rgba(0,0,0,0.08), 0 4px 12px -2px rgba(0,0,0,0.06)',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: isDark
        ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, transparent 55%, rgba(99,102,241,0.10) 95%)'
        : 'linear-gradient(135deg, rgba(59,130,246,0.16) 0%, transparent 55%, rgba(59,130,246,0.12) 95%)',
      pointerEvents: 'none'
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      background: isDark
        ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.30), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
    }
  };

  const avatarBg = isDark
    ? 'linear-gradient(145deg, rgba(99,102,241,0.30) 0%, rgba(99,102,241,0.12) 100%)'
    : 'linear-gradient(145deg, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0.08) 100%)';

  // Removed verification chip display

  return (
  <Box sx={{ 
    minHeight: '100vh', 
    background: pageBackground(theme), 
    position: 'relative'
  }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 4, md: 5 }, pb: 8, position: 'relative', zIndex: 1 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          mb: 4,
          ml: { xs: -5, sm: -7, md: -9, lg: -10 },
          pr: { xs: 2, md: 0 },
          maxWidth: { xs: '100%', xl: 1280 },
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.045) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.70) 100%)',
          borderRadius: 3,
          px: { xs: 2.5, md: 3.5 },
          py: { xs: 2.2, md: 2.7 },
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark ? '0 20px 45px rgba(0,0,0,0.35)' : '0 12px 28px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(26px) saturate(125%)',
          WebkitBackdropFilter: 'blur(26px) saturate(125%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: isDark
              ? 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent)'
              : `linear-gradient(90deg, transparent, ${theme.palette.divider}, transparent)`
          }
        }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: avatarBg, color: theme.palette.text.primary, display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20, border: `1px solid ${isDark ? 'rgba(99,102,241,.35)' : 'rgba(59,130,246,.35)'}` }}>
            {avatarLetter}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{'Profile'}</Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{userInfo?.email || user?.email || 'Wallet-only'}</Typography>
          </Box>
          {/* Verification chip removed */}
        </Box>

        <Grid container spacing={2.5} sx={{
          ml: { xs: -11, sm: -14, md: -17, lg: -20 },
          width: {
            xs: 'calc(100% + 88px)',
            sm: 'calc(100% + 112px)',
            md: 'calc(100% + 136px)',
            lg: 'calc(100% + 160px)'
          }
        }}>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Card sx={{ ...glassCard, flex: 1, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Account</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={5}><Label>Wallet</Label></Grid>
                  <Grid item xs={7}><Value>{formatAddress(account)}</Value></Grid>
                  <Grid item xs={5}><Label>Network</Label></Grid>
                  <Grid item xs={7}><Value>{network?.name || '—'}</Value></Grid>
                  <Grid item xs={5}><Label>Balance</Label></Grid>
                  <Grid item xs={7}><Value>{parseFloat(balance || '0').toFixed(4)} ETH</Value></Grid>
                </Grid>
                <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
                <Grid container spacing={1}>
                  <Grid item xs={5}><Label>Name</Label></Grid>
                  <Grid item xs={7}><Value>{userInfo?.name || user?.displayName || '—'}</Value></Grid>
                  <Grid item xs={5}><Label>Email</Label></Grid>
                  <Grid item xs={7}><Value>{userInfo?.email || user?.email || '—'}</Value></Grid>
                  <Grid item xs={5}><Label>Company</Label></Grid>
                  <Grid item xs={7}><Value>{userInfo?.company || '—'}</Value></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Card sx={{ ...glassCard, flex: 1, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Preferences & Stats</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}><Label>Theme</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.theme || 'dark'}</Value></Grid>
                  <Grid item xs={6}><Label>Timezone</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.timezone || 'UTC'}</Value></Grid>
                  <Grid item xs={6}><Label>Default Currency</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.defaultCurrency || 'ETH'}</Value></Grid>
                </Grid>
                <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Label>Total Invoices</Label></Grid>
                  <Grid item xs={6}><Value>{stats.totalInvoices ?? 0}</Value></Grid>
                  <Grid item xs={6}><Label>Total Earned</Label></Grid>
                  <Grid item xs={6}><Value>{Number(stats.totalEarned || 0).toString()}</Value></Grid>
                  <Grid item xs={6}><Label>Total Paid</Label></Grid>
                  <Grid item xs={6}><Value>{Number(stats.totalPaid || 0).toString()}</Value></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
