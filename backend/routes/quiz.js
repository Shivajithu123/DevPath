const router = require('express').Router();
const db     = require('../db');
const auth   = require('../middleware/auth');
const logger = require('../utils/logger');

// ─── RESOURCES ────────────────────────────────────────────────────────────────

router.post('/generate-resources', auth, async (req, res) => {
  const { step, technology } = req.body

  logger.debug('Resources', 'Request received', { step, technology, userId: req.userId })

  if (!step?.title || !technology) {
    logger.warn('Resources', 'Missing required fields', { step, technology })
    return res.status(400).json({ error: 'step and technology are required' })
  }

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
- For documentation: use official docs (e.g. react.dev, docs.python.org, developer.mozilla.org)
- For GitHub: use real popular repos (e.g. github.com/facebook/react)
- For articles: use real platforms (e.g. dev.to, medium.com, freecodecamp.org)
- type must be exactly: "documentation", "github", or "article"
- Return ONLY JSON, no markdown`

  try {
    logger.debug('Resources', `Calling Gemini for "${step.title}" in ${technology}`)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 1500,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    logger.debug('Resources', `Gemini responded with status ${response.status}`)

    const aiData = await response.json()

    if (aiData.error) {
      logger.error('Resources', 'Gemini API returned an error', null, { geminiError: aiData.error })
      throw new Error(aiData.error.message)
    }

    logger.debug('Resources', 'Gemini usage', {
      finishReason: aiData.candidates?.[0]?.finishReason,
      tokenCount:   aiData.usageMetadata,
    })

    const text   = aiData.candidates[0].content.parts[0].text
    const clean  = text.replace(/```json\n?|```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      logger.error('Resources', 'Failed to parse Gemini JSON', parseErr, { raw: clean.slice(0, 300) })
      throw new Error('Invalid JSON from Gemini: ' + parseErr.message)
    }

    logger.info('Resources', `Generated ${parsed.resources?.length} resources for "${step.title}"`)
    res.json({ resources: parsed.resources })

  } catch (err) {
    logger.error('Resources', 'Failed to generate resources', err, { step: step.title, technology, userId: req.userId })
    res.status(500).json({ error: 'Failed to fetch resources: ' + err.message })
  }
})

// ─── QUIZ GENERATE ────────────────────────────────────────────────────────────

router.post('/generate', auth, async (req, res) => {
  const { step, technology, roadmap_id } = req.body

  logger.debug('Quiz', 'Request received', { step, technology, roadmap_id, userId: req.userId })

  if (!step?.title || !technology || !roadmap_id) {
    logger.warn('Quiz', 'Missing required fields', { step, technology, roadmap_id })
    return res.status(400).json({ error: 'step, technology, and roadmap_id are required' })
  }

  const [rows] = await db.query(
    'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
    [roadmap_id, req.userId]
  )
  if (!rows.length) {
    logger.warn('Quiz', 'Forbidden — roadmap not owned by user', { roadmap_id, userId: req.userId })
    return res.status(403).json({ error: 'Forbidden' })
  }

  const prompt = `You are a coding quiz generator. Generate exactly 10 multiple choice questions to test knowledge about: "${step.title}" in the context of ${technology}.

Return ONLY valid JSON in this exact format:
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
- exactly 10 questions
- each question has exactly 4 options
- "correct" is the index (0,1,2,3) of the correct option
- questions should be practical and test real understanding
- vary difficulty from easy to hard
- Return ONLY JSON, no markdown`

  try {
    logger.debug('Quiz', `Calling Gemini for "${step.title}" in ${technology}`)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 2000,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    logger.debug('Quiz', `Gemini responded with status ${response.status}`)

    const aiData = await response.json()

    if (aiData.error) {
      logger.error('Quiz', 'Gemini API returned an error', null, { geminiError: aiData.error })
      throw new Error(aiData.error.message)
    }

    logger.debug('Quiz', 'Gemini usage', {
      finishReason: aiData.candidates?.[0]?.finishReason,
      tokenCount:   aiData.usageMetadata,
    })

    const text  = aiData.candidates[0].content.parts[0].text
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch (parseErr) {
      logger.error('Quiz', 'Failed to parse Gemini JSON', parseErr, { raw: clean.slice(0, 300) })
      throw new Error('Invalid JSON from Gemini: ' + parseErr.message)
    }

    logger.info('Quiz', `Generated ${parsed.questions?.length} questions for "${step.title}"`)
    res.json({ questions: parsed.questions })

  } catch (err) {
    logger.error('Quiz', 'Failed to generate quiz', err, { step: step.title, technology, roadmap_id, userId: req.userId })
    res.status(500).json({ error: 'Failed to generate quiz: ' + err.message })
  }
})

// ─── SAVE RESULT ──────────────────────────────────────────────────────────────

router.post('/result', auth, async (req, res) => {
  const { roadmap_id, step_id, score, total, passed } = req.body

  logger.debug('Quiz', 'Save result request', { roadmap_id, step_id, score, total, passed, userId: req.userId })

  if (roadmap_id == null || !step_id || score == null || total == null || passed == null) {
    logger.warn('Quiz', 'Missing fields for save result', req.body)
    return res.status(400).json({ error: 'roadmap_id, step_id, score, total, and passed are required' })
  }

  const [rows] = await db.query(
    'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
    [roadmap_id, req.userId]
  )
  if (!rows.length) {
    logger.warn('Quiz', 'Forbidden — roadmap not owned by user', { roadmap_id, userId: req.userId })
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    await db.query(
      `INSERT INTO quiz_results (user_id, roadmap_id, step_id, score, total, passed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, roadmap_id, step_id, score, total, passed ? 1 : 0]
    )
    logger.info('Quiz', `Result saved — step: ${step_id}, score: ${score}/${total}, passed: ${passed}`)
    res.json({ success: true })
  } catch (err) {
    logger.error('Quiz', 'Failed to save quiz result', err, { roadmap_id, step_id, userId: req.userId })
    res.status(500).json({ error: 'Failed to save result: ' + err.message })
  }
})

