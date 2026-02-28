const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Upsert progress item (mark complete/incomplete + notes)
router.put('/:roadmapId/items/:itemId', auth, async (req, res) => {
  const { roadmapId, itemId } = req.params;
  const { completed, notes, item_type } = req.body;

  // Verify ownership
  const [rows] = await db.query(
    'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
    [roadmapId, req.userId]
  );
  if (!rows.length) return res.status(403).json({ error: 'Forbidden' });

  await db.query(
    `INSERT INTO progress (roadmap_id, item_id, item_type, completed, notes)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE completed = VALUES(completed), notes = VALUES(notes)`,
    [roadmapId, itemId, item_type, completed ? 1 : 0, notes || '']
  );
  res.json({ success: true });
});

// Bulk get progress for roadmap
router.get('/:roadmapId', auth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT item_id, item_type, completed, notes FROM progress WHERE roadmap_id = ?',
    [req.params.roadmapId]
  );
  res.json(rows);
});

module.exports = router;
