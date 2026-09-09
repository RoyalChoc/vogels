import { useMemo, useState } from 'react'
import { medicatieVogelLabel } from '../../utils/birdUtils'
import { isDoseDue } from '../../utils/medicationProfiles'

function doseLabel(dose) {
  const date = new Date(dose.geplandOp)
  return Number.isNaN(date.getTime())
    ? dose.geplandOp
    : date.toLocaleString('nl-BE', { dateStyle: 'short', timeStyle: 'short' })
}

export default function MedicationDoseChecklist({ records, birds, birdKey = '', onSetDoseStatus }) {
  const [search, setSearch] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selectedDoseKeys, setSelectedDoseKeys] = useState([])
  const now = new Date()

  const visibleDoses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (records || [])
      .filter((record) => !birdKey || record.VogelKey === birdKey)
      .flatMap((record) => (record.Doses || []).map((dose) => ({ record, dose })))
      .filter(({ dose }) => showCompleted || !dose.toegediend)
      .filter(({ record }) => {
        if (!query) return true
        const bird = birds[record.VogelKey]
        return `${record.Medicijnnaam} ${medicatieVogelLabel(bird)}`.toLowerCase().includes(query)
      })
      .sort((a, b) => a.dose.geplandOp.localeCompare(b.dose.geplandOp))
  }, [birdKey, birds, records, search, showCompleted])

  const selectableKeys = visibleDoses
    .filter(({ dose }) => isDoseDue(dose, now))
    .map(({ record, dose }) => `${record.id}:${dose.id}`)
  const selectedSet = new Set(selectedDoseKeys)
  const allVisibleSelected = selectableKeys.length > 0 && selectableKeys.every((key) => selectedSet.has(key))

  function toggleSelection(key) {
    setSelectedDoseKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  function toggleAllVisible() {
    setSelectedDoseKeys(allVisibleSelected ? [] : selectableKeys)
  }

  async function completeSelected() {
    const changes = selectedDoseKeys.map((key) => {
      const separator = key.indexOf(':')
      return { recordId: key.slice(0, separator), doseId: key.slice(separator + 1) }
    })
    await onSetDoseStatus(changes, true)
    setSelectedDoseKeys([])
  }

  return (
    <div className="medicationDoseChecklist">
      {!birdKey && (
        <input
          type="search"
          placeholder="Zoek vogel of medicijn"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      )}
      <div className="doseToolbar">
        <button type="button" className="ghost" onClick={toggleAllVisible} disabled={selectableKeys.length === 0}>
          {allVisibleSelected ? 'Deselecteer alles' : 'Selecteer alles'}
        </button>
        <label className="adminInlineCheckbox">
          <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} />
          Toon toegediend
        </label>
        <button type="button" className="primary" onClick={completeSelected} disabled={selectedDoseKeys.length === 0}>
          Geselecteerde toedienen ({selectedDoseKeys.length})
        </button>
      </div>

      {visibleDoses.length === 0 ? (
        <p className="adminEmpty">Geen geplande doses gevonden.</p>
      ) : (
        <ul className="doseList">
          {visibleDoses.map(({ record, dose }) => {
            const key = `${record.id}:${dose.id}`
            const due = isDoseDue(dose, now)
            return (
              <li key={key} className={dose.toegediend ? 'completed' : ''}>
                {!dose.toegediend && <input type="checkbox" checked={selectedSet.has(key)} disabled={!due} onChange={() => toggleSelection(key)} />}
                <div>
                  <strong>{record.Medicijnnaam}</strong>
                  {!birdKey && <span>{medicatieVogelLabel(birds[record.VogelKey])}</span>}
                  <span>{doseLabel(dose)} · {record.Dosering} · {record.Toedieningswijze}</span>
                </div>
                <button
                  type="button"
                  className="ghost"
                  disabled={!dose.toegediend && !due}
                  onClick={() => onSetDoseStatus([{ recordId: record.id, doseId: dose.id }], !dose.toegediend)}
                >
                  {dose.toegediend ? 'Heropen' : 'Toedienen'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}