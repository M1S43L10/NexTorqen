import { Navigate, Outlet } from 'react-router-dom'
import { GearLoader } from '../components/GearLoader'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ roles }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="route-loader">
        <GearLoader label="Inicializando sesión..." size="page" tone="inline" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
