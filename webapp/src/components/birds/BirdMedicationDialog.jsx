import { useMemo, useState } from 'react'
import MedicationRecordFields from '../medication/MedicationRecordFields'

const emptyRecord = {
  id: '',
  VogelKey: '',
  DatumToediening: '',
  Medicijnnaam: '',
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

export default function BirdMedicationDialog({
  birdKey,
  birdName,
  records,
  medicijnOptions,
  isReadOnly,
  onClose,
  onSaveRecord,
  onDeleteRecord,
  onToggleAfgerond,
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
    if (!draft.Medicijnnaam) {
      onStatus('Kies een medicijn.')
      return
    }

    const record = { ...draft, VogelKey: birdKey, id: draft.id || createId() }
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
              {!isReadOnly && (
                <>
                  <button type="button" className="ghost" onClick={() => handleToggleAfgerond(record)}>
                    {record.Afgerond ? 'Heropen' : 'Afronden'}
                  </button>
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

        {!isReadOnly && (
          <>
            <MedicationRecordFields draft={draft} setDraft={setDraft} medicijnOptions={medicijnOptions} />

            <div className="rowActions">
              <button type="button" className="primary" onClick={handleSubmit}>
                {editingId ? 'Wijzig medicatie' : 'Medicatie toevoegen'}
              </button>
              {editingId && (
                <button type="button" className="ghost" onClick={resetForm}>
                  Annuleer
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
