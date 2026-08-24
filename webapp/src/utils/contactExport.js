import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const BASE_COLUMNS = [
  { key: 'Naam', label: 'Naam' },
  { key: 'Voornaam', label: 'Voornaam' },
  { key: 'Straat', label: 'Straat' },
  { key: 'Nummer', label: 'Nummer' },
  { key: 'Postcode', label: 'Postcode' },
  { key: 'Gemeente', label: 'Gemeente' },
  { key: 'Provincie', label: 'Provincie' },
  { key: 'Gsmnummer', label: 'Gsmnummer' },
  { key: 'Website', label: 'Website' },
]
const BASE_FIELD_KEYS = new Set(BASE_COLUMNS.map((column) => column.key))

function normalizeText(value) {
  return String(value || '').trim()
}

function contactSortKey(contact) {
  return `${normalizeText(contact?.Voornaam)} ${normalizeText(contact?.Naam)} ${normalizeText(contact?.Gemeente)}`.trim()
}

function buildRows(contacts, customFieldNames) {
  const customColumns = customFieldNames
    .filter((fieldName) => normalizeText(fieldName))
    .map((fieldName) => ({ key: fieldName, label: fieldName }))

  const allColumns = [...BASE_COLUMNS, ...customColumns]

  const rows = Object.values(contacts || {})
    .sort((a, b) =>
      contactSortKey(a).localeCompare(contactSortKey(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
    )
    .map((contact) => {
      return allColumns.map((column) => {
        if (BASE_COLUMNS.some((base) => base.key === column.key)) {
          return normalizeText(contact[column.key])
        }
        return normalizeText(contact.Extra?.[column.key])
      })
    })

  return {
    columns: allColumns,
    rows,
  }
}

function normalizeHeader(value) {
  return normalizeText(value).toLowerCase()
}

function getLocalElements(root, name) {
  return Array.from(root.getElementsByTagName('*')).filter((node) => node.localName === name)
}

function getSpreadsheetAttribute(node, attributeName) {
  return (
    node.getAttribute(`ss:${attributeName}`) ||
    node.getAttribute(attributeName) ||
    node.getAttributeNS('urn:schemas-microsoft-com:office:spreadsheet', attributeName) ||
    ''
  )
}

function rowToCells(row) {
  const cells = getLocalElements(row, 'Cell')
  const values = []
  let columnIndex = 1

  cells.forEach((cell) => {
    const explicitIndexRaw = getSpreadsheetAttribute(cell, 'Index')
    const explicitIndex = Number.parseInt(explicitIndexRaw, 10)
    if (Number.isFinite(explicitIndex) && explicitIndex > 0) {
      columnIndex = explicitIndex
    }

    const dataNode = getLocalElements(cell, 'Data')[0]
    values[columnIndex - 1] = normalizeText(dataNode?.textContent || '')
    columnIndex += 1
  })

  return values
}

function toContactSignature(contact) {
  return [contact.Voornaam, contact.Naam, contact.Gemeente, contact.Straat, contact.Nummer]
    .map((value) => normalizeText(value).toLowerCase())
    .join('|')
}

function contactDisplayLabel(contact) {
  const voornaam = normalizeText(contact?.Voornaam)
  const naam = normalizeText(contact?.Naam)
  const gemeente = normalizeText(contact?.Gemeente)
  const fullName = `${voornaam} ${naam}`.trim()
  if (fullName && gemeente) return `${fullName} (${gemeente})`
  if (fullName) return fullName
  return gemeente || 'Onbekend contact'
}

export function mergeContactsNonDestructive(existingContacts, importedContacts) {
  const next = { ...(existingContacts || {}) }
  const usedIds = new Set(Object.keys(next))
  const idBySignature = new Map()

  Object.entries(next).forEach(([id, contact]) => {
    idBySignature.set(toContactSignature(contact), id)
  })

  let addedCount = 0
  let updatedCount = 0
  const addedLabels = []
  const updatedLabels = []

  importedContacts.forEach((incomingContact) => {
    const signature = toContactSignature(incomingContact)
    const existingId = idBySignature.get(signature)

    if (existingId) {
      const current = next[existingId] || {}
      const mergedExtra = { ...(current.Extra || {}) }
      Object.entries(incomingContact.Extra || {}).forEach(([key, value]) => {
        if (normalizeText(value)) {
          mergedExtra[key] = normalizeText(value)
        }
      })

      const merged = {
        ...current,
        ...Object.fromEntries(
          Object.entries(incomingContact).map(([key, value]) => {
            if (key === 'Extra') return [key, mergedExtra]

            const normalizedValue = normalizeText(value)
            return [key, normalizedValue || current[key] || '']
          }),
        ),
        Extra: mergedExtra,
      }

      const changed = JSON.stringify(current) !== JSON.stringify(merged)
      if (changed) {
        next[existingId] = merged
        updatedCount += 1
        updatedLabels.push(contactDisplayLabel(merged))
      }
      return
    }

    let newId = `contact-${Date.now()}-${Math.floor(Math.random() * 100000)}`
    while (usedIds.has(newId)) {
      newId = `contact-${Date.now()}-${Math.floor(Math.random() * 100000)}`
    }
    usedIds.add(newId)

    next[newId] = incomingContact
    idBySignature.set(signature, newId)
    addedCount += 1
    addedLabels.push(contactDisplayLabel(incomingContact))
  })

  return {
    contacts: next,
    addedCount,
    updatedCount,
    addedLabels,
    updatedLabels,
  }
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

function buildContactsExcelXml(columns, rows) {
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
  <Worksheet ss:Name="Contacten">
    <Table>
      ${headerRow}
      ${bodyRows}
    </Table>
  </Worksheet>
</Workbook>`
}

export function exportContactsExcel(contacts, customFieldNames, filenamePrefix = 'contacten') {
  const { columns, rows } = buildRows(contacts, customFieldNames)
  const xml = buildContactsExcelXml(columns, rows)

  downloadBlob(
    new Blob([xml], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    }),
    `${filenamePrefix}-${formatFileStamp()}.xls`,
  )

  return `Excel opgeslagen: ${filenamePrefix}.`
}

export function exportContactsPdf(contacts, customFieldNames) {
  const { columns, rows } = buildRows(contacts, customFieldNames)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFontSize(16)
  doc.text('Contactenoverzicht', 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${new Date().toLocaleString('nl-BE')}`, 12, 17)

  autoTable(doc, {
    startY: 21,
    head: [columns.map((column) => column.label)],
    body: rows.length > 0 ? rows : [columns.map(() => '-')],
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 115, 115],
    },
    alternateRowStyles: {
      fillColor: [247, 251, 252],
    },
  })

  doc.save(`contacten-${formatFileStamp()}.pdf`)
  return 'PDF opgeslagen: contacten.'
}

