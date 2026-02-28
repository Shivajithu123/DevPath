import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function RoadmapView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [progress, setProgress] = useState({})
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const saveTimeout = useRef({})

  useEffect(() => {
    api.get(`/roadmaps/${id}`).then(({ data }) => {
      setRoadmap(data)
      const prog = {}, nts = {}
      data.progress?.forEach(p => {
        prog[p.item_id] = p.completed
        if (p.notes) nts[p.item_id] = p.notes
      })
      setProgress(prog)
      setNotes(nts)
      if (data.share_token) setShareLink(`${window.location.origin}/shared/${data.share_token}`)
    }).finally(() => setLoading(false))
  }, [id])

  const toggleItem = async (itemId, itemType) => {
    const newVal = !progress[itemId]
    setProgress(p => ({ ...p, [itemId]: newVal }))
    await api.put(`/progress/${id}/items/${itemId}`, { completed: newVal, item_type: itemType, notes: notes[itemId] || '' })
  }

  const saveNote = useCallback((itemId, value) => {
    setNotes(n => ({ ...n, [itemId]: value }))
    clearTimeout(saveTimeout.current[itemId])
    saveTimeout.current[itemId] = setTimeout(() => {
      api.put(`/progress/${id}/items/${itemId}`, { completed: !!progress[itemId], item_type: 'step', notes: value })
    }, 1000)
  }, [id, progress])

  const handleShare = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    setSharing(true)
    try {
      const { data } = await api.post(`/roadmaps/${id}/share`)
      const link = `${window.location.origin}/shared/${data.share_token}`
      setShareLink(link)
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch(e) {}
    setSharing(false)
  }

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const data = roadmap.data
    let y = 20

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(data.title, 20, y); y += 12

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(data.description || '', 20, y); y += 16

    data.levels?.forEach(level => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(0)
      doc.text(`${level.label}: ${level.title}`, 20, y); y += 10

      level.steps?.forEach((step, si) => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(30)
        const done = progress[step.id]
        doc.text(`${done ? '✓' : '○'} Step ${si+1}: ${step.title}`, 25, y); y += 7
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80)
        const lines = doc.splitTextToSize(step.description, 160)
        doc.text(lines, 30, y); y += lines.length * 5 + 4
      })

      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(60, 40, 180)
      doc.text('Projects:', 25, y); y += 7

      level.projects?.forEach(proj => {
        if (y > 260) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(30)
        doc.text(`⬡ ${proj.name}`, 30, y); y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80)
        const lines = doc.splitTextToSize(proj.description, 155)
        doc.text(lines, 35, y); y += lines.length * 5 + 4
      })
      y += 6
    })

    doc.save(`${roadmap.technology}-roadmap.pdf`)
  }

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin-slow" /></div>
  if (!roadmap) return <div className="min-h-screen bg-bg flex items-center justify-center text-muted">Roadmap not found</div>

  const rdata = roadmap.data
  const allItems = rdata.levels?.flatMap(l => [...(l.steps||[]).map(s=>s.id), ...(l.projects||[]).map(p=>p.id)]) || []
  const doneCount = allItems.filter(id => progress[id]).length
  const pct = allItems.length ? Math.round((doneCount / allItems.length) * 100) : 0

  return (
    <div className="min-h-screen bg-bg pb-20" style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="max-w-4xl mx-auto px-5">
        {/* Header */}
        <div className="py-10 border-b border-border mb-12 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1">
            <button onClick={() => navigate('/')} className="text-muted font-mono text-xs border border-border px-3 py-1.5 rounded-lg hover:border-muted transition-colors mb-6">← Dashboard</button>
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Personalized Roadmap</div>
            <h1 className="font-syne font-extrabold text-4xl mb-6">{rdata.title}</h1>
            <div className="max-w-xs">
              <div className="flex justify-between text-xs text-muted mb-2">
                <span>Overall Progress</span>
                <span className="text-green-400">{pct}% · {doneCount}/{allItems.length}</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background:'linear-gradient(90deg,#7c6aff,#6affd4)' }} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleShare} disabled={sharing}
              className="border border-border hover:border-accent text-sm font-syne font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              {copied ? '✓ Copied!' : shareLink ? '🔗 Copy Link' : '🔗 Share'}
            </button>
            <button onClick={exportPDF}
              className="border border-border hover:border-accent text-sm font-syne font-bold px-4 py-2.5 rounded-xl transition-colors">
              ↓ Export PDF
            </button>
          </div>
        </div>

        {/* Levels */}
        {rdata.levels?.map((level, li) => (
          <div key={level.id} className="mb-14 animate-fadeUp" style={{ animationDelay:`${li*0.1}s` }}>
            <div className="flex items-center gap-4 mb-8">
              <span className={`font-mono text-xs tracking-widest uppercase px-4 py-1.5 rounded-full border whitespace-nowrap
                ${level.id==='beginner'?'text-accent3 bg-accent3/10 border-accent3/20':
                  level.id==='intermediate'?'text-yellow-400 bg-yellow-400/10 border-yellow-400/20':
                  'text-accent2 bg-accent2/10 border-accent2/20'}`}>
                {level.label}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="font-syne font-bold text-xl">{level.title}</span>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {level.steps?.map((step, si) => (
                <div key={step.id} className={`bg-surface border rounded-2xl p-5 transition-all ${progress[step.id]?'border-green-500/40 bg-green-500/[0.03]':'border-border hover:border-accent'}`}>
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <span className="font-mono text-xs text-muted">STEP {String(si+1).padStart(2,'0')}</span>
                    <button onClick={() => toggleItem(step.id, 'step')}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all text-xs
                        ${progress[step.id]?'bg-green-400 border-green-400 text-white':'border-border hover:border-accent'}`}>
                      {progress[step.id] ? '✓' : ''}
                    </button>
                  </div>
                  <div className="font-syne font-bold text-base mb-2">{step.title}</div>
                  <div className="text-muted text-sm leading-relaxed mb-4">{step.description}</div>
                  <textarea value={notes[step.id]||''} onChange={e => saveNote(step.id, e.target.value)}
                    placeholder="Add notes, resources, links..."
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs text-[#e8e8f0] placeholder-muted outline-none focus:border-accent transition-colors resize-none"
                    rows={2} />
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="mb-2">
              <div className="font-syne font-bold text-xs tracking-widest text-accent uppercase flex items-center gap-2 mb-4">
                <span>⬡</span> Projects to Build
              </div>
              <div className="space-y-3">
                {level.projects?.map(proj => (
                  <div key={proj.id} className={`bg-surface border rounded-2xl p-5 flex gap-4 transition-all ${progress[proj.id]?'border-green-500/30 bg-green-500/[0.02]':'border-border hover:border-accent/50'}`}>
                    <button onClick={() => toggleItem(proj.id, 'project')}
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 text-sm transition-all mt-0.5
                        ${progress[proj.id]?'bg-green-400 border-green-400 text-white':'border-border hover:border-accent'}`}>
                      {progress[proj.id] ? '✓' : '○'}
                    </button>
                    <div className="flex-1">
                      <div className="font-syne font-bold text-base mb-1.5">{proj.name}</div>
                      <div className="text-muted text-sm leading-relaxed mb-3">{proj.description}</div>
                      <div className="flex gap-2 flex-wrap">
                        {proj.tags?.map(t => (
                          <span key={t} className="font-mono text-xs text-accent bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
