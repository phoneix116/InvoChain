#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load root and server envs (non-destructive, root first then server overrides)
const rootEnv = path.join(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) dotenv.config({ path: rootEnv });
const serverEnv = path.join(process.cwd(), 'server', '.env');
if (fs.existsSync(serverEnv)) dotenv.config({ path: serverEnv });

const requiredForProd = {
  MONGODB_URI: 'MongoDB connection string for persistence',
  RPC_URL: 'Blockchain RPC endpoint (local or provider)',
  IPFS_GATEWAY: 'Base IPFS gateway URL ending with /ipfs/',
};

const optionalGroups = {
  pinata: ['PINATA_JWT', 'PINATA_API_KEY', 'PINATA_SECRET_KEY'],
  firebaseAdmin: ['FIREBASE_ADMIN_ENABLED', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
  stripe: ['STRIPE_SECRET_KEY'],
  openai: ['OPENAI_API_KEY'],
};

function isSet(k) { return !!process.env[k] && !/^(REPLACE|YOUR_|CHANGE_ME)/i.test(process.env[k]); }

const missing = Object.entries(requiredForProd)
  .filter(([k]) => !isSet(k))
  .map(([k, desc]) => ({ key: k, desc }));

let issues = [];

// Validate gateway formatting
if (isSet('IPFS_GATEWAY') && !/^https?:\/\/.+\/ipfs\/$/i.test(process.env.IPFS_GATEWAY)) {
  issues.push(`IPFS_GATEWAY should be a full URL ending with /ipfs/ (current: ${process.env.IPFS_GATEWAY})`);
}

// Validate private key if present
if (process.env.PRIVATE_KEY && !/^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY)) {
  issues.push('PRIVATE_KEY present but not a 0x + 64 hex string');
}

// Pinata logic check
if (!isSet('PINATA_JWT') && !(isSet('PINATA_API_KEY') && isSet('PINATA_SECRET_KEY')) && process.env.PINATA_DISABLED !== 'true') {
  issues.push('Pinata credentials missing (set PINATA_DISABLED=true to suppress)');
}

if (process.env.FIREBASE_ADMIN_ENABLED === 'true') {
  ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY'].forEach(k=>{ if(!isSet(k)) issues.push(`Firebase admin enabled but ${k} missing`); });
}

// Report
if (!missing.length && !issues.length) {
  console.log('✅ Environment check passed.');
  process.exit(0);
}

if (missing.length) {
  console.log('\nMissing required (production) variables:');
  missing.forEach(m => console.log(` - ${m.key}: ${m.desc}`));
}
if (issues.length) {
  console.log('\nIssues detected:');
  issues.forEach(i => console.log(' - ' + i));
}

process.exit(1);
