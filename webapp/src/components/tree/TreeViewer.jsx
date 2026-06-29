import { PrintIcon, PdfIcon } from '../icons'
import TreeNode from '../TreeNode'
import { vogelNaam } from '../../utils/birdUtils'

export default function TreeViewer({
  selectedBirdKey,
  birdEntries,
  activeTreeBird,
  ancestors,
  descendants,
  onSelectBird,
  onPrint,
  onExportPdf,
}) {
  return (
    <article className="card">
      <div className="listHead">
        <h2>Stamboom viewer</h2>
        <div className="listHeadActions">
          <select value={selectedBirdKey} onChange={(e) => onSelectBird(e.target.value)}>
            <option value="">Selecteer startvogel</option>
            {birdEntries.map(([key, bird]) => (
              <option key={key} value={key}>
                {vogelNaam(bird)}
              </option>
            ))}
          </select>
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

      {!activeTreeBird ? (
        <p>Kies een vogel voor een 4-generatie overzicht.</p>
      ) : (
        <div className="treeGrid">
          <div>
            <h3>Voorouders</h3>
            <div className="treeWrap">
              <ul className="treeRoot">
                <TreeNode node={ancestors} />
              </ul>
            </div>
          </div>
          <div>
            <h3>Nakomelingen</h3>
            <div className="treeWrap">
              <ul className="treeRoot">
                <TreeNode node={descendants} />
              </ul>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
