import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listClients } from '../../services/clientService'
import { listVehicles } from '../../services/vehicleService'
import {
  createWorkOrder,
  deleteWorkOrder,
  listWorkOrders,
  updateWorkOrder,
} from '../../services/workOrderService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './OrdenesPage.css'

const emptyLineItem = { description: '', quantity: '1', price: '' }

const createEmptyForm = () => ({
  number: '',
  clientId: '',
  vehicleId: '',
  status: 'Pendiente',
  priority: 'Normal',
  entryDate: new Date().toISOString().slice(0, 10),
  promisedDate: '',
  failureDescription: '',
  diagnosis: '',
  services: [{ ...emptyLineItem }],
  parts: [],
  notes: '',
})

const statusOptions = ['Pendiente', 'En proceso', 'Finalizada', 'Entregada', 'Cancelada']
const priorityOptions = ['Baja', 'Normal', 'Alta', 'Urgente']

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)

const parseAmount = (value) => Number(String(value || '').replace(',', '.')) || 0

const calculateItemsTotal = (items) =>
  items.reduce((total, item) => total + parseAmount(item.quantity) * parseAmount(item.price), 0)

const normalizeItems = (items) =>
  items
    .filter((item) => item.description.trim())
    .map((item) => ({
      description: item.description.trim(),
      quantity: parseAmount(item.quantity) || 1,
      price: parseAmount(item.price),
      subtotal: (parseAmount(item.quantity) || 1) * parseAmount(item.price),
    }))

