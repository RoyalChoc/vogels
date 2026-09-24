import { vogelNaam } from '../../utils/birdUtils'

export default function GeslachtsbepalingTab({ birdEntries, selectedKeys, onSelectionChange, onPrintCards }) {
  const selectedSet = new Set(selectedKeys)

  function toggleKey(key) {
    if (selectedSet.has(key)) {
      onSelectionChange(selectedKeys.filter((item) => item !== key))
      return
    }

    onSelectionChange([...selectedKeys, key])
  }

  return (
    <section className="panel">
      <article className="card">
        <h2>Geslachtsbepaling</h2>
        <p>
          Selecteer de vogels waarvan het geslacht nog bepaald moet worden (DNA-test) en maak kaartjes aan met
          Vogelsoort, Wetenschappelijke naam, Mutatie, Factor, Split, Stamnummer en Ringnummer.
        </p>

        {birdEntries.length === 0 ? (
          <p className="muted">Geen vogels met een onbepaald geslacht gevonden.</p>
        ) : (
          <ul className="checkboxList">
            {birdEntries.map(([key, bird]) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(key)}
                    onChange={() => toggleKey(key)}
                  />
                  {vogelNaam(bird)}
                  {bird.Mutatie ? ` — ${bird.Mutatie}` : ''}
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="rowActions">
          <button type="button" className="primary" onClick={onPrintCards} disabled={selectedKeys.length === 0}>
            Maak kaartje(en)
          </button>
        </div>
      </article>
    </section>
  )
}
