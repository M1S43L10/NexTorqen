import { CalendarClock, CheckCircle2, Clock, Edit3, MessageCircle, Plus, Search, Trash2, Wrench, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
} from '../../services/appointmentService'
import { listClients } from '../../services/clientService'
import { listVehicles } from '../../services/vehicleService'
import { appointmentCancelledMessage, appointmentReminderMessage, openWhatsApp } from '../../services/whatsappService'
import { createWorkOrder, listWorkOrders } from '../../services/workOrderService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './TurnosPage.css'

const createEmptyForm = () => ({
  clientId: '',
  vehicleId: '',
  date: new Date().toISOString().slice(0, 10),
  time: '09:00',
  duration: '60',
  status: 'Programado',
  type: 'Diagnostico',
  reason: '',
  assignedTo: '',
  notes: '',
})

const statusOptions = ['Programado', 'Confirmado', 'En taller', 'Completado', 'Cancelado']
const typeOptions = [
  'Diagnostico',
  'Service',
  'Cambio de aceite',
  'Frenos',
  'Electricidad',
  'Revision general',
]

const todayIso = () => new Date().toISOString().slice(0, 10)

export function TurnosPage() {
  const { isAdmin } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [orders, setOrders] = useState([])
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

  const loadData = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const [appointmentsResult, clientsResult, vehiclesResult, ordersResult] = await Promise.all([
      listAppointments(),
      listClients(),
      listVehicles(),
      listWorkOrders(),
    ])
    setAppointments(appointmentsResult)
    setClients(clientsResult)
    setVehicles(vehiclesResult)
    setOrders(ordersResult)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([listAppointments(), listClients(), listVehicles(), listWorkOrders()]).then(
      ([appointmentsResult, clientsResult, vehiclesResult, ordersResult]) => {
        if (!active) return
        setAppointments(appointmentsResult)
        setClients(clientsResult)
        setVehicles(vehiclesResult)
        setOrders(ordersResult)
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const filteredAppointments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return appointments

    return appointments.filter((appointment) =>
      [
        appointment.clientName,
        appointment.vehicleLabel,
        appointment.status,
        appointment.type,
        appointment.reason,
        appointment.assignedTo,
        appointment.date,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [appointments, query])

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.date === todayIso()),
    [appointments],
  )

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.date >= todayIso() && !['Completado', 'Cancelado'].includes(appointment.status),
      ),
    [appointments],
  )

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    const firstClientId = clients[0]?.id || ''
    setForm({
      ...createEmptyForm(),
      clientId: firstClientId,
      vehicleId: vehicles.find((vehicle) => vehicle.clientId === firstClientId)?.id || '',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (appointment) => {
    setForm({
      clientId: appointment.clientId || '',
      vehicleId: appointment.vehicleId || '',
      date: appointment.date || todayIso(),
      time: appointment.time || '09:00',
      duration: String(appointment.duration || '60'),
      status: appointment.status || 'Programado',
      type: appointment.type || 'Diagnostico',
      reason: appointment.reason || '',
      assignedTo: appointment.assignedTo || '',
      notes: appointment.notes || '',
    })
    setEditingId(appointment.id)
    setShowForm(true)
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

    if (!form.clientId || !form.vehicleId) {
      setError('Selecciona un cliente y un vehiculo para agendar el turno.')
      setSaving(false)
      return
    }

    if (!form.reason.trim()) {
      setError('Carga el motivo del turno.')
      setSaving(false)
      return
    }

    const duplicatedSlot = appointments.some(
      (appointment) =>
        appointment.id !== editingId &&
        appointment.date === form.date &&
        appointment.time === form.time &&
        appointment.status !== 'Cancelado',
    )

    if (duplicatedSlot) {
      setError('Ya existe un turno activo en esa fecha y horario.')
      setSaving(false)
      return
    }

    const client = clientById.get(form.clientId)
    const vehicle = vehicleById.get(form.vehicleId)
    const vehicleLabel = `${vehicle?.plate || ''} ${vehicle?.brand_name || vehicle?.brand || ''} ${
      vehicle?.model_name || vehicle?.model || ''
    }`.trim()

    const payload = {
      clientId: form.clientId,
      clientName: client?.name || '',
      vehicleId: form.vehicleId,
      vehicleLabel,
      date: form.date,
      time: form.time,
      duration: Number(form.duration) || 60,
      status: form.status,
      type: form.type,
      reason: form.reason.trim(),
      assignedTo: form.assignedTo.trim(),
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await updateAppointment(editingId, payload)
      } else {
        await createAppointment(payload)
      }
      await loadData()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (appointment) => {
    const confirmed = window.confirm(`Eliminar el turno de ${appointment.clientName}?`)
    if (!confirmed) return

    await deleteAppointment(appointment.id)
    await loadData()
  }

  const handleCreateOrder = async (appointment) => {
    if (appointment.workOrderId) return

    const confirmed = window.confirm(`Crear orden de trabajo para el turno de ${appointment.clientName}?`)
    if (!confirmed) return

    const nextNumber = `OT-${String(orders.length + 1).padStart(5, '0')}`
    const payload = {
      number: nextNumber,
      clientId: appointment.clientId,
      clientName: appointment.clientName || '',
      vehicleId: appointment.vehicleId,
      vehicleLabel: appointment.vehicleLabel || '',
      status: 'Pendiente',
      priority: 'Normal',
      entryDate: appointment.date,
      promisedDate: '',
      failureDescription: appointment.reason,
      diagnosis: '',
      services: [
        {
          description: appointment.type || appointment.reason,
          quantity: 1,
          price: 0,
          subtotal: 0,
          stockItemId: '',
          sku: '',
        },
      ],
      parts: [],
      servicesTotal: 0,
      partsTotal: 0,
      total: 0,
      notes: appointment.notes || '',
      sourceAppointmentId: appointment.id,
    }

    try {
      const order = await createWorkOrder(payload)
      await updateAppointment(appointment.id, {
        ...appointment,
        status: 'En taller',
        workOrderId: order.id,
        workOrderNumber: order.number,
      })
      await loadData()
    } catch (conversionError) {
      setError(conversionError.message)
    }
  }

  const handleSendAppointmentMessage = (appointment) => {
    const client = clientById.get(appointment.clientId)
    const message =
      appointment.status === 'Cancelado'
        ? appointmentCancelledMessage(appointment)
        : appointmentReminderMessage(appointment)
    openWhatsApp(client?.phone, message)
  }

  return (
    <section className="usuarios-page turnos-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Agenda del taller</span>
          <h1>Turnos</h1>
          <p>Planifica ingresos, reserva horarios y anticipa la carga operativa del taller.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nuevo turno
        </button>
      </div>

      <div className="turnos-summary">
        <article className="card appointment-mini-card">
          <CalendarClock size={20} />
          <div>
            <strong>{appointments.length}</strong>
            <span>turnos</span>
          </div>
        </article>
        <article className="card appointment-mini-card">
          <Clock size={20} />
          <div>
            <strong>{todayAppointments.length}</strong>
            <span>hoy</span>
          </div>
        </article>
        <article className="card appointment-mini-card">
          <CheckCircle2 size={20} />
          <div>
            <strong>{upcomingAppointments.length}</strong>
            <span>proximos</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar turnos">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente, vehiculo, estado, tipo, responsable o fecha"
            value={query}
          />
        </label>
      </div>

      {showForm ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar turno' : 'Crear turno'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          {!clients.length || !vehicles.length ? (
            <div className="form-warning">Carga al menos un cliente y un vehiculo antes de agendar turnos.</div>
          ) : null}
          <div className="form-grid">
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
              <span>Fecha</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={form.date}
              />
            </label>
            <label className="field">
              <span>Hora</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                type="time"
                value={form.time}
              />
            </label>
            <label className="field">
              <span>Duracion min.</span>
              <input
                inputMode="numeric"
                onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))}
                value={form.duration}
              />
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
              <span>Tipo</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                value={form.type}
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Responsable</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
                value={form.assignedTo}
              />
            </label>
            <label className="field">
              <span>Motivo</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                required
                value={form.reason}
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
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving || !clients.length || !vehicles.length} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear turno'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">Cargando turnos...</div>
        ) : filteredAppointments.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Vehiculo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Motivo</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.date}</td>
                    <td>
                      <code>{appointment.time}</code>
                    </td>
                    <td>{appointment.clientName}</td>
                    <td>{appointment.vehicleLabel || '-'}</td>
                    <td>{appointment.type}</td>
                    <td>
                      <span className={`appointment-status appointment-status-${appointment.status?.replaceAll(' ', '-').toLowerCase()}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td>{appointment.assignedTo || '-'}</td>
                    <td>
                      <div className="appointment-reason">
                        <span>{appointment.reason}</span>
                        {appointment.workOrderNumber ? <code>{appointment.workOrderNumber}</code> : null}
                      </div>
                    </td>
                    <td>{formatDate(appointment.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(appointment)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button whatsapp-action"
                          type="button"
                          onClick={() => handleSendAppointmentMessage(appointment)}
                          aria-label="Enviar WhatsApp"
                        >
                          <MessageCircle size={17} />
                        </button>
                        {!appointment.workOrderId && !['Completado', 'Cancelado'].includes(appointment.status) ? (
                          <button className="icon-button order-action" type="button" onClick={() => handleCreateOrder(appointment)} aria-label="Crear orden">
                            <Wrench size={17} />
                          </button>
                        ) : null}
                        {isAdmin ? (
                          <button className="icon-button danger" type="button" onClick={() => handleDelete(appointment)} aria-label="Eliminar">
                            <Trash2 size={17} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No hay turnos cargados todavia.</div>
        )}
      </div>
    </section>
  )
}
