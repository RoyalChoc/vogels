import { useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function UserWidget({ onOpenProfile }) {
  const { currentUser, isAdmin, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  async function handleLogout() {
    setLoggingOut(true)
    setMenuOpen(false)
    await logout()
    setLoggingOut(false)
  }

  function handleProfile() {
    setMenuOpen(false)
    onOpenProfile()
  }

  if (!currentUser) return null

  const initials = `${currentUser.voornaam?.[0] ?? ''}${currentUser.naam?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="userWidget" ref={menuRef}>
      <button
        type="button"
        className="userWidgetTrigger"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
        title={`${currentUser.voornaam} ${currentUser.naam}`}
      >
        <span className="userWidgetAvatar" aria-hidden="true">
          {initials}
        </span>
        <span className="userWidgetName">
          {currentUser.voornaam} {currentUser.naam}
        </span>
        <span className={`userWidgetRoleBadge ${isAdmin ? 'admin' : 'user'}`}>
          {isAdmin ? 'Beheerder' : 'Gebruiker'}
        </span>
        <svg
          className={`userWidgetChevron${menuOpen ? ' open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menuOpen && (
        <div className="userWidgetMenu" role="menu">
          <div className="userWidgetMenuHeader">
            <strong>
              {currentUser.voornaam} {currentUser.naam}
            </strong>
            <span>{currentUser.email}</span>
          </div>
          <hr className="userWidgetDivider" />
          <button
            type="button"
            className="userWidgetMenuItem"
            role="menuitem"
            onClick={handleProfile}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profiel &amp; wachtwoord
          </button>
          <button
            type="button"
            className="userWidgetMenuItem logout"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {loggingOut ? 'Afmelden…' : 'Afmelden'}
          </button>
        </div>
      )}
    </div>
  )
}
