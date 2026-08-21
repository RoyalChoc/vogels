/**
 * Storage and state persistence utilities
 */

const LEGACY_STORAGE_KEY = 'voliare-modern-webapp-v1'
const STATE_API_URL = '/api/state'

function safeObject(value, fallback) {
  return value && typeof value === 'object' ? value : fallback
}

function clearLegacyLocalState() {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // Ignore browser storage errors: local JSON files are source of truth.
  }
}

async function saveStateToFile(birds, couples) {
  const response = await fetch(STATE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ birds, couples }),
  })

  if (!response.ok) {
    throw new Error(`Kon JSON-bestanden niet bewaren (${response.status}).`)
  }
}

export async function loadState(seedBirds, seedCouples) {
  clearLegacyLocalState()

  try {
    const response = await fetch(STATE_API_URL, { cache: 'no-store' })
    if (!response.ok) {
      return { birds: seedBirds, couples: seedCouples }
    }

    const fileStateRaw = await response.json()
    return {
      birds: safeObject(fileStateRaw.birds, seedBirds),
      couples: safeObject(fileStateRaw.couples, seedCouples),
    }
  } catch {
    return { birds: seedBirds, couples: seedCouples }
  }
}

export async function saveState(birds, couples) {
  try {
    await saveStateToFile(birds, couples)
    return true
  } catch {
    return false
  }
}
