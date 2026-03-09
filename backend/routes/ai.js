const router = require('express').Router();
const auth   = require('../middleware/auth');

router.post('/generate', auth, async (req, res) => {
  try {
    const { technology } = req.body;
    if (!technology) return res.status(400).json({ error: 'technology is required' });

    // The prompt remains largely the same, but we can simplify the JSON instructions
    // because Gemini's "JSON Mode" is very reliable.
    const prompt = `You are an expert coding mentor. Create a comprehensive learning roadmap for: "${technology}"

Return valid JSON in this exact structure:
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
    { "id": "intermediate", "label": "Intermediate", "title": "Core Mastery", "steps": [], "projects": [] },
    { "id": "advanced", "label": "Advanced", "title": "Expert Level", "steps": [], "projects": [] }
  ]
}

Rules:
- Each level must have 4-6 steps and 2-3 projects
- All IDs must be unique (use prefix b=beginner, i=intermediate, a=advanced)`;

    // Gemini API call using standard fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            // This forces the model to output raw JSON without markdown backticks
            response_mime_type: "application/json",
            temperature: 0.7,
            maxOutputTokens: 2400
          }
        })
      }
    );

    const aiData = await response.json();

    // Check for API errors
    if (aiData.error) {
      throw new Error(aiData.error.message);
    }

    // Extraction: Gemini's structure is candidates[0] -> content -> parts[0] -> text
    const text = aiData.candidates[0].content.parts[0].text;
    const roadmap = JSON.parse(text);

    res.json(roadmap);
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).json({ error: 'Failed to generate roadmap: ' + err.message });
  }
});

module.exports = router;