import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Alert, Divider, Chip, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AccountBalanceWallet, Verified, Google, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useInvoice } from '../contexts/InvoiceContext';

const Login = () => {
  const navigate = useNavigate();
  const { configured, signInWithGoogle, user } = useAuth();
  const { isConnected, connectWallet, account } = useWallet();
  const { userInfo, verifyWalletOwnership, loadUserInvoices } = useInvoice();

  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Once wallet connects, load user profile/invoices
    if (isConnected && account) {
      loadUserInvoices();
    }
  }, [isConnected, account, loadUserInvoices]);

  const isVerified = !!userInfo?.verifiedWallet;
  const displayName = useMemo(() => userInfo?.name || user?.displayName || user?.email?.split('@')[0] || null, [userInfo, user]);

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const ok = await verifyWalletOwnership();
      if (ok) navigate('/');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
      <Card sx={{ width: '100%', maxWidth: 720, background: 'rgba(15,23,42,0.6)' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>Welcome</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Sign in with your wallet. Linking Google is optional and only used to enrich your profile (name/email).
          </Typography>

          {/* Step 1: Connect Wallet */}
          <Box sx={{ mt: 2, p: 2, border: '1px solid rgba(148,163,184,0.2)', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccountBalanceWallet fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Connect your wallet</Typography>
              {isConnected && (
                <Chip size="small" color="success" icon={<CheckCircle />} label="Connected" sx={{ ml: 'auto' }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              We’ll create or load your account using your wallet address.
            </Typography>
            {!isConnected ? (
              <Button variant="outlined" onClick={connectWallet} sx={{ mt: 2 }}>Connect Wallet</Button>
            ) : (
              <Typography variant="body2" sx={{ mt: 2 }}>Address: <b>{account}</b></Typography>
            )}
          </Box>

          {/* Step 2: Verify ownership (SIWE-like) */}
          <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(148,163,184,0.2)', borderRadius: 2, opacity: isConnected ? 1 : 0.6 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Verified fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Verify wallet ownership</Typography>
              {isVerified && (
                <Chip size="small" color="success" icon={<CheckCircle />} label="Verified" sx={{ ml: 'auto' }} />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sign a one-time message to prove you own this wallet. This helps secure your account.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} disabled={!isConnected || isVerified || verifying} onClick={handleVerify}>
              {verifying ? 'Verifying…' : isVerified ? 'Verified' : 'Sign and Verify'}
            </Button>
          </Box>

          {/* Optional: Link Google */}
          <Box sx={{ mt: 3, p: 2, border: '1px solid rgba(148,163,184,0.2)', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Google fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Link Google (optional)</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Add your name and email to your profile. Your invoices can include this info.
            </Typography>
            {configured ? (
              <Button variant="outlined" onClick={signInWithGoogle} sx={{ mt: 2 }} startIcon={<Google />}>
                {user ? 'Linked • Update' : 'Link Google'}
              </Button>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Google linking isn’t configured. You can still continue with wallet-only sign-in.
              </Alert>
            )}
          </Box>

          {/* Preview: Who’s signing in */}
          <Box sx={{ mt: 3 }}>
            <Divider textAlign="left">You will sign in as</Divider>
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <Typography variant="body2">Wallet: <b>{account || 'Not connected'}</b></Typography>
              <Typography variant="body2">Name: <b>{displayName || '—'}</b></Typography>
              <Typography variant="body2">Email: <b>{userInfo?.email || user?.email || '—'}</b></Typography>
              {userInfo?.company && (
                <Typography variant="body2">Company: <b>{userInfo.company}</b></Typography>
              )}
            </Box>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => navigate('/')} disabled={!isConnected}>
              Continue
            </Button>
            <Button variant="text" onClick={() => navigate('/profile')} disabled={!isConnected}>
              Open Profile
            </Button>
          </Stack>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
