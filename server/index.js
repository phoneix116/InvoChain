// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');

// Import database connection
const database = require('./config/database');

// Import route handlers
const ipfsRoutes = require('./routes/ipfs');
const contractRoutes = require('./routes/contract');
const invoiceRoutes = require('./routes/invoice');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');

// Load contract ABI and setup
const contractABI = require('./contracts/InvoiceManager.json').abi;
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Initialize provider and contract
let provider, contract;
try {
  provider = new ethers.JsonRpcProvider('http://localhost:8545');
  contract = new ethers.Contract(contractAddress, contractABI, provider);
  console.log('✅ Contract loaded:', contractAddress);
} catch (error) {
  console.error('❌ Contract setup error:', error.message);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - More permissive for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded files
app.use('/uploads', express.static('uploads'));

// Make contract available to routes
app.use((req, res, next) => {
  req.contract = contract;
  req.provider = provider;
  next();
});

// API Routes
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/contract', contractRoutes);
// Optional Firebase auth (enabled via env FIREBASE_ADMIN_ENABLED=true)
let verifyFirebaseToken = (req, res, next) => next();
try {
  if (process.env.FIREBASE_ADMIN_ENABLED === 'true') {
    const admin = require('firebase-admin');
    const fs = require('fs');

    // Resolve credentials from env
    let credentials;
    if (process.env.FIREBASE_ADMIN_CREDENTIALS_JSON) {
      credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS_JSON);
    } else if (process.env.FIREBASE_CREDENTIALS_FILE) {
      const raw = fs.readFileSync(process.env.FIREBASE_CREDENTIALS_FILE, 'utf8');
      credentials = JSON.parse(raw);
    } else {
      credentials = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
      };
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
    }

    verifyFirebaseToken = async (req, res, next) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
} catch (e) {
  console.warn('Firebase admin not configured, skipping auth middleware');
}

app.use('/api/invoice', verifyFirebaseToken, invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);

// Auth debug endpoint (returns Firebase user claims when enabled)
app.get('/api/auth/me', verifyFirebaseToken, (req, res) => {
  const u = req.user || {};
  res.json({
    uid: u.uid,
    email: u.email,
    email_verified: u.email_verified,
    auth_time: u.auth_time,
    iss: u.iss,
    aud: u.aud,
    iat: u.iat,
    exp: u.exp
  });
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        blockchain: !!contract,
        ipfs: true,
        database: dbHealth
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        blockchain: !!contract,
        ipfs: true,
        database: { status: 'unhealthy', message: error.message }
      }
    });
  }
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Invoice Chain API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      ipfs: '/api/ipfs/*',
      contract: '/api/contract/*',
      invoice: '/api/invoice/*'
  },
  documentation: `http://localhost:${process.env.PORT || 3001}`
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server with database connection
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Try to connect to MongoDB, but do not crash the server on failure (dev-friendly)
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await database.connect();
  } catch (error) {
    console.error('❌ MongoDB initial connection failed:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('💡 Please update your .env file with your MongoDB connection string');
    } else if (error.message.toLowerCase().includes('etimeout')) {
      console.error('💡 DNS / Network issue reaching MongoDB Atlas. Ensure your IP is whitelisted in Atlas Network Access or allow 0.0.0.0/0 for dev.');
    }
  }

  // Start Express server regardless, so other routes remain usable
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`📊 Database: ${database.isConnected ? 'Connected to MongoDB Atlas' : 'Not connected (retrying...)'}`);
  });

  // Background retry loop to establish DB connection later
  if (!database.isConnected) {
    const RETRY_MS = 10000; // 10s
    const retry = setInterval(async () => {
      if (database.isConnected) {
        clearInterval(retry);
        return;
      }
      try {
        console.log(`⏳ Retrying MongoDB connection...`);
        await database.connect();
        if (database.isConnected) {
          console.log('✅ MongoDB connected after retry');
          clearInterval(retry);
        }
      } catch (e) {
        console.warn('⚠️ MongoDB retry failed:', e.message);
      }
    }, RETRY_MS);
  }
}

// Start the server
startServer();

module.exports = app;
