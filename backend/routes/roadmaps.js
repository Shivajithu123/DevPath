const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');

// Get all roadmaps for user
router.get('/', auth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.id, r.title, r.technology, r.share_token, r.is_public, r.created_at, r.updated_at,
      COUNT(CASE WHEN p.completed = 1 THEN 1 END) as completed_count,
      (
        SELECT JSON_LENGTH(JSON_EXTRACT(r2.data, '$.levels[*].steps')) +
               JSON_LENGTH(JSON_EXTRACT(r2.data, '$.levels[*].projects'))
        FROM roadmaps r2 WHERE r2.id = r.id
      ) as total_count
     FROM roadmaps r
     LEFT JOIN progress p ON p.roadmap_id = r.id
     WHERE r.user_id = ?
     GROUP BY r.id ORDER BY r.updated_at DESC`,
    [req.userId]
  );
  res.json(rows);
});

// Create roadmap
router.post('/', auth, async (req, res) => {
  const { title, technology, data } = req.body;
  if (!title || !technology || !data)
    return res.status(400).json({ error: 'Missing fields' });
  try {
    const [result] = await db.query(
      'INSERT INTO roadmaps (user_id, title, technology, data) VALUES (?, ?, ?, ?)',
      [req.userId, title, technology, JSON.stringify(data)]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single roadmap with progress
router.get('/:id', auth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM roadmaps WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  const [progress] = await db.query(
    'SELECT item_id, item_type, completed, notes FROM progress WHERE roadmap_id = ?',
    [req.params.id]
  );
  res.json({ ...rows[0], progress });
});

// Update roadmap title
router.patch('/:id', auth, async (req, res) => {
  const { title } = req.body;
  await db.query(
    'UPDATE roadmaps SET title = ? WHERE id = ? AND user_id = ?',
    [title, req.params.id, req.userId]
  );
  res.json({ success: true });
});

// Delete roadmap
router.delete('/:id', auth, async (req, res) => {
  await db.query('DELETE FROM roadmaps WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Generate share link
router.post('/:id/share', auth, async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query(
    'UPDATE roadmaps SET share_token = ?, is_public = TRUE WHERE id = ? AND user_id = ?',
    [token, req.params.id, req.userId]
  );
  res.json({ share_token: token });
});

// Unshare roadmap
router.delete('/:id/share', auth, async (req, res) => {
  await db.query(
    'UPDATE roadmaps SET share_token = NULL, is_public = FALSE WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  );
  res.json({ success: true });
});

// Public shared roadmap (no auth)
router.get('/shared/:token', async (req, res) => {
  const [rows] = await db.query(
    'SELECT r.*, u.name as author_name FROM roadmaps r JOIN users u ON u.id = r.user_id WHERE r.share_token = ? AND r.is_public = TRUE',
    [req.params.token]
  );
  if (!rows.length) return res.status(404).json({ error: 'Roadmap not found or no longer shared' });
  const [progress] = await db.query(
    'SELECT item_id, item_type, completed FROM progress WHERE roadmap_id = ?',
    [rows[0].id]
  );
  res.json({ ...rows[0], progress });
});

module.exports = router;
