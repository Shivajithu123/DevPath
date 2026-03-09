const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');

// Upsert progress item (mark complete/incomplete + notes)
router.put('/:roadmapId/items/:itemId', auth, async (req, res) => {
  const { roadmapId, itemId } = req.params;
  const { completed, notes, item_type } = req.body;

  // Verify ownership
  const check = await db.query(
    'SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2',
    [roadmapId, req.userId]
  );
  if (!check.rows.length) return res.status(403).json({ error: 'Forbidden' });

  await db.query(
    `INSERT INTO progress (roadmap_id, item_id, item_type, completed, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (roadmap_id, item_id)
     DO UPDATE SET completed = EXCLUDED.completed, notes = EXCLUDED.notes, updated_at = CURRENT_TIMESTAMP`,
    [roadmapId, itemId, item_type, completed, notes || '']
  );
  res.json({ success: true });
});

// Bulk get progress for roadmap
router.get('/:roadmapId', auth, async (req, res) => {
  const result = await db.query(
    'SELECT item_id, item_type, completed, notes FROM progress WHERE roadmap_id = $1',
    [req.params.roadmapId]
  );
  res.json(result.rows);
});

module.exports = router;