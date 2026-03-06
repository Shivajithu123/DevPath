import { useState } from 'react'

const TYPE_CONFIG = {
  documentation: {
    label: 'Official Docs',
    icon: '📄',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
  },
  github: {
    label: 'GitHub Repos',
    icon: '⚙️',
    color: 'text-accent3',
    bg: 'bg-accent3/10',
    border: 'border-accent3/20',
  },
  article: {
    label: 'Articles & Blogs',
    icon: '📝',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
}

export default function ResourcesModal({ step, technology, onClose }) {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const fetchResources = async () => {
    setLoading(true)
    setError('')

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
      const response = await fetch(
         `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
          })
        }
      )

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      const text = data.candidates[0].content.parts[0].text
      const clean = text.replace(/```json\n?|```\n?/g, '').trim()
      const parsed = JSON.parse(clean)

      setResources(parsed.resources)
      setLoaded(true)
    } catch (err) {
      console.error(err)
      setError('Failed to load resources. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount
  useState(() => { fetchResources() }, [])

  const tabs = ['all', 'documentation', 'github', 'article']
  const filtered = activeTab === 'all' ? resources : resources.filter(r => r.type === activeTab)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-fadeUp">

        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Learning Resources</div>
            <h2 className="font-syne font-extrabold text-xl leading-snug">{step.title}</h2>
            <p className="text-muted text-xs mt-1">{technology} · AI-curated resources</p>
          </div>
          <button onClick={onClose}
            className="text-muted hover:text-white transition-colors text-xl flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface2">
            ✕
          </button>
        </div>

        {/* Tabs */}
        {loaded && (
          <div className="px-6 pt-4 flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all capitalize
                  ${activeTab === tab
                    ? 'bg-accent text-white border-accent'
                    : 'text-muted border-border hover:border-accent hover:text-accent'}`}>
                {tab === 'all' ? `All (${resources.length})` :
                 tab === 'documentation' ? `📄 Docs (${resources.filter(r=>r.type===tab).length})` :
                 tab === 'github' ? `⚙️ GitHub (${resources.filter(r=>r.type===tab).length})` :
                 `📝 Articles (${resources.filter(r=>r.type===tab).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin-slow" />
              <div className="font-mono text-xs text-muted tracking-wider">Curating resources...</div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">😕</div>
              <p className="text-muted text-sm mb-4">{error}</p>
              <button onClick={fetchResources}
                className="bg-accent hover:opacity-90 text-white font-syne font-bold px-6 py-2.5 rounded-xl text-sm transition-opacity">
                Try Again
              </button>
            </div>
          )}

          {/* Resources list */}
          {!loading && !error && filtered.map((resource, i) => {
            const config = TYPE_CONFIG[resource.type] || TYPE_CONFIG.article
            return (
              <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer"
                className="block bg-surface2 border border-border hover:border-accent rounded-2xl p-4 transition-all group">
                <div className="flex items-start gap-3">
                  {/* Type badge */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center text-base`}>
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-syne font-bold text-sm leading-snug group-hover:text-accent transition-colors line-clamp-1">
                        {resource.title}
                      </h3>
                      <span className="text-muted text-lg group-hover:text-accent transition-colors flex-shrink-0">↗</span>
                    </div>

                    <p className="text-muted text-xs leading-relaxed mb-2 line-clamp-2">
                      {resource.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs ${config.color} ${config.bg} border ${config.border} px-2 py-0.5 rounded-full`}>
                        {config.label}
                      </span>
                      <span className="text-muted text-xs truncate">
                        {resource.source}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            )
          })}

          {/* Empty state */}
          {!loading && !error && loaded && filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-muted text-sm">No resources found for this filter.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {loaded && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-muted text-xs font-mono">Links open in a new tab</p>
            <button onClick={fetchResources}
              className="text-xs font-mono text-muted hover:text-accent transition-colors border border-border hover:border-accent px-3 py-1.5 rounded-lg">
              ↻ Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  )
}