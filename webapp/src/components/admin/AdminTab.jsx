import { useEffect, useMemo, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import ContactDataPanel from './ContactDataPanel'
import UserRolesPanel from './UserRolesPanel'

function cloneOptionsMap(optionsMap) {
  const next = {}
  Object.entries(optionsMap || {}).forEach(([key, values]) => {
    next[key] = Array.isArray(values) ? [...values] : []
  })
  return next
}

function sanitizeOptionValues(values) {
  const seen = new Set()
  const next = []

  values.forEach((value) => {
    const cleaned = String(value || '').trim()
    if (!cleaned || seen.has(cleaned)) return
    seen.add(cleaned)
    next.push(cleaned)
  })

  return next.sort((a, b) => a.localeCompare(b, 'nl-BE', { numeric: true, sensitivity: 'base' }))
}

function sanitizeOptionsMap(optionsMap, definitions) {
  const sanitized = {}

  definitions.forEach((definition) => {
    const current = optionsMap?.[definition.key]
    sanitized[definition.key] = sanitizeOptionValues(Array.isArray(current) ? current : [])
  })

  return sanitized
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

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildExcelXmlWorkbook(sheets) {
  const worksheetXml = sheets
    .map((sheet) => {
      const rowsXml = [['Waarde'], ...sheet.rows.map((value) => [value])]
        .map((row) => {
          const cells = row
            .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
            .join('')
          return `<Row>${cells}</Row>`
        })
        .join('')

      return `<Worksheet ss:Name="${escapeXml(sheet.name.slice(0, 31))}"><Table>${rowsXml}</Table></Worksheet>`
    })
    .join('')

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  ${worksheetXml}
</Workbook>`
}

function buildImportTemplateSheets(optionDefinitions) {
  return optionDefinitions.map((definition) => ({
    name: definition.label,
    rows: [],
  }))
}

function formatFileTimestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  const yyyy = now.getFullYear()
  const mm = pad(now.getMonth() + 1)
  const dd = pad(now.getDate())
  const hh = pad(now.getHours())
  const min = pad(now.getMinutes())
  const ss = pad(now.getSeconds())
  return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}`
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
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

function parseExcelXmlOptions(xmlText, optionDefinitions) {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml')
  const parseError = xmlDoc.querySelector('parsererror')

  if (parseError) {
    throw new Error('Ongeldig Excel-bestand. Alleen .xls exportbestanden van deze app worden ondersteund.')
  }

  const keyBySheetName = new Map()
  optionDefinitions.forEach((definition) => {
    keyBySheetName.set(normalizeText(definition.label), definition.key)
    keyBySheetName.set(normalizeText(definition.key), definition.key)
    keyBySheetName.set(normalizeText(definition.fileName?.replace('.json', '')), definition.key)
  })

  const worksheets = getLocalElements(xmlDoc, 'Worksheet')
  const imported = {}

  worksheets.forEach((worksheet) => {
    const rawSheetName = getSpreadsheetAttribute(worksheet, 'Name')
    const key = keyBySheetName.get(normalizeText(rawSheetName))
    if (!key) return

    const rows = getLocalElements(worksheet, 'Row')
    const extracted = []

    rows.forEach((row) => {
      const cells = getLocalElements(row, 'Cell')
      let firstColumnValue = ''
      let columnIndex = 1

      cells.forEach((cell) => {
        const explicitIndexRaw = getSpreadsheetAttribute(cell, 'Index')
        const explicitIndex = Number.parseInt(explicitIndexRaw, 10)
        if (Number.isFinite(explicitIndex) && explicitIndex > 0) {
          columnIndex = explicitIndex
        }

        if (columnIndex === 1 && !firstColumnValue) {
          const dataNode = getLocalElements(cell, 'Data')[0]
          firstColumnValue = String(dataNode?.textContent || '').trim()
        }

        columnIndex += 1
      })

      if (firstColumnValue) {
        extracted.push(firstColumnValue)
      }
    })

    if (normalizeText(extracted[0]) === 'waarde') {
      extracted.shift()
    }

    imported[key] = sanitizeOptionValues(extracted)
  })

  if (Object.keys(imported).length === 0) {
    throw new Error('Geen herkenbare lijsten gevonden in dit .xls bestand.')
  }

  return imported
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen.'))
    reader.readAsText(file)
  })
}

export default function AdminTab({
  optionDefinitions,
  optionsMap,
  contacts,
  customContactFieldNames,
  onSave,
  onSaveContacts,
  onStatus,
  token,
  currentUserId,
}) {
  const [activeKey, setActiveKey] = useState(optionDefinitions[0]?.key || '')
  const [draftOptions, setDraftOptions] = useState(() => cloneOptionsMap(optionsMap))
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    setDraftOptions(cloneOptionsMap(optionsMap))
  }, [optionsMap])

  useEffect(() => {
    if (!optionDefinitions.some((item) => item.key === activeKey)) {
      setActiveKey(optionDefinitions[0]?.key || '')
    }
  }, [activeKey, optionDefinitions])

  const activeDefinition = useMemo(
    () => optionDefinitions.find((item) => item.key === activeKey) || optionDefinitions[0],
    [activeKey, optionDefinitions],
  )

  const activeValues = useMemo(() => {
    if (!activeDefinition) return []
    const values = draftOptions[activeDefinition.key]
    return Array.isArray(values) ? values : []
  }, [activeDefinition, draftOptions])

  function updateRow(index, value) {
    if (!activeDefinition) return

    setDraftOptions((current) => {
      const nextRows = [...(current[activeDefinition.key] || [])]
      nextRows[index] = value
      return {
        ...current,
        [activeDefinition.key]: nextRows,
      }
    })
  }

  function addRow() {
    if (!activeDefinition) return

    setDraftOptions((current) => ({
      ...current,
      [activeDefinition.key]: [...(current[activeDefinition.key] || []), ''],
    }))
  }

  function deleteRow(index) {
    if (!activeDefinition) return

    setDraftOptions((current) => {
      const nextRows = [...(current[activeDefinition.key] || [])]
      nextRows.splice(index, 1)
      return {
        ...current,
        [activeDefinition.key]: nextRows,
      }
    })
  }

  function resetChanges() {
    setDraftOptions(cloneOptionsMap(optionsMap))
    onStatus('Wijzigingen teruggezet naar de laatst bewaarde versie.')
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const sanitized = sanitizeOptionsMap(draftOptions, optionDefinitions)
      await onSave(sanitized)
      setDraftOptions(cloneOptionsMap(sanitized))
      onStatus('Beheerdata opgeslagen.')
    } catch (error) {
      onStatus(error.message || 'Opslaan van beheerdata is mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  function exportOptionsAsExcel(options, filenamePrefix) {
    const xml = buildExcelXmlWorkbook(
      optionDefinitions.map((definition) => ({
        name: definition.label,
        rows: options[definition.key],
      })),
    )

    downloadBlob(
      new Blob([xml], {
        type: 'application/vnd.ms-excel;charset=utf-8',
      }),
      `${filenamePrefix}-${formatFileTimestamp()}.xls`,
    )
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const lowerName = String(file.name || '').toLowerCase()
    if (!lowerName.endsWith('.xls')) {
      onStatus('Alleen .xls bestanden worden nu ondersteund voor import.')
      return
    }

    setIsSaving(true)
    try {
      const xmlText = await readFileAsText(file)
      const imported = parseExcelXmlOptions(xmlText, optionDefinitions)
      const base = sanitizeOptionsMap(draftOptions, optionDefinitions)

      // Safety first: always export a full backup before applying import.
      exportOptionsAsExcel(base, 'beheer-backup-voor-import')

      const merged = { ...base }
      const updatedKeys = []

      Object.entries(imported).forEach(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0) {
          return
        }

        const combined = sanitizeOptionValues([...(base[key] || []), ...values])
        if (combined.length === (base[key] || []).length) {
          return
        }

        merged[key] = combined
        updatedKeys.push(key)
      })

      if (updatedKeys.length === 0) {
        onStatus('Import bevat geen nieuwe waarden. Back-up is gemaakt en data is ongewijzigd gebleven.')
        return
      }

      await onSave(merged)
      setDraftOptions(cloneOptionsMap(merged))

      const updatedLabels = optionDefinitions
        .filter((definition) => updatedKeys.includes(definition.key))
        .map((definition) => definition.label)
        .join(', ')

      onStatus(`Import geslaagd. Back-up gemaakt en toegevoegd zonder verwijderen: ${updatedLabels}.`)
    } catch (error) {
      onStatus(error.message || 'Importeren is mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  function triggerImport() {
    if (isSaving) return
    fileInputRef.current?.click()
  }

  function exportExcel() {
    const sanitized = sanitizeOptionsMap(draftOptions, optionDefinitions)
    exportOptionsAsExcel(sanitized, 'beheer-opties')
    onStatus('Excel-bestand met beheerdata geëxporteerd.')
  }

  function exportPdf() {
    const sanitized = sanitizeOptionsMap(draftOptions, optionDefinitions)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const fileStamp = new Date().toISOString().slice(0, 10)

    doc.setFontSize(16)
    doc.text('Beheerdata opties', 12, 14)
    doc.setFontSize(10)
    doc.text(`Gegenereerd op ${new Date().toLocaleString('nl-BE')}`, 12, 19)

    let currentY = 25

    optionDefinitions.forEach((definition, index) => {
      const rows = sanitized[definition.key]
      if (index > 0 && currentY > 245) {
        doc.addPage()
        currentY = 14
      }

      doc.setFontSize(12)
      doc.text(`${definition.label} (${rows.length})`, 12, currentY)

      autoTable(doc, {
        startY: currentY + 2,
        head: [['Nr', 'Waarde']],
        body: (rows.length > 0 ? rows : ['-']).map((value, rowIndex) => [String(rowIndex + 1), value]),
        styles: { fontSize: 9, cellPadding: 1.8 },
        headStyles: { fillColor: [15, 115, 115] },
        margin: { left: 12, right: 12 },
      })

      currentY = (doc.lastAutoTable?.finalY || currentY) + 8
    })

    doc.save(`beheer-opties-${fileStamp}.pdf`)
    onStatus('PDF met beheerdata geëxporteerd.')
  }

  function downloadImportTemplate() {
    const xml = buildExcelXmlWorkbook(buildImportTemplateSheets(optionDefinitions))

    downloadBlob(
      new Blob([xml], {
        type: 'application/vnd.ms-excel;charset=utf-8',
      }),
      `beheer-import-template-${formatFileTimestamp()}.xls`,
    )
    onStatus('Importtemplate geëxporteerd als .xls.')
  }

  return (
    <section className="panel">
      <article className="card adminCard">
        <h2>Beheer JSON-lijsten</h2>
        <p>Beheer hier de waarden voor factor, geslacht, gezoomd, herkomst, jaren, kooien, mutaties, ringmaten, split, status en contactvelden.</p>

        <div className="adminLayout">
          <aside className="adminGroups">
            {optionDefinitions.map((definition) => (
              <button
                key={definition.key}
                type="button"
                className={activeKey === definition.key ? 'active' : ''}
                onClick={() => setActiveKey(definition.key)}
              >
                <span>{definition.label}</span>
                <strong>{(draftOptions[definition.key] || []).length}</strong>
              </button>
            ))}
          </aside>

          <div className="adminEditor">
            <div className="adminEditorHead">
              <h3>{activeDefinition?.label || 'Selecteer lijst'}</h3>
              <small>Bronbestand: {activeDefinition?.fileName || '-'}</small>
            </div>

            <div className="adminRows">
              {activeValues.length === 0 && <p className="adminEmpty">Nog geen waarden. Voeg een nieuwe regel toe.</p>}

              {activeValues.map((value, index) => (
                <div key={`${activeDefinition?.key || 'list'}-${index}`} className="adminRow">
                  <span>{index + 1}</span>
                  <input
                    value={value}
                    onChange={(event) => updateRow(index, event.target.value)}
                    placeholder="Nieuwe waarde"
                  />
                  <button type="button" className="danger" onClick={() => deleteRow(index)}>
                    Verwijder
                  </button>
                </div>
              ))}
            </div>

            <div className="rowActions">
              <button type="button" className="ghost" onClick={addRow}>
                Regel toevoegen
              </button>
            </div>
          </div>
        </div>

        <div className="rowActions">
          <button type="button" className="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Opslaan...' : 'Alle wijzigingen opslaan'}
          </button>
          <button type="button" className="ghost" onClick={resetChanges} disabled={isSaving}>
            Wijzigingen terugzetten
          </button>
          <button type="button" className="iconAction" onClick={triggerImport} disabled={isSaving}>
            Importeer Excel (.xls)
          </button>
          <button type="button" className="iconAction" onClick={downloadImportTemplate} disabled={isSaving}>
            Download importtemplate
          </button>
          <button type="button" className="iconAction" onClick={exportExcel}>
            Exporteer naar Excel
          </button>
          <button type="button" className="iconAction pdf" onClick={exportPdf}>
            Exporteer naar PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>
      </article>

      <ContactDataPanel
        contacts={contacts}
        customFieldNames={customContactFieldNames}
        onSaveContacts={onSaveContacts}
        onStatus={onStatus}
      />
      <UserRolesPanel token={token} currentUserId={currentUserId} onStatus={onStatus} />
    </section>
  )
}