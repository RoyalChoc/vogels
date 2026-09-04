import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email.trim(), password)
      if (!result.ok) {
        setError(result.error || 'Inloggen mislukt.')
      }
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="loginBackdrop">
      <div className="loginCard">
        <div className="loginBrand">
          <div className="loginBrandIcon" aria-hidden="true"></div>
          <h1>Vogelbestand</h1>
          <p>Beheer van je vogels</p>
        </div>

        <form className="loginForm" onSubmit={handleSubmit} noValidate>
          <h2>Aanmelden</h2>

          {error && (
            <div className="loginError" role="alert">
              {error}
            </div>
          )}

          <div className="loginField">
            <label htmlFor="login-email">E-mailadres</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voornaam@voorbeeld.be"
              required
              disabled={loading}
            />
          </div>

          <div className="loginField">
            <label htmlFor="login-password">Wachtwoord</label>
            <div className="loginPasswordWrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="loginPasswordToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="loginBtn" disabled={loading}>
            {loading ? (
              <span className="loginSpinner" aria-hidden="true" />
            ) : null}
            {loading ? 'Bezig met aanmelden…' : 'Aanmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
