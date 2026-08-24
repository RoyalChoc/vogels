const CONTACTS_API_URL = '/api/contacts'

function safeContacts(value, fallback) {
  return value && typeof value === 'object' ? value : fallback
}

export async function loadContacts(seedContacts) {
  try {
    const response = await fetch(CONTACTS_API_URL, { cache: 'no-store' })
    if (!response.ok) return seedContacts

    const parsed = await response.json()
    return safeContacts(parsed?.contacts, seedContacts)
  } catch {
    return seedContacts
  }
}

export async function saveContacts(contacts) {
  const response = await fetch(CONTACTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contacts }),
  })

  if (!response.ok) {
    throw new Error(`Kon contacten niet bewaren (${response.status}).`)
  }

  return true
}
