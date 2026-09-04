import { vogelNaam } from '../../utils/birdUtils'
import { getPedigreeColorClass, PEDIGREE_LEGEND } from '../../utils/pedigree'

function splitLabel(bird) {
  const values = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (values.length > 0) return values.join(', ')
  return bird.Split || '-'
}

function PedigreeLegend() {
  return (
    <div className="pedigreeLegend">
      {PEDIGREE_LEGEND.map((item) => (
        <span key={item.className} className={`pedigreeLegendItem ${item.className}`}>{item.label}</span>
      ))}
    </div>
  )
}

function PersonBox({ person }) {
  if (!person) return null
  const colorClass = person.unknown ? 'unknown' : (person.colorClass || 'unsexed')
  return (
    <article className={`pedigreeBird ${colorClass}`}>
      <strong>{person.name || 'Onbekend'}</strong>
      {!person.unknown && (
        <div className="pedigreeBirdData">
          <div><span>Geslacht</span><b>{person.Geslacht || '-'}</b></div>
          {(person.details || []).map(({ label, value }) => (
            <div key={label}><span>{label}</span><b>{value || '-'}</b></div>
          ))}
        </div>
      )}
    </article>
  )
}

// ─── Nakomelingen: koppel bovenaan, kinderen (elk met hun eigen partner) eronder ───
function DescendantNode({ node }) {
  if (!node) return null
  return (
    <li className="pedigreeTreeLi">
      <div className="pedigreeCouple">
        <PersonBox person={node.subject} />
        {node.partner && <span className="pedigreeMate">×</span>}
        {node.partner && <PersonBox person={node.partner} />}
      </div>
      {node.children?.length > 0 && (
        <>
          <div className="pedigreeStem" />
          <ul className="pedigreeTreeUl">
            {node.children.map((child, index) => (
              <DescendantNode key={index} node={child} />
            ))}
          </ul>
        </>
      )}
    </li>
  )
}

// ─── Voorouders: oudste koppel bovenaan, lijnen zakken naar het kind eronder ───
function AncestorBox({ bird }) {
  if (!bird) return null
  const colorClass = getPedigreeColorClass(bird)
  const split = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean).join(', ') || bird.Split || '-'
  const values = [
    ['Jaar', bird.Kweekjaar],
    ['Stamnummer', bird.Stamnummer],
    ['Ringnummer', bird.Ringnummer],
    ['Mutatie', bird.Mutatie],
    ['Split', split],
    ['Factor', bird.Factor],
    ['Status', bird.Status],
  ]
  return (
    <article className={`pedigreeBird ${colorClass}`}>
      <strong>{bird.label || vogelNaam(bird) || 'Onbekend'}</strong>
      <div className="pedigreeBirdData">
        <div><span>Geslacht</span><b>{bird.Geslacht || '-'}</b></div>
        {values.map(([label, value]) => <div key={label}><span>{label}</span><b>{value || '-'}</b></div>)}
      </div>
    </article>
  )
}

function AncestorNode({ node }) {
  if (!node) return null
  const [a, b] = node.children || []
  const hasParents = Boolean(a || b)
  return (
    <li className="pedigreeTreeLi pedigreeTreeLi--up">
      {hasParents && (
        <ul className="pedigreeTreeUl pedigreeTreeUl--up">
          {a && <AncestorNode node={a} />}
          {a && b && <li className="pedigreeMateLi" aria-hidden="true"><span className="pedigreeMate">×</span></li>}
          {b && <AncestorNode node={b} />}
        </ul>
      )}
      {hasParents && <div className="pedigreeStem" />}
      <div className="pedigreeCouple">
        <AncestorBox bird={node} />
      </div>
    </li>
  )
}

function DescendantTree({ tree }) {
  if (!tree) return <p>Geen nakomelingen gevonden.</p>
  return (
    <ul className="pedigreeTree">
      <DescendantNode node={tree} />
    </ul>
  )
}

function AncestorTree({ tree }) {
  if (!tree || !(tree.Vader || tree.Moeder)) return <p>Geen voorouders gevonden.</p>
  return (
    <ul className="pedigreeTree pedigreeTree--up">
      <AncestorNode node={tree} />
    </ul>
  )
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
  return (
    <article className="card">
      <div className="listHead">
        <h2>Stamboom viewer</h2>
        <div className="listHeadActions">
          <select value={selectedBirdKey} onChange={(e) => onSelectBird(e.target.value)}>
            <option value="">Selecteer startvogel</option>
            {[...birdEntries].sort(([, a], [, b]) => {
              const labelA = (a.Mutatie ? `${a.Mutatie} - ${vogelNaam(a)}` : vogelNaam(a)).toLowerCase()
              const labelB = (b.Mutatie ? `${b.Mutatie} - ${vogelNaam(b)}` : vogelNaam(b)).toLowerCase()
              return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' })
            }).map(([key, bird]) => (
              <option key={key} value={key}>
                {bird.Mutatie ? `${bird.Mutatie} - ${vogelNaam(bird)}` : vogelNaam(bird)}
              </option>
            ))}
          </select>
          <button type="button" className="iconAction print" onClick={onPrint}>
            <span>Afdrukken</span>
          </button>
          <button type="button" className="iconAction pdf" onClick={onExportPdf}>
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

          <section className="pedigreeSchema">
            <h3>Voorouders</h3>
            <PedigreeLegend />
            <div className="pedigreeRows">
              <AncestorTree tree={ancestors} />
            </div>
          </section>

          <section className="pedigreeSchema">
            <h3>Nakomelingen</h3>
            <PedigreeLegend />
            <div className="pedigreeRows">
              <DescendantTree tree={descendants} />
            </div>
          </section>
        </>
      )}
    </article>
  )
}
