import ResourcesModal from '../components/ResourcesModalnew'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import QuizModal from '../components/QuizModal'


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
  const [quizStep, setQuizStep] = useState(null)
  const [quizPassed, setQuizPassed] = useState({})
  const [resourceStep, setResourceStep] = useState(null)
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
    await api.put(`/progress/${id}/items/${itemId}`, {
      completed: newVal,
      item_type: itemType,
      notes: notes[itemId] || ''
    })

    if (newVal && itemType === 'step') {
      const allSteps = roadmap.data.levels?.flatMap(l => l.steps || [])
      const step = allSteps.find(s => s.id === itemId)
      if (step) setQuizStep(step)
    }
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
    const { default: html2canvas } = await import('html2canvas')

    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 794px; background: #ffffff; padding: 48px;
      font-family: Arial, sans-serif; color: #0a0a0f;
    `

    const rdata = roadmap.data

    container.innerHTML = `
      <div style="margin-bottom:32px; border-bottom: 3px solid #7c6aff; padding-bottom: 24px;">
        <div style="font-size:11px; letter-spacing:3px; color:#7c6aff; text-transform:uppercase; margin-bottom:8px;">DevPath · Personalized Roadmap</div>
        <h1 style="font-size:32px; font-weight:900; margin:0 0 8px 0; color:#0a0a0f;">${rdata.title}</h1>
        <p style="font-size:13px; color:#6b6b8a; margin:0 0 16px 0;">${rdata.description || ''}</p>
        <div style="background:#f4f3ff; border-radius:8px; padding:10px 16px; display:inline-block;">
          <span style="font-size:12px; color:#7c6aff; font-weight:bold;">
            Progress: ${doneCount}/${allItems.length} items completed (${pct}%)
          </span>
        </div>
      </div>

      ${rdata.levels?.map(level => `
        <div style="margin-bottom:36px;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
            <span style="
              font-size:10px; letter-spacing:2px; text-transform:uppercase; font-weight:700;
              padding:5px 14px; border-radius:100px;
              ${level.id === 'beginner' ? 'background:#e8fef8; color:#059669; border:1px solid #a7f3d0;' :
                level.id === 'intermediate' ? 'background:#fffbe8; color:#d97706; border:1px solid #fde68a;' :
                'background:#fff1f1; color:#dc2626; border:1px solid #fecaca;'}
            ">${level.label}</span>
            <div style="flex:1; height:1px; background:#e5e7eb;"></div>
            <span style="font-size:18px; font-weight:800; color:#0a0a0f;">${level.title}</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            ${level.steps?.map((step, si) => `
              <div style="
                border: 1.5px solid ${progress[step.id] ? '#86efac' : '#e5e7eb'};
                background: ${progress[step.id] ? '#f0fdf4' : '#fafafa'};
                border-radius:12px; padding:16px;
              ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span style="font-size:10px; color:#9ca3af; letter-spacing:1px;">STEP ${String(si+1).padStart(2,'0')}</span>
                  <span style="
                    width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center;
                    font-size:11px; font-weight:bold;
                    background:${progress[step.id] ? '#4ade80' : '#e5e7eb'};
                    color:${progress[step.id] ? 'white' : '#9ca3af'};
                  ">${progress[step.id] ? '✓' : ''}</span>
                </div>
                <div style="font-size:13px; font-weight:700; margin-bottom:6px; color:#0a0a0f;">${step.title}</div>
                <div style="font-size:11px; color:#6b7280; line-height:1.6;">${step.description}</div>
                ${notes[step.id] ? `<div style="margin-top:8px; padding:8px; background:#f0f0ff; border-radius:6px; font-size:10px; color:#7c6aff;">📝 ${notes[step.id]}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="margin-top:8px;">
            <div style="font-size:11px; font-weight:700; color:#7c6aff; text-transform:uppercase; letter-spacing:2px; margin-bottom:12px;">⬡ Projects to Build</div>
            ${level.projects?.map(proj => `
              <div style="
                border: 1.5px solid ${progress[proj.id] ? '#86efac' : '#e5e7eb'};
                background: ${progress[proj.id] ? '#f0fdf4' : '#fafafa'};
                border-radius:12px; padding:16px; margin-bottom:10px;
                display:flex; gap:14px; align-items:flex-start;
              ">
                <div style="
                  width:28px; height:28px; border-radius:8px; flex-shrink:0;
                  display:flex; align-items:center; justify-content:center; font-size:14px;
                  background:${progress[proj.id] ? '#4ade80' : '#e5e7eb'};
                  color:${progress[proj.id] ? 'white' : '#9ca3af'};
                  font-weight:bold;
                ">${progress[proj.id] ? '✓' : '○'}</div>
                <div style="flex:1;">
                  <div style="font-size:14px; font-weight:700; margin-bottom:5px; color:#0a0a0f;">${proj.name}</div>
                  <div style="font-size:11px; color:#6b7280; line-height:1.6; margin-bottom:8px;">${proj.description}</div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${proj.tags?.map(t => `
                      <span style="font-size:10px; color:#7c6aff; background:#ede9fe; border:1px solid #c4b5fd; padding:2px 10px; border-radius:100px;">${t}</span>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <div style="margin-top:32px; border-top:1px solid #e5e7eb; padding-top:16px; text-align:center;">
        <span style="font-size:11px; color:#9ca3af;">Generated by DevPath · Escape Tutorial Hell</span>
      </div>
    `

    document.body.appendChild(container)

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${roadmap.technology}-roadmap.pdf`)
    } finally {
      document.body.removeChild(container)
    }
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

                  {/* Quiz Passed Badge */}
                  {quizPassed[step.id] && (
                    <div className="mb-3 inline-flex items-center gap-1 text-xs font-mono text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">
                      🧠 Quiz Passed
                    </div>
                  )}

                  {/* Notes */}
                  <textarea value={notes[step.id]||''} onChange={e => saveNote(step.id, e.target.value)}
                    placeholder="Add notes, resources, links..."
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-xs text-[#e8e8f0] placeholder-muted outline-none focus:border-accent transition-colors resize-none mb-3"
                    rows={2} />

                  {/* Resources Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setResourceStep(step) }}
                    className="w-full flex items-center justify-center gap-2 border border-border hover:border-accent text-muted hover:text-accent text-xs font-mono py-2 rounded-xl transition-all">
                    📚 View Resources
                  </button>
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

      {/* Quiz Modal */}
      {quizStep && (
        <QuizModal
          step={quizStep}
          technology={roadmap.technology}
          onClose={() => setQuizStep(null)}
          onPass={() => {
            setQuizPassed(p => ({ ...p, [quizStep.id]: true }))
            setQuizStep(null)
          }}
        />
      )}

      {/* Resources Modal */}
      {resourceStep && (
        <ResourcesModal
          step={resourceStep}
          technology={roadmap.technology}
          onClose={() => setResourceStep(null)}
        />
      )}

    </div>
  )
}