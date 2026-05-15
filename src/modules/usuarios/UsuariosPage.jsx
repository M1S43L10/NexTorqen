import { Edit3, Eye, EyeOff, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GearLoader } from '../../components/GearLoader'
import { createUser, deleteUser, listUsers, updateUser } from '../../services/userService'
import { formatDate } from '../../utils/date'
import './UsuariosPage.css'

const emptyForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'empleado',
}

export function UsuariosPage() {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showPasswords, setShowPasswords] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadUsers = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const result = await listUsers()
    setUsers(result)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    listUsers().then((result) => {
      if (!active) return
      setUsers(result)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return users

    return users.filter((user) =>
      [user.name, user.username, user.email, user.role].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [query, users])

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

  const openEdit = (user) => {
    setForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'empleado',
    })
    setEditingId(user.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const duplicated = users.some(
      (user) =>
        user.id !== editingId &&
        (user.username.toLowerCase() === form.username.trim().toLowerCase() ||
          user.email.toLowerCase() === form.email.trim().toLowerCase()),
    )

    if (duplicated) {
      setError('Ya existe un usuario con ese usuario o email.')
      setSaving(false)
      return
    }

  const payload = {
      ...form,
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      authPassword: form.password.length >= 6 ? form.password : `${form.password}123456`,
    }

    try {
      if (editingId) {
        await updateUser(editingId, payload)
      } else {
        await createUser(payload)
      }
      await loadUsers()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user) => {
    const confirmed = window.confirm(`Eliminar el usuario ${user.username}?`)
    if (!confirmed) return

    await deleteUser(user.id)
    await loadUsers()
  }

  return (
    <section className="usuarios-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Administración</span>
          <h1>Gestión de usuarios</h1>
          <p>CRUD inicial con roles, búsqueda y visualización de contraseñas para desarrollo.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar usuarios">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, usuario, email o rol"
            value={query}
          />
        </label>
        <button className="btn btn-ghost" type="button" onClick={() => setShowPasswords((value) => !value)}>
          {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
          {showPasswords ? 'Ocultar claves' : 'Ver claves'}
        </button>
      </div>

      {showForm ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar usuario' : 'Crear usuario'}</h2>
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
              <span>Usuario</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                required
                value={form.username}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                inputMode="email"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                type="text"
                value={form.email}
              />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                type="text"
                value={form.password}
              />
            </label>
            <label className="field">
              <span>Rol</span>
              <select
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                value={form.role}
              >
                <option value="admin">admin</option>
                <option value="empleado">empleado</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">
            <GearLoader label="Cargando usuarios..." />
          </div>
        ) : filteredUsers.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Contraseña</th>
                  <th>Rol</th>
                  <th>Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <code>{showPasswords ? user.password : '••••••••'}</code>
                    </td>
                    <td>
                      <span className={`status-pill status-${user.role}`}>{user.role}</span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => openEdit(user)} aria-label="Editar">
                          <Edit3 size={17} />
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => handleDelete(user)} aria-label="Eliminar">
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
          <div className="empty-state">No hay usuarios que coincidan con la búsqueda.</div>
        )}
      </div>
    </section>
  )
}
