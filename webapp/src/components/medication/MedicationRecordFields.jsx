export default function MedicationRecordFields({ draft, setDraft, medicijnOptions }) {
  return (
    <div className="formGrid">
      <select value={draft.Medicijnnaam} onChange={(e) => setDraft({ ...draft, Medicijnnaam: e.target.value })}>
        <option value="">Medicijn *</option>
        {medicijnOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <input
        type="date"
        placeholder="Datum toediening"
        value={draft.DatumToediening}
        onChange={(e) => setDraft({ ...draft, DatumToediening: e.target.value })}
      />

      <input
        placeholder="Dosering"
        value={draft.Dosering}
        onChange={(e) => setDraft({ ...draft, Dosering: e.target.value })}
      />

      <input
        placeholder="Toedieningswijze"
        value={draft.Toedieningswijze}
        onChange={(e) => setDraft({ ...draft, Toedieningswijze: e.target.value })}
      />

      <input
        placeholder="Dierenarts"
        value={draft.Dierenarts}
        onChange={(e) => setDraft({ ...draft, Dierenarts: e.target.value })}
      />

      <input
        placeholder="Reden / diagnose"
        value={draft.RedenDiagnose}
        onChange={(e) => setDraft({ ...draft, RedenDiagnose: e.target.value })}
      />

      <input
        type="date"
        placeholder="Datum hercontrole"
        value={draft.DatumHercontrole}
        onChange={(e) => setDraft({ ...draft, DatumHercontrole: e.target.value })}
      />

      <label className="adminInlineCheckbox">
        <input
          type="checkbox"
          checked={draft.Afgerond}
          onChange={(e) => setDraft({ ...draft, Afgerond: e.target.checked })}
        />
        Afgerond
      </label>

      <textarea
        className="fullWidth"
        placeholder="Opmerking"
        rows={2}
        value={draft.Opmerking}
        onChange={(e) => setDraft({ ...draft, Opmerking: e.target.value })}
      />
    </div>
  )
}
