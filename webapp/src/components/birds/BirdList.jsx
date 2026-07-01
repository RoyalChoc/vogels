import { PrintIcon, PdfIcon } from '../icons'
import { vogelNaam } from '../../utils/birdUtils'

function getStatusBadgeClass(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'actief') return 'statusPill active'
  if (normalized === 'overleden') return 'statusPill deceased'
  if (normalized === 'verkocht') return 'statusPill sold'
  return 'statusPill'
}

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
              <th>Status</th>
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
                <td>
                  <span className={getStatusBadgeClass(bird.Status)}>{bird.Status || '-'}</span>
                </td>
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
