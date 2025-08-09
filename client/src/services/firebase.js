import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let app;
let auth;

function buildConfig() {
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
  const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
  const appId = process.env.REACT_APP_FIREBASE_APP_ID;
  const measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
  const storageBucket = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;

  const missing = [];
  if (!apiKey) missing.push('REACT_APP_FIREBASE_API_KEY');
  if (!authDomain) missing.push('REACT_APP_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('REACT_APP_FIREBASE_PROJECT_ID');
  if (!appId) missing.push('REACT_APP_FIREBASE_APP_ID');

  if (missing.length) {
    if (process.env.NODE_ENV !== 'production') {
      // Print which keys are missing and preview provided ones
      const preview = (v) => (v ? String(v).slice(0, 6) + '…' : null);
      console.error('[Firebase] Missing required env vars:', missing);
      console.error('[Firebase] Provided env previews:', {
        REACT_APP_FIREBASE_API_KEY: preview(apiKey),
        REACT_APP_FIREBASE_AUTH_DOMAIN: preview(authDomain),
        REACT_APP_FIREBASE_PROJECT_ID: preview(projectId),
        REACT_APP_FIREBASE_APP_ID: preview(appId),
        REACT_APP_FIREBASE_MEASUREMENT_ID: preview(measurementId),
        REACT_APP_FIREBASE_STORAGE_BUCKET: preview(storageBucket),
      });
    }
    return null;
  }

  const cfg = { apiKey, authDomain, projectId, appId };
  if (measurementId) cfg.measurementId = measurementId;
  if (storageBucket) cfg.storageBucket = storageBucket;
  return cfg;
}

export function getFirebaseAuth() {
  try {
    if (!app) {
      const config = buildConfig();
      if (!config) return null;
      app = initializeApp(config);
      auth = getAuth(app);
    }
    return auth || null;
  } catch (e) {
    console.error('[Firebase] Initialization error:', e);
    return null;
  }
}

export default getFirebaseAuth;
