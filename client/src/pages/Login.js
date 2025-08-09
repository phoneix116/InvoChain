import React from 'react';
import { Box, Button, Card, CardContent, Typography, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { signInWithGoogle, configured } = useAuth();
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Card sx={{ maxWidth: 420 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Use Google to sign in and sync your profile with your wallet.
          </Typography>
          {!configured && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Firebase isn’t configured. Add REACT_APP_FIREBASE_* variables to client/.env and restart the dev server.
              </Alert>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
                Debug preview (first 6 chars):
              </Typography>
              <Box sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', mb: 2 }}>
                <div>API_KEY: {(process.env.REACT_APP_FIREBASE_API_KEY || '').slice(0, 6)}…</div>
                <div>AUTH_DOMAIN: {(process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '').slice(0, 6)}…</div>
                <div>PROJECT_ID: {(process.env.REACT_APP_FIREBASE_PROJECT_ID || '').slice(0, 6)}…</div>
                <div>APP_ID: {(process.env.REACT_APP_FIREBASE_APP_ID || '').slice(0, 6)}…</div>
              </Box>
            </>
          )}
          <Button variant="contained" onClick={signInWithGoogle} disabled={!configured}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