// ─── GET RESULTS ──────────────────────────────────────────────────────────────

router.get('/results/:roadmapId', auth, async (req, res) => {
  const { roadmapId } = req.params

  logger.debug('Quiz', 'Fetch results', { roadmapId, userId: req.userId })

  const [rows] = await db.query(
    'SELECT id FROM roadmaps WHERE id = ? AND user_id = ?',
    [roadmapId, req.userId]
  )
  if (!rows.length) {
    logger.warn('Quiz', 'Forbidden — roadmap not owned by user', { roadmapId, userId: req.userId })
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const [results] = await db.query(
      `SELECT step_id, score, total, passed, created_at
       FROM quiz_results
       WHERE roadmap_id = ? AND user_id = ?
       ORDER BY created_at DESC`,
      [roadmapId, req.userId]
    )
    logger.debug('Quiz', `Returning ${results.length} results for roadmap ${roadmapId}`)
    res.json(results)
  } catch (err) {
    logger.error('Quiz', 'Failed to fetch quiz results', err, { roadmapId, userId: req.userId })
    res.status(500).json({ error: 'Failed to fetch results: ' + err.message })
  }
})

module.exports = router;

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

// GET /api/quiz/analytics
// Returns overall stats + per-roadmap + per-step breakdown for the logged-in user
router.get('/analytics', auth, async (req, res) => {
  const userId = req.userId
  logger.debug('Analytics', 'Fetch analytics', { userId })

  try {
    // 1. Overall totals
    const [[totals]] = await db.query(
      `SELECT
         COUNT(*)                              AS total_attempts,
         SUM(passed = 1)                       AS total_passed,
         SUM(passed = 0)                       AS total_failed,
         ROUND(AVG(score / total * 100), 1)   AS avg_score_pct
       FROM quiz_results
       WHERE user_id = ?`,
      [userId]
    )

    // 2. Attempts over time (last 30 days, grouped by date)
    const [timeline] = await db.query(
      `SELECT
         DATE(created_at)  AS date,
         COUNT(*)          AS attempts,
         SUM(passed = 1)   AS passed
       FROM quiz_results
       WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [userId]
    )

    // 3. Per-roadmap breakdown
    const [byRoadmap] = await db.query(
      `SELECT
         r.id              AS roadmap_id,
         r.title           AS roadmap_title,
         r.technology,
         COUNT(qr.id)      AS attempts,
         SUM(qr.passed=1)  AS passed,
         ROUND(AVG(qr.score / qr.total * 100), 1) AS avg_score_pct
       FROM quiz_results qr
       JOIN roadmaps r ON r.id = qr.roadmap_id
       WHERE qr.user_id = ?
       GROUP BY r.id
       ORDER BY attempts DESC`,
      [userId]
    )

    // 4. Per-step breakdown (filtered by roadmap_id if provided)
    const roadmapFilter = req.query.roadmap_id
    const stepQuery = roadmapFilter
      ? `SELECT
           qr.step_id,
           COUNT(*)          AS attempts,
           SUM(qr.passed=1)  AS passed,
           MAX(qr.score)     AS best_score,
           ROUND(AVG(qr.score / qr.total * 100), 1) AS avg_score_pct,
           MAX(qr.created_at) AS last_attempt
         FROM quiz_results qr
         WHERE qr.user_id = ? AND qr.roadmap_id = ?
         GROUP BY qr.step_id
         ORDER BY last_attempt DESC`
      : `SELECT
           qr.step_id,
           r.title AS roadmap_title,
           COUNT(*)          AS attempts,
           SUM(qr.passed=1)  AS passed,
           MAX(qr.score)     AS best_score,
           ROUND(AVG(qr.score / qr.total * 100), 1) AS avg_score_pct,
           MAX(qr.created_at) AS last_attempt
         FROM quiz_results qr
         JOIN roadmaps r ON r.id = qr.roadmap_id
         WHERE qr.user_id = ?
         GROUP BY qr.step_id, qr.roadmap_id
         ORDER BY last_attempt DESC`

    const stepParams = roadmapFilter ? [userId, roadmapFilter] : [userId]
    const [byStep] = await db.query(stepQuery, stepParams)

    logger.info('Analytics', `Returning analytics for user ${userId}`)
    res.json({ totals, timeline, byRoadmap, byStep })

  } catch (err) {
    logger.error('Analytics', 'Failed to fetch analytics', err, { userId })
    res.status(500).json({ error: 'Failed to fetch analytics: ' + err.message })
  }
})