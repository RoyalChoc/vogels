import { useState } from 'react'
import {
  ADMINISTRATION_METHODS,
  createMedicationId,
  medicationProfileLabel,
} from '../../utils/medicationProfiles'

const emptyProfile = {
  id: '',
  medicijnnaam: '',
  doseringWaarde: '',
  doseringEenheid: '',
  frequentiePerDag: 1,
  duurDagen: 1,
  toedieningswijze: ADMINISTRATION_METHODS[0],
  isStandaard: true,
  actief: true,
}

export default function MedicationProfilesPanel({ medicines, profiles, dosageUnits, records, onSave, onStatus }) {
  const [draft, setDraft] = useState(emptyProfile)
  const [newUnit, setNewUnit] = useState('')

  function reset() {
    setDraft(emptyProfile)
  }

  async function saveProfile() {
    const frequency = Number(draft.frequentiePerDag)
    const duration = Number(draft.duurDagen)
    if (!draft.medicijnnaam || !draft.doseringWaarde.trim() || !draft.doseringEenheid || !draft.toedieningswijze) {
      onStatus('Vul medicijn, dosering, eenheid en toedieningswijze in.')
      return
    }
    if (!Number.isInteger(frequency) || frequency < 1 || !Number.isInteger(duration) || duration < 1) {
      onStatus('Frequentie en duur moeten gehele getallen vanaf 1 zijn.')
      return
    }

    const profile = {
      ...draft,
      id: draft.id || createMedicationId('profile'),
      frequentiePerDag: frequency,
      duurDagen: duration,
      actief: true,
    }
    let nextProfiles = draft.id
      ? profiles.map((item) => item.id === draft.id ? profile : item)
      : [...profiles, profile]
    if (profile.isStandaard) {
      nextProfiles = nextProfiles.map((item) => item.medicijnnaam === profile.medicijnnaam
        ? { ...item, isStandaard: item.id === profile.id }
        : item)
    }

    const hasActiveTreatments = draft.id && records.some((record) => record.ProfielId === draft.id && !record.Afgerond)
    const updateActive = hasActiveTreatments
      ? window.confirm('Dit profiel wordt gebruikt door actieve behandelingen. Klik OK om die behandelingen bij te werken, of Annuleer om alleen het profiel voor nieuwe behandelingen te wijzigen.')
      : false

    await onSave(nextProfiles, dosageUnits, profile, updateActive)
    onStatus(updateActive ? 'Profiel en passende actieve behandelingen bijgewerkt.' : 'Behandelprofiel opgeslagen.')
    reset()
  }

  async function archiveProfile(profile) {
    const nextProfiles = profiles.map((item) => item.id === profile.id ? { ...item, actief: false, isStandaard: false } : item)
    await onSave(nextProfiles, dosageUnits, null, false)
    if (draft.id === profile.id) reset()
    onStatus('Behandelprofiel gearchiveerd.')
  }

  async function addUnit() {
    const unit = newUnit.trim()
    if (!unit || dosageUnits.includes(unit)) return
    await onSave(profiles, [...dosageUnits, unit], null, false)
    setNewUnit('')
    onStatus('Doseringseenheid toegevoegd.')
  }

  async function removeUnit(unit) {
    if (profiles.some((profile) => profile.doseringEenheid === unit)) {
      onStatus('Deze eenheid is nog gekoppeld aan een behandelprofiel en kan niet worden verwijderd.')
      return
    }
    await onSave(profiles, dosageUnits.filter((item) => item !== unit), null, false)
    onStatus('Doseringseenheid verwijderd.')
  }

  return (
    <article className="card adminCard">
      <h2>Behandelprofielen</h2>
      <p>Leg vaste dosering, frequentie, duur en toedieningswijze per medicijn vast.</p>

      <div className="formGrid">
        <select value={draft.medicijnnaam} onChange={(event) => setDraft({ ...draft, medicijnnaam: event.target.value })}>
          <option value="">Medicijn *</option>
          {medicines.map((medicine) => <option key={medicine} value={medicine}>{medicine}</option>)}
        </select>
        <input placeholder="Dosering *" value={draft.doseringWaarde} onChange={(event) => setDraft({ ...draft, doseringWaarde: event.target.value })} />
        <select value={draft.doseringEenheid} onChange={(event) => setDraft({ ...draft, doseringEenheid: event.target.value })}>
          <option value="">Eenheid *</option>
          {dosageUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
        </select>
        <label className="medicationFieldLabel">
          Keer per dag
          <input type="number" min="1" step="1" value={draft.frequentiePerDag} onChange={(event) => setDraft({ ...draft, frequentiePerDag: event.target.value })} />
        </label>
        <label className="medicationFieldLabel">
          Aantal dagen
          <input type="number" min="1" step="1" value={draft.duurDagen} onChange={(event) => setDraft({ ...draft, duurDagen: event.target.value })} />
        </label>
        <select value={draft.toedieningswijze} onChange={(event) => setDraft({ ...draft, toedieningswijze: event.target.value })}>
          {ADMINISTRATION_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
        <label className="adminInlineCheckbox">
          <input type="checkbox" checked={draft.isStandaard} onChange={(event) => setDraft({ ...draft, isStandaard: event.target.checked })} />
          Standaardprofiel voor gebruikers
        </label>
      </div>

      <div className="rowActions">
        <button type="button" className="primary" onClick={saveProfile}>{draft.id ? 'Profiel wijzigen' : 'Profiel toevoegen'}</button>
        {draft.id && <button type="button" className="ghost" onClick={reset}>Annuleer</button>}
      </div>

      <div className="adminRows medicationProfileRows">
        {profiles.filter((profile) => profile.actief).map((profile) => (
          <div className="adminRow medicationProfileRow" key={profile.id}>
            <span>
              <strong>{medicationProfileLabel(profile)}</strong>
              {profile.isStandaard ? ' · Standaard' : ''}
            </span>
            <button type="button" className="ghost" onClick={() => setDraft({ ...profile })}>Wijzig</button>
            <button type="button" className="danger" onClick={() => archiveProfile(profile)}>Archiveer</button>
          </div>
        ))}
        {profiles.filter((profile) => profile.actief).length === 0 && <p className="adminEmpty">Nog geen behandelprofielen.</p>}
      </div>

      <h3>Doseringseenheden</h3>
      <div className="unitManager">
        {dosageUnits.map((unit) => (
          <span key={unit}>{unit}<button type="button" aria-label={`${unit} verwijderen`} onClick={() => removeUnit(unit)}>x</button></span>
        ))}
      </div>
      <div className="rowActions">
        <input placeholder="Nieuwe eenheid" value={newUnit} onChange={(event) => setNewUnit(event.target.value)} />
        <button type="button" className="ghost" onClick={addUnit}>Eenheid toevoegen</button>
      </div>
    </article>
  )
}