import { useMemo, useState } from 'react'
import { PrintIcon, PdfIcon } from '../icons'
import { vogelNaam } from '../../utils/birdUtils'

const FILTER_FIELDS = ['vogelsoort', 'mutatie', 'geslacht', 'jaar', 'status', 'gezoomd', 'factor', 'split', 'naam', 'aankoopDatum', 'opmerking']
const SORTABLE_FIELDS = ['vogelsoort', 'mutatie', 'geslacht', 'jaar', 'status', 'gezoomd', 'factor', 'split', 'naam', 'aankoopDatum']

function splitLabel(bird) {
  const values = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (values.length > 0) return values.join(', ')
  return bird.Split || '-'
}

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
  mediaByBird,
  onOpenCertificate,
  onOpenPhotos,
}) {
  const [columnSortOrders, setColumnSortOrders] = useState({
    vogelsoort: '',
    mutatie: 'asc',
    geslacht: '',
    jaar: '',
    status: '',
    gezoomd: '',
    factor: '',
    split: '',
    naam: '',
    aankoopDatum: '',
  })
  const [columnFilters, setColumnFilters] = useState({
    vogelsoort: '',
    mutatie: '',
    geslacht: '',
    jaar: '',
    status: '',
    gezoomd: '',
    factor: '',
    split: '',
    naam: '',
    aankoopDatum: '',
    opmerking: '',
  })

  const rowsWithValues = useMemo(
    () =>
      filteredBirds.map(([key, bird]) => ({
        key,
        bird,
        values: {
          vogelsoort: bird.Vogelsoort || '-',
          mutatie: bird.Mutatie || '-',
          geslacht: bird.Geslacht || '-',
          jaar: bird.Kweekjaar || '-',
          status: bird.Status || '-',
          gezoomd: bird.Gezoomd || '-',
          factor: bird.Factor || '-',
          split: splitLabel(bird),
          naam: vogelNaam(bird),
          aankoopDatum: bird.AankoopDatum || '-',
          opmerking: bird.Opmerking || '-',
        },
      })),
    [filteredBirds],
  )

  const filterOptions = useMemo(() => {
    return Object.fromEntries(
      FILTER_FIELDS.map((field) => {
        const uniqueValues = new Set(rowsWithValues.map((row) => row.values[field]))
        const sortedValues = Array.from(uniqueValues).sort((a, b) =>
          a.localeCompare(b, 'nl-BE', { numeric: true, sensitivity: 'base' }),
        )
        return [field, sortedValues]
      }),
    )
  }, [rowsWithValues])

  const visibleRows = useMemo(() => {
    const filteredRows = rowsWithValues.filter((row) => {
      const matchesColumns = FILTER_FIELDS.every((field) => {
        const selected = columnFilters[field]
        return !selected || row.values[field] === selected
      })

      return matchesColumns
    })

    const activeSorts = SORTABLE_FIELDS.filter((field) => columnSortOrders[field])
    if (activeSorts.length === 0) return filteredRows

    return [...filteredRows].sort((a, b) => {
      for (const field of activeSorts) {
        const direction = columnSortOrders[field] === 'desc' ? -1 : 1
        const compare = String(a.values[field]).localeCompare(String(b.values[field]), 'nl-BE', {
          numeric: true,
          sensitivity: 'base',
        })

        if (compare !== 0) {
          return compare * direction
        }
      }

      return 0
    })
  }, [rowsWithValues, columnFilters, columnSortOrders])

  function setFilter(field, value) {
    setColumnFilters((prev) => ({ ...prev, [field]: value }))
  }

  function setSortOrder(field, value) {
    setColumnSortOrders((prev) => ({ ...prev, [field]: value }))
  }

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
              <th>Vogelsoort</th>
              <th>Mutatie</th>
              <th>Geslacht</th>
              <th>Jaar</th>
              <th>Status</th>
              <th>Gezoomd</th>
              <th>Factor</th>
              <th>Split</th>
              <th>Naam</th>
              <th>Aankoop datum</th>
              <th>Opmerking</th>
              <th>Certificaat</th>
              <th>Foto</th>
            </tr>
            <tr className="tableFilters">
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.vogelsoort} onChange={(e) => setFilter('vogelsoort', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.vogelsoort?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.vogelsoort} onChange={(e) => setSortOrder('vogelsoort', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.mutatie} onChange={(e) => setFilter('mutatie', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.mutatie?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.mutatie} onChange={(e) => setSortOrder('mutatie', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.geslacht} onChange={(e) => setFilter('geslacht', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.geslacht?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.geslacht} onChange={(e) => setSortOrder('geslacht', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.jaar} onChange={(e) => setFilter('jaar', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.jaar?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.jaar} onChange={(e) => setSortOrder('jaar', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.status} onChange={(e) => setFilter('status', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.status?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.status} onChange={(e) => setSortOrder('status', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.gezoomd} onChange={(e) => setFilter('gezoomd', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.gezoomd?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.gezoomd} onChange={(e) => setSortOrder('gezoomd', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.factor} onChange={(e) => setFilter('factor', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.factor?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.factor} onChange={(e) => setSortOrder('factor', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.split} onChange={(e) => setFilter('split', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.split?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.split} onChange={(e) => setSortOrder('split', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.naam} onChange={(e) => setFilter('naam', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.naam?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.naam} onChange={(e) => setSortOrder('naam', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">A-Z</option>
                    <option value="desc">Z-A</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="cellFilterStack">
                  <select value={columnFilters.aankoopDatum} onChange={(e) => setFilter('aankoopDatum', e.target.value)}>
                    <option value="">Alle</option>
                    {filterOptions.aankoopDatum?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <select value={columnSortOrders.aankoopDatum} onChange={(e) => setSortOrder('aankoopDatum', e.target.value)}>
                    <option value="">Sortering</option>
                    <option value="asc">Oud → Nieuw</option>
                    <option value="desc">Nieuw → Oud</option>
                  </select>
                </div>
              </th>
              <th>
                <select value={columnFilters.opmerking} onChange={(e) => setFilter('opmerking', e.target.value)}>
                  <option value="">Alle</option>
                  {filterOptions.opmerking?.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ key, values }) => {
              const media = mediaByBird[key]
              const photoCount = media?.photos?.length || 0

              return (
              <tr
                key={key}
                className={selectedBirdKey === key ? 'selected' : ''}
                onClick={() => onSelectBird(key)}
              >
                <td>{values.vogelsoort}</td>
                <td>{values.mutatie}</td>
                <td>{values.geslacht}</td>
                <td>{values.jaar}</td>
                <td>
                  <span className={getStatusBadgeClass(values.status)}>{values.status}</span>
                </td>
                <td>{values.gezoomd}</td>
                <td>{values.factor}</td>
                <td>{values.split}</td>
                <td>{values.naam}</td>
                <td>{values.aankoopDatum}</td>
                <td>{values.opmerking}</td>
                <td>
                  <button
                    type="button"
                    className="mediaTableButton"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenCertificate(key)
                    }}
                  >
                    {media?.certificate ? 'Certificaat' : 'Toevoegen'}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="mediaTableButton"
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenPhotos(key)
                    }}
                  >
                    Foto&apos;s ({photoCount}/10)
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}
