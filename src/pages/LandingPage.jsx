import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Car,
  CheckCircle2,
  Gauge,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

const benefits = [
  'Control operativo centralizado',
  'Historial claro por cliente y vehículo',
  'Roles preparados para equipos reales',
  'Base lista para facturación, stock y reportes',
]

const features = [
  { icon: Users, title: 'Usuarios y roles', text: 'Administradores y empleados con perfiles ordenados.' },
  { icon: Car, title: 'Vehículos', text: 'Estructura preparada para unidades, patentes e historial.' },
  { icon: Wrench, title: 'Órdenes', text: 'Flujo pensado para servicios, reparaciones y seguimiento.' },
  { icon: BarChart3, title: 'Reportes', text: 'Base modular para métricas operativas y financieras.' },
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="NexTorqen inicio">
          <span>NT</span>
          NexTorqen
        </a>
        <nav className="landing-nav" aria-label="Navegación pública">
          <a href="#beneficios">Beneficios</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <Link className="btn btn-primary" to="/login">
          Ingresar
          <ArrowRight size={18} />
        </Link>
      </header>

      <main>
        <section className="hero-section" id="inicio">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} />
              Sistema SaaS para talleres modernos
            </div>
            <h1>NexTorqen</h1>
            <p>
              Plataforma de gestión para talleres mecánicos y servicios automotrices:
              usuarios, órdenes, vehículos, agenda y operación diaria en una base modular.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/login">
                Abrir panel
                <ArrowRight size={18} />
              </Link>
              <a className="btn btn-ghost" href="#funcionalidades">
                Ver módulos
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="dashboard-preview">
              <div className="preview-top">
                <span />
                <span />
                <span />
              </div>
              <div className="preview-grid">
                <div className="preview-panel wide">
                  <Gauge />
                  <strong>Operación activa</strong>
                  <small>32 servicios este mes</small>
                </div>
                <div className="preview-panel">
                  <CalendarCheck />
                  <strong>Turnos</strong>
                  <small>8 hoy</small>
                </div>
                <div className="preview-panel">
                  <ShieldCheck />
                  <strong>Roles</strong>
                  <small>admin / empleado</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-block split-section" id="descripcion">
          <div>
            <span className="section-kicker">Sistema operativo del taller</span>
            <h2>Una base profesional para ordenar el trabajo y escalar módulos.</h2>
          </div>
          <p>
            NexTorqen queda preparado para administrar clientes, vehículos, órdenes,
            cambios de aceite, repuestos, facturación, turnos, sucursales y reportes
            sin rehacer la arquitectura.
          </p>
        </section>

        <section className="section-block" id="beneficios">
          <span className="section-kicker">Beneficios</span>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <div className="benefit-item" key={benefit}>
                <CheckCircle2 size={20} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section-block" id="funcionalidades">
          <span className="section-kicker">Funcionalidades</span>
          <h2>Módulos iniciales y puntos de extensión claros.</h2>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <feature.icon size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="contact-band" id="contacto">
          <div>
            <span className="section-kicker">Contacto</span>
            <h2>Listo para conectar el taller con una operación más precisa.</h2>
          </div>
          <Link className="btn btn-primary" to="/login">
            Entrar al sistema
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <strong>NexTorqen</strong>
        <span>Gestión moderna para servicios automotrices.</span>
      </footer>
    </div>
  )
}
