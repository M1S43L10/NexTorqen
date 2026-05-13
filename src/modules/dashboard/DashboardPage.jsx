import { Activity, Car, ClipboardList, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listUsers } from '../../services/userService'
import './DashboardPage.css'

const placeholderStats = [
  { label: 'Vehículos', value: '0', icon: Car, tone: 'blue' },
  { label: 'Órdenes', value: '0', icon: ClipboardList, tone: 'amber' },
  { label: 'Servicios realizados', value: '0', icon: Wrench, tone: 'green' },
]

export function DashboardPage() {
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    listUsers().then((users) => setUserCount(users.length))
  }, [])

  const stats = [{ label: 'Usuarios registrados', value: userCount, icon: Users, tone: 'blue' }, ...placeholderStats]

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span>Resumen general</span>
        <h1>Dashboard</h1>
        <p>Indicadores iniciales para controlar usuarios, vehículos, órdenes y servicios.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card card" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="card operations-card">
          <div className="panel-title">
            <Activity size={20} />
            <h2>Flujo operativo</h2>
          </div>
          <div className="timeline">
            <div>
              <span />
              <strong>Base del sistema</strong>
              <p>Autenticación, roles, rutas protegidas y gestión de usuarios activa.</p>
            </div>
            <div>
              <span />
              <strong>Siguiente módulo</strong>
              <p>Clientes y vehículos pueden agregarse con el mismo patrón modular.</p>
            </div>
            <div>
              <span />
              <strong>Escalado</strong>
              <p>Órdenes, stock, turnos, facturación y reportes quedan como módulos separados.</p>
            </div>
          </div>
        </article>

        <article className="card next-modules-card">
          <h2>Módulos futuros</h2>
          <div className="module-tags">
            {[
              'Clientes',
              'Vehículos',
              'Órdenes',
              'Aceite',
              'Historial',
              'Stock',
              'Facturación',
              'Turnos',
              'Sucursales',
              'Reportes',
              'Finanzas',
            ].map((module) => (
              <span key={module}>{module}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
