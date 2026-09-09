import { useState } from 'react'
import { medicatieVogelLabel } from '../../utils/birdUtils'
import MedicationRecordFields from '../medication/MedicationRecordFields'

const emptyDraft = {
  Medicijnnaam: '',
  DatumToediening: '',
  Dosering: '',
  Toedieningswijze: '',
  RedenDiagnose: '',
  Dierenarts: '',
  DatumHercontrole: '',
  Afgerond: false,
  Opmerking: '',
}

function createId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `med-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function BirdMedicationBulkDialog({ birdKeys, birds, medicijnOptions, onClose, onSaveRecords, onStatus }) {
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!draft.Medicijnnaam) {
      onStatus('Kies een medicijn.')
      return
    }

    setSaving(true)
    try {
      const records = birdKeys.map((vogelKey) => ({
        ...draft,
        id: createId(),
        VogelKey: vogelKey,
      }))
      await onSaveRecords(records)
      onStatus(`Medicatie opgeslagen voor ${records.length} vogel(s).`)
      onClose()
    } catch (error) {
      onStatus(error.message || 'Medicatie kon niet worden opgeslagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mediaBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="mediaDialog medicationDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-medication-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mediaDialogHead">
          <div>
            <h2 id="bulk-medication-title">Medicatie voor selectie</h2>
            <p>{birdKeys.length} vogel(s) geselecteerd</p>
          </div>
          <button type="button" className="closeButton" aria-label="Sluiten" title="Sluiten" onClick={onClose}>
            x
          </button>
        </header>

        <ul className="reminderList">
          {birdKeys.map((key) => (
            <li key={key}>{medicatieVogelLabel(birds[key])}</li>
          ))}
        </ul>

        <MedicationRecordFields draft={draft} setDraft={setDraft} medicijnOptions={medicijnOptions} />

        <div className="rowActions">
          <button type="button" className="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Opslaan...' : 'Medicatie toevoegen'}
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Annuleer
          </button>
        </div>
      </section>
    </div>
  )
}
