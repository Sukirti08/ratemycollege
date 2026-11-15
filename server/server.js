require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('node:path');

const connectDB = require('./config/db');
const { passport } = require('./config/passport');

// Correct
const authRoutes = require('./routes/auth');
const collegeRoutes = require('./routes/colleges');
const reviewRoutes = require('./routes/reviews');
const professorRoutes = require('./routes/professors');
const placementRoutes = require('./routes/placements');
const trendRoutes = require('./routes/trends');
const oracleRoutes = require('./routes/oracle');
const userRoutes = require('./routes/users');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;
const serveClient = process.env.SERVE_CLIENT === 'true';
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Security & parsing middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: { imgSrc: ["'self'", 'data:', 'https:'] },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/oracle', oracleRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'degraded' });
});

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
if (serveClient) {
  const clientDir = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientDir));
  app.get('/{*route}', (req, res) => res.sendFile(path.join(clientDir, 'index.html')));
}

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

module.exports = app;
