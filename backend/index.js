require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const morgan    = require('morgan');
const logger    = require('./utils/logger');

const app = express();
app.set('trust proxy', 1);
// ── MIDDLEWARE ──
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// ── RATE LIMITS ──
app.use('/api/ai', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please wait a moment.' }
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── ROUTES ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/ai',       require('./routes/ai'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quiz',     require('./routes/quiz'));

// ── HEALTH CHECK ──
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  logger.error('Server', 'Unhandled error', err, {
    method: req.method,
    url:    req.originalUrl,
    userId: req.userId || null,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DevPath API running on port ${PORT}`));