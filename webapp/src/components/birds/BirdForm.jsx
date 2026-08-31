import { formatVogelsoortOption, parseVogelsoortOption } from '../../utils/birdUtils'

export default function BirdForm({
  birdForm,
  setBirdForm,
  editingBirdKey,
  maleNames,
  femaleNames,
  optionSets,
  contactOptions,
  onSave,
  onClear,
  onDelete,
}) {
  const factorOptions = optionSets?.factor || []
  const gezoomdOptions = optionSets?.gezoomd || []
  const geslachtOptions = optionSets?.geslacht || []
  const herkomstOptions = optionSets?.herkomst || []
  const kooienOptions = optionSets?.kooien || []
  const kweekjaarOptions = optionSets?.jaren || []
  const mutatieOptions = optionSets?.mutaties || []
  const ringmaatOptions = optionSets?.ringmaten || []
  const statusOptions = optionSets?.status || []
  const splitOptions = optionSets?.split || []
  const vogelsoortOptions = optionSets?.vogelsoorten || []
  const monstertypeOptions = optionSets?.monstertypes || []

  const splitFields = ['Split1', 'Split2', 'Split3', 'Split4']

  function splitOptionsFor(fieldName) {
    const selectedInOtherFields = new Set(
      splitFields
        .filter((field) => field !== fieldName)
        .map((field) => birdForm[field])
        .filter(Boolean),
    )

    return splitOptions.filter(
      (item) => !selectedInOtherFields.has(item) || item === (birdForm[fieldName] || ''),
    )
  }

  return (
    <article className="card">
      <h2>Vogel formulier</h2>
      <div className="formGrid">
        <select
          value={formatVogelsoortOption(birdForm.Vogelsoort, birdForm.WetenschappelijkeNaam)}
          onChange={(e) => {
            const { naam, wetenschappelijkeNaam } = parseVogelsoortOption(e.target.value)
            setBirdForm({ ...birdForm, Vogelsoort: naam, WetenschappelijkeNaam: wetenschappelijkeNaam })
          }}
        >
          <option value="">Vogelsoort</option>
          {vogelsoortOptions.map((item) => (
            <option key={item} value={item}>
              {parseVogelsoortOption(item).naam}
            </option>
          ))}
        </select>

        <input placeholder="Wetenschappelijke naam" value={birdForm.WetenschappelijkeNaam || ''} readOnly />

        <input
          placeholder="Stamnummer *"
          value={birdForm.Stamnummer}
          onChange={(e) => setBirdForm({ ...birdForm, Stamnummer: e.target.value })}
        />
        <input
          placeholder="Ringnummer"
          value={birdForm.Ringnummer}
          onChange={(e) => setBirdForm({ ...birdForm, Ringnummer: e.target.value })}
        />

        <select value={birdForm.Ringmaat} onChange={(e) => setBirdForm({ ...birdForm, Ringmaat: e.target.value })}>
          <option value="">Ringmaat</option>
          {ringmaatOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Geslacht} onChange={(e) => setBirdForm({ ...birdForm, Geslacht: e.target.value })}>
          <option value="">Geslacht</option>
          {geslachtOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Mutatie} onChange={(e) => setBirdForm({ ...birdForm, Mutatie: e.target.value })}>
          <option value="">Mutatie</option>
          {mutatieOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Gezoomd || ''} onChange={(e) => setBirdForm({ ...birdForm, Gezoomd: e.target.value })}>
          <option value="">Gezoomd</option>
          {gezoomdOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Factor || ''} onChange={(e) => setBirdForm({ ...birdForm, Factor: e.target.value })}>
          <option value="">Factor</option>
          {factorOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {splitFields.map((fieldName, index) => (
          <select
            key={fieldName}
            value={birdForm[fieldName] || ''}
            onChange={(e) => setBirdForm({ ...birdForm, [fieldName]: e.target.value })}
          >
            <option value="">{`Split ${index + 1}`}</option>
            {splitOptionsFor(fieldName).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ))}

        <select value={birdForm.Status} onChange={(e) => setBirdForm({ ...birdForm, Status: e.target.value })}>
          <option value="">Status</option>
          {statusOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Herkomst} onChange={(e) => setBirdForm({ ...birdForm, Herkomst: e.target.value })}>
          <option value="">Herkomst</option>
          {herkomstOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={birdForm.AankoopContactId || ''}
          onChange={(e) => setBirdForm({ ...birdForm, AankoopContactId: e.target.value })}
        >
          <option value="">Aangekocht bij (contact)</option>
          {contactOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={birdForm.Monstertype || ''}
          onChange={(e) => setBirdForm({ ...birdForm, Monstertype: e.target.value })}
        >
          <option value="">Monstertype</option>
          {monstertypeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={birdForm.EigenaarContactId || ''}
          onChange={(e) => setBirdForm({ ...birdForm, EigenaarContactId: e.target.value })}
        >
          <option value="">Eigenaar (contact)</option>
          {contactOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <select value={birdForm.Kooi} onChange={(e) => setBirdForm({ ...birdForm, Kooi: e.target.value })}>
          <option value="">Kooi</option>
          {kooienOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Kweekjaar} onChange={(e) => setBirdForm({ ...birdForm, Kweekjaar: e.target.value })}>
          <option value="">Kweekjaar</option>
          {kweekjaarOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Vader} onChange={(e) => setBirdForm({ ...birdForm, Vader: e.target.value })}>
          <option value="">Vader</option>
          {maleNames.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Moeder} onChange={(e) => setBirdForm({ ...birdForm, Moeder: e.target.value })}>
          <option value="">Moeder</option>
          {femaleNames.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <textarea
          className="fullWidth"
          placeholder="Opmerking (aanvullende info)"
          rows={3}
          value={birdForm.Opmerking || ''}
          onChange={(e) => setBirdForm({ ...birdForm, Opmerking: e.target.value })}
        />
      </div>

      <div className="rowActions">
        <button type="button" className="primary" onClick={onSave}>
          {editingBirdKey ? 'Wijzig vogel' : 'Vogel toevoegen'}
        </button>
        <button type="button" className="ghost" onClick={onClear}>
          Leeg formulier
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Verwijderen
        </button>
      </div>
    </article>
  )
}
