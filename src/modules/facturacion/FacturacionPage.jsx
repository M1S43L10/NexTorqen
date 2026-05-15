import { CreditCard, Download, Edit3, FileText, MessageCircle, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GearLoader } from '../../components/GearLoader'
import { listClients } from '../../services/clientService'
import {
  createInvoice,
  deleteInvoice,
  listInvoices,
  updateInvoice,
} from '../../services/invoiceService'
import { listWorkOrders } from '../../services/workOrderService'
import { invoiceMessage, openWhatsApp } from '../../services/whatsappService'
import { exportToCsv } from '../../services/exportService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './FacturacionPage.css'

const createEmptyForm = () => ({
  number: '',
  workOrderId: '',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  status: 'Emitida',
  paymentMethod: 'Efectivo',
  taxRate: '21',
  discount: '',
  notes: '',
})

const statusOptions = ['Borrador', 'Emitida', 'Pagada', 'Anulada']
const paymentOptions = ['Efectivo', 'Transferencia', 'Tarjeta', 'Mercado Pago', 'Cuenta corriente']

const toNumber = (value) => Number(String(value || '').replace(',', '.')) || 0

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)

const buildInvoiceItems = (order) => [
  ...(order?.services || []).map((item) => ({
    type: 'Servicio',
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
  })),
  ...(order?.parts || []).map((item) => ({
    type: 'Repuesto',
    description: item.description,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.subtotal,
    stockItemId: item.stockItemId || '',
    sku: item.sku || '',
  })),
]

