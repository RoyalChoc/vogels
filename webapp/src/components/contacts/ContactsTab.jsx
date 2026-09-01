import { useMemo, useRef, useState } from 'react'
import { PdfIcon } from '../icons'

const BASE_CONTACT_FIELDS = [
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

function contactLabel(contact) {
  const naam = String(contact?.Naam || '').trim()
  const voornaam = String(contact?.Voornaam || '').trim()
  const gemeente = String(contact?.Gemeente || '').trim()
  const fullName = `${voornaam} ${naam}`.trim()
  if (fullName && gemeente) return `${fullName} (${gemeente})`
  if (fullName) return fullName
  return gemeente || 'Onbekend contact'
}

export default function ContactsTab({
  contacts,
  selectedContactId,
  contactForm,
  customFieldNames,
  onContactFieldChange,
  onCustomFieldChange,
  onSelectContact,
  onSaveContact,
  onNewContact,
  onDeleteContact,
  onExportExcel,
  onExportPdf,
  onImportExcel,
}) {
  const [search, setSearch] = useState('')
  const importInputRef = useRef(null)

  const contactEntries = Object.entries(contacts).sort(([, a], [, b]) =>
    contactLabel(a).localeCompare(contactLabel(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
  )

  const visibleContactEntries = useMemo(() => {
    const q = String(search || '').trim().toLowerCase()
    if (!q) return contactEntries

    return contactEntries.filter(([, contact]) => {
      const combined = [
        contactLabel(contact),
        contact.Naam,
        contact.Voornaam,
        contact.Gemeente,
        contact.Provincie,
        contact.Straat,
        contact.Website,
        contact.Gsmnummer,
      ]
        .join(' ')
        .toLowerCase()

      return combined.includes(q)
    })
  }, [contactEntries, search])

  function triggerImport() {
    importInputRef.current?.click()
  }

  return (
    <section className="panel split">
      <article className="card">
        <h2>Contactgegevens</h2>
        <div className="formGrid">
          {BASE_CONTACT_FIELDS.map((field) => (
            <input
              key={field.key}
              placeholder={field.label}
              value={contactForm[field.key] || ''}
              onChange={(event) => onContactFieldChange(field.key, event.target.value)}
            />
          ))}

          {customFieldNames.map((fieldName) => (
            <input
              key={`custom-${fieldName}`}
              placeholder={fieldName}
              value={contactForm.Extra?.[fieldName] || ''}
              onChange={(event) => onCustomFieldChange(fieldName, event.target.value)}
            />
          ))}
        </div>

        <div className="rowActions">
          <button type="button" className="primary" onClick={onSaveContact}>
            {selectedContactId ? 'Wijzig contact' : 'Contact toevoegen'}
          </button>
          <button type="button" className="ghost" onClick={onNewContact}>
            Nieuw contact
          </button>
          <button type="button" className="iconAction" onClick={triggerImport}>
            Importeer contacten (.xls)
          </button>
          <button type="button" className="iconAction" onClick={onExportExcel}>
            Exporteer contacten (Excel)
          </button>
          <button type="button" className="iconAction pdf" onClick={onExportPdf}>
            <PdfIcon />
            <span>Exporteer contacten (PDF)</span>
          </button>
          <button type="button" className="danger" onClick={onDeleteContact}>
            Verwijderen
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xls"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onImportExcel(file)
            }}
            style={{ display: 'none' }}
          />
        </div>
      </article>

      <article className="card">
        <div className="listHead">
          <h2>Contactenlijst</h2>
          <div className="listHeadActions">
            <input
              placeholder="Zoek op naam, gemeente, straat..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="coupleCards">
          {visibleContactEntries.length === 0 && <p>Geen contacten gevonden.</p>}
          {visibleContactEntries.map(([id, contact]) => (
            <button
              key={id}
              type="button"
              className={`coupleCard ${selectedContactId === id ? 'active' : ''}`}
              onClick={() => onSelectContact(id)}
            >
              <strong>{contactLabel(contact)}</strong>
              <p>{[contact.Straat, contact.Nummer].filter(Boolean).join(' ') || '-'}</p>
              <small>
                {[contact.Postcode, contact.Gemeente, contact.Provincie].filter(Boolean).join(' ') || 'Geen adres'}
              </small>
              {customFieldNames
                .map((fieldName) => [fieldName, contact.Extra?.[fieldName]])
                .filter(([, value]) => String(value || '').trim())
                .map(([fieldName, value]) => (
                  <small key={fieldName} className="contactExtraValue">
                    {fieldName}: {value}
                  </small>
                ))}
            </button>
          ))}
        </div>
      </article>
    </section>
  )
}
