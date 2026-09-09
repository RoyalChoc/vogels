import { useMemo, useState } from 'react'
import { medicatieVogelLabel } from '../../utils/birdUtils'

const EXCLUDED_STATUSES = new Set(['verkocht', 'overleden'])

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase()
}

export default function BirdMedicationChecklist({ birds, selectedKeys, onSelectionChange }) {
  const [search, setSearch] = useState('')
  const selectedSet = new Set(selectedKeys)

  const entries = useMemo(() => {
    const query = normalizeSearchText(search)

    return Object.entries(birds)
      .filter(([, bird]) => !EXCLUDED_STATUSES.has(normalizeStatus(bird.Status)))
      .map(([key, bird]) => ({ key, bird, label: medicatieVogelLabel(bird) }))
      .filter(({ bird, label }) => {
        if (!query) return true
        return (
          label.toLowerCase().includes(query) ||
          normalizeSearchText(bird.Mutatie).includes(query) ||
          normalizeSearchText(bird.Stamnummer).includes(query) ||
          normalizeSearchText(bird.Ringnummer).includes(query)
        )
      })
      .sort((a, b) => {
        const mutatieCompare = String(a.bird.Mutatie || '').localeCompare(String(b.bird.Mutatie || ''), 'nl-BE', {
          numeric: true,
          sensitivity: 'base',
        })
        if (mutatieCompare !== 0) return mutatieCompare

        const stamnummerCompare = String(a.bird.Stamnummer || '').localeCompare(
          String(b.bird.Stamnummer || ''),
          'nl-BE',
          { numeric: true, sensitivity: 'base' },
        )
        if (stamnummerCompare !== 0) return stamnummerCompare

        return String(a.bird.Ringnummer || '').localeCompare(String(b.bird.Ringnummer || ''), 'nl-BE', {
          numeric: true,
          sensitivity: 'base',
        })
      })
  }, [birds, search])

  function toggleKey(key) {
    if (selectedSet.has(key)) {
      onSelectionChange(selectedKeys.filter((item) => item !== key))
      return
    }

    onSelectionChange([...selectedKeys, key])
  }

  return (
    <div className="birdMedicationChecklist">
      <input
        type="search"
        placeholder="Zoek op mutatie, stamnummer of ringnummer"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {entries.length === 0 ? (
        <p className="adminEmpty">Geen vogels gevonden.</p>
      ) : (
        <ul className="checkboxList">
          {entries.map(({ key, label }) => (
            <li key={key}>
              <label>
                <input type="checkbox" checked={selectedSet.has(key)} onChange={() => toggleKey(key)} />
                {label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
