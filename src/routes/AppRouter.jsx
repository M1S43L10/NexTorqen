import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { LoginPage } from '../modules/auth/LoginPage'
import { ClientesPage } from '../modules/clientes/ClientesPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { FacturacionPage } from '../modules/facturacion/FacturacionPage'
import { OrdenesPage } from '../modules/ordenes/OrdenesPage'
import { StockPage } from '../modules/stock/StockPage'
import { UsuariosPage } from '../modules/usuarios/UsuariosPage'
import { VehiculosPage } from '../modules/vehiculos/VehiculosPage'
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
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="vehiculos" element={<VehiculosPage />} />
            <Route path="ordenes" element={<OrdenesPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="facturacion" element={<FacturacionPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
