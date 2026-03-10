require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');

const app = express();

// ── MIDDLEWARE ──
app.use(cors({
  origin: '*',
  credentials: false
}));

// Rate limit AI endpoint
app.use('/api/ai', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please wait a moment.' }
}));

// General rate limit
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── ROUTES ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/ai',       require('./routes/ai'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── START ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DevPath API running on port ${PORT}`));
