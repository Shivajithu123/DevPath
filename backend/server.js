require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const logger  = require('./utils/logger');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quiz',     require('./routes/quiz'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Server', 'Unhandled error', err, {
    method: req.method,
    url:    req.originalUrl,
    userId: req.userId || null,
  });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DevPath API running on port ${PORT}`));