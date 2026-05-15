import { Edit3, Mail, MapPin, MessageCircle, Phone, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from '../../services/clientService'
import { formatDate } from '../../utils/date'
import { clientGreetingMessage, openWhatsApp } from '../../services/whatsappService'
import '../usuarios/UsuariosPage.css'
import './ClientesPage.css'

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  document: '',
  address: '',
  notes: '',
}

export function ClientesPage() {
  const { isAdmin } = useAuth()
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadClients = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const result = await listClients()
    setClients(result)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    listClients().then((result) => {
      if (!active) return
      setClients(result)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return clients

    return clients.filter((client) =>
      [client.name, client.phone, client.email, client.document, client.address].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [clients, query])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (client) => {
    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      document: client.document || '',
      address: client.address || '',
      notes: client.notes || '',
    })
    setEditingId(client.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const duplicated = clients.some(
      (client) =>
        client.id !== editingId &&
        form.email.trim() &&
        client.email?.toLowerCase() === form.email.trim().toLowerCase(),
    )

    if (duplicated) {
      setError('Ya existe un cliente con ese email.')
      setSaving(false)
      return
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      document: form.document.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    }

    try {
      if (editingId) {
        await updateClient(editingId, payload)
      } else {
        await createClient(payload)
      }
      await loadClients()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client) => {
    const confirmed = window.confirm(`Eliminar el cliente ${client.name}?`)
    if (!confirmed) return

    await deleteClient(client.id)
    await loadClients()
  }

  return (
    <section className="usuarios-page clientes-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Base comercial</span>
          <h1>Clientes</h1>
          <p>Registro centralizado de clientes para vincular vehiculos y ordenes futuras.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nuevo cliente
        </button>
      </div>

      <div className="clientes-summary">
        <article className="card client-mini-card">
          <Phone size={19} />
          <div>
            <strong>{clients.filter((client) => client.phone).length}</strong>
            <span>con telefono</span>
          </div>
        </article>
        <article className="card client-mini-card">
          <Mail size={19} />
          <div>
            <strong>{clients.filter((client) => client.email).length}</strong>
            <span>con email</span>
          </div>
        </article>
        <article className="card client-mini-card">
          <MapPin size={19} />
          <div>
            <strong>{clients.filter((client) => client.address).length}</strong>
            <span>con direccion</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar clientes">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, telefono, email, documento o direccion"
            value={query}
          />
        </label>
      </div>

      {showForm ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar cliente' : 'Crear cliente'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={form.name}
              />
            </label>
            <label className="field">
              <span>Telefono</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                required
                value={form.phone}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                inputMode="email"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                type="text"
                value={form.email}
              />
            </label>
            <label className="field">
              <span>Documento</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, document: event.target.value }))}
                value={form.document}
              />
            </label>
            <label className="field">
              <span>Direccion</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                value={form.address}
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
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">Cargando clientes...</div>
        ) : filteredClients.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Telefono</th>
                  <th>Email</th>
                  <th>Documento</th>
                  <th>Direccion</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.phone}</td>
                    <td>{client.email || '-'}</td>
                    <td>{client.document || '-'}</td>
                    <td>{client.address || '-'}</td>
                    <td>{formatDate(client.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(client)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button whatsapp-action"
                          type="button"
                          onClick={() => openWhatsApp(client.phone, clientGreetingMessage(client))}
                          aria-label="Enviar WhatsApp"
                        >
                          <MessageCircle size={17} />
                        </button>
                        {isAdmin ? (
                          <button className="icon-button danger" type="button" onClick={() => handleDelete(client)} aria-label="Eliminar">
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
          <div className="empty-state">No hay clientes cargados todavia.</div>
        )}
      </div>
    </section>
  )
}
