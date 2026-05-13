import { useCallback, useEffect, useMemo, useState } from 'react'
import { bootstrapAuth, login as loginService, logout as logoutService } from '../services/authService'
import { AuthContext } from './authContextObject'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    bootstrapAuth()
      .then((session) => {
        if (mounted) setUser(session)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const login = useCallback(async (identifier, password) => {
    const session = await loginService(identifier, password)
    setUser(session)
    return session
  }, [])

  const logout = useCallback(async () => {
    await logoutService()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      logout,
    }),
    [loading, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
