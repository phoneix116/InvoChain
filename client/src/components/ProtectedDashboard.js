import React from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

/**
 * Renders a full-screen login overlay until both wallet and firebase auth are active.
 * Ensures the rest of the app (sidebar/layout) is visually obscured while signing in.
 */
export default function ProtectedDashboard() {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWallet();

  const ready = isAuthenticated && isConnected;

  if (!ready) {
    // Full-screen overlay: occupy entire viewport, dark backdrop.
    return (
      <Box sx={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 0px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Background dim layer (optional subtle) */}
  <Box sx={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px) saturate(140%)', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(3,7,18,0.82)' : 'rgba(241,245,249,0.82)' }} />
        {/* Login card rendered above */}
        <Box sx={{ position: 'relative', zIndex: 2, width: '100%' }}>
          <Login embedded={false} />
        </Box>
      </Box>
    );
  }

  return <Dashboard />;
}
