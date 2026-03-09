const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [name, email, hash]
    );
    const userId = result.rows[0].id;
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, name, email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const result = await db.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

module.exports = router;