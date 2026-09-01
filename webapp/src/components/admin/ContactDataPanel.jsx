import { useEffect, useMemo, useState } from 'react'

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
  const name = `${String(contact?.Voornaam || '').trim()} ${String(contact?.Naam || '').trim()}`.trim()
  const municipality = String(contact?.Gemeente || '').trim()
  return municipality && name ? `${name} (${municipality})` : name || municipality || 'Onbekend contact'
}

function createDraft(contact, customFieldNames) {
  const draft = { ...contact, Extra: {} }
  customFieldNames.forEach((fieldName) => {
    draft.Extra[fieldName] = String(contact?.Extra?.[fieldName] || '')
  })
  return draft
}

export default function ContactDataPanel({ contacts, customFieldNames, onSaveContacts, onStatus }) {
  const entries = useMemo(
    () =>
      Object.entries(contacts).sort(([, first], [, second]) =>
        contactLabel(first).localeCompare(contactLabel(second), 'nl-BE', { numeric: true, sensitivity: 'base' }),
      ),
    [contacts],
  )
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!selectedId || !contacts[selectedId]) {
      setSelectedId(entries[0]?.[0] || '')
    }
  }, [contacts, entries, selectedId])

  useEffect(() => {
    setDraft(selectedId ? createDraft(contacts[selectedId], customFieldNames) : null)
  }, [contacts, customFieldNames, selectedId])

  async function handleSave() {
    if (!selectedId || !draft) return

    setSaving(true)
    try {
      const nextContacts = {
        ...contacts,
        [selectedId]: createDraft(draft, customFieldNames),
      }
      await onSaveContacts(nextContacts)
      onStatus('Contactgegevens opgeslagen.')
    } catch (error) {
      onStatus(error.message || 'Contactgegevens konden niet worden opgeslagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="card adminCard">
      <h2>Contactgegevens</h2>
      <p>Pas hier bestaande contacten en extra velden aan.</p>

      {entries.length === 0 ? (
        <p className="adminEmpty">Nog geen contacten. Voeg het eerste contact toe via Contacten.</p>
      ) : (
        <>
          <label className="adminContactSelect" htmlFor="admin-contact-select">
            Contact
            <select id="admin-contact-select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {entries.map(([id, contact]) => (
                <option key={id} value={id}>
                  {contactLabel(contact)}
                </option>
              ))}
            </select>
          </label>

          {draft && (
            <div className="adminContactFields">
              {BASE_CONTACT_FIELDS.map(({ key, label }) => (
                <label key={key}>
                  {label}
                  <input
                    value={draft[key] || ''}
                    onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
              {customFieldNames.map((fieldName) => (
                <label key={fieldName}>
                  {fieldName}
                  <input
                    value={draft.Extra?.[fieldName] || ''}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        Extra: { ...current.Extra, [fieldName]: event.target.value },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          )}

          <div className="rowActions">
            <button type="button" className="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Opslaan...' : 'Contact opslaan'}
            </button>
          </div>
        </>
      )}
    </article>
  )
}