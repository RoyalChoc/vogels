import { PrintIcon, PdfIcon } from '../icons'
import { vogelNaam } from '../../utils/birdUtils'

export default function BirdList({
  filteredBirds,
  selectedBirdKey,
  search,
  setSearch,
  onSelectBird,
  onPrint,
  onExportPdf,
}) {
  return (
    <article className="card">
      <div className="listHead">
        <h2>Vogeloverzicht</h2>
        <div className="listHeadActions">
          <input
            placeholder="Zoek op stam, ring, mutatie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="iconAction print" onClick={onPrint}>
            <PrintIcon />
            <span>Afdrukken</span>
          </button>
          <button type="button" className="iconAction pdf" onClick={onExportPdf}>
            <PdfIcon />
            <span>Opslaan als PDF</span>
          </button>
        </div>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Naam</th>
              <th>Geslacht</th>
              <th>Mutatie</th>
              <th>Kooi</th>
              <th>Jaar</th>
            </tr>
          </thead>
          <tbody>
            {filteredBirds.map(([key, bird]) => (
              <tr
                key={key}
                className={selectedBirdKey === key ? 'selected' : ''}
                onClick={() => onSelectBird(key)}
              >
                <td>{vogelNaam(bird)}</td>
                <td>{bird.Geslacht || '-'}</td>
                <td>{bird.Mutatie || '-'}</td>
                <td>{bird.Kooi || '-'}</td>
                <td>{bird.Kweekjaar || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
