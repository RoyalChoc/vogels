export default function Header({
  totalBirds,
  totalCouples,
  totalChildren,
  childrenPerBirthYear,
  childrenStatusFilter,
  onChildrenStatusFilterChange,
}) {
  return (
    <header className="heroBar">
      <div>
        <p className="eyebrow">Splendid Parkieten</p>
        <h1>Voliere Command Center</h1>
        <p className="subline">Moderne webapp voor vogels, koppels en stambomen.</p>

        <section className="yearOverview">
          <div className="yearOverviewHead">
            <h2>Jongen per geboortejaar</h2>
            <select
              value={childrenStatusFilter}
              onChange={(event) => onChildrenStatusFilterChange(event.target.value)}
              aria-label="Filter jongenstatus"
            >
              <option value="active-only">Alleen actief</option>
              <option value="active-sold">Actief + verkocht</option>
              <option value="all">Alles incl. overleden</option>
            </select>
          </div>
          {childrenPerBirthYear.length === 0 ? (
            <p>Geen jongen gekoppeld.</p>
          ) : (
            <ul className="yearList">
              {childrenPerBirthYear.map((item) => (
                <li key={item.year}>
                  <span>{item.year}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="kpiGrid">
        <article>
          <span>Vogels</span>
          <strong>{totalBirds}</strong>
        </article>
        <article>
          <span>Koppels</span>
          <strong>{totalCouples}</strong>
        </article>
        <article>
          <span>Jongen actief</span>
          <strong>{totalChildren}</strong>
        </article>
      </div>
    </header>
  )
}
