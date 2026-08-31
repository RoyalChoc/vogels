const TOKEN_KEY = 'voliare-auth-token'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {}
}

export async function apiLogin(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function apiLogout(token) {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {}
}

export async function apiGetMe(token) {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.ok ? data.user : null
  } catch {
    return null
  }
}

export async function apiUpdateProfile(token, { voornaam, naam, email }) {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ voornaam, naam, email }),
  })
  return res.json()
}

export async function apiChangePassword(token, { currentPassword, newPassword }) {
  const res = await fetch('/api/auth/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  return res.json()
}

export async function apiListUsers(token) {
  const res = await fetch('/api/auth/users', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.json()
}

export async function apiUpdateUserRole(token, userId, rol) {
  const res = await fetch('/api/auth/users', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, rol }),
  })
  return res.json()
}

export async function apiCreateUser(token, { voornaam, naam, email, password, rol }) {
  const res = await fetch('/api/auth/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ voornaam, naam, email, password, rol }),
  })
  return res.json()
}
