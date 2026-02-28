import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { roadmapAPI } from '../api/client'
import styles from './Roadmap.module.css'

export default function Shared() {
  const { token }               = useParams()
  const [roadmap, setRoadmap]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    roadmapAPI.getShared(token)
      .then(res => setRoadmap(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className={styles.loading}><div className={styles.ring}></div></div>

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <span style={{ fontSize: 48 }}>🔒</span>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24 }}>Roadmap not found</h2>
      <p style={{ color: 'var(--muted)' }}>This link may be invalid or sharing has been disabled.</p>
      <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create your own roadmap →</Link>
    </div>
  )

  const LEVEL_COLORS = {
    beginner:     styles.badgeBeginner,
    intermediate: styles.badgeIntermediate,
    advanced:     styles.badgeAdvanced,
  }

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>
        <span className={styles.navLogo}>DevPath</span>
        <Link to="/register">
          <button className={styles.actionBtn}>Start Learning for Free →</button>
        </Link>
      </nav>

      <div className={styles.header}>
        <div className={styles.tech}>{roadmap.technology}</div>
        <h1 className={styles.title}>{roadmap.title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Shared by <strong>{roadmap.author_name}</strong>
        </p>
      </div>

      <div className={styles.levels}>
        {roadmap.data.levels.map(level => (
          <div key={level.id} className={styles.levelSection}>
            <div className={styles.levelHeader}>
              <span className={`${styles.badge} ${LEVEL_COLORS[level.id] || styles.badgeBeginner}`}>{level.label}</span>
              <div className={styles.levelLine} />
              <span className={styles.levelTitle}>{level.title}</span>
            </div>

            <div className={styles.stepsGrid}>
              {level.steps.map((step, si) => (
                <div key={step.id} className={styles.stepCard}>
                  <div className={styles.stepTop}>
                    <span className={styles.stepNum}>STEP {String(si + 1).padStart(2, '0')}</span>
                  </div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.description}</div>
                </div>
              ))}
            </div>

            <div className={styles.projectsSection}>
              <div className={styles.projectsTitle}>⬡ Projects to Build</div>
              {level.projects.map(proj => (
                <div key={proj.id} className={styles.projectCard}>
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
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '40px 20px 80px', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Want your own learning roadmap?
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Generate AI-powered roadmaps for any technology. Free to start.</p>
        <Link to="/register">
          <button style={{
            background: 'linear-gradient(135deg, #7c6aff, #5a4aff)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '14px 32px', fontFamily: 'Syne, sans-serif',
            fontWeight: 700, fontSize: 15, cursor: 'pointer'
          }}>
            Get Started Free →
          </button>
        </Link>
      </div>
    </div>
  )
}
