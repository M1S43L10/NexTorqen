import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Package,
  ReceiptText,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GearLoader } from '../../components/GearLoader'
import { listAppointments } from '../../services/appointmentService'
import { listInvoices } from '../../services/invoiceService'
import { listStockItems } from '../../services/stockService'
import { listWorkOrders } from '../../services/workOrderService'
import { formatDate } from '../../utils/date'
import './ReportesPage.css'

const toNumber = (value) => Number(value) || 0

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)

const percent = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

const todayIso = () => new Date().toISOString().slice(0, 10)

export function ReportesPage() {
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [stockItems, setStockItems] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([listWorkOrders(), listInvoices(), listStockItems(), listAppointments()]).then(
      ([ordersResult, invoicesResult, stockResult, appointmentsResult]) => {
        if (!active) return
        setOrders(ordersResult)
        setInvoices(invoicesResult)
        setStockItems(stockResult)
        setAppointments(appointmentsResult)
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'Pagada')
    const issuedInvoices = invoices.filter((invoice) => invoice.status !== 'Anulada')
    const paidTotal = paidInvoices.reduce((total, invoice) => total + toNumber(invoice.total), 0)
    const issuedTotal = issuedInvoices.reduce((total, invoice) => total + toNumber(invoice.total), 0)
    const pendingTotal = invoices
      .filter((invoice) => ['Borrador', 'Emitida'].includes(invoice.status))
      .reduce((total, invoice) => total + toNumber(invoice.total), 0)
    const activeOrders = orders.filter((order) => ['Pendiente', 'En proceso'].includes(order.status))
    const finishedOrders = orders.filter((order) => ['Finalizada', 'Entregada'].includes(order.status))
    const lowStock = stockItems.filter((item) => toNumber(item.stock) <= toNumber(item.minStock))
    const todayAppointments = appointments.filter((appointment) => appointment.date === todayIso())
    const upcomingAppointments = appointments.filter(
      (appointment) =>
        appointment.date >= todayIso() && !['Completado', 'Cancelado'].includes(appointment.status),
    )

    return {
      paidTotal,
      issuedTotal,
      pendingTotal,
      averageTicket: issuedInvoices.length ? issuedTotal / issuedInvoices.length : 0,
      activeOrders: activeOrders.length,
      finishedOrders: finishedOrders.length,
      lowStock,
      todayAppointments: todayAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
    }
  }, [appointments, invoices, orders, stockItems])

  const orderStatus = useMemo(
    () =>
      ['Pendiente', 'En proceso', 'Finalizada', 'Entregada', 'Cancelada'].map((status) => ({
        status,
        count: orders.filter((order) => order.status === status).length,
      })),
    [orders],
  )

  const invoiceStatus = useMemo(
    () =>
      ['Borrador', 'Emitida', 'Pagada', 'Anulada'].map((status) => ({
        status,
        count: invoices.filter((invoice) => invoice.status === status).length,
      })),
    [invoices],
  )

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices])
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  return (
    <section className="reportes-page">
      <div className="page-heading">
        <span>Inteligencia operativa</span>
        <h1>Reportes</h1>
        <p>Indicadores comerciales, operativos y de inventario para leer el pulso del taller.</p>
      </div>

      {loading ? (
        <div className="card empty-state">
          <GearLoader label="Calculando reportes..." />
        </div>
      ) : (
        <>
          <div className="reports-kpi-grid">
            <article className="card report-kpi">
              <CreditCard size={22} />
              <span>Cobrado</span>
              <strong>{formatCurrency(metrics.paidTotal)}</strong>
            </article>
            <article className="card report-kpi">
              <ReceiptText size={22} />
              <span>Emitido</span>
              <strong>{formatCurrency(metrics.issuedTotal)}</strong>
            </article>
            <article className="card report-kpi">
              <AlertTriangle size={22} />
              <span>Pendiente</span>
              <strong>{formatCurrency(metrics.pendingTotal)}</strong>
            </article>
            <article className="card report-kpi">
              <BarChart3 size={22} />
              <span>Ticket promedio</span>
              <strong>{formatCurrency(metrics.averageTicket)}</strong>
            </article>
          </div>

          <div className="reports-grid">
            <article className="card report-panel">
              <div className="report-panel-title">
                <ClipboardList size={20} />
                <h2>Ordenes por estado</h2>
              </div>
              <div className="status-bars">
                {orderStatus.map((item) => (
                  <div key={item.status}>
                    <span>
                      {item.status}
                      <b>{item.count}</b>
                    </span>
                    <div>
                      <i style={{ width: `${percent(item.count, orders.length)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card report-panel">
              <div className="report-panel-title">
                <ReceiptText size={20} />
                <h2>Facturas por estado</h2>
              </div>
              <div className="status-bars">
                {invoiceStatus.map((item) => (
                  <div key={item.status}>
                    <span>
                      {item.status}
                      <b>{item.count}</b>
                    </span>
                    <div>
                      <i style={{ width: `${percent(item.count, invoices.length)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="card report-panel report-list">
              <div className="report-panel-title">
                <Package size={20} />
                <h2>Stock bajo minimo</h2>
              </div>
              {metrics.lowStock.length ? (
                metrics.lowStock.slice(0, 6).map((item) => (
                  <div className="report-list-row" key={item.id}>
                    <strong>{item.name}</strong>
                    <span>{item.sku || 'Sin SKU'}</span>
                    <b>
                      {item.stock} / min {item.minStock}
                    </b>
                  </div>
                ))
              ) : (
                <div className="report-empty">No hay alertas de inventario.</div>
              )}
            </article>

            <article className="card report-panel">
              <div className="report-panel-title">
                <CalendarClock size={20} />
                <h2>Agenda</h2>
              </div>
              <div className="report-split">
                <div>
                  <span>Turnos hoy</span>
                  <strong>{metrics.todayAppointments}</strong>
                </div>
                <div>
                  <span>Proximos activos</span>
                  <strong>{metrics.upcomingAppointments}</strong>
                </div>
              </div>
            </article>
          </div>

          <div className="reports-grid bottom-reports">
            <article className="card report-panel report-list">
              <div className="report-panel-title">
                <ReceiptText size={20} />
                <h2>Ultimas facturas</h2>
              </div>
              {recentInvoices.length ? (
                recentInvoices.map((invoice) => (
                  <div className="report-list-row" key={invoice.id}>
                    <strong>{invoice.number}</strong>
                    <span>{invoice.clientName || '-'}</span>
                    <b>{formatCurrency(invoice.total)}</b>
                  </div>
                ))
              ) : (
                <div className="report-empty">No hay facturas todavia.</div>
              )}
            </article>

            <article className="card report-panel report-list">
              <div className="report-panel-title">
                <Wrench size={20} />
                <h2>Ultimas ordenes</h2>
              </div>
              {recentOrders.length ? (
                recentOrders.map((order) => (
                  <div className="report-list-row" key={order.id}>
                    <strong>{order.number}</strong>
                    <span>{order.clientName || '-'}</span>
                    <b>{formatDate(order.createdAt)}</b>
                  </div>
                ))
              ) : (
                <div className="report-empty">No hay ordenes todavia.</div>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  )
}
