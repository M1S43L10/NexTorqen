import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './ProtectedRoute'

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })))

const AdminLayout = lazyNamed(() => import('../layouts/AdminLayout'), 'AdminLayout')
const LoginPage = lazyNamed(() => import('../modules/auth/LoginPage'), 'LoginPage')
const ClientesPage = lazyNamed(() => import('../modules/clientes/ClientesPage'), 'ClientesPage')
const DashboardPage = lazyNamed(() => import('../modules/dashboard/DashboardPage'), 'DashboardPage')
const FacturacionPage = lazyNamed(
  () => import('../modules/facturacion/FacturacionPage'),
  'FacturacionPage',
)
const OrdenesPage = lazyNamed(() => import('../modules/ordenes/OrdenesPage'), 'OrdenesPage')
const ReportesPage = lazyNamed(() => import('../modules/reportes/ReportesPage'), 'ReportesPage')
const StockPage = lazyNamed(() => import('../modules/stock/StockPage'), 'StockPage')
const TurnosPage = lazyNamed(() => import('../modules/turnos/TurnosPage'), 'TurnosPage')
const UsuariosPage = lazyNamed(() => import('../modules/usuarios/UsuariosPage'), 'UsuariosPage')
const VehiculosPage = lazyNamed(() => import('../modules/vehiculos/VehiculosPage'), 'VehiculosPage')
const LandingPage = lazyNamed(() => import('../pages/LandingPage'), 'LandingPage')

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="route-loader">Cargando módulo...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="vehiculos" element={<VehiculosPage />} />
              <Route path="ordenes" element={<OrdenesPage />} />
              <Route path="turnos" element={<TurnosPage />} />
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="stock" element={<StockPage />} />
                <Route path="facturacion" element={<FacturacionPage />} />
                <Route path="reportes" element={<ReportesPage />} />
                <Route path="usuarios" element={<UsuariosPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
