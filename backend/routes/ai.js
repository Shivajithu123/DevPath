const router = require('express').Router();
const auth   = require('../middleware/auth');

router.post('/generate', auth, async (req, res) => {
  try {
    const { technology } = req.body;
    if (!technology) return res.status(400).json({ error: 'technology is required' });

    const prompt = `You are an expert coding mentor. Create a comprehensive learning roadmap for: "${technology}"

Return ONLY valid JSON in this exact structure, nothing else:

{
  "title": "Learning ${technology}",
  "description": "A hands-on roadmap to master ${technology}",
  "levels": [
    {
      "id": "beginner",
      "label": "Beginner",
      "title": "Foundations",
      "steps": [
        {
          "id": "step-b-1",
          "title": "Topic Name",
          "description": "What this covers and why it matters (2-3 sentences)"
        }
      ],
      "projects": [
        {
          "id": "proj-b-1",
          "name": "Project Name",
          "description": "What to build and what skills it practices (2-3 sentences)",
          "tags": ["tag1", "tag2", "tag3"]
        }
      ]
    },
    {
      "id": "intermediate",
      "label": "Intermediate",
      "title": "Core Mastery",
      "steps": [],
      "projects": []
    },
    {
      "id": "advanced",
      "label": "Advanced",
      "title": "Expert Level",
      "steps": [],
      "projects": []
    }
  ]
}

Rules:
- Each level must have 4-6 steps and 2-3 projects
- Steps should be specific, actionable topics
- Projects must be real, buildable applications
- Tags should be relevant skills/concepts
- All IDs must be unique across all levels (use prefix b=beginner, i=intermediate, a=advanced)
- Return ONLY the JSON object, no markdown fences, no explanation`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await response.json();
    if (aiData.error) throw new Error(aiData.error.message);

    const text = aiData.content[0].text.trim().replace(/```json\n?|```\n?/g, '');
    const roadmap = JSON.parse(text);

    res.json(roadmap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate roadmap: ' + err.message });
  }
});

module.exports = router;
