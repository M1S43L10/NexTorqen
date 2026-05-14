import {
  BarChart3,
  Building2,
  CalendarClock,
  Car,
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
import './AdminLayout.css'

const mainNav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/ordenes', label: 'Ordenes', icon: Wrench },
  { to: '/app/clientes', label: 'Clientes', icon: Building2 },
  { to: '/app/vehiculos', label: 'Vehiculos', icon: Car },
  { to: '/app/stock', label: 'Stock', icon: Package },
  { to: '/app/usuarios', label: 'Usuarios', icon: Users },
]

const futureNav = [
  { label: 'Turnos', icon: CalendarClock },
  { label: 'Reportes', icon: BarChart3 },
]

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
          {mainNav.map((item) => (
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

        <div className="sidebar-section">
          <span>Preparado para escalar</span>
          {futureNav.map((item) => (
            <div className="sidebar-link disabled" key={item.label}>
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </div>
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
