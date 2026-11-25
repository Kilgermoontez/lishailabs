require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initializeDatabase } = require('./config/dbInit');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Initialize database on startup
initializeDatabase().catch(console.error);

const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (isLocalhost) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/uploads', express.static(uploadsDir));
app.use('/api', apiRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'Lishai Labs API' }));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' });
});

module.exports = app;