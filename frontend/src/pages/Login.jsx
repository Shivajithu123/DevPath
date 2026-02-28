import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="w-full max-w-md animate-fadeUp">
        <div className="text-center mb-10">
          <div className="font-syne font-bold text-accent tracking-[4px] text-sm uppercase mb-6">DevPath</div>
          <h1 className="font-syne font-extrabold text-4xl mb-2">Welcome back</h1>
          <p className="text-muted text-sm">Continue your learning journey</p>
        </div>
        <form onSubmit={handle} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-accent2 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-xs font-mono text-muted mb-2 tracking-wider uppercase">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted mb-2 tracking-wider uppercase">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white font-syne font-bold py-3 rounded-xl transition-opacity">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-muted text-sm mt-6">
          No account? <Link to="/register" className="text-accent hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
