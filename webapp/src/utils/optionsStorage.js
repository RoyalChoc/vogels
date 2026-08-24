const OPTIONS_API_URL = '/api/options'

function sortOptionValues(values) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
  )
}

function normalizeOptionsMap(raw, fallbackMap) {
  const next = { ...fallbackMap }

  Object.entries(fallbackMap).forEach(([key, fallback]) => {
    const incoming = raw?.[key]
    const source = Array.isArray(incoming) ? incoming : fallback
    next[key] = sortOptionValues(source)
  })

  return next
}

export async function loadOptions(fallbackMap) {
  try {
    const response = await fetch(OPTIONS_API_URL, { cache: 'no-store' })
    if (!response.ok) return fallbackMap

    const parsed = await response.json()
    return normalizeOptionsMap(parsed?.options, fallbackMap)
  } catch {
    return fallbackMap
  }
}

export async function saveOptions(optionsMap) {
  const response = await fetch(OPTIONS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ options: optionsMap }),
  })

  if (!response.ok) {
    throw new Error(`Kon optie-bestanden niet bewaren (${response.status}).`)
  }

  return true
}