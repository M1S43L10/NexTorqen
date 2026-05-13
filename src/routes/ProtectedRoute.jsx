import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ roles }) {
  const { loading, user } = useAuth()

  if (loading) {
    return <div className="route-loader">Inicializando sesión...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
