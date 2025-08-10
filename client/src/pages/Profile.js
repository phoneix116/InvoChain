import React, { useMemo } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Chip, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { Navigate } from 'react-router-dom';

const Label = ({ children }) => (
  <Typography variant="body2" sx={{ color: '#94a3b8' }}>{children}</Typography>
);

const Value = ({ children }) => (
  <Typography variant="body1" sx={{ color: '#f8fafc', fontWeight: 600 }}>{children}</Typography>
);

export default function Profile() {
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

  const verified = !!userInfo?.verifiedWallet;
  const stats = userInfo?.stats || {};

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', p: 3 }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,.2)', color: '#f8fafc', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20, border: '1px solid rgba(99,102,241,.35)' }}>
            {avatarLetter}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: '#f8fafc', fontWeight: 700 }}>Profile</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>{userInfo?.email || user?.email || 'Wallet-only'}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {verified ? (
              <Chip label="Verified" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }} />
            ) : (
              <Chip label="Unverified" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} />
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 700 }}>Account</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={5}><Label>Wallet</Label></Grid>
                  <Grid item xs={7}><Value>{formatAddress(account)}</Value></Grid>
                  <Grid item xs={5}><Label>Network</Label></Grid>
                  <Grid item xs={7}><Value>{network?.name || '—'}</Value></Grid>
                  <Grid item xs={5}><Label>Balance</Label></Grid>
                  <Grid item xs={7}><Value>{parseFloat(balance || '0').toFixed(4)} ETH</Value></Grid>
                </Grid>
                <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.2)' }} />
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
          <Grid item xs={12} md={6}>
            <Card sx={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#f8fafc', mb: 2, fontWeight: 700 }}>Preferences & Stats</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}><Label>Theme</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.theme || 'dark'}</Value></Grid>
                  <Grid item xs={6}><Label>Timezone</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.timezone || 'UTC'}</Value></Grid>
                  <Grid item xs={6}><Label>Default Currency</Label></Grid>
                  <Grid item xs={6}><Value>{userInfo?.preferences?.defaultCurrency || 'ETH'}</Value></Grid>
                </Grid>
                <Divider sx={{ my: 2, borderColor: 'rgba(148,163,184,0.2)' }} />
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
