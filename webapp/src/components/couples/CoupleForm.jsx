import { PrintIcon, PdfIcon } from '../icons'
import { findBirdByName } from '../../utils/birdUtils'

function calculateUitkomdatum(legdatum) {
  if (!legdatum) return ''
  
  const date = new Date(legdatum)
  date.setDate(date.getDate() + 21)
  
  return date.toISOString().split('T')[0]
}

function createEmptyEi() {
  return {
    legdatum: '',
    uitkomdatum: '',
    mutatie: '',
    gezoomd: '',
    factor: '',
    split1: '',
    split2: '',
    split3: '',
    split4: '',
  }
}

export default function CoupleForm({
  coupleForm,
  setCoupleForm,
  maleNames,
  femaleNames,
  birds,
  optionSets,
  selectedCouple,
  onSave,
  onNew,
  onAdd,
  onPrint,
  onExportPdf,
  onDelete,
}) {
  const factorOptions = optionSets?.factor || []
  const gezoomdOptions = optionSets?.gezoomd || []
  const kooienOptions = optionSets?.kooien || []
  const kweekjaarOptions = optionSets?.jaren || []
  const mutatieOptions = optionSets?.mutaties || []
  const splitOptions = optionSets?.split || []

  const isEditing = Boolean(selectedCouple)
  const yearSelected = Boolean(String(coupleForm.kweekjaar || '').trim())
  const isEditingCurrent = Boolean(selectedCouple && coupleForm.name.trim() === selectedCouple)

  function handleYearChange(value) {
    if (isEditing) {
      setCoupleForm({ ...coupleForm, kweekjaar: value })
      return
    }

    setCoupleForm({
      ...coupleForm,
      kweekjaar: value,
      man: '',
      pop: '',
    })
  }

  function handleLegdatumChange(rondeIndex, eggIndex, newDatum) {
    const rondes = [...(coupleForm.rondes || [])]
    if (!rondes[rondeIndex]) {
      rondes[rondeIndex] = { number: rondeIndex + 1, eitjes: [] }
    }
    const eitjes = [...(rondes[rondeIndex].eitjes || [])]
    if (!eitjes[eggIndex]) {
      eitjes[eggIndex] = createEmptyEi()
    }
    eitjes[eggIndex].legdatum = newDatum

    // Auto-fill uitkomdatum for ei 4+ (index 3+)
    if (eggIndex >= 3 && newDatum) {
      eitjes[eggIndex].uitkomdatum = calculateUitkomdatum(newDatum)
    }

    rondes[rondeIndex].eitjes = eitjes
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleUitkomdatumChange(rondeIndex, eggIndex, newDatum) {
    const rondes = [...(coupleForm.rondes || [])]
    if (!rondes[rondeIndex]) {
      rondes[rondeIndex] = { number: rondeIndex + 1, eitjes: [] }
    }
    const eitjes = [...(rondes[rondeIndex].eitjes || [])]
    if (!eitjes[eggIndex]) {
      eitjes[eggIndex] = createEmptyEi()
    }
    eitjes[eggIndex].uitkomdatum = newDatum
    rondes[rondeIndex].eitjes = eitjes
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleEiFieldChange(rondeIndex, eggIndex, field, value) {
    const rondes = [...(coupleForm.rondes || [])]
    if (!rondes[rondeIndex]) {
      rondes[rondeIndex] = { number: rondeIndex + 1, eitjes: [] }
    }

    const eitjes = [...(rondes[rondeIndex].eitjes || [])]
    if (!eitjes[eggIndex]) {
      eitjes[eggIndex] = createEmptyEi()
    }

    eitjes[eggIndex] = {
      ...createEmptyEi(),
      ...eitjes[eggIndex],
      [field]: value,
    }

    rondes[rondeIndex].eitjes = eitjes
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleAddEi(rondeIndex) {
    const rondes = [...(coupleForm.rondes || [])]
    if (!rondes[rondeIndex]) {
      rondes[rondeIndex] = { number: rondeIndex + 1, eitjes: [] }
    }
    const eitjes = [...(rondes[rondeIndex].eitjes || [])]
    eitjes.push(createEmptyEi())
    rondes[rondeIndex].eitjes = eitjes
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleRemoveEi(rondeIndex, eggIndex) {
    const rondes = [...(coupleForm.rondes || [])]
    if (!rondes[rondeIndex]) return
    const eitjes = [...(rondes[rondeIndex].eitjes || [])]
    eitjes.splice(eggIndex, 1)
    rondes[rondeIndex].eitjes = eitjes
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleAddRonde() {
    const rondes = [...(coupleForm.rondes || [])]
    const newNumber = rondes.length > 0 ? Math.max(...rondes.map(r => r.number || 0)) + 1 : 1
    rondes.push({ number: newNumber, eitjes: [] })
    setCoupleForm({ ...coupleForm, rondes })
  }

  function handleRemoveRonde(rondeIndex) {
    const rondes = [...(coupleForm.rondes || [])]
    rondes.splice(rondeIndex, 1)
    setCoupleForm({ ...coupleForm, rondes })
  }

  return (
    <article className="card">
      <h2>Koppel editor</h2>
      <div className="formGrid">
        <input
          placeholder="Koppelnaam"
          value={coupleForm.name}
          onChange={(e) => setCoupleForm({ ...coupleForm, name: e.target.value })}
        />

        <select
          value={coupleForm.man}
          disabled={!isEditing && !yearSelected}
          onChange={(e) => setCoupleForm({ ...coupleForm, man: e.target.value })}
        >
          <option value="">{!isEditing && !yearSelected ? 'Kies eerst kweekjaar' : 'Man'}</option>
          {[...maleNames].sort((a, b) => {
            const labelA = (findBirdByName(birds || {}, a)?.Mutatie ? `${findBirdByName(birds || {}, a).Mutatie} - ${a}` : a).toLowerCase()
            const labelB = (findBirdByName(birds || {}, b)?.Mutatie ? `${findBirdByName(birds || {}, b).Mutatie} - ${b}` : b).toLowerCase()
            return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' })
          }).map((v) => {
            const mutatie = findBirdByName(birds || {}, v)?.Mutatie
            return (
              <option key={v} value={v}>
                {mutatie ? `${mutatie} - ${v}` : v}
              </option>
            )
          })}
        </select>

        <select
          value={coupleForm.pop}
          disabled={!isEditing && !yearSelected}
          onChange={(e) => setCoupleForm({ ...coupleForm, pop: e.target.value })}
        >
          <option value="">{!isEditing && !yearSelected ? 'Kies eerst kweekjaar' : 'Pop'}</option>
          {[...femaleNames].sort((a, b) => {
            const labelA = (findBirdByName(birds || {}, a)?.Mutatie ? `${findBirdByName(birds || {}, a).Mutatie} - ${a}` : a).toLowerCase()
            const labelB = (findBirdByName(birds || {}, b)?.Mutatie ? `${findBirdByName(birds || {}, b).Mutatie} - ${b}` : b).toLowerCase()
            return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' })
          }).map((v) => {
            const mutatie = findBirdByName(birds || {}, v)?.Mutatie
            return (
              <option key={v} value={v}>
                {mutatie ? `${mutatie} - ${v}` : v}
              </option>
            )
          })}
        </select>

        <select
          value={coupleForm.kooi}
          onChange={(e) => setCoupleForm({ ...coupleForm, kooi: e.target.value })}
        >
          <option value="">Kooi</option>
          {kooienOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={coupleForm.kweekjaar}
          onChange={(e) => handleYearChange(e.target.value)}
        >
          <option value="">Kweekjaar</option>
          {kweekjaarOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="rowActions singleLineActions">
        <button type="button" className="primary" onClick={onSave}>
          {isEditingCurrent ? 'Wijzig koppel' : 'Nieuw koppel'}
        </button>
        <button type="button" className="primary" onClick={onAdd}>
          Koppel toevoegen
        </button>
        <button type="button" onClick={onNew}>
          Extra koppel toevoegen
        </button>
        <button type="button" className="iconAction print" onClick={onPrint}>
          <PrintIcon />
          <span>Afdruk koppel</span>
        </button>
        <button type="button" className="iconAction pdf" onClick={onExportPdf}>
          <PdfIcon />
          <span>Koppel als PDF</span>
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          Verwijder koppel
        </button>
      </div>

      {isEditing && (
        <>
          <hr />
          <h3>Kweekkaart gegevens - Rondes</h3>
          
          {coupleForm.rondes && coupleForm.rondes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              {coupleForm.rondes.map((ronde, rondeIndex) => (
                <div key={rondeIndex} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Ronde {ronde.number}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveRonde(rondeIndex)}
                      style={{
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      Ronde verwijderen
                    </button>
                  </div>

                  {ronde.eitjes && ronde.eitjes.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ei</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Legdatum</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Uitkomdatum</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Mutatie</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Gezoomd</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Factor</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Split</th>
                          <th style={{ padding: '0.5rem', textAlign: 'center', width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ronde.eitjes.map((ei, eggIndex) => (
                          <tr key={eggIndex} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>Ei {eggIndex + 1}</td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="date"
                                value={ei.legdatum || ''}
                                onChange={(e) => handleLegdatumChange(rondeIndex, eggIndex, e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <input
                                type="date"
                                value={ei.uitkomdatum || ''}
                                onChange={(e) => handleUitkomdatumChange(rondeIndex, eggIndex, e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', cursor: 'text', backgroundColor: '#ffffff' }}
                              />
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                value={ei.mutatie || ''}
                                onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'mutatie', e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                              >
                                <option value="">Mutatie</option>
                                {mutatieOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                value={ei.gezoomd || ''}
                                onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'gezoomd', e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                              >
                                <option value="">Gezoomd</option>
                                {gezoomdOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <select
                                value={ei.factor || ''}
                                onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'factor', e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box' }}
                              >
                                <option value="">Factor</option>
                                {factorOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '0.5rem' }}>
                              <div style={{ display: 'grid', gap: '0.25rem' }}>
                                <select
                                  value={ei.split1 || ''}
                                  onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'split1', e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                  <option value="">Split 1</option>
                                  {splitOptions.map((option) => (
                                    <option key={`split1-${option}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={ei.split2 || ''}
                                  onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'split2', e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                  <option value="">Split 2</option>
                                  {splitOptions.map((option) => (
                                    <option key={`split2-${option}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={ei.split3 || ''}
                                  onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'split3', e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                  <option value="">Split 3</option>
                                  {splitOptions.map((option) => (
                                    <option key={`split3-${option}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={ei.split4 || ''}
                                  onChange={(e) => handleEiFieldChange(rondeIndex, eggIndex, 'split4', e.target.value)}
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                >
                                  <option value="">Split 4</option>
                                  {splitOptions.map((option) => (
                                    <option key={`split4-${option}`} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveEi(rondeIndex, eggIndex)}
                                style={{
                                  background: '#ff4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <button type="button" onClick={() => handleAddEi(rondeIndex)} style={{ marginBottom: '1rem' }}>
                    + Ei toevoegen aan Ronde {ronde.number}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={handleAddRonde} style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
            + Nieuwe ronde toevoegen
          </button>

          <div className="formGrid">
            <input
              type="number"
              placeholder="Aantal jong uit"
              min="0"
              value={coupleForm.aantalJongUit || ''}
              onChange={(e) => setCoupleForm({ ...coupleForm, aantalJongUit: e.target.value })}
            />
            <textarea
              placeholder="Opmerking kweek"
              value={coupleForm.opmerkingKweek || ''}
              onChange={(e) => setCoupleForm({ ...coupleForm, opmerkingKweek: e.target.value })}
              style={{ gridColumn: '1 / -1', minHeight: '60px' }}
            />
          </div>
        </>
      )}
    </article>
  )
}
