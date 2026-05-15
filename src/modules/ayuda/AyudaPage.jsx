import {
  BookOpen,
  CalendarClock,
  Car,
  ClipboardList,
  FileText,
  MessageCircle,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'
import './AyudaPage.css'

const modules = [
  {
    title: 'Clientes',
    icon: Users,
    purpose: 'Centraliza los datos de cada cliente para vincular vehiculos, turnos, ordenes y facturas.',
    uses: ['Crear y editar datos de contacto.', 'Enviar WhatsApp rapido.', 'Exportar la lista filtrada a CSV.'],
  },
  {
    title: 'Vehiculos',
    icon: Car,
    purpose: 'Registra cada unidad del cliente con marca, modelo, version, patente, kilometraje e historial.',
    uses: ['Buscar datos con Arg Autos o cargar manualmente.', 'Consultar historial de ordenes, facturas y turnos.', 'Mantener estado operativo del vehiculo.'],
  },
  {
    title: 'Turnos',
    icon: CalendarClock,
    purpose: 'Organiza ingresos al taller antes de crear una orden de trabajo.',
    uses: ['Agendar fecha, hora, tipo de servicio y responsable.', 'Enviar recordatorio por WhatsApp.', 'Convertir el turno en orden cuando el vehiculo llega.'],
  },
  {
    title: 'Ordenes',
    icon: ClipboardList,
    purpose: 'Controla el trabajo tecnico del taller, servicios, repuestos, estados y totales.',
    uses: ['Agregar servicios y repuestos.', 'Descontar stock si el repuesto viene del inventario.', 'Avisar estado por WhatsApp.'],
  },
  {
    title: 'Stock',
    icon: Package,
    purpose: 'Administra repuestos, existencias, costos, precios y alertas de minimo.',
    uses: ['Crear repuestos con SKU y ubicacion.', 'Detectar bajo stock.', 'Alimentar repuestos de las ordenes.'],
    adminOnly: true,
  },
  {
    title: 'Facturacion',
    icon: FileText,
    purpose: 'Genera comprobantes desde ordenes y controla importes emitidos, cobrados y pendientes.',
    uses: ['Crear factura desde una orden.', 'Aplicar IVA y descuento.', 'Enviar aviso por WhatsApp.'],
    adminOnly: true,
  },
  {
    title: 'Reportes',
    icon: Wrench,
    purpose: 'Resume indicadores comerciales, operativos y de inventario.',
    uses: ['Ver cobrado, emitido y pendiente.', 'Controlar ordenes y facturas por estado.', 'Detectar stock bajo y actividad reciente.'],
    adminOnly: true,
  },
]

const statuses = [
  { group: 'Turnos', values: ['Programado', 'Confirmado', 'En taller', 'Completado', 'Cancelado'] },
  { group: 'Ordenes', values: ['Pendiente', 'En proceso', 'Finalizada', 'Entregada', 'Cancelada'] },
  { group: 'Facturas', values: ['Borrador', 'Emitida', 'Pagada', 'Anulada'] },
  { group: 'Vehiculos', values: ['En taller', 'Pendiente', 'Entregado', 'Inactivo'] },
]

export function AyudaPage() {
  return (
    <section className="ayuda-page">
      <div className="page-heading">
        <span>Manual interno</span>
        <h1>Guia de uso</h1>
        <p>Referencia rapida para entender el flujo de NexTorqen, sus modulos y el significado de cada funcion.</p>
      </div>

      <div className="help-flow card">
        <div className="panel-title">
          <BookOpen size={20} />
          <h2>Flujo recomendado del taller</h2>
        </div>
        <div className="flow-steps">
          {['Cliente', 'Vehiculo', 'Turno', 'Orden', 'Stock', 'Factura', 'Reporte'].map((step, index) => (
            <div key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="help-grid">
        {modules.map((module) => (
          <article className="card help-card" key={module.title}>
            <div className="help-card-title">
              <module.icon size={20} />
              <h2>{module.title}</h2>
              {module.adminOnly ? <span>Admin</span> : null}
            </div>
            <p>{module.purpose}</p>
            <ul>
              {module.uses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="help-grid help-grid-small">
        <article className="card help-card">
          <div className="help-card-title">
            <ShieldCheck size={20} />
            <h2>Roles y permisos</h2>
          </div>
          <p>Admin gestiona usuarios, stock, facturacion y reportes. Empleado opera clientes, vehiculos, turnos y ordenes sin borrar registros sensibles.</p>
        </article>

        <article className="card help-card">
          <div className="help-card-title">
            <MessageCircle size={20} />
            <h2>WhatsApp</h2>
          </div>
          <p>Los botones verdes abren WhatsApp con mensajes prearmados. Sirven para recordatorios, estados de orden y avisos de factura.</p>
        </article>
      </div>

      <div className="card status-guide">
        <div className="panel-title">
          <ClipboardList size={20} />
          <h2>Estados del sistema</h2>
        </div>
        <div className="status-guide-grid">
          {statuses.map((item) => (
            <div key={item.group}>
              <strong>{item.group}</strong>
              <div>
                {item.values.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
