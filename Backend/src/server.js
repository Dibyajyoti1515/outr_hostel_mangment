require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const studentRoutes = require('./routes/studentRoutes');
const managementRoutes = require('./routes/managementRoutes');

const app = express();

// ─── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet());
app.use(compression()); // gzip responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// JSON body parser with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// HTTP logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// General API limit: 100 req/min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, slow down' },
});

// Stricter limit for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { success: false, message: 'Too many login attempts, try again in 15 minutes' },
});

// Scanner has high throughput needs (management scanning 1400 students)
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
});

app.use('/api/', apiLimiter);
app.use('/api/student/login', loginLimiter);
app.use('/api/management/login', loginLimiter);
app.use('/api/management/scan', scanLimiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/student', studentRoutes);
app.use('/api/management', managementRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 OUTR Hostel Food API running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
