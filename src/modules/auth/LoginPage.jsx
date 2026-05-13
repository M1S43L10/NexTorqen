import { AlertCircle, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { DEFAULT_ADMIN } from '../../utils/defaultAdmin'
import './LoginPage.css'

export function LoginPage() {
  const [identifier, setIdentifier] = useState(DEFAULT_ADMIN.username)
  const [password, setPassword] = useState(DEFAULT_ADMIN.password)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(identifier, password)
      navigate('/app')
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel card">
        <Link className="login-brand" to="/">
          <span>NT</span>
          NexTorqen
        </Link>
        <div>
          <p className="login-kicker">Acceso seguro</p>
          <h1>Panel administrativo</h1>
          <p className="login-copy">
            Ingresá con el usuario administrador inicial o con usuarios creados desde el módulo.
          </p>
        </div>

        {error ? (
          <div className="login-alert" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Usuario o email</span>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                autoComplete="username"
                onChange={(event) => setIdentifier(event.target.value)}
                required
                value={identifier}
              />
            </div>
          </label>
          <label className="field">
            <span>Contraseña</span>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
          </label>
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </section>

      <aside className="login-aside">
        <div>
          <span className="login-kicker">Credencial inicial</span>
          <h2>{DEFAULT_ADMIN.username}</h2>
          <p>
            Si Firebase está configurado, el perfil admin se siembra en Firestore y el Auth
            se crea al primer ingreso válido.
          </p>
        </div>
      </aside>
    </main>
  )
}
