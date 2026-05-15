import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { GearLoader } from '../../components/GearLoader'
import { useAuth } from '../../hooks/useAuth'
import { listUsers } from '../../services/userService'
import { listWorkOrders } from '../../services/workOrderService'
import {
  createWorkAssignment,
  deleteWorkAssignment,
  listWorkAssignments,
  updateWorkAssignment,
} from '../../services/workAssignmentService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './TrabajosPage.css'

const createEmptyForm = () => ({
  title: '',
  description: '',
  assignedToId: '',
  assignedToUid: '',
  assignedToName: '',
  assignedToEmail: '',
  orderId: '',
  orderNumber: '',
  priority: 'Normal',
  status: 'Pendiente',
  dueDate: '',
})

const priorityOptions = ['Baja', 'Normal', 'Alta', 'Urgente']
const statusOptions = ['Pendiente', 'En proceso', 'Completada', 'Cancelada']

const statusClass = (status) =>
  ({
    Pendiente: 'status-pending',
    'En proceso': 'status-progress',
    Completada: 'status-done',
    Cancelada: 'status-cancelled',
  })[status] || 'status-pending'

export function TrabajosPage() {
  const { isAdmin, user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [employees, setEmployees] = useState([])
  const [orders, setOrders] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(createEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const orderById = useMemo(() => new Map(orders.map((order) => [order.id, order])), [orders])

  const metrics = useMemo(
    () => ({
      total: assignments.length,
      pending: assignments.filter((item) => item.status === 'Pendiente').length,
      progress: assignments.filter((item) => item.status === 'En proceso').length,
      done: assignments.filter((item) => item.status === 'Completada').length,
    }),
    [assignments],
  )

  const loadData = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    try {
      const [assignmentsResult, usersResult, ordersResult] = await Promise.allSettled([
        listWorkAssignments(user),
        isAdmin ? listUsers() : Promise.resolve([]),
        listWorkOrders(),
      ])
      if (assignmentsResult.status === 'rejected') throw assignmentsResult.reason
      setAssignments(assignmentsResult.value)
      setEmployees(
        usersResult.status === 'fulfilled'
          ? usersResult.value.filter((item) => item.role === 'empleado')
          : [],
      )
      setOrders(ordersResult.status === 'fulfilled' ? ordersResult.value : [])
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      if (withLoading) setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    Promise.allSettled([
      listWorkAssignments(user),
      isAdmin ? listUsers() : Promise.resolve([]),
      listWorkOrders(),
    ])
      .then(([assignmentsResult, usersResult, ordersResult]) => {
        if (!active) return
        if (assignmentsResult.status === 'rejected') throw assignmentsResult.reason
        setAssignments(assignmentsResult.value)
        setEmployees(
          usersResult.status === 'fulfilled'
            ? usersResult.value.filter((item) => item.role === 'empleado')
            : [],
        )
        setOrders(ordersResult.status === 'fulfilled' ? ordersResult.value : [])
        setError('')
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isAdmin, user])

  const filteredAssignments = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return assignments

    return assignments.filter((assignment) =>
      [
        assignment.title,
        assignment.description,
        assignment.assignedToName,
        assignment.orderNumber,
        assignment.priority,
        assignment.status,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [assignments, query])

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const handleEmployeeChange = (employeeId) => {
    const employee = employees.find((item) => item.id === employeeId)
    setForm((current) => ({
      ...current,
      assignedToId: employee?.id || '',
      assignedToUid: employee?.uid || employee?.id || '',
      assignedToName: employee?.name || '',
      assignedToEmail: employee?.email || '',
    }))
  }

  const handleOrderChange = (orderId) => {
    const order = orderById.get(orderId)
    setForm((current) => ({
      ...current,
      orderId,
      orderNumber: order?.number || '',
      title: current.title || (order ? `Trabajo sobre ${order.number}` : ''),
    }))
  }

  const openCreate = () => {
    setForm({
      ...createEmptyForm(),
      assignedToId: employees[0]?.id || '',
      assignedToUid: employees[0]?.uid || employees[0]?.id || '',
      assignedToName: employees[0]?.name || '',
      assignedToEmail: employees[0]?.email || '',
    })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (assignment) => {
    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      assignedToId: assignment.assignedToId || '',
      assignedToUid: assignment.assignedToUid || '',
      assignedToName: assignment.assignedToName || '',
      assignedToEmail: assignment.assignedToEmail || '',
      orderId: assignment.orderId || '',
      orderNumber: assignment.orderNumber || '',
      priority: assignment.priority || 'Normal',
      status: assignment.status || 'Pendiente',
      dueDate: assignment.dueDate || '',
    })
    setEditingId(assignment.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (!form.title.trim()) throw new Error('Ingresá un título para el trabajo.')
      if (!form.assignedToUid) throw new Error('Seleccioná un empleado.')

      if (editingId) {
        await updateWorkAssignment(editingId, form)
      } else {
        await createWorkAssignment(form, user)
      }

      await loadData(false)
      resetForm()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (assignment, status) => {
    await updateWorkAssignment(assignment.id, { ...assignment, status })
    await loadData(false)
  }

  const handleDelete = async (assignment) => {
    if (!confirm(`Eliminar trabajo "${assignment.title}"?`)) return
    await deleteWorkAssignment(assignment.id)
    await loadData(false)
  }

  return (
    <section className="trabajos-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Equipo técnico</span>
          <h1>Trabajos asignados</h1>
          <p>
            Asigná tareas a empleados, vinculalas a órdenes y mantené visible el estado de cada
            intervención.
          </p>
        </div>
        {isAdmin ? (
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            <Plus size={18} />
            Asignar trabajo
          </button>
        ) : null}
      </div>

      <div className="assignment-metrics">
        <article className="card assignment-kpi">
          <BriefcaseBusiness size={20} />
          <span>Total</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="card assignment-kpi">
          <Bell size={20} />
          <span>Pendientes</span>
          <strong>{metrics.pending}</strong>
        </article>
        <article className="card assignment-kpi">
          <ClipboardList size={20} />
          <span>En proceso</span>
          <strong>{metrics.progress}</strong>
        </article>
        <article className="card assignment-kpi">
          <CheckCircle2 size={20} />
          <span>Completadas</span>
          <strong>{metrics.done}</strong>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box">
          <Search size={18} />
          <input
            placeholder="Buscar por trabajo, empleado, orden o estado..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {error && !showForm ? <div className="form-error">{error}</div> : null}

      {showForm && isAdmin ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar asignación' : 'Nueva asignación'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <div className="form-grid assignment-form-grid">
            <label className="field">
              <span>Título</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Empleado</span>
              <select
                required
                value={form.assignedToId}
                onChange={(event) => handleEmployeeChange(event.target.value)}
              >
                <option value="">Seleccionar empleado</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} · {employee.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Orden vinculada</span>
              <select value={form.orderId} onChange={(event) => handleOrderChange(event.target.value)}>
                <option value="">Sin orden vinculada</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.number} · {order.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Prioridad</span>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fecha límite</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>
            <label className="field assignment-description">
              <span>Detalle del trabajo</span>
              <textarea
                rows="4"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Asignar y notificar'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="assignment-list">
        {loading ? (
          <div className="card empty-state">
            <GearLoader label="Cargando trabajos..." />
          </div>
        ) : filteredAssignments.length ? (
          filteredAssignments.map((assignment) => (
            <article className="card assignment-card" key={assignment.id}>
              <div className="assignment-card-main">
                <div className="assignment-card-title">
                  <span className={`assignment-status ${statusClass(assignment.status)}`}>
                    {assignment.status}
                  </span>
                  <h2>{assignment.title}</h2>
                </div>
                <p>{assignment.description || 'Sin detalle adicional.'}</p>
                <div className="assignment-meta">
                  <span>Empleado: {assignment.assignedToName || 'Sin asignar'}</span>
                  <span>Prioridad: {assignment.priority}</span>
                  {assignment.orderNumber ? <span>Orden: {assignment.orderNumber}</span> : null}
                  {assignment.dueDate ? <span>Fecha límite: {assignment.dueDate}</span> : null}
                  <span>Creación: {formatDate(assignment.createdAt)}</span>
                </div>
              </div>

              <div className="assignment-actions">
                <select
                  value={assignment.status}
                  onChange={(event) => handleStatusChange(assignment, event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {isAdmin ? (
                  <>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => openEdit(assignment)}
                      aria-label="Editar trabajo"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => handleDelete(assignment)}
                      aria-label="Eliminar trabajo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <div className="card empty-state">
            {isAdmin
              ? 'Todavía no hay trabajos asignados.'
              : 'No tenés trabajos asignados por el momento.'}
          </div>
        )}
      </div>
    </section>
  )
}
