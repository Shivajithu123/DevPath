import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { roadmapAPI } from '../api/client'
import styles from './Roadmap.module.css'

const LEVEL_COLORS = {
  beginner:     { badge: styles.badgeBeginner,     label: 'Beginner' },
  intermediate: { badge: styles.badgeIntermediate, label: 'Intermediate' },
  advanced:     { badge: styles.badgeAdvanced,     label: 'Advanced' },
}

export default function Roadmap() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const printRef    = useRef()

  const [roadmap,   setRoadmap]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [completed, setCompleted] = useState({}) // { itemId: bool }
  const [notes,     setNotes]     = useState({}) // { stepId: string }
  const [shareInfo, setShareInfo] = useState({ token: null, copying: false })
  const [saving,    setSaving]    = useState({})

  useEffect(() => {
    roadmapAPI.get(id)
      .then(res => {
        const r = res.data
        setRoadmap(r)
        setShareInfo({ token: r.share_token, copying: false })
        // hydrate progress
        const c = {}, n = {}
        r.progress?.forEach(p => {
          c[p.item_id] = p.completed
          if (p.note) n[p.item_id] = p.note
        })
        setCompleted(c)
        setNotes(n)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const getTotals = () => {
    if (!roadmap) return { total: 0, done: 0 }
    let total = 0, done = 0
    roadmap.data.levels.forEach(l => {
      l.steps.forEach(s => { total++; if (completed[s.id]) done++ })
      l.projects.forEach(p => { total++; if (completed[p.id]) done++ })
    })
    return { total, done }
  }

  const { total, done } = getTotals()
  const pct = total ? Math.round((done / total) * 100) : 0

  const saveProgress = useCallback(async (itemId, itemType, isCompleted, note) => {
    setSaving(prev => ({ ...prev, [itemId]: true }))
    try {
      await roadmapAPI.saveProgress(id, {
        item_id:   itemId,
        item_type: itemType,
        completed: isCompleted,
        note:      note ?? notes[itemId] ?? null,
      })
    } finally {
      setSaving(prev => ({ ...prev, [itemId]: false }))
    }
  }, [id, notes])

  const toggleItem = (itemId, itemType) => {
    const next = !completed[itemId]
    setCompleted(prev => ({ ...prev, [itemId]: next }))
    saveProgress(itemId, itemType, next)
  }

  const updateNote = (stepId, value) => {
    setNotes(prev => ({ ...prev, [stepId]: value }))
  }

  const saveNote = (stepId) => {
    saveProgress(stepId, 'step', completed[stepId] || false, notes[stepId])
  }

  const handleShare = async () => {
    const res = await roadmapAPI.toggleShare(id)
    const newToken = res.data.share_token
    setShareInfo({ token: newToken, copying: false })
    if (newToken) {
      const url = `${window.location.origin}/shared/${newToken}`
      navigator.clipboard.writeText(url)
      setShareInfo({ token: newToken, copying: true })
      setTimeout(() => setShareInfo(prev => ({ ...prev, copying: false })), 2000)
    }
  }

  const exportPDF = async () => {
    const { default: jsPDF }        = await import('jspdf')
    const { default: html2canvas }  = await import('html2canvas')
    const canvas = await html2canvas(printRef.current, { backgroundColor: '#0a0a0f', scale: 2 })
    const img    = canvas.toDataURL('image/png')
    const pdf    = new jsPDF('p', 'mm', 'a4')
    const ratio  = canvas.width / canvas.height
    const w      = 210
    const h      = w / ratio
    let y = 0
    while (y < canvas.height) {
      if (y > 0) pdf.addPage()
      pdf.addImage(img, 'PNG', 0, -(y / canvas.height) * h, w, h)
      y += canvas.height * (297 / h)
    }
    pdf.save(`${roadmap.title}.pdf`)
  }

  if (loading) return <div className={styles.loading}><div className={styles.ring}></div></div>
  if (!roadmap) return null

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <button className={styles.back} onClick={() => navigate('/')}>← Dashboard</button>
        <span className={styles.navLogo}>DevPath</span>
        <div className={styles.navActions}>
          <button className={styles.actionBtn} onClick={handleShare}>
            {shareInfo.copying ? '✓ Copied!' : shareInfo.token ? '🔗 Shared' : '🔒 Share'}
          </button>
          <button className={styles.actionBtn} onClick={exportPDF}>⬇ Export PDF</button>
        </div>
      </nav>

      <div ref={printRef}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.tech}>{roadmap.technology}</div>
            <h1 className={styles.title}>{roadmap.title}</h1>
            <div className={styles.progressWrap}>
              <div className={styles.progressLabel}>
                <span>Progress</span>
                <span className={styles.pct}>{pct}% — {done} of {total} items</span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.levels}>
          {roadmap.data.levels.map((level, li) => {
            const color = LEVEL_COLORS[level.id] || LEVEL_COLORS.beginner
            return (
              <div key={level.id} className={styles.levelSection}>
                <div className={styles.levelHeader}>
                  <span className={`${styles.badge} ${color.badge}`}>{level.label}</span>
                  <div className={styles.levelLine} />
                  <span className={styles.levelTitle}>{level.title}</span>
                </div>

                {/* Steps */}
                <div className={styles.stepsGrid}>
                  {level.steps.map((step, si) => (
                    <div key={step.id} className={`${styles.stepCard} ${completed[step.id] ? styles.done : ''}`}>
                      <div className={styles.stepTop}>
                        <span className={styles.stepNum}>STEP {String(si + 1).padStart(2, '0')}</span>
                        <button
                          className={`${styles.check} ${completed[step.id] ? styles.checked : ''}`}
                          onClick={() => toggleItem(step.id, 'step')}
                          title={completed[step.id] ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {completed[step.id] && '✓'}
                        </button>
                      </div>
                      <div className={styles.stepTitle}>{step.title}</div>
                      <div className={styles.stepDesc}>{step.description}</div>
                      <div className={styles.notesWrap}>
                        <textarea
                          className={styles.noteInput}
                          placeholder="Add notes, links, resources..."
                          value={notes[step.id] || ''}
                          onChange={e => updateNote(step.id, e.target.value)}
                          onBlur={() => saveNote(step.id)}
                        />
                        {saving[step.id] && <span className={styles.saving}>saving…</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Projects */}
                <div className={styles.projectsSection}>
                  <div className={styles.projectsTitle}>⬡ Projects to Build</div>
                  {level.projects.map(proj => (
                    <div key={proj.id} className={`${styles.projectCard} ${completed[proj.id] ? styles.projDone : ''}`}>
                      <button
                        className={`${styles.projCheck} ${completed[proj.id] ? styles.projChecked : ''}`}
                        onClick={() => toggleItem(proj.id, 'project')}
                      >
                        {completed[proj.id] ? '✓' : '○'}
                      </button>
                      <div className={styles.projInfo}>
                        <div className={styles.projName}>{proj.name}</div>
                        <div className={styles.projDesc}>{proj.description}</div>
                        <div className={styles.projTags}>
                          {proj.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
