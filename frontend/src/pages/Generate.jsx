import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const EXAMPLES = ['React JS', 'Python', 'Machine Learning', 'Docker & Kubernetes', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'Flutter', 'Rust']

export default function Generate() {
  const navigate = useNavigate()
  const [tech, setTech] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stage, setStage] = useState('Generating your roadmap...')

  const generate = async () => {
    if (!tech.trim()) { setError('Please enter a technology'); return }
    setError('')
    setLoading(true)

    const stages = ['Analyzing technology...', 'Planning learning path...', 'Creating projects...', 'Finalizing roadmap...']
    let si = 0
    const iv = setInterval(() => { si = (si+1) % stages.length; setStage(stages[si]) }, 2000)

    try {
      // 1. Ask the backend to generate the roadmap using Gemini
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/roadmaps/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}` // Send JWT if user is logged in
        },
        body: JSON.stringify({ technology: tech }) 
      });

      const roadmapData = await response.json();

      // Check for errors from the API
      if (!response.ok || roadmapData.error) {
        throw new Error(roadmapData.error || 'Failed to generate roadmap');
      }

      console.log("Roadmap from AI:", roadmapData);

      // 2. Save the generated roadmap securely to your database
      const { data } = await api.post('/roadmaps', {
        title: roadmapData.title,
        technology: tech,
        data: roadmapData
      });

      // 3. Navigate to the new roadmap view
      navigate(`/roadmap/${data.id}`);

    } catch (err) {
      console.error(err);
      setError('Failed to generate roadmap. Please try again.')
    } finally {
      clearInterval(iv)
      setLoading(false)
    }
  }

  // --- UI RENDER LOGIC BELOW REMAINS UNCHANGED ---

  if (loading) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-6">
      <div className="w-14 h-14 rounded-full border-2 border-border border-t-accent animate-spin-slow" />
      <div className="font-mono text-sm text-muted tracking-wider">{stage}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center"
      style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>

      <button onClick={() => navigate('/')} className="fixed top-6 left-6 text-muted font-mono text-xs border border-border px-4 py-2 rounded-lg hover:border-muted transition-colors">← Back</button>

      <div className="font-syne font-bold text-accent tracking-[4px] text-sm uppercase mb-10">DevPath</div>
      <div className="inline-block font-mono text-xs tracking-widest text-accent3 bg-accent3/10 border border-accent3/20 px-4 py-2 rounded-full mb-7">AI-Powered Roadmap Generator</div>

      <h1 className="font-syne font-extrabold text-5xl md:text-7xl leading-none tracking-tight mb-5">
        What will you<br /><span className="text-transparent bg-clip-text" style={{backgroundImage:'linear-gradient(135deg,#7c6aff,#ff6a6a)'}}>master?</span>
      </h1>
      <p className="text-muted text-lg max-w-md mb-12">Enter any technology and get a structured roadmap with real projects to build.</p>

      <div className="w-full max-w-xl">
        <div className="flex bg-surface border border-border rounded-2xl p-2 pl-6 gap-3 focus-within:border-accent transition-colors mb-3">
          <input value={tech} onChange={e => setTech(e.target.value)} onKeyDown={e => e.key==='Enter' && generate()}
            className="flex-1 bg-transparent outline-none text-base placeholder-muted"
            placeholder="React JS, Python, AWS, Machine Learning..." />
          <button onClick={generate}
            className="bg-accent hover:opacity-90 text-white font-syne font-bold px-6 py-3 rounded-xl transition-opacity whitespace-nowrap">
            Generate →
          </button>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-accent2 rounded-xl p-3 text-sm mb-3">{error}</div>}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-5">
        {EXAMPLES.map(e => (
          <button key={e} onClick={() => setTech(e)}
            className="font-mono text-xs text-muted border border-border px-3 py-1.5 rounded-full hover:text-accent hover:border-accent transition-colors">{e}</button>
        ))}
      </div>
    </div>
  )
}