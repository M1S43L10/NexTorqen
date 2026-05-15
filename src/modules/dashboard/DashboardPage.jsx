import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Car,
  ClipboardList,
  CreditCard,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listAppointments } from '../../services/appointmentService'
import { listClients } from '../../services/clientService'
import { listInvoices } from '../../services/invoiceService'
import { listStockItems } from '../../services/stockService'
import { listUsers } from '../../services/userService'
import { listVehicles } from '../../services/vehicleService'
import { listWorkOrders } from '../../services/workOrderService'
import './DashboardPage.css'

const toNumber = (value) => Number(value) || 0

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)

const todayIso = () => new Date().toISOString().slice(0, 10)

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const [statsData, setStatsData] = useState({
    users: 0,
    clients: 0,
    vehicles: 0,
    orders: 0,
    openOrders: 0,
    stockItems: 0,
    lowStock: 0,
    invoices: 0,
    pendingInvoicesTotal: 0,
    paidInvoicesTotal: 0,
    appointments: 0,
    todayAppointments: 0,
  })

  useEffect(() => {
    let active = true

    const adminRequests = isAdmin
      ? [listUsers(), listStockItems(), listInvoices()]
      : [Promise.resolve([]), Promise.resolve([]), Promise.resolve([])]

    Promise.all([
      listClients(),
      listVehicles(),
      listWorkOrders(),
      listAppointments(),
      ...adminRequests,
    ]).then(([clients, vehicles, orders, appointments, users, stockItems, invoices]) => {
        if (!active) return
        setStatsData({
          users: users.length,
          clients: clients.length,
          vehicles: vehicles.length,
          orders: orders.length,
          openOrders: orders.filter((order) => ['Pendiente', 'En proceso'].includes(order.status)).length,
          stockItems: stockItems.length,
          lowStock: stockItems.filter((item) => toNumber(item.stock) <= toNumber(item.minStock)).length,
          invoices: invoices.length,
          pendingInvoicesTotal: invoices
            .filter((invoice) => ['Borrador', 'Emitida'].includes(invoice.status))
            .reduce((total, invoice) => total + toNumber(invoice.total), 0),
          paidInvoicesTotal: invoices
            .filter((invoice) => invoice.status === 'Pagada')
            .reduce((total, invoice) => total + toNumber(invoice.total), 0),
          appointments: appointments.length,
          todayAppointments: appointments.filter((appointment) => appointment.date === todayIso()).length,
        })
      })

    return () => {
      active = false
    }
  }, [isAdmin])

  const employeeStats = [
    { label: 'Clientes activos', value: statsData.clients, icon: UserRound, tone: 'green' },
    { label: 'Vehiculos', value: statsData.vehicles, icon: Car, tone: 'blue' },
    { label: 'Ordenes abiertas', value: statsData.openOrders, icon: ClipboardList, tone: 'amber' },
    { label: 'Turnos hoy', value: statsData.todayAppointments, icon: CalendarClock, tone: 'blue' },
  ]

  const adminStats = [
    { label: 'Usuarios registrados', value: statsData.users, icon: Users, tone: 'blue' },
    { label: 'Facturas', value: statsData.invoices, icon: ClipboardList, tone: 'amber' },
    { label: 'Cobrado', value: formatCurrency(statsData.paidInvoicesTotal), icon: CreditCard, tone: 'green' },
    { label: 'Pendiente', value: formatCurrency(statsData.pendingInvoicesTotal), icon: AlertTriangle, tone: 'amber' },
    { label: 'Repuestos', value: statsData.stockItems, icon: Wrench, tone: 'green' },
    { label: 'Stock bajo', value: statsData.lowStock, icon: AlertTriangle, tone: 'amber' },
  ]

  const stats = isAdmin ? [...employeeStats, ...adminStats] : employeeStats

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span>Resumen general</span>
        <h1>Dashboard</h1>
        <p>Indicadores reales para controlar agenda, ordenes, facturacion y operacion diaria.</p>
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
              <strong>Permisos por rol</strong>
              <p>Administradores gestionan datos sensibles; empleados operan clientes, vehiculos, turnos y ordenes.</p>
            </div>
            <div>
              <span />
              <strong>Operacion diaria</strong>
              <p>Turnos, vehiculos y ordenes abiertas muestran la carga real del taller.</p>
            </div>
            <div>
              <span />
              <strong>Gestion comercial</strong>
              <p>Stock, facturacion y reportes quedan reservados para administracion.</p>
            </div>
          </div>
        </article>

        <article className="card next-modules-card">
          <h2>Modulos activos</h2>
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
