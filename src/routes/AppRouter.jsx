import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { LoginPage } from '../modules/auth/LoginPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { UsuariosPage } from '../modules/usuarios/UsuariosPage'
import { LandingPage } from '../pages/LandingPage'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
