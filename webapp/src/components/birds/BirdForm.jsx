import { options } from '../../data/seedData'

export default function BirdForm({
  birdForm,
  setBirdForm,
  editingBirdKey,
  maleNames,
  femaleNames,
  onSave,
  onClear,
  onDelete,
}) {
  return (
    <article className="card">
      <h2>Vogel formulier</h2>
      <div className="formGrid">
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
          {options.ringmaten.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Geslacht} onChange={(e) => setBirdForm({ ...birdForm, Geslacht: e.target.value })}>
          <option value="">Geslacht</option>
          {options.geslachten.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Mutatie} onChange={(e) => setBirdForm({ ...birdForm, Mutatie: e.target.value })}>
          <option value="">Mutatie</option>
          {options.mutaties.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Status} onChange={(e) => setBirdForm({ ...birdForm, Status: e.target.value })}>
          <option value="">Status</option>
          {options.statussen.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Herkomst} onChange={(e) => setBirdForm({ ...birdForm, Herkomst: e.target.value })}>
          <option value="">Herkomst</option>
          {options.herkomsten.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Kooi} onChange={(e) => setBirdForm({ ...birdForm, Kooi: e.target.value })}>
          <option value="">Kooi</option>
          {options.kooien.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={birdForm.Kweekjaar} onChange={(e) => setBirdForm({ ...birdForm, Kweekjaar: e.target.value })}>
          <option value="">Kweekjaar</option>
          {options.jaren.map((item) => (
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
