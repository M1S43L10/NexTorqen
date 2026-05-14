import { Activity, Car, ClipboardList, UserRound, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listClients } from '../../services/clientService'
import { listStockItems } from '../../services/stockService'
import { listUsers } from '../../services/userService'
import { listVehicles } from '../../services/vehicleService'
import { listWorkOrders } from '../../services/workOrderService'
import './DashboardPage.css'

const placeholderStats = [
  { label: 'Servicios realizados', value: '0', icon: Wrench, tone: 'green' },
]

export function DashboardPage() {
  const [statsData, setStatsData] = useState({
    users: 0,
    clients: 0,
    vehicles: 0,
    orders: 0,
    stockItems: 0,
  })

  useEffect(() => {
    let active = true

    Promise.all([
      listUsers(),
      listClients(),
      listVehicles(),
      listWorkOrders(),
      listStockItems(),
    ]).then(([users, clients, vehicles, orders, stockItems]) => {
        if (!active) return
        setStatsData({
          users: users.length,
          clients: clients.length,
          vehicles: vehicles.length,
          orders: orders.length,
          stockItems: stockItems.length,
        })
      })

    return () => {
      active = false
    }
  }, [])

  const stats = [
    { label: 'Usuarios registrados', value: statsData.users, icon: Users, tone: 'blue' },
    { label: 'Clientes activos', value: statsData.clients, icon: UserRound, tone: 'green' },
    { label: 'Vehiculos', value: statsData.vehicles, icon: Car, tone: 'blue' },
    { label: 'Ordenes', value: statsData.orders, icon: ClipboardList, tone: 'amber' },
    { label: 'Repuestos', value: statsData.stockItems, icon: Wrench, tone: 'green' },
    ...placeholderStats,
  ]

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span>Resumen general</span>
        <h1>Dashboard</h1>
        <p>Indicadores iniciales para controlar usuarios, clientes, vehiculos, ordenes y servicios.</p>
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
              <p>Autenticacion, roles, rutas protegidas y gestion de usuarios activa.</p>
            </div>
            <div>
              <span />
              <strong>Clientes y vehiculos</strong>
              <p>Ya podes cargar clientes y vincular unidades para preparar ordenes de trabajo.</p>
            </div>
            <div>
              <span />
              <strong>Escalado</strong>
              <p>Ordenes, stock, turnos, facturacion y reportes quedan como modulos separados.</p>
            </div>
          </div>
        </article>

        <article className="card next-modules-card">
          <h2>Modulos futuros</h2>
          <div className="module-tags">
            {[
              'Ordenes',
              'Aceite',
              'Historial',
              'Stock',
              'Facturacion',
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
