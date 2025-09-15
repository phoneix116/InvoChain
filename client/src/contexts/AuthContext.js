import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, getIdToken } from 'firebase/auth';
import getFirebaseAuth from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const auth = useMemo(() => getFirebaseAuth(), []);
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [loading, setLoading] = useState(true); // still initializing listener
  const [authReady, setAuthReady] = useState(false); // first onAuthStateChanged fired

  useEffect(() => {
    if (!auth) {
      console.warn('[Auth] Firebase auth not initialized. Check .env config.');
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const token = await getIdToken(fbUser, true);
          setIdToken(token);
        } catch (e) {
          // silent token fetch failure
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
      setAuthReady(true);
    });
    return () => unsub();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.warn('[Auth] Firebase not configured. Sign-in is disabled.');
      return; // no-op to avoid unhandled promise rejections in UI
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = () => (auth ? signOut(auth) : undefined);

  const value = {
    user,
    idToken,
    loading,
    authReady,
    configured: !!auth,
    isAuthenticated: !!user,
    signInWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
