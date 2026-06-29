export default function Header({ totalBirds, totalCouples, totalChildren }) {
  return (
    <header className="heroBar">
      <div>
        <p className="eyebrow">Splendid Parkieten</p>
        <h1>Voliere Command Center</h1>
        <p className="subline">Moderne webapp voor vogels, koppels en stambomen.</p>
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
          <span>Jongen links</span>
          <strong>{totalChildren}</strong>
        </article>
      </div>
    </header>
  )
}
