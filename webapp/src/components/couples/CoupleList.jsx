import { useEffect, useMemo, useRef } from 'react'

export default function CoupleList({ couples, selectedCouple, onSelectCouple, onCreateCouple }) {
  const cardsRef = useRef(null)

  const coupleEntries = useMemo(() => {
    return Object.entries(couples).sort(([nameA], [nameB]) => {
      if (nameA === selectedCouple) return -1
      if (nameB === selectedCouple) return 1
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [couples, selectedCouple])

  useEffect(() => {
    if (!selectedCouple || !cardsRef.current) return
    const activeCard = cardsRef.current.querySelector('.coupleCard.active')
    activeCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedCouple, coupleEntries])

  return (
    <aside className="card">
      <h2>Koppellijst</h2>
      <div className="rowActions">
        <button type="button" className="primary" onClick={onCreateCouple}>
          Nieuw / extra koppel
        </button>
      </div>
      <div className="coupleCards" ref={cardsRef}>
        {coupleEntries.map(([name, info]) => (
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
