import { Car, Edit3, Gauge, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listClients } from '../../services/clientService'
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from '../../services/vehicleService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './VehiculosPage.css'

const emptyForm = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  mileage: '',
  clientId: '',
  status: 'En taller',
  notes: '',
}

const statusOptions = ['En taller', 'Pendiente', 'Entregado', 'Inactivo']

export function VehiculosPage() {
  const [vehicles, setVehicles] = useState([])
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
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
    const [vehiclesResult, clientsResult] = await Promise.all([listVehicles(), listClients()])
    setVehicles(vehiclesResult)
    setClients(clientsResult)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    Promise.all([listVehicles(), listClients()]).then(([vehiclesResult, clientsResult]) => {
      if (!active) return
      setVehicles(vehiclesResult)
      setClients(clientsResult)
      setLoading(false)
    })

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
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        vehicle.status,
        clientName,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      )
    })
  }, [clientById, query, vehicles])

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
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage || '',
      clientId: vehicle.clientId || '',
      status: vehicle.status || 'En taller',
      notes: vehicle.notes || '',
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
        vehicle.plate.toLowerCase() === form.plate.trim().toLowerCase(),
    )

    if (duplicated) {
      setError('Ya existe un vehiculo con esa patente.')
      setSaving(false)
      return
    }

    const client = clientById.get(form.clientId)
    const payload = {
      plate: form.plate.trim().toUpperCase(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: form.year.trim(),
      color: form.color.trim(),
      mileage: form.mileage.trim(),
      clientId: form.clientId,
      clientName: client?.name || '',
      status: form.status,
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await updateVehicle(editingId, payload)
      } else {
        await createVehicle(payload)
      }
      await loadData()
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
              <span>Marca</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                required
                value={form.brand}
              />
            </label>
            <label className="field">
              <span>Modelo</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
                required
                value={form.model}
              />
            </label>
            <label className="field">
              <span>Ano</span>
              <input
                inputMode="numeric"
                onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
                value={form.year}
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
              <span>Color</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                value={form.color}
              />
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
                    <td>{`${vehicle.brand} ${vehicle.model}`}</td>
                    <td>{vehicle.year || '-'}</td>
                    <td>{clientById.get(vehicle.clientId)?.name || vehicle.clientName || '-'}</td>
                    <td>{vehicle.mileage || '-'}</td>
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
                        <button className="icon-button danger" type="button" onClick={() => handleDelete(vehicle)} aria-label="Eliminar">
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
          <div className="empty-state">No hay vehiculos cargados todavia.</div>
        )}
      </div>
    </section>
  )
}
