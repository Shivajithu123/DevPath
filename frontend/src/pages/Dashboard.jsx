import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'


export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [renaming, setRenaming] = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchRoadmaps() }, [])

  const fetchRoadmaps = async () => {
    try {
      const { data } = await api.get('/roadmaps')
      setRoadmaps(data)
    } catch(e) {}
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    await api.delete(`/roadmaps/${id}`)
    setRoadmaps(r => r.filter(x => x.id !== id))
    setDeleting(null)
  }

  const handleRename = async (id) => {
    if (!renameVal.trim()) return
    await api.patch(`/roadmaps/${id}`, { title: renameVal })
    setRoadmaps(r => r.map(x => x.id === id ? { ...x, title: renameVal } : x))
    setRenaming(null)
  }

  const pct = r => r.total_count ? Math.round((r.completed_count / r.total_count) * 100) : 0

  return (
    <div className="min-h-screen bg-bg" style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="font-syne font-bold text-accent tracking-[4px] text-sm uppercase">DevPath</div>
        <div className="flex items-center gap-4">
          <span className="text-muted text-sm hidden sm:block">Hey, {user?.name} 👋</span>
          <button onClick={logout} className="text-muted text-sm hover:text-white transition-colors font-mono">Logout</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Your Roadmaps</div>
            <h1 className="font-syne font-extrabold text-4xl">Learning Dashboard</h1>
          </div>
          <button onClick={() => navigate('/generate')}
            className="bg-accent hover:opacity-90 text-white font-syne font-bold px-6 py-3 rounded-xl transition-opacity flex items-center gap-2">
            <span>+ New Roadmap</span>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin-slow" /></div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center py-24 animate-fadeUp">
            <div className="text-6xl mb-6">🗺️</div>
            <h2 className="font-syne font-bold text-2xl mb-3">No roadmaps yet</h2>
            <p className="text-muted mb-8">Generate your first AI roadmap and start building real skills</p>
            <button onClick={() => navigate('/generate')}
              className="bg-accent text-white font-syne font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Generate Your First Roadmap
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {roadmaps.map((r, i) => (
              <div key={r.id} className="bg-surface border border-border rounded-2xl p-6 hover:border-accent transition-colors animate-fadeUp relative group"
                style={{ animationDelay: `${i * 0.06}s` }}>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setRenaming(r.id); setRenameVal(r.title) }}
                    className="text-muted hover:text-white text-xs font-mono bg-surface2 border border-border px-2 py-1 rounded-lg transition-colors">✏️</button>
                  <button onClick={() => setDeleting(r.id)}
                    className="text-muted hover:text-accent2 text-xs font-mono bg-surface2 border border-border px-2 py-1 rounded-lg transition-colors">🗑️</button>
                </div>

                {/* Rename input */}
                {renaming === r.id ? (
                  <div className="mb-4 flex gap-2">
                    <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter') handleRename(r.id); if(e.key==='Escape') setRenaming(null) }}
                      className="flex-1 bg-surface2 border border-accent rounded-lg px-3 py-1.5 text-sm outline-none" />
                    <button onClick={() => handleRename(r.id)} className="text-accent text-xs font-mono">Save</button>
                  </div>
                ) : (
                  <h3 className="font-syne font-bold text-lg mb-1 pr-16 leading-tight">{r.title}</h3>
                )}

                <div className="font-mono text-xs text-accent mb-4">{r.technology}</div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted mb-2">
                    <span>Progress</span>
                    <span className="text-green-400">{pct(r)}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct(r)}%`, background: 'linear-gradient(90deg, #7c6aff, #6affd4)' }} />
                  </div>
                </div>

                <div className="text-xs text-muted font-mono mb-5">
                  {r.completed_count || 0}/{r.total_count || 0} items · {new Date(r.updated_at).toLocaleDateString()}
                </div>

                <button onClick={() => navigate(`/roadmap/${r.id}`)}
                  className="w-full bg-surface2 hover:bg-accent/10 border border-border hover:border-accent text-sm font-syne font-bold py-2.5 rounded-xl transition-all">
                  Continue →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Quiz Analytics ── */}
        {!loading && roadmaps.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full bg-accent" />
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase">Quiz Performance</div>
                <h2 className="font-syne font-extrabold text-2xl">Analytics</h2>
              </div>
            </div>
            
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleting(null)}>
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-syne font-bold text-xl mb-2">Delete Roadmap?</h3>
            <p className="text-muted text-sm mb-6">This action cannot be undone. All progress will be lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-syne font-bold hover:border-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 bg-accent2/20 border border-accent2/40 text-accent2 py-2.5 rounded-xl text-sm font-syne font-bold hover:bg-accent2/30 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}