import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiGetMe, apiLogin, apiLogout, getStoredToken, setStoredToken } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [token, setToken] = useState(getStoredToken)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const storedToken = getStoredToken()
      if (!storedToken) {
        setAuthLoading(false)
        return
      }
      const user = await apiGetMe(storedToken)
      if (cancelled) return
      if (user) {
        setCurrentUser(user)
        setToken(storedToken)
      } else {
        setStoredToken(null)
        setToken(null)
      }
      setAuthLoading(false)
    }

    checkSession()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await apiLogin(email, password)
    if (data.ok) {
      setStoredToken(data.token)
      setToken(data.token)
      setCurrentUser(data.user)
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    const storedToken = getStoredToken()
    if (storedToken) await apiLogout(storedToken)
    setStoredToken(null)
    setToken(null)
    setCurrentUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken()
    if (!storedToken) return
    const user = await apiGetMe(storedToken)
    if (user) setCurrentUser(user)
  }, [])

  const value = {
    currentUser,
    authLoading,
    token,
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.rol === 'admin',
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
