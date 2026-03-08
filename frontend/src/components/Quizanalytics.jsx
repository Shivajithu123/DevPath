import { useState, useEffect, useRef } from 'react'
import { quizAPI, roadmapAPI } from '../api/client'

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = '#7c6aff', height = 40 }) {
  if (!data?.length) return null
  const w = 200, h = height
  const max = Math.max(...data.map(d => d.attempts), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w
    const y = h - (d.attempts / max) * (h - 6) - 3
    return `${x},${y}`
  }).join(' ')
  const filled = `${pts} ${w},${h} 0,${h}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={filled} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ passed, failed, size = 120 }) {
  const total = passed + failed || 1
  const passPct = passed / total
  const r = 44, cx = 60, cy = 60
  const circ = 2 * Math.PI * r
  const passArc = circ * passPct
  const failArc = circ * (1 - passPct)

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a2a3d" strokeWidth="12" />
      {/* Failed arc (base) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff6a6a" strokeWidth="12"
        strokeDasharray={`${failArc} ${circ}`}
        strokeDashoffset={-passArc}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      {/* Passed arc */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#6affd4" strokeWidth="12"
        strokeDasharray={`${passArc} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#e8e8f0" fontSize="16" fontWeight="bold" fontFamily="Syne">
        {Math.round(passPct * 100)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b6b8a" fontSize="9" fontFamily="DM Mono">
        PASS RATE
      </text>
    </svg>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return <div className="text-muted text-xs font-mono text-center py-8">No data yet</div>
  const max = Math.max(...data.map(d => d.attempts), 1)

  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.slice(-20).map((d, i) => {
        const heightPct = (d.attempts / max) * 100
        const passPct = d.passed / (d.attempts || 1)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="text-accent3">{d.attempts} attempt{d.attempts !== 1 ? 's' : ''}</div>
              <div className="text-green-400">{d.passed} passed</div>
              <div className="text-muted">{d.date}</div>
            </div>
            <div className="w-full rounded-t-sm overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(heightPct, 4)}%` }}>
              {/* Pass portion */}
              <div className="w-full rounded-t-sm" style={{
                height: `${passPct * 100}%`,
                background: 'linear-gradient(180deg, #6affd4, #4ae8b8)',
                minHeight: d.passed > 0 ? 3 : 0
              }} />
              {/* Fail portion */}
              <div className="w-full" style={{
                height: `${(1 - passPct) * 100}%`,
                background: 'linear-gradient(180deg, #ff6a6a88, #ff6a6a44)',
                minHeight: d.attempts - d.passed > 0 ? 2 : 0
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Step Row ──────────────────────────────────────────────────────────────────
function StepRow({ step, index }) {
  const passPct = Math.round((step.passed / (step.attempts || 1)) * 100)
  const isPassing = passPct >= 70

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 group hover:bg-white/[0.02] rounded-lg px-2 transition-colors">
      <span className="font-mono text-xs text-muted w-5 text-right flex-shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-white truncate">{step.step_id}</div>
        {step.roadmap_title && (
          <div className="font-mono text-[10px] text-muted truncate">{step.roadmap_title}</div>
        )}
      </div>
      {/* Mini progress bar */}
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${passPct}%`, background: isPassing ? 'linear-gradient(90deg,#6affd4,#4ae8b8)' : 'linear-gradient(90deg,#ff6a6a,#ff4444)' }} />
      </div>
      <div className="flex gap-3 flex-shrink-0 text-[11px] font-mono">
        <span className="text-muted">{step.attempts}×</span>
        <span className={isPassing ? 'text-accent3' : 'text-accent2'}>{passPct}%</span>
        <span className="text-yellow-400">⭐{step.best_score}</span>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QuizAnalytics({ roadmaps }) {
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [selectedMap,  setSelectedMap]  = useState('')
  const [activeTab,    setActiveTab]    = useState('overview') // overview | steps
  const [expanded,     setExpanded]     = useState(false)

  useEffect(() => {
    fetchAnalytics(selectedMap)
  }, [selectedMap])

  const fetchAnalytics = async (roadmapId) => {
    setLoading(true)
    try {
      const res = await quizAPI.analytics(roadmapId || null)
      setData(res.data)
    } catch (e) {
      console.error('Analytics fetch failed', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin-slow" />
    </div>
  )

  if (!data || data.totals.total_attempts === 0) return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">📊</div>
      <p className="text-muted text-sm font-mono">Complete a quiz to see analytics here.</p>
    </div>
  )

  const { totals, timeline, byRoadmap, byStep } = data
  const displayedSteps = expanded ? byStep : byStep.slice(0, 5)

  return (
    <div className="space-y-4 animate-fadeUp">

      {/* ── Filter Row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('overview')}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all ${activeTab === 'overview' ? 'bg-accent text-white border-accent' : 'text-muted border-border hover:border-accent'}`}>
            Overview
          </button>
          <button onClick={() => setActiveTab('steps')}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-all ${activeTab === 'steps' ? 'bg-accent text-white border-accent' : 'text-muted border-border hover:border-accent'}`}>
            By Step
          </button>
        </div>

        {/* Roadmap filter */}
        <select value={selectedMap} onChange={e => setSelectedMap(e.target.value)}
          className="bg-surface2 border border-border text-muted font-mono text-xs px-3 py-1.5 rounded-lg outline-none hover:border-accent transition-colors">
          <option value="">All Roadmaps</option>
          {roadmaps.map(r => (
            <option key={r.id} value={r.id}>{r.technology}</option>
          ))}
        </select>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Attempts', value: totals.total_attempts, color: '#7c6aff', icon: '🎯' },
              { label: 'Passed',         value: totals.total_passed,   color: '#6affd4', icon: '✅' },
              { label: 'Failed',         value: totals.total_failed,   color: '#ff6a6a', icon: '❌' },
              { label: 'Avg Score',      value: `${totals.avg_score_pct ?? 0}%`, color: '#ffd96a', icon: '📈' },
            ].map(card => (
              <div key={card.label}
                className="bg-surface border border-border rounded-xl p-4 relative overflow-hidden group hover:border-opacity-60 transition-all"
                style={{ borderColor: `${card.color}30` }}>
                {/* Glow */}
                <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{ background: card.color }} />
                <div className="text-xl mb-2">{card.icon}</div>
                <div className="font-syne font-extrabold text-2xl" style={{ color: card.color }}>{card.value}</div>
                <div className="font-mono text-[10px] text-muted mt-0.5 tracking-widest uppercase">{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Donut */}
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-4">
              <div className="font-mono text-xs text-muted tracking-widest uppercase">Pass / Fail Split</div>
              <DonutChart passed={Number(totals.total_passed)} failed={Number(totals.total_failed)} size={130} />
              <div className="flex gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent3 inline-block" /><span className="text-muted">Passed {totals.total_passed}</span></span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent2 inline-block" /><span className="text-muted">Failed {totals.total_failed}</span></span>
              </div>
            </div>

            {/* Timeline bar chart */}
            <div className="md:col-span-2 bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-mono text-xs text-muted tracking-widest uppercase">Attempts — Last 30 Days</div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent3 inline-block"/>Pass</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent2/50 inline-block"/>Fail</span>
                </div>
              </div>
              {timeline.length > 0
                ? <BarChart data={timeline} />
                : <div className="text-muted text-xs font-mono text-center py-8">No activity in last 30 days</div>
              }
            </div>
          </div>

          {/* ── Per Roadmap ── */}
          {byRoadmap.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-4">Per Roadmap</div>
              <div className="space-y-3">
                {byRoadmap.map(r => {
                  const pct = Number(r.avg_score_pct) || 0
                  return (
                    <div key={r.roadmap_id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-xs text-white truncate">{r.technology}</span>
                          <span className="font-mono text-xs text-muted flex-shrink-0 ml-2">{r.attempts} tries · {r.passed} passed</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c6aff, #6affd4)' }} />
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-accent flex-shrink-0">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'steps' && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase">Step Breakdown</div>
            <div className="flex items-center gap-4 font-mono text-[10px] text-muted">
              <span>Tries</span><span>Pass%</span><span>Best</span>
            </div>
          </div>

          {byStep.length === 0
            ? <div className="text-muted text-xs font-mono text-center py-8">No step data yet</div>
            : (
              <>
                {displayedSteps.map((s, i) => <StepRow key={`${s.step_id}-${i}`} step={s} index={i} />)}
                {byStep.length > 5 && (
                  <button onClick={() => setExpanded(e => !e)}
                    className="w-full mt-3 text-xs font-mono text-muted hover:text-accent transition-colors text-center py-2 border border-border hover:border-accent rounded-lg">
                    {expanded ? '↑ Show less' : `↓ Show all ${byStep.length} steps`}
                  </button>
                )}
              </>
            )
          }
        </div>
      )}
    </div>
  )
}