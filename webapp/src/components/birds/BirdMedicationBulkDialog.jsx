import { useState } from 'react'
import { medicatieVogelLabel } from '../../utils/birdUtils'
import { createMedicationId, createProfileTreatment, todayDateInputValue, validateTreatmentInput } from '../../utils/medicationProfiles'
import MedicationTreatmentFields from '../medication/MedicationTreatmentFields'

const emptyDraft = {
  ProfielId: '',
  Medicijnnaam: '',
  DatumToediening: todayDateInputValue(),
  DagelijkseTijden: [],
  Dosering: '',
  Toedieningswijze: '',
  RedenDiagnose: '',
  Dierenarts: '',
  DatumHercontrole: '',
  Afgerond: false,
  Opmerking: '',
}

export default function BirdMedicationBulkDialog({ birdKeys, birds, medicijnOptions, profiles, isAdmin, onClose, onSaveRecords, onStatus }) {
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    const profile = profiles.find((item) => item.id === draft.ProfielId)
    if (draft.ProfielId) {
      const validationError = validateTreatmentInput(profile, draft.DatumToediening, draft.DagelijkseTijden)
      if (validationError) {
        onStatus(validationError)
        return
      }
    } else if (!isAdmin || !draft.Medicijnnaam) {
      onStatus('Kies een medicijn.')
      return
    }

    setSaving(true)
    try {
      const records = birdKeys.map((vogelKey) => {
        const base = { ...draft, id: createMedicationId(), VogelKey: vogelKey }
        return profile
          ? createProfileTreatment(profile, { ...base, dagelijkseTijden: draft.DagelijkseTijden }, () => createMedicationId('dose'))
          : base
      })
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

        <MedicationTreatmentFields
          draft={draft}
          setDraft={setDraft}
          profiles={profiles}
          medicijnOptions={medicijnOptions}
          isAdmin={isAdmin}
        />

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
