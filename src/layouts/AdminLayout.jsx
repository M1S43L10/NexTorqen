import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Car,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import nextorqenLogo from '../assets/nextorqen-logo.svg'
import { NotificationBell } from '../components/NotificationBell'
import './AdminLayout.css'

const mainNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/ordenes', label: 'Ordenes', icon: Wrench },
  { to: '/app/trabajos', label: 'Trabajos', icon: BriefcaseBusiness },
  { to: '/app/clientes', label: 'Clientes', icon: Building2 },
  { to: '/app/vehiculos', label: 'Vehiculos', icon: Car },
  { to: '/app/stock', label: 'Stock', icon: Package, roles: ['admin'] },
  { to: '/app/facturacion', label: 'Facturacion', icon: FileText, roles: ['admin'] },
  { to: '/app/turnos', label: 'Turnos', icon: CalendarClock },
  { to: '/app/ayuda', label: 'Ayuda', icon: BookOpen },
  { to: '/app/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { to: '/app/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
]

const futureNav = []

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img className="sidebar-logo" src={nextorqenLogo} alt="NexTorqen" />
          <button
            className="icon-button sidebar-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          {mainNav
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map((item) => (
            <NavLink
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end={item.end}
              key={item.to}
              onClick={() => setSidebarOpen(false)}
              to={item.to}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {futureNav.length ? (
          <div className="sidebar-section">
            <span>Preparado para escalar</span>
            {futureNav.map((item) => (
              <div className="sidebar-link disabled" key={item.label}>
                <item.icon size={18} />
                {item.label}
              </div>
            ))}
          </div>
        ) : null}
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            <span>Panel administrativo</span>
            <strong>Operación del taller</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <NotificationBell />
            <div className="user-chip">
              <span>{user?.name?.slice(0, 1) || 'U'}</span>
              <div>
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
            </div>
            <button className="btn btn-ghost logout-btn" type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
