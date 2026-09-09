import { useMemo } from 'react'
import { activeDefaultProfiles, medicationProfileLabel } from '../../utils/medicationProfiles'
import MedicationRecordFields from './MedicationRecordFields'

export default function MedicationTreatmentFields({
  draft,
  setDraft,
  profiles,
  medicijnOptions,
  isAdmin = false,
}) {
  const selectableProfiles = useMemo(
    () => isAdmin ? (profiles || []).filter((profile) => profile.actief) : activeDefaultProfiles(profiles),
    [isAdmin, profiles],
  )

  const selectedProfile = selectableProfiles.find((profile) => profile.id === draft.ProfielId)

  function selectProfile(profileId) {
    if (!profileId) {
      setDraft({ ...draft, ProfielId: '', DagelijkseTijden: [] })
      return
    }

    const profile = selectableProfiles.find((item) => item.id === profileId)
    if (!profile) return
    const existingTimes = Array.isArray(draft.DagelijkseTijden) ? draft.DagelijkseTijden : []
    const dagelijkseTijden = Array.from(
      { length: profile.frequentiePerDag },
      (_, index) => existingTimes[index] || '',
    )
    setDraft({
      ...draft,
      ProfielId: profile.id,
      Medicijnnaam: profile.medicijnnaam,
      Dosering: `${profile.doseringWaarde} ${profile.doseringEenheid}`.trim(),
      Toedieningswijze: profile.toedieningswijze,
      DagelijkseTijden: dagelijkseTijden,
    })
  }

  if (isAdmin && !draft.ProfielId) {
    return (
      <>
        <label className="medicationFieldLabel fullWidth">
          Invoertype
          <select value="" onChange={(event) => selectProfile(event.target.value)}>
            <option value="">Vrije invoer (admin)</option>
            {selectableProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{medicationProfileLabel(profile)}</option>
            ))}
          </select>
        </label>
        <MedicationRecordFields draft={draft} setDraft={setDraft} medicijnOptions={medicijnOptions} />
      </>
    )
  }

  return (
    <div className="formGrid medicationTreatmentFields">
      <label className="medicationFieldLabel fullWidth">
        Medicijn en behandelprofiel
        <select value={draft.ProfielId || ''} onChange={(event) => selectProfile(event.target.value)}>
          <option value="">Kies medicijn *</option>
          {selectableProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>{medicationProfileLabel(profile)}</option>
          ))}
        </select>
      </label>

      {selectedProfile && (
        <div className="medicationProfileSummary fullWidth">
          <strong>{selectedProfile.medicijnnaam}</strong>
          <span>{selectedProfile.doseringWaarde} {selectedProfile.doseringEenheid}</span>
          <span>{selectedProfile.frequentiePerDag}x per dag, {selectedProfile.duurDagen} dag(en)</span>
          <span>{selectedProfile.toedieningswijze}</span>
        </div>
      )}

      <label className="medicationFieldLabel">
        Startdatum
        <input
          type="date"
          value={draft.DatumToediening || ''}
          onChange={(event) => setDraft({ ...draft, DatumToediening: event.target.value })}
        />
      </label>

      {selectedProfile && Array.from({ length: selectedProfile.frequentiePerDag }, (_, index) => (
        <label className="medicationFieldLabel" key={`time-${index}`}>
          Tijdstip {index + 1}
          <input
            type="time"
            value={draft.DagelijkseTijden?.[index] || ''}
            onChange={(event) => {
              const dagelijkseTijden = [...(draft.DagelijkseTijden || [])]
              dagelijkseTijden[index] = event.target.value
              setDraft({ ...draft, DagelijkseTijden: dagelijkseTijden })
            }}
          />
        </label>
      ))}

      <input
        placeholder="Dierenarts"
        value={draft.Dierenarts || ''}
        onChange={(event) => setDraft({ ...draft, Dierenarts: event.target.value })}
      />
      <input
        placeholder="Reden / diagnose"
        value={draft.RedenDiagnose || ''}
        onChange={(event) => setDraft({ ...draft, RedenDiagnose: event.target.value })}
      />
      <input
        type="date"
        aria-label="Datum hercontrole"
        value={draft.DatumHercontrole || ''}
        onChange={(event) => setDraft({ ...draft, DatumHercontrole: event.target.value })}
      />
      <textarea
        className="fullWidth"
        placeholder="Opmerking"
        rows={2}
        value={draft.Opmerking || ''}
        onChange={(event) => setDraft({ ...draft, Opmerking: event.target.value })}
      />
    </div>
  )
}