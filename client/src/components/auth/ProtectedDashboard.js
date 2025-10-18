import React from 'react';
import { Box, Fade } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import Dashboard from '../../pages/Dashboard';
import Login from '../../pages/Login';

/**
 * Renders a full-screen overlay Login until both wallet and firebase auth are ready.
 */
const ProtectedDashboard = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWallet();
  const ready = isAuthenticated && isConnected;

  return (
    <Box position="relative" sx={{ width: '100%', minHeight: 'calc(100vh - 64px)' }}>
      <Fade in={ready} timeout={400} mountOnEnter unmountOnExit>
        <Box>
          <Dashboard />
        </Box>
      </Fade>
      <Fade in={!ready} timeout={300} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: (theme) => theme.palette.mode === 'dark' ? 'blur(6px) saturate(140%)' : 'blur(10px) saturate(150%)',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.10), transparent 60%), rgba(0,0,0,0.80)'
              : 'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.15), transparent 60%), rgba(255,255,255,0.70)',
            zIndex: 10,
            p: 2
          }}
        >
          <Login embedded />
        </Box>
      </Fade>
    </Box>
  );
};

export default ProtectedDashboard;
