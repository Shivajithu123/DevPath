import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async e => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4" style={{backgroundImage:'linear-gradient(rgba(124,106,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}>
      <div className="w-full max-w-md animate-fadeUp">
        <div className="text-center mb-10">
          <div className="font-syne font-bold text-accent tracking-[4px] text-sm uppercase mb-6">DevPath</div>
          <h1 className="font-syne font-extrabold text-4xl mb-2">Start learning</h1>
          <p className="text-muted text-sm">Build real skills, not watch hours</p>
        </div>
        <form onSubmit={handle} className="bg-surface border border-border rounded-2xl p-8 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-accent2 rounded-xl p-3 text-sm">{error}</div>}
          {[
            { key:'name', label:'Full Name', type:'text', placeholder:'John Doe' },
            { key:'email', label:'Email', type:'email', placeholder:'you@example.com' },
            { key:'password', label:'Password', type:'password', placeholder:'Min 8 characters' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-mono text-muted mb-2 tracking-wider uppercase">{f.label}</label>
              <input type={f.type} required value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
                placeholder={f.placeholder} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white font-syne font-bold py-3 rounded-xl transition-opacity">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-muted text-sm mt-6">
          Already have an account? <Link to="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