export function FacturacionPage() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const orderById = useMemo(
    () => new Map(orders.map((order) => [order.id, order])),
    [orders],
  )

  const selectedOrder = orderById.get(form.workOrderId)

  const billableOrders = useMemo(
    () =>
      orders.filter((order) =>
        ['Finalizada', 'Entregada', 'En proceso'].includes(order.status || ''),
      ),
    [orders],
  )

  const totals = useMemo(() => {
    const subtotal = toNumber(selectedOrder?.total)
    const discount = toNumber(form.discount)
    const taxableBase = Math.max(subtotal - discount, 0)
    const taxTotal = taxableBase * (toNumber(form.taxRate) / 100)
    return {
      subtotal,
      discount,
      taxTotal,
      total: taxableBase + taxTotal,
    }
  }, [form.discount, form.taxRate, selectedOrder])

  const loadData = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const [invoicesResult, ordersResult, clientsResult] = await Promise.all([
      listInvoices(),
      listWorkOrders(),
      listClients(),
    ])
    setInvoices(invoicesResult)
    setOrders(ordersResult)
    setClients(clientsResult)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([listInvoices(), listWorkOrders(), listClients()]).then(([invoicesResult, ordersResult, clientsResult]) => {
      if (!active) return
      setInvoices(invoicesResult)
      setOrders(ordersResult)
      setClients(clientsResult)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filteredInvoices = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return invoices

    return invoices.filter((invoice) =>
      [
        invoice.number,
        invoice.orderNumber,
        invoice.clientName,
        invoice.vehicleLabel,
        invoice.status,
        invoice.paymentMethod,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [invoices, query])

  const paidTotal = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status === 'Pagada')
        .reduce((total, invoice) => total + toNumber(invoice.total), 0),
    [invoices],
  )

  const pendingTotal = useMemo(
    () =>
      invoices
        .filter((invoice) => ['Borrador', 'Emitida'].includes(invoice.status))
        .reduce((total, invoice) => total + toNumber(invoice.total), 0),
    [invoices],
  )

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm({
      ...createEmptyForm(),
      number: `FC-${String(invoices.length + 1).padStart(5, '0')}`,
      workOrderId: billableOrders[0]?.id || '',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (invoice) => {
    setForm({
      number: invoice.number || '',
      workOrderId: invoice.workOrderId || '',
      issueDate: invoice.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: invoice.dueDate || '',
      status: invoice.status || 'Emitida',
      paymentMethod: invoice.paymentMethod || 'Efectivo',
      taxRate: String(invoice.taxRate ?? '21'),
      discount: String(invoice.discount || ''),
      notes: invoice.notes || '',
    })
    setEditingId(invoice.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const order = orderById.get(form.workOrderId)

    if (!order) {
      setError('Selecciona una orden para facturar.')
      setSaving(false)
      return
    }

    const duplicatedNumber = invoices.some(
      (invoice) =>
        invoice.id !== editingId &&
        invoice.number.trim().toLowerCase() === form.number.trim().toLowerCase(),
    )

    if (duplicatedNumber) {
      setError('Ya existe una factura con ese numero.')
      setSaving(false)
      return
    }

    const duplicatedOrder = invoices.some(
      (invoice) => invoice.id !== editingId && invoice.workOrderId === form.workOrderId,
    )

    if (duplicatedOrder) {
      setError('Esa orden ya tiene una factura asociada.')
      setSaving(false)
      return
    }

    const payload = {
      number: form.number.trim(),
      workOrderId: form.workOrderId,
      orderNumber: order.number || '',
      clientId: order.clientId || '',
      clientName: order.clientName || '',
      vehicleId: order.vehicleId || '',
      vehicleLabel: order.vehicleLabel || '',
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      paymentMethod: form.paymentMethod,
      items: buildInvoiceItems(order),
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxRate: toNumber(form.taxRate),
      taxTotal: totals.taxTotal,
      total: totals.total,
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await updateInvoice(editingId, payload)
      } else {
        await createInvoice(payload)
      }
      await loadData()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (invoice) => {
    const confirmed = window.confirm(`Eliminar la factura ${invoice.number}?`)
    if (!confirmed) return

    await deleteInvoice(invoice.id)
    await loadData()
  }

  const handleSendInvoiceMessage = (invoice) => {
    const client = clients.find((item) => item.id === invoice.clientId)
    openWhatsApp(client?.phone, invoiceMessage(invoice))
  }

  return (
    <section className="usuarios-page facturacion-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Control comercial</span>
          <h1>Facturacion</h1>
          <p>Genera comprobantes desde ordenes de trabajo y controla importes emitidos y cobrados.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nueva factura
        </button>
      </div>

      <div className="facturacion-summary">
        <article className="card invoice-mini-card">
          <ReceiptText size={20} />
          <div>
            <strong>{invoices.length}</strong>
            <span>facturas</span>
          </div>
        </article>
        <article className="card invoice-mini-card">
          <CreditCard size={20} />
          <div>
            <strong>{formatCurrency(paidTotal)}</strong>
            <span>cobrado</span>
          </div>
        </article>
        <article className="card invoice-mini-card">
          <FileText size={20} />
          <div>
            <strong>{formatCurrency(pendingTotal)}</strong>
            <span>pendiente</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar facturas">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por factura, orden, cliente, vehiculo, estado o pago"
            value={query}
          />
        </label>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() =>
            exportToCsv('nextorqen-facturas', filteredInvoices, [
              { label: 'Factura', value: 'number' },
              { label: 'Orden', value: 'orderNumber' },
              { label: 'Cliente', value: 'clientName' },
              { label: 'Vehiculo', value: 'vehicleLabel' },
              { label: 'Estado', value: 'status' },
              { label: 'Pago', value: 'paymentMethod' },
              { label: 'Subtotal', value: 'subtotal' },
              { label: 'IVA', value: 'taxTotal' },
              { label: 'Total', value: 'total' },
              { label: 'Emision', value: 'issueDate' },
            ])
          }
        >
          <Download size={17} />
          Exportar
        </button>
      </div>

      {showForm ? (
        <form className="user-form invoice-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar factura' : 'Crear factura'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          {!billableOrders.length ? (
            <div className="form-warning">Primero crea una orden en proceso, finalizada o entregada.</div>
          ) : null}

          <div className="form-grid">
            <label className="field">
              <span>Numero</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))}
                required
                value={form.number}
              />
            </label>
            <label className="field">
              <span>Orden</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, workOrderId: event.target.value }))}
                required
                value={form.workOrderId}
              >
                <option value="" disabled>
                  Seleccionar orden
                </option>
                {billableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {`${order.number} - ${order.clientName} - ${formatCurrency(order.total)}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estado</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                value={form.status}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Pago</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                value={form.paymentMethod}
              >
                {paymentOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Emision</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
                type="date"
                value={form.issueDate}
              />
            </label>
            <label className="field">
              <span>Vencimiento</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                type="date"
                value={form.dueDate}
              />
            </label>
            <label className="field">
              <span>IVA %</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, taxRate: event.target.value }))}
                value={form.taxRate}
              />
            </label>
            <label className="field">
              <span>Descuento</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))}
                value={form.discount}
              />
            </label>
            <label className="field">
              <span>Notas</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                value={form.notes}
              />
            </label>
          </div>

          <div className="invoice-preview">
            <div>
              <span>Cliente</span>
              <strong>{selectedOrder?.clientName || '-'}</strong>
            </div>
            <div>
              <span>Vehiculo</span>
              <strong>{selectedOrder?.vehicleLabel || '-'}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>
            <div>
              <span>IVA</span>
              <strong>{formatCurrency(totals.taxTotal)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatCurrency(totals.total)}</strong>
            </div>
          </div>

          {selectedOrder ? (
            <div className="invoice-items">
              {buildInvoiceItems(selectedOrder).map((item, index) => (
                <div key={`${item.type}-${index}`}>
                  <span>{item.type}</span>
                  <strong>{item.description}</strong>
                  <small>
                    {item.quantity} x {formatCurrency(item.price)}
                  </small>
                  <b>{formatCurrency(item.subtotal)}</b>
                </div>
              ))}
            </div>
          ) : null}

          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving || !billableOrders.length} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear factura'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">
            <GearLoader label="Cargando facturas..." />
          </div>
        ) : filteredInvoices.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Vehiculo</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Emision</th>
                  <th>Actualizo</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <code>{invoice.number}</code>
                    </td>
                    <td>{invoice.orderNumber || '-'}</td>
                    <td>{invoice.clientName || '-'}</td>
                    <td>{invoice.vehicleLabel || '-'}</td>
                    <td>
                      <span className={`invoice-status invoice-status-${invoice.status?.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>{invoice.paymentMethod}</td>
                    <td>{formatCurrency(invoice.total)}</td>
                    <td>{invoice.issueDate || '-'}</td>
                    <td>{invoice.updatedByName || invoice.createdByName || '-'}</td>
                    <td>{formatDate(invoice.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(invoice)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button whatsapp-action"
                          type="button"
                          onClick={() => handleSendInvoiceMessage(invoice)}
                          aria-label="Enviar WhatsApp"
                        >
                          <MessageCircle size={17} />
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => handleDelete(invoice)} aria-label="Eliminar">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No hay facturas cargadas todavia.</div>
        )}
      </div>
    </section>
  )
}
