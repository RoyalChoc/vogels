import { getStoredToken } from './auth'

const MEDICATIONS_API_URL = '/api/medicaties'

function safeMedicaties(value, fallback) {
  if (!value || typeof value !== 'object') return fallback
  return {
    records: Array.isArray(value.records) ? value.records : fallback.records,
    profielen: Array.isArray(value.profielen) ? value.profielen : fallback.profielen,
    doseringEenheden: Array.isArray(value.doseringEenheden) ? value.doseringEenheden : fallback.doseringEenheden,
    instellingen: {
      reminderDagenVooraf: Number.isFinite(Number(value.instellingen?.reminderDagenVooraf))
        ? Number(value.instellingen.reminderDagenVooraf)
        : fallback.instellingen.reminderDagenVooraf,
    },
  }
}

export async function loadMedicaties(seedMedicaties) {
  try {
    const response = await fetch(MEDICATIONS_API_URL, { cache: 'no-store' })
    if (!response.ok) return seedMedicaties

    const parsed = await response.json()
    return safeMedicaties(parsed?.medicaties, seedMedicaties)
  } catch {
    return seedMedicaties
  }
}

export async function saveMedicaties(medicaties) {
  const token = getStoredToken()
  const response = await fetch(MEDICATIONS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ medicaties }),
  })

  if (!response.ok) {
    throw new Error(`Kon medicatiegegevens niet bewaren (${response.status}).`)
  }

  return true
}
