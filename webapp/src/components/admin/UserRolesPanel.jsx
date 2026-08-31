import { useEffect, useState } from 'react'
import { apiCreateUser, apiListUsers, apiUpdateUserRole } from '../../utils/auth'

const emptyNewUser = { voornaam: '', naam: '', email: '', password: '', rol: 'user' }

export default function UserRolesPanel({ token, currentUserId, onStatus }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const [newUser, setNewUser] = useState(emptyNewUser)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoading(true)
      setError('')
      const data = await apiListUsers(token)
      if (cancelled) return
      if (data.ok) {
        setUsers(data.users)
      } else {
        setError(data.error || 'Kon gebruikers niet laden.')
      }
      setLoading(false)
    }

    loadUsers()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleRoleChange(userId, nextRol) {
    setSavingId(userId)
    setError('')
    try {
      const result = await apiUpdateUserRole(token, userId, nextRol)
      if (result.ok) {
        setUsers((current) => current.map((u) => (u.id === userId ? { ...u, rol: nextRol } : u)))
        onStatus?.('Rol succesvol bijgewerkt.')
      } else {
        setError(result.error || 'Rol wijzigen is mislukt.')
      }
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setSavingId(null)
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault()
    setCreateError('')

    if (!newUser.voornaam.trim() || !newUser.naam.trim() || !newUser.email.trim() || !newUser.password) {
      setCreateError('Voornaam, naam, e-mail en wachtwoord zijn verplicht.')
      return
    }
    if (newUser.password.length < 6) {
      setCreateError('Wachtwoord moet minimaal 6 tekens bevatten.')
      return
    }

    setCreating(true)
    try {
      const result = await apiCreateUser(token, newUser)
      if (result.ok) {
        setUsers((current) =>
          [...current, result.user].sort((a, b) =>
            `${a.voornaam} ${a.naam}`.localeCompare(`${b.voornaam} ${b.naam}`, 'nl-BE', { sensitivity: 'base' }),
          ),
        )
        setNewUser(emptyNewUser)
        onStatus?.(`Gebruiker ${result.user.voornaam} ${result.user.naam} aangemaakt.`)
      } else {
        setCreateError(result.error || 'Aanmaken van gebruiker is mislukt.')
      }
    } catch {
      setCreateError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <article className="card adminCard">
      <h2>Gebruikersbeheer</h2>
      <p>Beheer gebruikers en ken rollen toe. Beheerders hebben lees- en schrijfrechten, gebruikers enkel leesrechten.</p>

      <form className="userCreateForm" onSubmit={handleCreateUser}>
        <h3>Nieuwe gebruiker toevoegen</h3>

        <div className="userCreateGrid">
          <div className="profileField">
            <label htmlFor="newuser-voornaam">Voornaam</label>
            <input
              id="newuser-voornaam"
              value={newUser.voornaam}
              onChange={(e) => setNewUser((current) => ({ ...current, voornaam: e.target.value }))}
              disabled={creating}
              required
            />
          </div>

          <div className="profileField">
            <label htmlFor="newuser-naam">Naam</label>
            <input
              id="newuser-naam"
              value={newUser.naam}
              onChange={(e) => setNewUser((current) => ({ ...current, naam: e.target.value }))}
              disabled={creating}
              required
            />
          </div>

          <div className="profileField">
            <label htmlFor="newuser-email">E-mailadres</label>
            <input
              id="newuser-email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((current) => ({ ...current, email: e.target.value }))}
              disabled={creating}
              required
            />
          </div>

          <div className="profileField">
            <label htmlFor="newuser-password">Wachtwoord</label>
            <div className="profilePwdWrap">
              <input
                id="newuser-password"
                type={showPassword ? 'text' : 'password'}
                value={newUser.password}
                onChange={(e) => setNewUser((current) => ({ ...current, password: e.target.value }))}
                disabled={creating}
                minLength={6}
                required
              />
              <button
                type="button"
                className="profilePwdToggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Verbergen' : 'Tonen'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <div className="profileField">
            <label htmlFor="newuser-rol">Rol</label>
            <select
              id="newuser-rol"
              value={newUser.rol}
              onChange={(e) => setNewUser((current) => ({ ...current, rol: e.target.value }))}
              disabled={creating}
            >
              <option value="user">Gebruiker (lezen)</option>
              <option value="admin">Beheerder (lezen + schrijven)</option>
            </select>
          </div>
        </div>

        {createError && (
          <div className="profileError" role="alert">
            {createError}
          </div>
        )}

        <div className="rowActions">
          <button type="submit" className="primary" disabled={creating}>
            {creating ? 'Aanmaken...' : 'Gebruiker aanmaken'}
          </button>
        </div>
      </form>

      <hr className="userWidgetDivider" />

      {error && (
        <div className="profileError" role="alert" style={{ marginBottom: '0.8rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p className="adminEmpty">Gebruikers laden...</p>
      ) : users.length === 0 ? (
        <p className="adminEmpty">Geen gebruikers gevonden.</p>
      ) : (
        <div className="userRolesList">
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            return (
              <div key={user.id} className="userRolesRow">
                <div className="userRolesInfo">
                  <strong>
                    {user.voornaam} {user.naam}
                  </strong>
                  <span>{user.email}</span>
                </div>

                <div className="userRolesActions">
                  <span className={`roleBadge ${user.rol}`}>
                    {user.rol === 'admin' ? 'Beheerder' : 'Gebruiker'}
                  </span>

                  <select
                    value={user.rol}
                    disabled={isSelf || savingId === user.id}
                    onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    aria-label={`Rol voor ${user.voornaam} ${user.naam}`}
                  >
                    <option value="user">Gebruiker (lezen)</option>
                    <option value="admin">Beheerder (lezen + schrijven)</option>
                  </select>

                  {isSelf && <small className="userRolesSelfNote">Je eigen rol kan niet gewijzigd worden</small>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
