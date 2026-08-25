import { useEffect, useMemo, useState } from 'react'
import { splendidFieldGroups, splendidKnownFieldValues } from '../../data/splendidGencalcConfig'
import { calculateSplendid } from '../../utils/splendidGeneticsEngine'
import { exportSplendidResultPdf, printSplendidResult } from '../../utils/print'

const QUICK_PRESETS = [
  { id: 'wildkleur', label: 'kies', male: {}, female: {} },
  { id: 'violet-df', label: 'violet(df)', male: { 'md[0]': 'V/V;' }, female: { 'fd[0]': 'V/V;' } },
  { id: 'violet-ef', label: 'violet(ef)', male: { 'md[0]': 'V+/V;' }, female: { 'fd[0]': 'V+/V;' } },
  { id: 'grijs-df', label: 'grijs(df)', male: { 'md[1]': 'G/G;' }, female: { 'fd[1]': 'G/G;' } },
  { id: 'grijs-ef', label: 'grijs(ef)', male: { 'md[1]': 'G+/G;' }, female: { 'fd[1]': 'G+/G;' } },
  { id: 'khaki-df', label: 'khaki(df)', male: { 'md[2]': 'Kh/Kh;' }, female: { 'fd[2]': 'Kh/Kh;' } },
  { id: 'khaki-ef', label: 'khaki(ef)', male: { 'md[2]': 'Kh+/Kh;' }, female: { 'fd[2]': 'Kh+/Kh;' } },
  { id: 'cinnamon', label: 'cinnamon visueel', male: { 'ms[0]': 'cin/cin;' }, female: { 'fs[0]': 'cin/Y;' } },
  { id: 'split-cinnamon', label: 'split cinnamon', male: { 'ms[0]': 'cin/cin+;' }, female: {} },
  { id: 'opaline', label: 'opaline visueel', male: { 'ms[1]': 'op/op;' }, female: { 'fs[1]': 'op/Y;' } },
  { id: 'split-opaline', label: 'split opaline', male: { 'ms[1]': 'op/op+;' }, female: {} },
  { id: 'split-ino', label: 'split ino', male: { 'msm[1]': '1ino' }, female: {} },
  { id: 'split-pallid', label: 'split pallid(isabel)', male: { 'msm[1]': '1ino*pd' }, female: {} },
  { id: 'ino', label: 'ino', male: { 'msm[0]': 'ino' }, female: { 'fsm[0]': 'ino/Y;' } },
  { id: 'pallid', label: 'pallid(isabel)', male: { 'msm[0]': 'ino*pd' }, female: { 'fsm[0]': 'ino*pd/Y;' } },
  { id: 'dom-bont-df', label: 'dom.Bont(df)', male: { 'md[3]': 'Pi/Pi;' }, female: { 'fd[3]': 'Pi/Pi;' } },
  { id: 'dom-bont-ef', label: 'dom.Bont(ef)', male: { 'md[3]': 'Pi+/Pi;' }, female: { 'fd[3]': 'Pi+/Pi;' } },
  { id: 'rec-bont', label: 'rec.Bont visueel', male: { 'mr[0]': 's/s;' }, female: { 'fr[0]': 's/s;' } },
  { id: 'split-rec-bont', label: 'split rec.Bont', male: { 'mr[0]': 's+/s;' }, female: { 'fr[0]': 's+/s;' } },
  { id: 'dun-fallow', label: 'dun_fallow visueel', male: { 'mr[1]': 'df/df;' }, female: { 'fr[1]': 'df/df;' } },
  { id: 'split-dun-fallow', label: 'split dun_fallow', male: { 'mr[1]': 'df+/df;' }, female: { 'fr[1]': 'df+/df;' } },
  { id: 'ashen-fallow', label: 'ashen_fallow visueel', male: { 'mr[2]': 'af/af;' }, female: { 'fr[2]': 'af/af;' } },
  { id: 'split-ashen-fallow', label: 'split ashen_fallow', male: { 'mr[2]': 'af+/af;' }, female: { 'fr[2]': 'af+/af;' } },
  { id: 'witborst-blauw', label: '(witborst)blauw', male: { 'mrm[0]': 'bl' }, female: { 'frm[0]': 'bl' } },
  { id: 'pastelblauw', label: 'pastelblauw', male: { 'mrm[0]': 'bl*tq' }, female: { 'frm[0]': 'bl*tq' } },
  { id: 'zeegroen', label: 'zeegroen', male: { 'mrm[0]': 'bl*aq' }, female: { 'frm[0]': 'bl*aq' } },
  { id: 'gezoomd-df', label: 'gezoomd(df)', male: { 'md[4]': 'Ed/Ed;' }, female: { 'fd[4]': 'Ed/Ed;' } },
  { id: 'gezoomd-ef', label: 'gezoomd(ef)', male: { 'md[4]': 'Ed+/Ed;' }, female: { 'fd[4]': 'Ed+/Ed;' } },
  { id: 'roodbuik-df', label: 'roodbuik(df)', male: { 'md[5]': 'Rs/Rs;' }, female: { 'fd[5]': 'Rs/Rs;' } },
  { id: 'roodbuik-ef', label: 'roodbuik(ef)', male: { 'md[5]': 'Rs+/Rs;' }, female: { 'fd[5]': 'Rs+/Rs;' } },
]

