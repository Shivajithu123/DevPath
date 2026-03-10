const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');
const logger = require('../utils/logger');

// ─── RESOURCES ────────────────────────────────────────────────────────────────

router.post('/generate-resources', auth, async (req, res) => {
  const { step, technology } = req.body;

  if (!step?.title || !technology)
    return res.status(400).json({ error: 'step and technology are required' });

  const prompt = `You are a learning resource curator. Suggest the best free learning resources for someone studying: "${step.title}" in the context of learning ${technology}.

Return ONLY valid JSON in this exact format:
{
  "resources": [
    {
      "type": "documentation",
      "title": "Resource title",
      "description": "One sentence about what this resource covers",
      "url": "https://actual-real-url.com",
      "source": "Website/Platform name"
    }
  ]
}

Rules:
- Suggest exactly 8 resources total:
  - 3 official documentation links
  - 3 GitHub repositories
  - 2 free articles or blogs
- Use ONLY real, well-known URLs that actually exist
- type must be exactly: "documentation", "github", or "article"
- Return ONLY JSON, no markdown`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
         generationConfig: { 
  response_mime_type: "application/json",
  temperature: 0.3, 
  maxOutputTokens: 3000  // increase from 1500
}
        })
      }
    );

    const aiData = await response.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const text  = aiData.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json({ resources: parsed.resources });
  } catch (err) {
    logger.error('Resources', 'Failed to generate resources', err);
    res.status(500).json({ error: 'Failed to fetch resources: ' + err.message });
  }
});

// ─── QUIZ GENERATE ────────────────────────────────────────────────────────────

router.post('/generate', auth, async (req, res) => {
  const { step, technology, roadmap_id } = req.body;

  if (!step?.title || !technology || !roadmap_id)
    return res.status(400).json({ error: 'step, technology, and roadmap_id are required' });

  const check = await db.query(
    'SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2',
    [roadmap_id, req.userId]
  );
  if (!check.rows.length) return res.status(403).json({ error: 'Forbidden' });

  const prompt = `You are a coding quiz generator. Generate exactly 5 multiple choice questions to test knowledge about: "${step.title}" in the context of ${technology}.

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }
  ]
}

Rules:
- exactly 5 questions
- each question has exactly 4 options
- "correct" is the index (0,1,2,3) of the correct option
- questions should be practical and test real understanding
- vary difficulty from easy to hard
- Return ONLY JSON, no markdown`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
  response_mime_type: "application/json",
  temperature: 0.7, 
  maxOutputTokens: 4000  // increase from 2000
}
        })
      }
    );

    const aiData = await response.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const text  = aiData.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      throw new Error('Invalid JSON from Gemini');
    }

    res.json({ questions: parsed.questions });
  } catch (err) {
    logger.error('Quiz', 'Failed to generate quiz', err);
    res.status(500).json({ error: 'Failed to generate quiz: ' + err.message });
  }
});

// ─── SAVE RESULT ──────────────────────────────────────────────────────────────

router.post('/result', auth, async (req, res) => {
  const { roadmap_id, step_id, score, total, passed } = req.body;

  if (roadmap_id == null || !step_id || score == null || total == null || passed == null)
    return res.status(400).json({ error: 'roadmap_id, step_id, score, total, and passed are required' });

  const check = await db.query(
    'SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2',
    [roadmap_id, req.userId]
  );
  if (!check.rows.length) return res.status(403).json({ error: 'Forbidden' });

  try {
    await db.query(
      `INSERT INTO quiz_results (user_id, roadmap_id, step_id, score, total, passed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.userId, roadmap_id, step_id, score, total, passed]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save result: ' + err.message });
  }
});

// ─── GET RESULTS ──────────────────────────────────────────────────────────────

router.get('/results/:roadmapId', auth, async (req, res) => {
  const { roadmapId } = req.params;

  const check = await db.query(
    'SELECT id FROM roadmaps WHERE id = $1 AND user_id = $2',
    [roadmapId, req.userId]
  );
  if (!check.rows.length) return res.status(403).json({ error: 'Forbidden' });

  try {
    const result = await db.query(
      `SELECT step_id, score, total, passed, created_at
       FROM quiz_results
       WHERE roadmap_id = $1 AND user_id = $2
       ORDER BY created_at DESC`,
      [roadmapId, req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results: ' + err.message });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

router.get('/analytics', auth, async (req, res) => {
  const userId = req.userId;

  try {
    const totalsResult = await db.query(
      `SELECT
         COUNT(*)                                        AS total_attempts,
         SUM(CASE WHEN passed THEN 1 ELSE 0 END)        AS total_passed,
         SUM(CASE WHEN NOT passed THEN 1 ELSE 0 END)    AS total_failed,
         ROUND(AVG(score::numeric / total * 100), 1)    AS avg_score_pct
       FROM quiz_results
       WHERE user_id = $1`,
      [userId]
    );

    const timelineResult = await db.query(
      `SELECT
         DATE(created_at)                               AS date,
         COUNT(*)                                       AS attempts,
         SUM(CASE WHEN passed THEN 1 ELSE 0 END)        AS passed
       FROM quiz_results
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    );

    const byRoadmapResult = await db.query(
      `SELECT
         r.id                                                AS roadmap_id,
         r.title                                             AS roadmap_title,
         r.technology,
         COUNT(qr.id)                                        AS attempts,
         SUM(CASE WHEN qr.passed THEN 1 ELSE 0 END)         AS passed,
         ROUND(AVG(qr.score::numeric / qr.total * 100), 1)  AS avg_score_pct
       FROM quiz_results qr
       JOIN roadmaps r ON r.id = qr.roadmap_id
       WHERE qr.user_id = $1
       GROUP BY r.id
       ORDER BY attempts DESC`,
      [userId]
    );

    const roadmapFilter = req.query.roadmap_id;
    const byStepResult = roadmapFilter
      ? await db.query(
          `SELECT
             qr.step_id,
             COUNT(*)                                          AS attempts,
             SUM(CASE WHEN qr.passed THEN 1 ELSE 0 END)       AS passed,
             MAX(qr.score)                                     AS best_score,
             ROUND(AVG(qr.score::numeric / qr.total * 100), 1) AS avg_score_pct,
             MAX(qr.created_at)                                AS last_attempt
           FROM quiz_results qr
           WHERE qr.user_id = $1 AND qr.roadmap_id = $2
           GROUP BY qr.step_id
           ORDER BY last_attempt DESC`,
          [userId, roadmapFilter]
        )
      : await db.query(
          `SELECT
             qr.step_id,
             r.title                                             AS roadmap_title,
             COUNT(*)                                            AS attempts,
             SUM(CASE WHEN qr.passed THEN 1 ELSE 0 END)         AS passed,
             MAX(qr.score)                                       AS best_score,
             ROUND(AVG(qr.score::numeric / qr.total * 100), 1)  AS avg_score_pct,
             MAX(qr.created_at)                                  AS last_attempt
           FROM quiz_results qr
           JOIN roadmaps r ON r.id = qr.roadmap_id
           WHERE qr.user_id = $1
           GROUP BY qr.step_id, qr.roadmap_id, r.title
           ORDER BY last_attempt DESC`,
          [userId]
        );

    res.json({
      totals:    totalsResult.rows[0],
      timeline:  timelineResult.rows,
      byRoadmap: byRoadmapResult.rows,
      byStep:    byStepResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics: ' + err.message });
  }
});

module.exports = router;