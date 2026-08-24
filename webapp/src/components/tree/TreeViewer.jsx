import { PrintIcon, PdfIcon } from '../icons'
import TreeNode from '../TreeNode'
import { vogelNaam } from '../../utils/birdUtils'

function splitLabel(bird) {
  const values = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (values.length > 0) return values.join(', ')
  return bird.Split || '-'
}

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
  function renderBranch(tree, emptyText) {
    const branch = tree?.children || []
    if (branch.length === 0) {
      return <li><article className="treeNode"><h4>{emptyText}</h4></article></li>
    }

    return branch.map((child) => <TreeNode key={`${child.label}-${child.meta}`} node={child} />)
  }

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
        <>
          <div className="treeNode" style={{ marginBottom: '14px' }}>
            <h4>Gekozen vogel: {vogelNaam(activeTreeBird)}</h4>
            <p>
              {activeTreeBird.Ringmaat || '-'} | {activeTreeBird.Geslacht || '-'} | {activeTreeBird.Mutatie || '-'}
            </p>
            <p>
              Factor: {activeTreeBird.Factor || '-'} | Split: {splitLabel(activeTreeBird)} | Jaar:{' '}
              {activeTreeBird.Kweekjaar || '-'}
            </p>
            <p>
              Status: {activeTreeBird.Status || '-'} | Herkomst: {activeTreeBird.Herkomst || '-'} | Kooi:{' '}
              {activeTreeBird.Kooi || '-'}
            </p>
            <p>
              Vader: {activeTreeBird.Vader || '-'} | Moeder: {activeTreeBird.Moeder || '-'}
            </p>
            {activeTreeBird.Opmerking ? <p>Opmerking: {activeTreeBird.Opmerking}</p> : null}
          </div>

          <div className="treeGrid">
            <div>
              <h3>Voorouders</h3>
              <div className="treeWrap">
                <ul className="treeRoot">
                  {renderBranch(ancestors, 'Geen voorouders gevonden')}
                </ul>
              </div>
            </div>
            <div>
              <h3>Nakomelingen</h3>
              <div className="treeWrap">
                <ul className="treeRoot">
                  {renderBranch(descendants, 'Geen nakomelingen gevonden')}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  )
}
