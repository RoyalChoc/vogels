import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiChangePassword, apiUpdateProfile, getStoredToken } from '../../utils/auth'

export default function ProfilePage({ onBack }) {
  const { currentUser, refreshUser } = useAuth()

  const [voornaam, setVoornaam] = useState(currentUser?.voornaam ?? '')
  const [naam, setNaam] = useState(currentUser?.naam ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setVoornaam(currentUser.voornaam ?? '')
      setNaam(currentUser.naam ?? '')
      setEmail(currentUser.email ?? '')
    }
  }, [currentUser])

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileMsg('')
    setProfileError('')
    setProfileLoading(true)
    try {
      const token = getStoredToken()
      const result = await apiUpdateProfile(token, { voornaam, naam, email })
      if (result.ok) {
        setProfileMsg('Profiel succesvol bijgewerkt.')
        await refreshUser()
      } else {
        setProfileError(result.error ?? 'Opslaan mislukt.')
      }
    } catch {
      setProfileError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwdMsg('')
    setPwdError('')

    if (newPwd !== confirmPwd) {
      setPwdError('Nieuwe wachtwoorden komen niet overeen.')
      return
    }
    if (newPwd.length < 6) {
      setPwdError('Nieuw wachtwoord moet minimaal 6 tekens bevatten.')
      return
    }

    setPwdLoading(true)
    try {
      const token = getStoredToken()
      const result = await apiChangePassword(token, { currentPassword: currentPwd, newPassword: newPwd })
      if (result.ok) {
        setPwdMsg('Wachtwoord succesvol gewijzigd.')
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
      } else {
        setPwdError(result.error ?? 'Wijzigen mislukt.')
      }
    } catch {
      setPwdError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setPwdLoading(false)
    }
  }

  const EyeIcon = ({ open }) => (
    open ? (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    ) : (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    )
  )

  return (
    <div className="profilePage">
      <div className="profilePageHeader">
        <button type="button" className="ghost profileBackBtn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Terug
        </button>
        <div>
          <h2 className="profilePageTitle">Mijn profiel</h2>
          <p className="profilePageSub">Beheer je persoonlijke gegevens en wachtwoord</p>
        </div>
      </div>

      <div className="profilePageGrid">
        {/* Persoonlijke gegevens */}
        <article className="card profileCard">
          <div className="profileCardHead">
            <div className="profileCardIcon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3>Persoonlijke gegevens</h3>
          </div>

          <form onSubmit={handleProfileSave} className="profileForm">
            <div className="profileFieldRow">
              <div className="profileField">
                <label htmlFor="prof-voornaam">Voornaam</label>
                <input
                  id="prof-voornaam"
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  required
                />
              </div>
              <div className="profileField">
                <label htmlFor="prof-naam">Naam</label>
                <input
                  id="prof-naam"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="profileField">
              <label htmlFor="prof-email">E-mailadres</label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="profileField">
              <label>Rol</label>
              <div className="profileRoleDisplay">
                <span className={`roleBadge ${currentUser?.rol}`}>
                  {currentUser?.rol === 'admin' ? 'Beheerder' : 'Gebruiker'}
                </span>
                <span className="profileRoleNote">
                  {currentUser?.rol === 'admin'
                    ? 'Je hebt volledige lees- en schrijfrechten.'
                    : 'Je hebt alleen leesrechten.'}
                </span>
              </div>
            </div>

            {profileMsg && (
              <div className="profileSuccess" role="status">
                {profileMsg}
              </div>
            )}
            {profileError && (
              <div className="profileError" role="alert">
                {profileError}
              </div>
            )}

            <button type="submit" className="primary" disabled={profileLoading}>
              {profileLoading ? 'Opslaan…' : 'Opslaan'}
            </button>
          </form>
        </article>

        {/* Wachtwoord wijzigen */}
        <article className="card profileCard">
          <div className="profileCardHead">
            <div className="profileCardIcon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3>Wachtwoord wijzigen</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="profileForm">
            <div className="profileField">
              <label htmlFor="prof-curpwd">Huidig wachtwoord</label>
              <div className="profilePwdWrap">
                <input
                  id="prof-curpwd"
                  type={showCurrentPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="profilePwdToggle"
                  onClick={() => setShowCurrentPwd((v) => !v)}
                  aria-label={showCurrentPwd ? 'Verbergen' : 'Tonen'}
                  tabIndex={-1}
                >
                  <EyeIcon open={showCurrentPwd} />
                </button>
              </div>
            </div>

            <div className="profileField">
              <label htmlFor="prof-newpwd">Nieuw wachtwoord</label>
              <div className="profilePwdWrap">
                <input
                  id="prof-newpwd"
                  type={showNewPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="profilePwdToggle"
                  onClick={() => setShowNewPwd((v) => !v)}
                  aria-label={showNewPwd ? 'Verbergen' : 'Tonen'}
                  tabIndex={-1}
                >
                  <EyeIcon open={showNewPwd} />
                </button>
              </div>
            </div>

            <div className="profileField">
              <label htmlFor="prof-confirmpwd">Bevestig nieuw wachtwoord</label>
              <input
                id="prof-confirmpwd"
                type="password"
                autoComplete="new-password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
              />
            </div>

            {pwdMsg && (
              <div className="profileSuccess" role="status">
                {pwdMsg}
              </div>
            )}
            {pwdError && (
              <div className="profileError" role="alert">
                {pwdError}
              </div>
            )}

            <button type="submit" className="primary" disabled={pwdLoading}>
              {pwdLoading ? 'Bezig…' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        </article>
      </div>
    </div>
  )
}
