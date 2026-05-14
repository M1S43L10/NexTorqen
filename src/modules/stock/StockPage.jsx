import { AlertTriangle, Edit3, Package, Plus, Search, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  createStockItem,
  deleteStockItem,
  listStockItems,
  updateStockItem,
} from '../../services/stockService'
import { formatDate } from '../../utils/date'
import '../usuarios/UsuariosPage.css'
import './StockPage.css'

const emptyForm = {
  sku: '',
  name: '',
  category: '',
  brand: '',
  supplier: '',
  location: '',
  stock: '',
  minStock: '',
  cost: '',
  salePrice: '',
  notes: '',
  active: true,
}

const toNumber = (value) => Number(String(value || '').replace(',', '.')) || 0

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0)

export function StockPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadItems = async (withLoading = true) => {
    if (withLoading) setLoading(true)
    const result = await listStockItems()
    setItems(result)
    if (withLoading) setLoading(false)
  }

  useEffect(() => {
    let active = true

    listStockItems().then((result) => {
      if (!active) return
      setItems(result)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return items

    return items.filter((item) =>
      [item.sku, item.name, item.category, item.brand, item.supplier, item.location].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized),
      ),
    )
  }, [items, query])

  const lowStockItems = useMemo(
    () => items.filter((item) => toNumber(item.stock) <= toNumber(item.minStock)),
    [items],
  )

  const stockValue = useMemo(
    () => items.reduce((total, item) => total + toNumber(item.stock) * toNumber(item.cost), 0),
    [items],
  )

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

  const openEdit = (item) => {
    setForm({
      sku: item.sku || '',
      name: item.name || '',
      category: item.category || '',
      brand: item.brand || '',
      supplier: item.supplier || '',
      location: item.location || '',
      stock: String(item.stock ?? ''),
      minStock: String(item.minStock ?? ''),
      cost: String(item.cost ?? ''),
      salePrice: String(item.salePrice ?? ''),
      notes: item.notes || '',
      active: item.active !== false,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const duplicated = items.some(
      (item) =>
        item.id !== editingId &&
        form.sku.trim() &&
        item.sku?.toLowerCase() === form.sku.trim().toLowerCase(),
    )

    if (duplicated) {
      setError('Ya existe un repuesto con ese codigo SKU.')
      setSaving(false)
      return
    }

    const payload = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim(),
      supplier: form.supplier.trim(),
      location: form.location.trim(),
      stock: toNumber(form.stock),
      minStock: toNumber(form.minStock),
      cost: toNumber(form.cost),
      salePrice: toNumber(form.salePrice),
      notes: form.notes.trim(),
      active: form.active,
    }

    try {
      if (editingId) {
        await updateStockItem(editingId, payload)
      } else {
        await createStockItem(payload)
      }
      await loadItems()
      resetForm()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Eliminar el repuesto ${item.name}?`)
    if (!confirmed) return

    await deleteStockItem(item.id)
    await loadItems()
  }

  return (
    <section className="usuarios-page stock-page">
      <div className="usuarios-header">
        <div className="page-heading">
          <span>Inventario operativo</span>
          <h1>Stock y repuestos</h1>
          <p>Controla repuestos, existencias minimas, costos, precios y ubicaciones del taller.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          Nuevo repuesto
        </button>
      </div>

      <div className="stock-summary">
        <article className="card stock-mini-card">
          <Package size={20} />
          <div>
            <strong>{items.length}</strong>
            <span>repuestos</span>
          </div>
        </article>
        <article className="card stock-mini-card">
          <AlertTriangle size={20} />
          <div>
            <strong>{lowStockItems.length}</strong>
            <span>bajo minimo</span>
          </div>
        </article>
        <article className="card stock-mini-card">
          <Package size={20} />
          <div>
            <strong>{formatCurrency(stockValue)}</strong>
            <span>valor costo</span>
          </div>
        </article>
      </div>

      <div className="usuarios-toolbar card">
        <label className="search-box" aria-label="Buscar repuestos">
          <Search size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por SKU, nombre, categoria, marca, proveedor o ubicacion"
            value={query}
          />
        </label>
      </div>

      {showForm ? (
        <form className="user-form card" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? 'Editar repuesto' : 'Crear repuesto'}</h2>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              <X size={18} />
            </button>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="form-grid">
            <label className="field">
              <span>SKU</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                value={form.sku}
              />
            </label>
            <label className="field">
              <span>Repuesto</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={form.name}
              />
            </label>
            <label className="field">
              <span>Categoria</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                value={form.category}
              />
            </label>
            <label className="field">
              <span>Marca</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
                value={form.brand}
              />
            </label>
            <label className="field">
              <span>Proveedor</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, supplier: event.target.value }))}
                value={form.supplier}
              />
            </label>
            <label className="field">
              <span>Ubicacion</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                value={form.location}
              />
            </label>
            <label className="field">
              <span>Stock</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                required
                value={form.stock}
              />
            </label>
            <label className="field">
              <span>Minimo</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, minStock: event.target.value }))}
                value={form.minStock}
              />
            </label>
            <label className="field">
              <span>Costo</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, cost: event.target.value }))}
                value={form.cost}
              />
            </label>
            <label className="field">
              <span>Precio venta</span>
              <input
                inputMode="decimal"
                onChange={(event) => setForm((current) => ({ ...current, salePrice: event.target.value }))}
                value={form.salePrice}
              />
            </label>
            <label className="field">
              <span>Notas</span>
              <input
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                value={form.notes}
              />
            </label>
            <label className="field checkbox-field">
              <span>Activo</span>
              <input
                checked={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                type="checkbox"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear repuesto'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="users-table card">
        {loading ? (
          <div className="empty-state">Cargando repuestos...</div>
        ) : filteredItems.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Repuesto</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Minimo</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>Ubicacion</th>
                  <th>Estado</th>
                  <th>Creacion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const lowStock = toNumber(item.stock) <= toNumber(item.minStock)
                  return (
                    <tr key={item.id}>
                      <td>
                        <code>{item.sku || '-'}</code>
                      </td>
                      <td>{item.name}</td>
                      <td>{item.category || '-'}</td>
                      <td>{item.stock}</td>
                      <td>{item.minStock || 0}</td>
                      <td>{formatCurrency(item.cost)}</td>
                      <td>{formatCurrency(item.salePrice)}</td>
                      <td>{item.location || '-'}</td>
                      <td>
                        <span className={`stock-status ${lowStock ? 'stock-status-low' : 'stock-status-ok'}`}>
                          {lowStock ? 'Bajo minimo' : 'Disponible'}
                        </span>
                      </td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="icon-button" type="button" onClick={() => openEdit(item)} aria-label="Editar">
                            <Edit3 size={17} />
                          </button>
                          <button className="icon-button danger" type="button" onClick={() => handleDelete(item)} aria-label="Eliminar">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No hay repuestos cargados todavia.</div>
        )}
      </div>
    </section>
  )
}
