import { useMemo, useState } from 'react'
import { vogelNaam } from '../../utils/birdUtils'
import { exportMedicatiesExcel, exportMedicatiesPdf } from '../../utils/medicationExport'
import BirdMedicationChecklist from '../medication/BirdMedicationChecklist'
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

export default function MedicatiePanel({
  records,
  reminderDagenVooraf,
  medicijnOptions,
  birds,
  onSaveRecord,
  onSaveRecords,
  onDeleteRecord,
  onToggleAfgerond,
  onSaveReminderDays,
  onStatus,
}) {
  const [draft, setDraft] = useState(emptyRecord)
  const [editingId, setEditingId] = useState('')
  const [selectedVogelKeys, setSelectedVogelKeys] = useState([])
  const [reminderDraft, setReminderDraft] = useState(String(reminderDagenVooraf))
  const [savingReminder, setSavingReminder] = useState(false)

  const vogelNaamByKey = useMemo(
    () => Object.fromEntries(Object.entries(birds).map(([key, bird]) => [key, vogelNaam(bird)])),
    [birds],
  )

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) =>
        String(b.DatumToediening || '').localeCompare(String(a.DatumToediening || ''), 'nl-BE', { numeric: true }),
      ),
    [records],
  )

  function startEdit(record) {
    setEditingId(record.id)
    setDraft({ ...emptyRecord, ...record })
    setSelectedVogelKeys([])
  }

  function resetForm() {
    setEditingId('')
    setDraft(emptyRecord)
    setSelectedVogelKeys([])
  }

  async function handleSubmit() {
    if (!draft.Medicijnnaam) {
      onStatus('Kies een medicijn. Beheer de lijst hierboven bij "Medicijnen".')
      return
    }

    try {
      if (editingId) {
        await onSaveRecord({ ...draft, id: editingId })
        onStatus('Medicatie opgeslagen.')
      } else {
        if (selectedVogelKeys.length === 0) {
          onStatus('Vink minstens één vogel aan om te behandelen.')
          return
        }

        const { id: _unusedId, VogelKey: _unusedVogelKey, ...sharedFields } = draft
        const newRecords = selectedVogelKeys.map((vogelKey) => ({
          ...sharedFields,
          id: createId(),
          VogelKey: vogelKey,
        }))
        await onSaveRecords(newRecords)
        onStatus(`Medicatie opgeslagen voor ${newRecords.length} vogel(s).`)
      }
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

  async function handleSaveReminderDays() {
    const days = Number(reminderDraft)
    if (!Number.isFinite(days) || days < 0) {
      onStatus('Geef een geldig aantal dagen op (0 of meer).')
      return
    }

    setSavingReminder(true)
    try {
      await onSaveReminderDays(days)
      onStatus('Herinneringsinstelling opgeslagen.')
    } catch (error) {
      onStatus(error.message || 'Herinneringsinstelling kon niet worden opgeslagen.')
    } finally {
      setSavingReminder(false)
    }
  }

  function exportExcel() {
    onStatus(exportMedicatiesExcel(sortedRecords, vogelNaamByKey))
  }

  function exportPdf() {
    onStatus(exportMedicatiesPdf(sortedRecords, vogelNaamByKey))
  }

  return (
    <article className="card adminCard">
      <h2>Medicatie</h2>
      <p>Houd hier medicatietoedieningen per vogel bij. Medicijnnamen beheer je bij de lijst "Medicijnen" hierboven.</p>

      {editingId ? (
        <p className="adminEmpty">
          Je wijzigt medicatie voor: <strong>{vogelNaamByKey[draft.VogelKey] || draft.VogelKey}</strong>
        </p>
      ) : (
        <>
          <h3>Vogel(s) selecteren</h3>
          <BirdMedicationChecklist birds={birds} selectedKeys={selectedVogelKeys} onSelectionChange={setSelectedVogelKeys} />
        </>
      )}

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

      <div className="adminRows">
        {sortedRecords.length === 0 && <p className="adminEmpty">Nog geen medicatie geregistreerd.</p>}

        {sortedRecords.map((record) => (
          <div key={record.id} className="adminRow medicationRow">
            <span>
              <strong>{vogelNaamByKey[record.VogelKey] || record.VogelKey || 'Onbekende vogel'}</strong>
              {' — '}
              {record.Medicijnnaam || '-'} ({record.DatumToediening || '-'})
              {record.DatumHercontrole && ` · Hercontrole: ${record.DatumHercontrole}`}
              {record.Afgerond ? ' · Afgerond' : ''}
            </span>
            <button type="button" className="ghost" onClick={() => handleToggleAfgerond(record)}>
              {record.Afgerond ? 'Heropen' : 'Afronden'}
            </button>
            <button type="button" className="ghost" onClick={() => startEdit(record)}>
              Wijzig
            </button>
            <button type="button" className="danger" onClick={() => handleDelete(record)}>
              Verwijder
            </button>
          </div>
        ))}
      </div>

      <div className="rowActions">
        <label className="adminReminderSetting">
          Waarschuw
          <input
            type="number"
            min="0"
            value={reminderDraft}
            onChange={(e) => setReminderDraft(e.target.value)}
          />
          dagen voor de hercontroledatum
        </label>
        <button type="button" className="ghost" onClick={handleSaveReminderDays} disabled={savingReminder}>
          {savingReminder ? 'Opslaan...' : 'Instelling opslaan'}
        </button>
      </div>

      <div className="rowActions">
        <button type="button" className="iconAction" onClick={exportExcel}>
          Exporteer naar Excel
        </button>
        <button type="button" className="iconAction pdf" onClick={exportPdf}>
          Exporteer naar PDF
        </button>
      </div>
    </article>
  )
}
