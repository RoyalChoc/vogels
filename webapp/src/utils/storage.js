/**
 * Storage and state persistence utilities
 */

const STORAGE_KEY = 'voliare-modern-webapp-v1'

export function loadState(seedBirds, seedCouples) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { birds: seedBirds, couples: seedCouples }
    const parsed = JSON.parse(raw)
    return {
      birds: parsed.birds || seedBirds,
      couples: parsed.couples || seedCouples,
    }
  } catch {
    return { birds: seedBirds, couples: seedCouples }
  }
}

export function saveState(birds, couples) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ birds, couples }))
}
