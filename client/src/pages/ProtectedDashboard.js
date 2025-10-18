import React from 'react';
import Dashboard from './Dashboard';
import Login from './Login';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';

/**
 * Renders Login until both wallet and firebase auth are active, then Dashboard.
 * Keeps root path '/' as the single entry point.
 */
export default function ProtectedDashboard() {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useWallet();

  if (!isConnected || !isAuthenticated) return <Login />;
  return <Dashboard />;
}
