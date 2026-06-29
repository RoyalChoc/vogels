export default function ChildEditor({
  selectedCouple,
  coupleChildren,
  newChild,
  setNewChild,
  availableChildrenNames,
  onAddChild,
  onRemoveChild,
}) {
  return (
    <div className="childEditor">
      <h3>Jongen voor {selectedCouple}</h3>
      <div className="rowActions compact">
        <select value={newChild} onChange={(e) => setNewChild(e.target.value)}>
          <option value="">Kies jong</option>
          {availableChildrenNames.map((child) => (
            <option key={child} value={child}>
              {child}
            </option>
          ))}
        </select>
        <button type="button" className="ghost" onClick={onAddChild}>
          Voeg toe
        </button>
      </div>

      <ul className="chips">
        {(coupleChildren || []).map((child) => (
          <li key={child}>
            <span>{child}</span>
            <button type="button" onClick={() => onRemoveChild(child)}>
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
