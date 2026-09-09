import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLUMNS = [
  { key: 'vogelNaam', label: 'Vogel' },
  { key: 'DatumToediening', label: 'Datum toediening' },
  { key: 'Medicijnnaam', label: 'Medicijn' },
  { key: 'Dosering', label: 'Dosering' },
  { key: 'Toedieningswijze', label: 'Toedieningswijze' },
  { key: 'RedenDiagnose', label: 'Reden/diagnose' },
  { key: 'Dierenarts', label: 'Dierenarts' },
  { key: 'DatumHercontrole', label: 'Hercontrole' },
  { key: 'AfgerondLabel', label: 'Afgerond' },
  { key: 'Opmerking', label: 'Opmerking' },
]

function normalizeText(value) {
  return String(value || '').trim()
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function formatFileStamp() {
  return new Date().toISOString().slice(0, 10)
}

function buildRows(records, vogelNaamByKey) {
  const sorted = [...records].sort((a, b) =>
    normalizeText(b.DatumToediening).localeCompare(normalizeText(a.DatumToediening), 'nl-BE', { numeric: true }),
  )

  const rows = sorted.map((record) => {
    const enriched = {
      ...record,
      vogelNaam: vogelNaamByKey[record.VogelKey] || record.VogelKey || '-',
      AfgerondLabel: record.Afgerond ? 'Ja' : 'Nee',
    }
    return COLUMNS.map((column) => normalizeText(enriched[column.key]))
  })

  return { columns: COLUMNS, rows }
}

function buildMedicatiesExcelXml(columns, rows) {
  const headerRow = `<Row>${columns
    .map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
    .join('')}</Row>`

  const bodyRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`)
          .join('')}</Row>`,
    )
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Medicatie">
    <Table>
      ${headerRow}
      ${bodyRows}
    </Table>
  </Worksheet>
</Workbook>`
}

export function exportMedicatiesExcel(records, vogelNaamByKey) {
  const { columns, rows } = buildRows(records, vogelNaamByKey)
  const xml = buildMedicatiesExcelXml(columns, rows)

  downloadBlob(
    new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' }),
    `medicatie-${formatFileStamp()}.xls`,
  )

  return 'Excel opgeslagen: medicatie.'
}

export function exportMedicatiesPdf(records, vogelNaamByKey) {
  const { columns, rows } = buildRows(records, vogelNaamByKey)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.text('Medicatieoverzicht', 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${new Date().toLocaleString('nl-BE')}`, 12, 17)

  autoTable(doc, {
    startY: 21,
    head: [columns.map((column) => column.label)],
    body: rows.length > 0 ? rows : [columns.map(() => '-')],
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 1.8, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
  })

  doc.save(`medicatie-${formatFileStamp()}.pdf`)
  return 'PDF opgeslagen: medicatie.'
}
