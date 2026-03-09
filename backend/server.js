require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const logger  = require('./utils/logger');

const app = express();
const aiRoutes   = require('./routes/ai');
const quizRoutes = require('./routes/quiz');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// HTTP request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Global error handler — catches anything not caught in routes
app.use((err, req, res, next) => {
  logger.error('Server', 'Unhandled error', err, {
    method:  req.method,
    url:     req.originalUrl,
    body:    req.body,
    userId:  req.userId || null,
  })
  res.status(500).json({ error: 'Internal server error' })
})

app.use('/api/auth', require('./routes/auth'));
app.use('/api/roadmaps', require('./routes/roadmaps'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/roadmaps', aiRoutes);
app.use('/api/quiz', quizRoutes);   // handles both /api/quiz/* and /api/resources/*

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`DevPath API running on port ${PORT}`));