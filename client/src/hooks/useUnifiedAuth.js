import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Combines wallet connection and Firebase Google Auth into unified actions.
 * Keeps existing contexts unchanged while offering a single entrypoint.
 */
export default function useUnifiedAuth() {
  const { connectWallet, isConnected, disconnectWallet } = useWallet();
  const { signInWithGoogle, logout, isAuthenticated } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const unifiedSignIn = useCallback(async () => {
    if (signingIn) return; // prevent double taps
    setSigningIn(true);
    let walletDidConnect = false;
    let googleDidSign = false;
    try {
      if (!isConnected) {
        await connectWallet();
        walletDidConnect = true;
      }
      if (!isAuthenticated) {
        await signInWithGoogle();
        googleDidSign = true;
      }

      if (walletDidConnect && googleDidSign) {
        toast.success('Signed in with wallet + Google');
      } else if (walletDidConnect && !googleDidSign) {
        toast.info('Wallet connected (Google already signed in)');
      } else if (!walletDidConnect && googleDidSign) {
        toast.info('Google signed in (wallet already connected)');
      } else {
        toast.info('Already signed in');
      }
    } catch (e) {
      toast.error(e?.message || 'Unified sign-in failed');
      throw e;
    } finally {
      setSigningIn(false);
    }
  }, [signingIn, isConnected, isAuthenticated, connectWallet, signInWithGoogle]);

  const unifiedSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // Sign out of Firebase first so protected calls stop
      await logout();
    } catch (e) {
      // Non-fatal: still proceed to wallet disconnect
    } finally {
      try {
        if (isConnected) disconnectWallet();
      } catch (e) {
        // ignore wallet disconnect failure
      }
      toast.info('Signed out of Google + wallet');
      setSigningOut(false);
    }
  }, [signingOut, logout, disconnectWallet, isConnected]);

  return {
    unifiedSignIn,
    unifiedSignOut,
    signingIn,
    signingOut,
    unifiedAuthBusy: signingIn || signingOut,
  };
}