export function parseContactsFromExcelXml(xmlText, customFieldNames) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml')
  const parseError = xmlDoc.querySelector('parsererror')

  if (parseError) {
    throw new Error('Ongeldig Excel-bestand. Alleen .xls exportbestanden worden ondersteund.')
  }

  const worksheet = getLocalElements(xmlDoc, 'Worksheet').find(
    (node) => normalizeHeader(getSpreadsheetAttribute(node, 'Name')) === 'contacten',
  )
  if (!worksheet) {
    throw new Error('Werkblad Contacten niet gevonden in dit .xls bestand.')
  }

  const rows = getLocalElements(worksheet, 'Row').map(rowToCells).filter((row) => row.some((cell) => normalizeText(cell)))
  if (rows.length < 2) {
    throw new Error('Geen contactgegevens gevonden om te importeren.')
  }

  const customFieldSet = new Set(customFieldNames.map((name) => normalizeHeader(name)))
  const headers = rows[0].map((value) => normalizeText(value))
  const headerMap = headers.map((header) => {
    const normalized = normalizeHeader(header)
    const base = BASE_COLUMNS.find((column) => normalizeHeader(column.label) === normalized)
    if (base) return { type: 'base', key: base.key }
    if (customFieldSet.has(normalized)) {
      const originalName = customFieldNames.find((name) => normalizeHeader(name) === normalized)
      return { type: 'extra', key: originalName }
    }
    return null
  })

  const imported = rows
    .slice(1)
    .map((row) => {
      const contact = {
        Naam: '',
        Voornaam: '',
        Straat: '',
        Nummer: '',
        Postcode: '',
        Gemeente: '',
        Provincie: '',
        Gsmnummer: '',
        Website: '',
        Extra: {},
      }

      headerMap.forEach((mapped, index) => {
        if (!mapped) return
        const value = normalizeText(row[index] || '')
        if (!value) return

        if (mapped.type === 'base' && BASE_FIELD_KEYS.has(mapped.key)) {
          contact[mapped.key] = value
        }
        if (mapped.type === 'extra') {
          contact.Extra[mapped.key] = value
        }
      })

      return contact
    })
    .filter((contact) => normalizeText(contact.Naam) || normalizeText(contact.Voornaam) || normalizeText(contact.Gemeente))

  if (imported.length === 0) {
    throw new Error('Geen bruikbare contacten gevonden in dit bestand.')
  }

  return imported
}
