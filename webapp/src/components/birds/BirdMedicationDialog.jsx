import { useMemo, useState } from 'react'
import { createMedicationId, createProfileTreatment, todayDateInputValue, validateTreatmentInput } from '../../utils/medicationProfiles'
import MedicationDoseChecklist from '../medication/MedicationDoseChecklist'
import MedicationTreatmentFields from '../medication/MedicationTreatmentFields'

const emptyRecord = {
  id: '',
  VogelKey: '',
  DatumToediening: todayDateInputValue(),
  ProfielId: '',
  DagelijkseTijden: [],
  Medicijnnaam: '',
  Dosering: '',
  Toedieningswijze: '',
  RedenDiagnose: '',
  Dierenarts: '',
  DatumHercontrole: '',
  Afgerond: false,
  Opmerking: '',
}

export default function BirdMedicationDialog({
  birdKey,
  birdName,
  records,
  medicijnOptions,
  profiles,
  isAdmin,
  onClose,
  onSaveRecord,
  onDeleteRecord,
  onToggleAfgerond,
  onSetDoseStatus,
  onStatus,
}) {
  const [draft, setDraft] = useState({ ...emptyRecord, VogelKey: birdKey })
  const [editingId, setEditingId] = useState('')

  const birdRecords = useMemo(
    () =>
      records
        .filter((record) => record.VogelKey === birdKey)
        .sort((a, b) => String(b.DatumToediening || '').localeCompare(String(a.DatumToediening || ''), 'nl-BE', { numeric: true })),
    [records, birdKey],
  )

  function startEdit(record) {
    setEditingId(record.id)
    setDraft({ ...emptyRecord, ...record })
  }

  function resetForm() {
    setEditingId('')
    setDraft({ ...emptyRecord, VogelKey: birdKey })
  }

  async function handleSubmit() {
    const profile = profiles.find((item) => item.id === draft.ProfielId)
    if (!editingId && draft.ProfielId) {
      const validationError = validateTreatmentInput(profile, draft.DatumToediening, draft.DagelijkseTijden)
      if (validationError) {
        onStatus(validationError)
        return
      }
    } else if (!draft.Medicijnnaam || (!isAdmin && !profile)) {
      onStatus('Kies een medicijn.')
      return
    }

    const base = { ...draft, VogelKey: birdKey, id: draft.id || createMedicationId() }
    const record = !editingId && profile
      ? createProfileTreatment(profile, { ...base, dagelijkseTijden: draft.DagelijkseTijden }, () => createMedicationId('dose'))
      : base
    try {
      await onSaveRecord(record)
      onStatus('Medicatie opgeslagen.')
      resetForm()
    } catch (error) {
      onStatus(error.message || 'Medicatie kon niet worden opgeslagen.')
    }
  }

  async function handleDelete(record) {
    if (!window.confirm('Deze medicatie wordt definitief verwijderd. Doorgaan?')) return
    try {
      await onDeleteRecord(record.id)
      onStatus('Medicatie verwijderd.')
      if (editingId === record.id) resetForm()
    } catch (error) {
      onStatus(error.message || 'Medicatie kon niet worden verwijderd.')
    }
  }

  async function handleToggleAfgerond(record) {
    try {
      await onToggleAfgerond(record.id)
    } catch (error) {
      onStatus(error.message || 'Status kon niet worden aangepast.')
    }
  }

  return (
    <div className="mediaBackdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="mediaDialog medicationDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bird-medication-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mediaDialogHead">
          <div>
            <h2 id="bird-medication-title">Medicatie</h2>
            <p>{birdName}</p>
          </div>
          <button type="button" className="closeButton" aria-label="Sluiten" title="Sluiten" onClick={onClose}>
            x
          </button>
        </header>

        <div className="adminRows">
          {birdRecords.length === 0 && <p className="mediaEmpty">Nog geen medicatie geregistreerd voor deze vogel.</p>}

          {birdRecords.map((record) => (
            <div key={record.id} className="adminRow medicationRow">
              <span>
                <strong>{record.Medicijnnaam || '-'}</strong>
                {' — '}
                {record.DatumToediening || '-'}
                {record.DatumHercontrole && ` · Hercontrole: ${record.DatumHercontrole}`}
                {record.Afgerond ? ' · Afgerond' : ''}
              </span>
              <button type="button" className="ghost" onClick={() => handleToggleAfgerond(record)}>
                {record.Afgerond ? 'Heropen' : 'Afronden'}
              </button>
              {isAdmin && (
                <>
                  <button type="button" className="ghost" onClick={() => startEdit(record)}>
                    Wijzig
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(record)}>
                    Verwijder
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <MedicationDoseChecklist records={birdRecords} birds={{}} birdKey={birdKey} onSetDoseStatus={onSetDoseStatus} />

        <MedicationTreatmentFields
          draft={draft}
          setDraft={setDraft}
          profiles={profiles}
          medicijnOptions={medicijnOptions}
          isAdmin={isAdmin}
        />

        <div className="rowActions">
          <button type="button" className="primary" onClick={handleSubmit}>
            {editingId ? 'Wijzig medicatie' : 'Medicatie toevoegen'}
          </button>
          {editingId && <button type="button" className="ghost" onClick={resetForm}>Annuleer</button>}
        </div>
      </section>
    </div>
  )
}
