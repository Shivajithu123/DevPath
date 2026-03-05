import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Reference to hold our timer so we can clear it
  const timerRef = useRef(null)
  const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes in milliseconds

  // Wrap logout in useCallback so it can be safely used inside useEffect
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login' // Redirect user when logged out
  }, [])

  // Function to reset the inactivity timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    
    // Only set the auto-logout timer if a user is currently logged in
    if (user) {
      timerRef.current = setTimeout(() => {
        logout()
      }, TIMEOUT_MS)
    }
  }, [user, logout, TIMEOUT_MS])

  // Track user activity to reset the timer
  useEffect(() => {
    if (!user) return

    // List of DOM events that count as "activity"
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    
    // Reset timer immediately when user logs in, and whenever they interact
    resetTimer()
    events.forEach(event => window.addEventListener(event, resetTimer))

    return () => {
      // Cleanup listeners and timer when component unmounts
      events.forEach(event => window.removeEventListener(event, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [user, resetTimer])

  // Initial authentication check
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.get('/auth/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)