export default function CoupleList({ couples, selectedCouple, onSelectCouple }) {
  return (
    <aside className="card">
      <h2>Koppellijst</h2>
      <div className="coupleCards">
        {Object.entries(couples).map(([name, info]) => (
          <button
            key={name}
            type="button"
            className={selectedCouple === name ? 'coupleCard active' : 'coupleCard'}
            onClick={() => onSelectCouple(name)}
          >
            <strong>{name}</strong>
            <p>
              {info.man} x {info.pop}
            </p>
            <small>
              {info.kooi} | {info.kweekjaar} | {info.jongen?.length || 0} jongen
            </small>
          </button>
        ))}
      </div>
    </aside>
  )
}
