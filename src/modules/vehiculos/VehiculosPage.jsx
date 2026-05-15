import { CalendarClock, Car, Edit3, FileText, Gauge, History, Plus, Search, Trash2, Wrench, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { listAppointments } from '../../services/appointmentService'
import { listClients } from '../../services/clientService'
import { listInvoices } from '../../services/invoiceService'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from '../../services/vehicleService'
import { listWorkOrders } from '../../services/workOrderService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import { VehicleSelector } from './VehicleSelector'
import './VehiculosPage.css'

const emptyForm = {
  plate: '',
  brand_id_api: '',
  brand_name: '',
  model_id_api: '',
  model_name: '',
  version_id_api: '',
  version_name: '',
  year: '',
  estimated_value: null,
  currency: 'ARS',
  mileage: '',
  clientId: '',
  status: 'En taller',
  notes: '',
  source: 'argautos',
}

const statusOptions = ['En taller', 'Pendiente', 'Entregado', 'Inactivo']

const formatCurrency = (value, currency = 'ARS') => {
  if (!value) return '-'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function VehiculosPage() {
  const { isAdmin } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [clients, setClients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  const loadData = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const [vehiclesResult, clientsResult, ordersResult, invoicesResult, appointmentsResult] = await Promise.all([
      listVehicles(),
      listClients(),
      listWorkOrders(),
      listInvoices(),
      listAppointments(),
    ])
    setVehicles(vehiclesResult)
    setClients(clientsResult)
    setOrders(ordersResult)
    setInvoices(invoicesResult)
    setAppointments(appointmentsResult)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([listVehicles(), listClients(), listWorkOrders(), listInvoices(), listAppointments()]).then(
      ([vehiclesResult, clientsResult, ordersResult, invoicesResult, appointmentsResult]) => {
        if (!active) return
        setVehicles(vehiclesResult)
        setClients(clientsResult)
        setOrders(ordersResult)
        setInvoices(invoicesResult)
        setAppointments(appointmentsResult)
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [])

  const filteredVehicles = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return vehicles

    return vehicles.filter((vehicle) => {
      const clientName = clientById.get(vehicle.clientId)?.name
      return [
        vehicle.plate,
        vehicle.brand_name || vehicle.brand,
        vehicle.model_name || vehicle.model,
        vehicle.version_name || vehicle.version,
        vehicle.year,
        vehicle.status,
        clientName,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      )
    })
  }, [clientById, query, vehicles])

  const selectedVehicleHistory = useMemo(() => {
    if (!selectedHistoryVehicle) return null

    const vehicleOrders = orders.filter((order) => order.vehicleId === selectedHistoryVehicle.id)
    const vehicleInvoices = invoices.filter((invoice) => invoice.vehicleId === selectedHistoryVehicle.id)
    const vehicleAppointments = appointments.filter(
      (appointment) => appointment.vehicleId === selectedHistoryVehicle.id,
    )

    return {
      appointments: vehicleAppointments,
      invoices: vehicleInvoices,
      orders: vehicleOrders,
      totalBilled: vehicleInvoices.reduce((total, invoice) => total + (Number(invoice.total) || 0), 0),
    }
  }, [appointments, invoices, orders, selectedHistoryVehicle])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm({
      ...emptyForm,
      clientId: clients[0]?.id || '',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (vehicle) => {
    setForm({
      plate: vehicle.plate || '',
      brand_id_api: vehicle.brand_id_api || '',
      brand_name: vehicle.brand_name || vehicle.brand || '',
      model_id_api: vehicle.model_id_api || '',
      model_name: vehicle.model_name || vehicle.model || '',
      version_id_api: vehicle.version_id_api || '',
      version_name: vehicle.version_name || vehicle.version || '',
      year: vehicle.year || '',
      estimated_value: vehicle.estimated_value || null,
      currency: vehicle.currency || 'ARS',
      mileage: vehicle.mileage || '',
      clientId: vehicle.clientId || '',
      status: vehicle.status || 'En taller',
      notes: vehicle.notes || '',
      source: vehicle.source || 'manual',
    })
    setEditingId(vehicle.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const duplicated = vehicles.some(
      (vehicle) =>
        vehicle.id !== editingId &&
        vehicle.plate?.toLowerCase() === form.plate.trim().toLowerCase(),
    )

    if (duplicated) {
      setError('Ya existe un vehiculo con esa patente.')
      setSaving(false)
      return
    }

    if (!form.brand_name.trim() || !form.model_name.trim()) {
      setError('Selecciona marca y modelo desde Arg Autos o usa carga manual.')
      setSaving(false)
      return
    }

    const client = clientById.get(form.clientId)
    const payload = {
      plate: form.plate.trim().toUpperCase(),
      patent: form.plate.trim().toUpperCase(),
      brand_id_api: form.brand_id_api || '',
      brand_name: form.brand_name.trim(),
      brand: form.brand_name.trim(),
      model_id_api: form.model_id_api || '',
      model_name: form.model_name.trim(),
      model: form.model_name.trim(),
      version_id_api: form.version_id_api || '',
      version_name: form.version_name.trim(),
      version: form.version_name.trim(),
      year: form.year.trim(),
      estimated_value: form.estimated_value,
      estimatedValue: form.estimated_value,
      currency: form.currency || 'ARS',
      mileage: form.mileage.trim(),
      kilometraje: form.mileage.trim(),
      clientId: form.clientId,
      clientName: client?.name || '',
      status: form.status,
      notes: form.notes.trim(),
      observaciones: form.notes.trim(),
      source: form.source || 'manual',
    }

    try {
      if (editingId) {
        await updateVehicle(editingId, payload)
      } else {
        await createVehicle(payload)
      }
      await loadData()
      setSelectedHistoryVehicle(null)
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicle) => {
    const confirmed = window.confirm(`Eliminar el vehiculo ${vehicle.plate}?`)
    if (!confirmed) return

    await deleteVehicle(vehicle.id)
    await loadData()
  }

  return (
    <section className="usuarios-page vehiculos-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Operacion del taller</span>
          <h1>Vehiculos</h1>
          <p>Registro de unidades por cliente para alimentar historial y ordenes de trabajo.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nuevo vehiculo
        </button>
      </div>

      <div className="vehiculos-summary">
        <article className="card vehicle-mini-card">
          <Car size={20} />
          <div>
            <strong>{vehicles.length}</strong>
            <span>vehiculos</span>
          </div>
        </article>
        <article className="card vehicle-mini-card">
          <Gauge size={20} />
          <div>
            <strong>{vehicles.filter((vehicle) => vehicle.status === 'En taller').length}</strong>
            <span>en taller</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar vehiculos">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por patente, marca, modelo, cliente o estado"
            value={query}
          />
        </label>
      </div>

      {showForm ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar vehiculo' : 'Crear vehiculo'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          {!clients.length ? (
            <div className="form-warning">Carga un cliente antes de registrar vehiculos.</div>
          ) : null}
          <div className="form-grid">
            <label className="field">
              <span>Patente</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, plate: event.target.value }))}
                required
                value={form.plate}
              />
            </label>
            <label className="field">
              <span>Cliente</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
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
              <span>Kilometraje</span>
              <input
                inputMode="numeric"
                onChange={(event) => setForm((current) => ({ ...current, mileage: event.target.value }))}
                value={form.mileage}
              />
            </label>
            <label className="field">
              <span>Observaciones</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                value={form.notes}
              />
            </label>
          </div>
          <VehicleSelector
            value={form}
            onChange={(vehicleData) => setForm((current) => ({ ...current, ...vehicleData }))}
          />
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving || !clients.length} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear vehiculo'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">Cargando vehiculos...</div>
        ) : filteredVehicles.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Marca / Modelo</th>
                  <th>Ano</th>
                  <th>Cliente</th>
                  <th>Kilometraje</th>
                  <th>Valuacion</th>
                  <th>Estado</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <code>{vehicle.plate}</code>
                    </td>
                    <td>{`${vehicle.brand_name || vehicle.brand} ${vehicle.model_name || vehicle.model}`}</td>
                    <td>{vehicle.year || '-'}</td>
                    <td>{clientById.get(vehicle.clientId)?.name || vehicle.clientName || '-'}</td>
                    <td>{vehicle.mileage || '-'}</td>
                    <td>{formatCurrency(vehicle.estimated_value, vehicle.currency)}</td>
                    <td>
                      <span className={`vehicle-status vehicle-status-${vehicle.status?.replaceAll(' ', '-').toLowerCase()}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td>{formatDate(vehicle.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(vehicle)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button history-action"
                          type="button"
                          onClick={() => setSelectedHistoryVehicle(vehicle)}
                          aria-label="Ver historial"
                        >
                          <History size={17} />
                        </button>
                        {isAdmin ? (
                          <button className="icon-button danger" type="button" onClick={() => handleDelete(vehicle)} aria-label="Eliminar">
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
          <div className="empty-state">No hay vehiculos cargados todavia.</div>
        )}
      </div>

      {selectedHistoryVehicle && selectedVehicleHistory ? (
        <section className="vehicle-history card">
          <div className="form-title">
            <div>
              <h2>Historial de {selectedHistoryVehicle.plate}</h2>
              <p>
                {`${selectedHistoryVehicle.brand_name || selectedHistoryVehicle.brand} ${
                  selectedHistoryVehicle.model_name || selectedHistoryVehicle.model
                }`}
              </p>
            </div>
            <button className="icon-button" type="button" onClick={() => setSelectedHistoryVehicle(null)} aria-label="Cerrar historial">
              <X size={18} />
            </button>
          </div>

          <div className="history-summary">
            <article>
              <Wrench size={18} />
              <strong>{selectedVehicleHistory.orders.length}</strong>
              <span>ordenes</span>
            </article>
            <article>
              <FileText size={18} />
              <strong>{formatCurrency(selectedVehicleHistory.totalBilled)}</strong>
              <span>facturado</span>
            </article>
            <article>
              <CalendarClock size={18} />
              <strong>{selectedVehicleHistory.appointments.length}</strong>
              <span>turnos</span>
            </article>
          </div>

          <div className="history-grid">
            <div className="history-list">
              <h3>Ordenes</h3>
              {selectedVehicleHistory.orders.length ? (
                selectedVehicleHistory.orders.map((order) => (
                  <div className="history-row" key={order.id}>
                    <strong>{order.number}</strong>
                    <span>{order.status}</span>
                    <b>{formatCurrency(order.total)}</b>
                  </div>
                ))
              ) : (
                <p>No hay ordenes para este vehiculo.</p>
              )}
            </div>
            <div className="history-list">
              <h3>Facturas</h3>
              {selectedVehicleHistory.invoices.length ? (
                selectedVehicleHistory.invoices.map((invoice) => (
                  <div className="history-row" key={invoice.id}>
                    <strong>{invoice.number}</strong>
                    <span>{invoice.status}</span>
                    <b>{formatCurrency(invoice.total)}</b>
                  </div>
                ))
              ) : (
                <p>No hay facturas asociadas.</p>
              )}
            </div>
            <div className="history-list">
              <h3>Turnos</h3>
              {selectedVehicleHistory.appointments.length ? (
                selectedVehicleHistory.appointments.map((appointment) => (
                  <div className="history-row" key={appointment.id}>
                    <strong>{appointment.date}</strong>
                    <span>{appointment.time}</span>
                    <b>{appointment.status}</b>
                  </div>
                ))
              ) : (
                <p>No hay turnos asociados.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  )
}
