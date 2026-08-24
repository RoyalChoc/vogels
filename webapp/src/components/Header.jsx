import { useEffect, useMemo, useState } from 'react'

const YEARS_PER_PAGE = 2
const PAGE_WINDOW = 5

export default function Header({
  totalBirds,
  totalCouples,
  totalChildren,
  childrenPerBirthYear,
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(childrenPerBirthYear.length / YEARS_PER_PAGE))

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const visibleYears = useMemo(() => {
    const start = (page - 1) * YEARS_PER_PAGE
    return childrenPerBirthYear.slice(start, start + YEARS_PER_PAGE)
  }, [childrenPerBirthYear, page])

  const pageNumbers = useMemo(() => {
    const half = Math.floor(PAGE_WINDOW / 2)
    let start = Math.max(1, page - half)
    const end = Math.min(totalPages, start + PAGE_WINDOW - 1)
    start = Math.max(1, end - PAGE_WINDOW + 1)

    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [page, totalPages])

  return (
    <header className="heroBar">
      <div>
        <p className="eyebrow">Splendid Parkieten</p>
        <h1>Voliere bestand</h1>
        <p className="subline">App voor vogels</p>

        <section className="yearOverview">
          <div className="yearOverviewHead">
            <h2>Jongen per geboortejaar</h2>
          </div>
          {childrenPerBirthYear.length === 0 ? (
            <p>Geen jongen gekoppeld.</p>
          ) : (
            <>
              <ul className="yearList">
                {visibleYears.map((item) => (
                <li key={item.year}>
                  <span>{item.year}</span>
                  <strong>{item.count}</strong>
                </li>
                ))}
              </ul>

              <nav className="yearPager" aria-label="Paginering geboortejaren">
                <button type="button" onClick={() => setPage(1)} disabled={page === 1} aria-label="Eerste pagina">
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  aria-label="Vorige pagina"
                >
                  ‹
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  aria-label="Volgende pagina"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Laatste pagina"
                >
                  »
                </button>
              </nav>
            </>
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