// ─── Accessible radio pill group ─────────────────────────────────────────────

function RadioPills({ fieldName, value, onChange, options, disabledValues = [] }) {
  const disabledSet = new Set(disabledValues)
  return (
    <div className="splendidRadioPills" role="radiogroup">
      {options.map((opt, i) => {
        const id = `${fieldName}-${i}`
        const isDisabled = disabledSet.has(opt.value)
        const isSelected = (value || '') === opt.value
        return (
          <label
            key={id}
            htmlFor={id}
            className={`splendidRadioPill${isSelected ? ' is-selected' : ''}${isDisabled ? ' is-disabled' : ''}`}
          >
            <input
              id={id}
              type="radio"
              name={fieldName}
              value={opt.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={(e) => onChange(e.target.value)}
            />
            {opt.label === 'kies' ? '—' : opt.label}
          </label>
        )
      })}
    </div>
  )
}

// ─── Dependency helpers ───────────────────────────────────────────────────────

function disabledInoSecondaryValues(primaryValue, options) {
  if (!primaryValue) return []
  const primaryIndex = ['ino', 'ino*pd'].indexOf(primaryValue)
  if (primaryIndex < 0) return []
  const threshold = primaryIndex * 2
  return options.filter((_, index) => index >= threshold).map((o) => o.value)
}

function disabledBlueSecondaryValues(primaryValue, options) {
  if (!primaryValue) return []
  const primaryIndex = ['bl', 'bl*tq', 'bl*aq'].indexOf(primaryValue)
  if (primaryIndex < 0) return []
  return options.filter((_, index) => index >= primaryIndex).map((o) => o.value)
}

// ─── Parent label builder ─────────────────────────────────────────────────────

function buildParentSummary(fields, sex) {
  const isMale = sex === 'male'
  const parts = []

  splendidFieldGroups.forEach((group) => {
    group.rows.forEach((row) => {
      if (row.options) {
        const key = isMale ? row.maleField : row.femaleField
        const val = fields[key] || ''
        if (val) {
          const opt = row.options.find((o) => o.value === val)
          if (opt && opt.label !== 'kies') parts.push(opt.label)
        }
        return
      }
      if (row.maleOptions) {
        const key = isMale ? row.maleField : row.femaleField
        const opts = isMale ? row.maleOptions : row.femaleOptions
        const val = fields[key] || ''
        if (val) {
          const opt = opts.find((o) => o.value === val)
          if (opt && opt.label !== 'kies') parts.push(opt.label)
        }
        return
      }
      if (row.seriesOptions) {
        const [fA, fB] = isMale
          ? [row.maleFieldPrimary, row.maleFieldSecondary]
          : [row.femaleFieldPrimary, row.femaleFieldSecondary]
        const alleles = [fields[fA] || '', fields[fB] || ''].filter(Boolean)
        if (alleles.length > 0) {
          const names = alleles.map((v) => {
            const opt = row.seriesOptions.find((o) => o.value === v)
            return opt ? opt.label.replace(' allel', '') : v
          })
          parts.push(names.join('/'))
        }
        return
      }
      // ino/pallid special
      if (isMale) {
        const primVal = fields[row.maleFieldPrimary] || ''
        const secVal = fields[row.maleFieldSecondary] || ''
        if (primVal) {
          const opt = (row.malePrimaryOptions || []).find((o) => o.value === primVal)
          if (opt && opt.label !== 'kies') parts.push(opt.label)
        }
        if (secVal) {
          const opt = (row.maleSecondaryOptions || []).find((o) => o.value === secVal)
          if (opt && opt.label !== 'kies') parts.push(opt.label)
        }
      } else {
        const val = fields[row.femaleField] || ''
        if (val) {
          const opt = (row.femaleOptions || []).find((o) => o.value === val)
          if (opt && opt.label !== 'kies') parts.push(opt.label)
        }
      }
    })
  })

  return parts.length > 0 ? parts.join(' · ') : 'Wildkleur'
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SplendidCalculatorTab() {
  const [fields, setFields] = useState({})
  const [visualOnly, setVisualOnly] = useState(false)
  const [showSplitDetails, setShowSplitDetails] = useState(false)
  const [showGeneticCode, setShowGeneticCode] = useState(false)
  const [malePreset, setMalePreset] = useState('wildkleur')
  const [femalePreset, setFemalePreset] = useState('wildkleur')
  const [calcFields, setCalcFields] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [exportError, setExportError] = useState('')

  function setFieldValue(name, value) {
    setFields((current) => ({ ...current, [name]: value }))
  }

  function resetAll() {
    setFields({})
    setVisualOnly(false)
    setShowSplitDetails(false)
    setShowGeneticCode(false)
    setMalePreset('wildkleur')
    setFemalePreset('wildkleur')
    setCalcFields(null)
    setShowResults(false)
    setExportError('')
  }

  function applyQuickPreset(sex, presetId) {
    const preset = QUICK_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    const values = sex === 'male' ? preset.male : preset.female
    const keyPrefix = sex === 'male' ? 'm' : 'f'
    setFields((current) => {
      const next = { ...current }
      Object.keys(splendidKnownFieldValues).forEach((key) => {
        if (key.startsWith(keyPrefix)) next[key] = ''
      })
      Object.entries(values).forEach(([key, value]) => { next[key] = value })
      return next
    })
  }

  // Ino X2 auto-clear when X1 changes
  useEffect(() => {
    const primary = fields['msm[0]'] || ''
    const secondary = fields['msm[1]'] || ''
    const disabled = disabledInoSecondaryValues(primary, splendidFieldGroups[1].rows[1].maleSecondaryOptions)
    if (secondary && disabled.includes(secondary)) setFieldValue('msm[1]', '')
  }, [fields])

  // Blue-series allel 2 auto-clear when allel 1 changes
  useEffect(() => {
    const blueOpts = splendidFieldGroups[2].rows[4].seriesOptions.filter((o) => o.value !== '')
    const pairs = [['mrm[0]', 'mrm[1]'], ['frm[0]', 'frm[1]']]
    pairs.forEach(([primary, secondary]) => {
      const pVal = fields[primary] || ''
      const sVal = fields[secondary] || ''
      if (sVal && disabledBlueSecondaryValues(pVal, blueOpts).includes(sVal)) {
        setFieldValue(secondary, '')
      }
    })
  }, [fields])

  // Snapshot fields on Calculate; display toggles recalculate live within the modal.
  const result = useMemo(
    () => (calcFields ? calculateSplendid(calcFields, { visualOnly, showGeneticCode, showSplitDetails }) : null),
    [calcFields, visualOnly, showGeneticCode, showSplitDetails],
  )

  const maleSummary = useMemo(() => (calcFields ? buildParentSummary(calcFields, 'male') : ''), [calcFields])
  const femaleSummary = useMemo(() => (calcFields ? buildParentSummary(calcFields, 'female') : ''), [calcFields])

  function handleCalculate() {
    setCalcFields({ ...fields })
    setShowResults(true)
    setExportError('')
  }

  function handleExportPdf() {
    if (!result) return
    try {
      exportSplendidResultPdf(
        result.maleRows, result.femaleRows,
        { visualOnly, showSplitDetails, showGeneticCode },
        maleSummary, femaleSummary,
      )
      setExportError('')
    } catch (err) {
      setExportError(err.message || 'PDF kon niet worden opgeslagen.')
    }
  }

  function handlePrint() {
    if (!result) return
    try {
      printSplendidResult(
        result.maleRows, result.femaleRows,
        { visualOnly, showSplitDetails, showGeneticCode },
        maleSummary, femaleSummary,
      )
      setExportError('')
    } catch (err) {
      setExportError(err.message || 'Afdrukken mislukt.')
    }
  }

  function renderMutationRow(group, row) {
    if (row.options) {
      return (
        <div key={`${group.id}-${row.symbol}`} className="splendidCompactRow">
          <span className="splendidCompactLabel">
            <strong>{row.symbol}</strong>
            <span>{row.mutation}</span>
          </span>
          <RadioPills
            fieldName={`${row.maleField}-m`}
            value={fields[row.maleField]}
            onChange={(v) => setFieldValue(row.maleField, v)}
            options={row.options}
          />
          <RadioPills
            fieldName={`${row.femaleField}-f`}
            value={fields[row.femaleField]}
            onChange={(v) => setFieldValue(row.femaleField, v)}
            options={row.options}
          />
        </div>
      )
    }

    if (row.maleOptions) {
      return (
        <div key={`${group.id}-${row.symbol}`} className="splendidCompactRow">
          <span className="splendidCompactLabel">
            <strong>{row.symbol}</strong>
            <span>{row.mutation}</span>
          </span>
          <RadioPills
            fieldName={`${row.maleField}-m`}
            value={fields[row.maleField]}
            onChange={(v) => setFieldValue(row.maleField, v)}
            options={row.maleOptions}
          />
          <RadioPills
            fieldName={`${row.femaleField}-f`}
            value={fields[row.femaleField]}
            onChange={(v) => setFieldValue(row.femaleField, v)}
            options={row.femaleOptions}
          />
        </div>
      )
    }

    if (row.seriesOptions) {
      const malePrimary = fields[row.maleFieldPrimary] || ''
      const maleSecondary = fields[row.maleFieldSecondary] || ''
      const femalePrimary = fields[row.femaleFieldPrimary] || ''
      const femaleSecondary = fields[row.femaleFieldSecondary] || ''
      const optNoEmpty = row.seriesOptions.filter((o) => o.value !== '')
      return (
        <div key={`${group.id}-${row.symbol}`} className="splendidCompactRow">
          <span className="splendidCompactLabel">
            <strong>{row.symbol}</strong>
            <span>{row.mutation}</span>
          </span>
          <div className="splendidCompactDouble">
            <RadioPills fieldName={`${row.maleFieldPrimary}-m1`} value={malePrimary} onChange={(v) => setFieldValue(row.maleFieldPrimary, v)} options={row.seriesOptions} />
            <RadioPills fieldName={`${row.maleFieldSecondary}-m2`} value={maleSecondary} onChange={(v) => setFieldValue(row.maleFieldSecondary, v)} options={row.seriesOptions} disabledValues={disabledBlueSecondaryValues(malePrimary, optNoEmpty)} />
          </div>
          <div className="splendidCompactDouble">
            <RadioPills fieldName={`${row.femaleFieldPrimary}-f1`} value={femalePrimary} onChange={(v) => setFieldValue(row.femaleFieldPrimary, v)} options={row.seriesOptions} />
            <RadioPills fieldName={`${row.femaleFieldSecondary}-f2`} value={femaleSecondary} onChange={(v) => setFieldValue(row.femaleFieldSecondary, v)} options={row.seriesOptions} disabledValues={disabledBlueSecondaryValues(femalePrimary, optNoEmpty)} />
          </div>
        </div>
      )
    }

    // ino/pallid: X1 + X2 for male, single for female
    const malePrimary = fields[row.maleFieldPrimary] || ''
    const maleSecondary = fields[row.maleFieldSecondary] || ''
    const disabledSecondary = disabledInoSecondaryValues(
      malePrimary,
      (row.maleSecondaryOptions || []).filter((o) => o.value !== ''),
    )
    return (
      <div key={`${group.id}-${row.symbol}`} className="splendidCompactRow">
        <span className="splendidCompactLabel">
          <strong>{row.symbol}</strong>
          <span>{row.mutation}</span>
        </span>
        <div className="splendidCompactDouble">
          <RadioPills fieldName={`${row.maleFieldPrimary}-m-x1`} value={malePrimary} onChange={(v) => setFieldValue(row.maleFieldPrimary, v)} options={row.malePrimaryOptions} />
          <RadioPills fieldName={`${row.maleFieldSecondary}-m-x2`} value={maleSecondary} onChange={(v) => setFieldValue(row.maleFieldSecondary, v)} options={row.maleSecondaryOptions} disabledValues={disabledSecondary} />
        </div>
        <RadioPills
          fieldName={`${row.femaleField}-f`}
          value={fields[row.femaleField]}
          onChange={(v) => setFieldValue(row.femaleField, v)}
          options={row.femaleOptions}
        />
      </div>
    )
  }

  const showCode = showGeneticCode && !visualOnly

  return (
    <section className="panel splendidPanel">
      <article className="card">
        {/* Header */}
        <div className="splendidCompactHeader">
          <div>
            <h2>Splendid Calculator</h2>
            <p className="splendidCompactSubtitle">Neophema splendida</p>
          </div>
          <button type="button" className="splendidResetBtn" onClick={resetAll}>
            ↺ Reset
          </button>
        </div>

        {/* Quick presets */}
        <div className="splendidCompactPresets">
          <label className="splendidCompactPresetField">
            <span>Snelle keuze 1.0</span>
            <select value={malePreset} onChange={(e) => { setMalePreset(e.target.value); applyQuickPreset('male', e.target.value) }}>
              {QUICK_PRESETS.map((p) => <option key={`mp-${p.id}`} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="splendidCompactPresetField">
            <span>Snelle keuze 0.1</span>
            <select value={femalePreset} onChange={(e) => { setFemalePreset(e.target.value); applyQuickPreset('female', e.target.value) }}>
              {QUICK_PRESETS.map((p) => <option key={`fp-${p.id}`} value={p.id}>{p.label}</option>)}
            </select>
          </label>
        </div>

        {/* Compact mutation table with radio pills */}
        <div className="splendidCompactTable">
          <div className="splendidCompactTableHead">
            <span>Mutatie</span>
            <span>Man 1.0</span>
            <span>Pop 0.1</span>
          </div>
          {splendidFieldGroups.map((group) => (
            <div key={group.id}>
              <div className="splendidCompactGroupHeader">{group.title}</div>
              {group.rows.map((row) => renderMutationRow(group, row))}
            </div>
          ))}
        </div>

        <div className="splendidCompactActions">
          <button type="button" className="primary" onClick={handleCalculate}>
            Bereken nakomelingen
          </button>
        </div>
      </article>

      {/* Results modal */}
      {showResults && result && (
        <div className="pinGateBackdrop" role="dialog" aria-modal="true" aria-label="Nakomelingen Splendidparkiet">
          <article className="card splendidResultModal">

            {/* Sticky header */}
            <div className="splendidModalTop">
              <div>
                <h2>Nakomelingen</h2>
                <p className="splendidCompactSubtitle">Neophema splendida</p>
              </div>
              <button type="button" className="ghost splendidModalClose" onClick={() => setShowResults(false)} aria-label="Sluiten">
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="splendidModalBody">
              {/* Crossing summary */}
              <div className="splendidCrossing">
                <div className="splendidCrossingRow">
                  <span className="splendidCrossingBadge splendidCrossingBadge--male">1.0</span>
                  <span>{maleSummary}</span>
                </div>
                <div className="splendidCrossingSep">×</div>
                <div className="splendidCrossingRow">
                  <span className="splendidCrossingBadge splendidCrossingBadge--female">0.1</span>
                  <span>{femaleSummary}</span>
                </div>
              </div>

              {/* Display toggles */}
              <div className="splendidModalToggles">
                <label>
                  <input type="checkbox" checked={visualOnly} onChange={(e) => setVisualOnly(e.target.checked)} />
                  Enkel visueel
                </label>
                <label className={visualOnly ? 'is-muted' : ''}>
                  <input type="checkbox" checked={showSplitDetails} disabled={visualOnly} onChange={(e) => setShowSplitDetails(e.target.checked)} />
                  Splits tonen
                </label>
                <label>
                  <input type="checkbox" checked={showGeneticCode} onChange={(e) => setShowGeneticCode(e.target.checked)} />
                  Genetische code
                </label>
              </div>

              {/* Results grids */}
              <div className="splendidModalResults">
                <div className="splendidModalSection">
                  <h3 className="calcMale">1.0 – Mannen</h3>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>%</th>
                          <th>Uitkomst</th>
                          {showCode && <th>Code</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {result.maleRows.map((row, i) => (
                          <tr key={`m-${i}`}>
                            <td className="splendidPctCell">{row.percentage.toFixed(2)}%</td>
                            <td>{row.label}</td>
                            {showCode && <td className="splendidCodeCell">{row.code}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="splendidModalSection">
                  <h3 className="calcFemale">0.1 – Poppen</h3>
                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>%</th>
                          <th>Uitkomst</th>
                          {showCode && <th>Code</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {result.femaleRows.map((row, i) => (
                          <tr key={`f-${i}`}>
                            <td className="splendidPctCell">{row.percentage.toFixed(2)}%</td>
                            <td>{row.label}</td>
                            {showCode && <td className="splendidCodeCell">{row.code}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {exportError && <p className="splendidExportError">{exportError}</p>}
            </div>

            {/* Sticky footer */}
            <div className="splendidModalFooter">
              <button type="button" className="primary" onClick={handleExportPdf}>
                Export PDF
              </button>
              <button type="button" className="ghost" onClick={handlePrint}>
                Afdrukken
              </button>
              <button type="button" className="ghost" onClick={() => setShowResults(false)}>
                Sluiten
              </button>
            </div>

          </article>
        </div>
      )}
    </section>
  )
}
