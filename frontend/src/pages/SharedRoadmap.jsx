import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function SharedRoadmap() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/roadmaps/shared/${token}`)
      .then(({ data }) => setRoadmap(data))
      .catch(() => setError('This roadmap is no longer shared or does not exist.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin-slow" /></div>

  if (error) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center p-6">
      <div className="text-5xl mb-4">🔒</div>
      <h2 className="font-syne font-bold text-2xl mb-2">Roadmap Not Found</h2>
      <p className="text-muted mb-6">{error}</p>
      <button onClick={() => navigate('/')} className="bg-accent text-white font-syne font-bold px-6 py-3 rounded-xl">Go to DevPath</button>
    </div>
  )

  const rdata = roadmap.data
  const allItems = rdata.levels?.flatMap(l => [...(l.steps||[]).map(s=>s.id), ...(l.projects||[]).map(p=>p.id)]) || []
  const doneCount = (roadmap.progress || []).filter(p => p.completed).length
  const pct = allItems.length ? Math.round((doneCount / allItems.length) * 100) : 0

  return (
    <div className="min-h-screen bg-bg pb-20" style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="max-w-4xl mx-auto px-5">
        <div className="py-10 border-b border-border mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="font-mono text-xs text-accent3 bg-accent3/10 border border-accent3/20 px-4 py-1.5 rounded-full">
              Shared Roadmap · by {roadmap.author_name}
            </div>
            <button onClick={() => navigate('/register')} className="bg-accent text-white font-syne font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
              Create Your Own →
            </button>
          </div>
          <h1 className="font-syne font-extrabold text-4xl mb-6">{rdata.title}</h1>
          <div className="max-w-xs">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>Author Progress</span>
              <span className="text-green-400">{pct}%</span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#7c6aff,#6affd4)' }} />
            </div>
          </div>
        </div>

        {rdata.levels?.map((level, li) => (
          <div key={level.id} className="mb-14 animate-fadeUp" style={{ animationDelay:`${li*0.1}s` }}>
            <div className="flex items-center gap-4 mb-8">
              <span className={`font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded-full border
                ${level.id==='beginner'?'text-accent3 bg-accent3/10 border-accent3/20':
                  level.id==='intermediate'?'text-yellow-400 bg-yellow-400/10 border-yellow-400/20':
                  'text-accent2 bg-accent2/10 border-accent2/20'}`}>
                {level.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="font-syne font-bold text-xl">{level.title}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {level.steps?.map((step, si) => {
                const done = roadmap.progress?.find(p=>p.item_id===step.id)?.completed
                return (
                  <div key={step.id} className={`bg-surface border rounded-2xl p-5 ${done?'border-green-500/40':'border-border'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono text-xs text-muted">STEP {String(si+1).padStart(2,'0')}</span>
                      {done && <span className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-white text-xs">✓</span>}
                    </div>
                    <div className="font-syne font-bold text-base mb-2">{step.title}</div>
                    <div className="text-muted text-sm leading-relaxed">{step.description}</div>
                  </div>
                )
              })}
            </div>
            <div>
              <div className="font-syne font-bold text-xs tracking-widest text-accent uppercase flex items-center gap-2 mb-4"><span>⬡</span> Projects to Build</div>
              <div className="space-y-3">
                {level.projects?.map(proj => {
                  const done = roadmap.progress?.find(p=>p.item_id===proj.id)?.completed
                  return (
                    <div key={proj.id} className={`bg-surface border rounded-2xl p-5 flex gap-4 ${done?'border-green-500/30':'border-border'}`}>
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 text-sm mt-0.5 ${done?'bg-green-400 border-green-400 text-white':'border-border'}`}>{done?'✓':'○'}</div>
                      <div className="flex-1">
                        <div className="font-syne font-bold text-base mb-1.5">{proj.name}</div>
                        <div className="text-muted text-sm leading-relaxed mb-3">{proj.description}</div>
                        <div className="flex gap-2 flex-wrap">{proj.tags?.map(t=><span key={t} className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">{t}</span>)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
