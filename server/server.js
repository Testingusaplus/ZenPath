import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

// Load environmental variables
dotenv.config();

// Routes imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import socialRoutes from './routes/social.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';

import { db } from './services/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configurations
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: { message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit login/register attempts
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger base64 avatar strings

// Maintenance Mode middleware
app.use((req, res, next) => {
  const config = db.getConfig();
  if (config.maintenanceMode && !req.path.startsWith('/api/auth/admin') && !req.path.startsWith('/api/admin')) {
    // Check if the request is an admin (we let JWT verification handle actual auth, but we reject others)
    // If it's a request to non-admin endpoints, we reject if maintenance mode is active
    if (req.path.startsWith('/api/')) {
      return res.status(503).json({ message: 'ZenPath is currently undergoing maintenance. Please try again later.' });
    }
  }
  next();
});

// Apply rate limiters
app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Serves Static React Client Build
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to React app router
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err);
  
  // Log critical error in system log
  db.insert('system_logs', {
    timestamp: new Date().toISOString(),
    action: 'Express Server Error',
    admin: 'SYSTEM',
    details: err.message || err.toString(),
    type: 'error'
  });

  res.status(500).json({
    message: 'An internal server error occurred. Please try again later.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[ZenPath Backend] running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