export function OrdenesPage() {
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  const vehicleById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles],
  )

  const vehiclesForClient = useMemo(
    () => vehicles.filter((vehicle) => !form.clientId || vehicle.clientId === form.clientId),
    [form.clientId, vehicles],
  )

  const totals = useMemo(() => {
    const servicesTotal = calculateItemsTotal(form.services)
    const partsTotal = calculateItemsTotal(form.parts)
    return {
      servicesTotal,
      partsTotal,
      total: servicesTotal + partsTotal,
    }
  }, [form.parts, form.services])

  const loadData = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const [ordersResult, clientsResult, vehiclesResult] = await Promise.all([
      listWorkOrders(),
      listClients(),
      listVehicles(),
    ])
    setOrders(ordersResult)
    setClients(clientsResult)
    setVehicles(vehiclesResult)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([listWorkOrders(), listClients(), listVehicles()]).then(
      ([ordersResult, clientsResult, vehiclesResult]) => {
        if (!active) return
        setOrders(ordersResult)
        setClients(clientsResult)
        setVehicles(vehiclesResult)
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return orders

    return orders.filter((order) => {
      const clientName = clientById.get(order.clientId)?.name || order.clientName
      const vehicle = vehicleById.get(order.vehicleId)
      const vehicleText =
        order.vehicleLabel ||
        `${vehicle?.plate || ''} ${vehicle?.brand_name || vehicle?.brand || ''} ${
          vehicle?.model_name || vehicle?.model || ''
        }`

      return [
        order.number,
        clientName,
        vehicleText,
        order.status,
        order.priority,
        order.failureDescription,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      )
    })
  }, [clientById, orders, query, vehicleById])

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm({
      ...createEmptyForm(),
      number: `OT-${String(orders.length + 1).padStart(5, '0')}`,
      clientId: clients[0]?.id || '',
      vehicleId: vehicles.find((vehicle) => vehicle.clientId === clients[0]?.id)?.id || '',
      entryDate: new Date().toISOString().slice(0, 10),
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (order) => {
    setForm({
      number: order.number || '',
      clientId: order.clientId || '',
      vehicleId: order.vehicleId || '',
      status: order.status || 'Pendiente',
      priority: order.priority || 'Normal',
      entryDate: order.entryDate || new Date().toISOString().slice(0, 10),
      promisedDate: order.promisedDate || '',
      failureDescription: order.failureDescription || '',
      diagnosis: order.diagnosis || '',
      services: order.services?.length ? order.services : [{ ...emptyLineItem }],
      parts: order.parts || [],
      notes: order.notes || '',
    })
    setEditingId(order.id)
    setShowForm(true)
  }

  const updateLineItem = (type, index, key, value) => {
    setForm((current) => ({
      ...current,
      [type]: current[type].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
  }

  const addLineItem = (type) => {
    setForm((current) => ({
      ...current,
      [type]: [...current[type], { ...emptyLineItem }],
    }))
  }

  const removeLineItem = (type, index) => {
    setForm((current) => ({
      ...current,
      [type]: current[type].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleClientChange = (clientId) => {
    const firstVehicle = vehicles.find((vehicle) => vehicle.clientId === clientId)
    setForm((current) => ({
      ...current,
      clientId,
      vehicleId: firstVehicle?.id || '',
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const services = normalizeItems(form.services)
    const parts = normalizeItems(form.parts)

    if (!form.clientId || !form.vehicleId) {
      setError('Selecciona un cliente y un vehiculo para crear la orden.')
      setSaving(false)
      return
    }

    if (!form.failureDescription.trim()) {
      setError('Carga el motivo de ingreso o falla reportada.')
      setSaving(false)
      return
    }

    if (!services.length && !parts.length) {
      setError('Agrega al menos un servicio o repuesto a la orden.')
      setSaving(false)
      return
    }

    const duplicated = orders.some(
      (order) =>
        order.id !== editingId &&
        order.number.trim().toLowerCase() === form.number.trim().toLowerCase(),
    )

    if (duplicated) {
      setError('Ya existe una orden con ese numero.')
      setSaving(false)
      return
    }

    const client = clientById.get(form.clientId)
    const vehicle = vehicleById.get(form.vehicleId)
    const vehicleLabel = `${vehicle?.plate || ''} ${vehicle?.brand_name || vehicle?.brand || ''} ${
      vehicle?.model_name || vehicle?.model || ''
    }`.trim()
    const servicesTotal = calculateItemsTotal(services)
    const partsTotal = calculateItemsTotal(parts)

    const payload = {
      number: form.number.trim(),
      clientId: form.clientId,
      clientName: client?.name || '',
      vehicleId: form.vehicleId,
      vehicleLabel,
      status: form.status,
      priority: form.priority,
      entryDate: form.entryDate,
      promisedDate: form.promisedDate,
      failureDescription: form.failureDescription.trim(),
      diagnosis: form.diagnosis.trim(),
      services,
      parts,
      servicesTotal,
      partsTotal,
      total: servicesTotal + partsTotal,
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await updateWorkOrder(editingId, payload)
      } else {
        await createWorkOrder(payload)
      }
      await loadData()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (order) => {
    const confirmed = window.confirm(`Eliminar la orden ${order.number}?`)
    if (!confirmed) return

    await deleteWorkOrder(order.id)
    await loadData()
  }

  const renderItems = (type, title) => (
    <div className="order-items">
      <div className="order-items-title">
        <h3>{title}</h3>
        <button className="btn btn-ghost" type="button" onClick={() => addLineItem(type)}>
          <Plus size={16} />
          Agregar
        </button>
      </div>
      {form[type].length ? (
        form[type].map((item, index) => (
          <div className="order-item-row" key={`${type}-${index}`}>
            <label className="field">
              <span>Detalle</span>
              <input
                onChange={(event) => updateLineItem(type, index, 'description', event.target.value)}
                value={item.description}
              />
            </label>
            <label className="field compact-field">
              <span>Cant.</span>
              <input
                inputMode="decimal"
                onChange={(event) => updateLineItem(type, index, 'quantity', event.target.value)}
                value={item.quantity}
              />
            </label>
            <label className="field compact-field">
              <span>Precio</span>
              <input
                inputMode="decimal"
                onChange={(event) => updateLineItem(type, index, 'price', event.target.value)}
                value={item.price}
              />
            </label>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => removeLineItem(type, index)}
              aria-label="Eliminar item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))
      ) : (
        <div className="empty-inline">Sin items cargados.</div>
      )}
    </div>
  )

  return (
    <section className="usuarios-page ordenes-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Operacion diaria</span>
          <h1>Ordenes de trabajo</h1>
          <p>Gestiona ingresos al taller, servicios, repuestos, estados y totales por vehiculo.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nueva orden
        </button>
      </div>

      <div className="ordenes-summary">
        <article className="card order-mini-card">
          <FileText size={20} />
          <div>
            <strong>{orders.length}</strong>
            <span>ordenes</span>
          </div>
        </article>
        <article className="card order-mini-card">
          <Wrench size={20} />
          <div>
            <strong>{orders.filter((order) => order.status === 'En proceso').length}</strong>
            <span>en proceso</span>
          </div>
        </article>
        <article className="card order-mini-card">
          <CheckCircle2 size={20} />
          <div>
            <strong>{orders.filter((order) => order.status === 'Finalizada').length}</strong>
            <span>finalizadas</span>
          </div>
        </article>
        <article className="card order-mini-card">
          <CalendarClock size={20} />
          <div>
            <strong>
              {formatCurrency(orders.reduce((total, order) => total + (order.total || 0), 0))}
            </strong>
            <span>total historico</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar ordenes">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por numero, cliente, vehiculo, estado o motivo"
            value={query}
          />
        </label>
      </div>

      {showForm ? (
        <form className="user-form order-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar orden' : 'Crear orden'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          {!clients.length || !vehicles.length ? (
            <div className="form-warning">
              Carga al menos un cliente y un vehiculo antes de registrar ordenes.
            </div>
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
              <span>Cliente</span>
              <select
                onChange={(event) => handleClientChange(event.target.value)}
                required
                value={form.clientId}
              >
                <option value="" disabled>
                  Seleccionar cliente
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Vehiculo</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))}
                required
                value={form.vehicleId}
              >
                <option value="" disabled>
                  Seleccionar vehiculo
                </option>
                {vehiclesForClient.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {`${vehicle.plate} - ${vehicle.brand_name || vehicle.brand} ${
                      vehicle.model_name || vehicle.model
                    }`}
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
              <span>Prioridad</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                value={form.priority}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Ingreso</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, entryDate: event.target.value }))}
                type="date"
                value={form.entryDate}
              />
            </label>
            <label className="field">
              <span>Prometido</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, promisedDate: event.target.value }))}
                type="date"
                value={form.promisedDate}
              />
            </label>
          </div>

          <div className="form-grid form-grid-wide">
            <label className="field">
              <span>Motivo de ingreso</span>
              <textarea
                onChange={(event) =>
                  setForm((current) => ({ ...current, failureDescription: event.target.value }))
                }
                required
                rows="3"
                value={form.failureDescription}
              />
            </label>
            <label className="field">
              <span>Diagnostico</span>
              <textarea
                onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))}
                rows="3"
                value={form.diagnosis}
              />
            </label>
            <label className="field">
              <span>Notas internas</span>
              <textarea
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows="3"
                value={form.notes}
              />
            </label>
          </div>

          <div className="order-builder">
            {renderItems('services', 'Servicios')}
            {renderItems('parts', 'Repuestos')}
          </div>

          <div className="order-total-panel">
            <span>Servicios: {formatCurrency(totals.servicesTotal)}</span>
            <span>Repuestos: {formatCurrency(totals.partsTotal)}</span>
            <strong>Total: {formatCurrency(totals.total)}</strong>
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving || !clients.length || !vehicles.length} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear orden'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">Cargando ordenes...</div>
        ) : filteredOrders.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Vehiculo</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Ingreso</th>
                  <th>Total</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <code>{order.number}</code>
                    </td>
                    <td>{clientById.get(order.clientId)?.name || order.clientName || '-'}</td>
                    <td>{order.vehicleLabel || '-'}</td>
                    <td>
                      <span className={`order-status order-status-${order.status?.replaceAll(' ', '-').toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{order.priority}</td>
                    <td>{order.entryDate || '-'}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(order)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => handleDelete(order)} aria-label="Eliminar">
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
          <div className="empty-state">No hay ordenes cargadas todavia.</div>
        )}
      </div>
    </section>
  )
}
