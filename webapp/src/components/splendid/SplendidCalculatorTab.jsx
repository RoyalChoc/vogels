import { useEffect, useMemo, useState } from 'react'
import { splendidFieldGroups, splendidKnownFieldValues } from '../../data/splendidGencalcConfig'
import { calculateLocalSplendid } from '../../utils/splendidLocalEngine'

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

function RadioGroup({ legend, name, value, onChange, options, disabledValues = [] }) {
  const disabledSet = new Set(disabledValues)

  return (
    <fieldset className="splendidRadioGroup">
      <legend>{legend}</legend>
      <div className="splendidRadioList">
        {options.map((option, index) => {
          const optionId = `${name}-${index}`
          const isDisabled = disabledSet.has(option.value)
          return (
            <label key={optionId} htmlFor={optionId} className={`splendidRadioItem${isDisabled ? ' disabled' : ''}`}>
              <input
                id={optionId}
                type="radio"
                name={name}
                value={option.value}
                checked={(value || '') === option.value}
                disabled={isDisabled}
                onChange={(event) => onChange(event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function disabledInoSecondaryValues(primaryValue, options) {
  if (!primaryValue) return []
  const primaryIndex = ['ino', 'ino*pd'].indexOf(primaryValue)
  if (primaryIndex < 0) return []
  const threshold = primaryIndex * 2
  return options.filter((option, index) => index >= threshold).map((option) => option.value)
}

function disabledBlueSecondaryValues(primaryValue, options) {
  if (!primaryValue) return []
  const primaryIndex = ['bl', 'bl*tq', 'bl*aq'].indexOf(primaryValue)
  if (primaryIndex < 0) return []
  return options.filter((option, index) => index >= primaryIndex).map((option) => option.value)
}

function inoDependencyHint(primaryValue) {
  if (primaryValue === 'ino') return 'X1 = ino: X2 wordt uitgeschakeld (GenCalc-regel).'
  if (primaryValue === 'ino*pd') return 'X1 = pallid(isabel): op X2 blijft alleen ino mogelijk.'
  return 'Kies eerst X1; dan worden onmogelijke X2-keuzes automatisch uitgeschakeld.'
}

function blueDependencyHint(primaryValue, sexLabel) {
  if (!primaryValue) return `${sexLabel}: kies eerst allel 1; daarna worden onmogelijke allel 2-keuzes uitgeschakeld.`
  if (primaryValue === 'bl') return `${sexLabel}: bij allel 1 = bl is allel 2 volledig uitgeschakeld.`
  if (primaryValue === 'bl*tq') return `${sexLabel}: bij allel 1 = bl*tq blijft alleen bl als allel 2 mogelijk.`
  if (primaryValue === 'bl*aq') return `${sexLabel}: bij allel 1 = bl*aq blijven bl en bl*tq als allel 2 mogelijk.`
  return ''
}

export default function SplendidCalculatorTab() {
  const [fields, setFields] = useState({})
  const [visualOnly, setVisualOnly] = useState(false)
  const [showGeneticCode, setShowGeneticCode] = useState(true)
  const [showSplitDetails, setShowSplitDetails] = useState(true)
  const [malePreset, setMalePreset] = useState('wildkleur')
  const [femalePreset, setFemalePreset] = useState('wildkleur')

  const fieldCount = useMemo(() => Object.keys(splendidKnownFieldValues).length, [])

  function setFieldValue(name, value) {
    setFields((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function resetAll() {
    setFields({})
    setVisualOnly(false)
    setShowGeneticCode(true)
    setShowSplitDetails(true)
    setMalePreset('wildkleur')
    setFemalePreset('wildkleur')
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
      Object.entries(values).forEach(([key, value]) => {
        next[key] = value
      })
      return next
    })
  }

  useEffect(() => {
    const primary = fields['msm[0]'] || ''
    const secondary = fields['msm[1]'] || ''
    const disabled = disabledInoSecondaryValues(primary, splendidFieldGroups[1].rows[1].maleSecondaryOptions)
    if (secondary && disabled.includes(secondary)) {
      setFieldValue('msm[1]', '')
    }
  }, [fields])

  useEffect(() => {
    const mPrimary = fields['mrm[0]'] || ''
    const mSecondary = fields['mrm[1]'] || ''
    const fPrimary = fields['frm[0]'] || ''
    const fSecondary = fields['frm[1]'] || ''
    const blueOptions = splendidFieldGroups[2].rows[4].seriesOptions.filter((option) => option.value !== '')

    const disabledM = disabledBlueSecondaryValues(mPrimary, blueOptions)
    const disabledF = disabledBlueSecondaryValues(fPrimary, blueOptions)

    if (mSecondary && disabledM.includes(mSecondary)) {
      setFieldValue('mrm[1]', '')
    }

    if (fSecondary && disabledF.includes(fSecondary)) {
      setFieldValue('frm[1]', '')
    }
  }, [fields])

  const result = useMemo(
    () => calculateLocalSplendid(fields, { visualOnly, showGeneticCode, showSplitDetails }),
    [fields, visualOnly, showGeneticCode, showSplitDetails],
  )

  const diagnostics = useMemo(() => {
    const entries = []

    const inoRow = splendidFieldGroups[1].rows[1]
    const inoPrimary = fields['msm[0]'] || ''
    const inoDisabled = disabledInoSecondaryValues(
      inoPrimary,
      inoRow.maleSecondaryOptions.filter((option) => option.value !== ''),
    )
    if (inoDisabled.length > 0) {
      const labels = inoRow.maleSecondaryOptions
        .filter((option) => inoDisabled.includes(option.value))
        .map((option) => option.label)
      entries.push({
        key: 'ino-man-x2',
        title: 'Ino/Pallid - Man X2',
        reason: inoDependencyHint(inoPrimary),
        blockedLabels: labels,
      })
    }

    const blueRow = splendidFieldGroups[2].rows[4]
    const blueOptions = blueRow.seriesOptions.filter((option) => option.value !== '')

    const mBluePrimary = fields['mrm[0]'] || ''
    const mBlueDisabled = disabledBlueSecondaryValues(mBluePrimary, blueOptions)
    if (mBlueDisabled.length > 0) {
      const labels = blueRow.seriesOptions
        .filter((option) => mBlueDisabled.includes(option.value))
        .map((option) => option.label)
      entries.push({
        key: 'blue-man-2',
        title: 'Blue-serie - Man allel 2',
        reason: blueDependencyHint(mBluePrimary, 'Man'),
        blockedLabels: labels,
      })
    }

    const fBluePrimary = fields['frm[0]'] || ''
    const fBlueDisabled = disabledBlueSecondaryValues(fBluePrimary, blueOptions)
    if (fBlueDisabled.length > 0) {
      const labels = blueRow.seriesOptions
        .filter((option) => fBlueDisabled.includes(option.value))
        .map((option) => option.label)
      entries.push({
        key: 'blue-pop-2',
        title: 'Blue-serie - Pop allel 2',
        reason: blueDependencyHint(fBluePrimary, 'Pop'),
        blockedLabels: labels,
      })
    }

    return entries
  }, [fields])

  return (
    <section className="panel splendidPanel">
      <article className="card">
        <h2>Splendid Calculator (autonoom)</h2>
        <p className="splendidIntro">
          Deze versie gebruikt lokaal exact dezelfde invoervelden als GenCalc voor{' '}
          <strong>Neophema splendida</strong>, maar rekent volledig autonoom in de app.
        </p>
        <p className="splendidIntro">Data integrity: {fieldCount} veldgroepen/flags gematcht met GenCalc.</p>

        <div className="splendidActionsRow">
          <button type="button" className="ghost" onClick={resetAll}>
            Standaardwaarden herstellen
          </button>
        </div>

        <div className="splendidToggleGrid">
          <label className="splendidField">
            <span>Snelle keuze man 1.0</span>
            <select
              value={malePreset}
              onChange={(event) => {
                const next = event.target.value
                setMalePreset(next)
                applyQuickPreset('male', next)
              }}
            >
              {QUICK_PRESETS.map((preset) => (
                <option key={`male-preset-${preset.id}`} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <label className="splendidField">
            <span>Snelle keuze pop 0.1</span>
            <select
              value={femalePreset}
              onChange={(event) => {
                const next = event.target.value
                setFemalePreset(next)
                applyQuickPreset('female', next)
              }}
            >
              {QUICK_PRESETS.map((preset) => (
                <option key={`female-preset-${preset.id}`} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="splendidToggleGrid">
          <label>
            <input type="checkbox" checked={visualOnly} onChange={(event) => setVisualOnly(event.target.checked)} />
            Enkel visueel (split=0)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showGeneticCode}
              onChange={(event) => setShowGeneticCode(event.target.checked)}
            />
            Geef genetische code weer (scode=1)
          </label>
          <label>
            <input
              type="checkbox"
              checked={showSplitDetails}
              onChange={(event) => setShowSplitDetails(event.target.checked)}
            />
            Toon split-details in uitkomst
          </label>
        </div>

        {diagnostics.length > 0 && (
          <div className="splendidDiagnostics" role="status" aria-live="polite">
            <h4>Diagnose geblokkeerde keuzes</h4>
            {diagnostics.map((entry) => (
              <div key={entry.key} className="splendidDiagnosticsItem">
                <strong>{entry.title}</strong>
                <p>{entry.reason}</p>
                <p>Geblokkeerd: {entry.blockedLabels.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      {splendidFieldGroups.map((group) => (
        <article key={group.id} className="card splendidResultCard">
          <h3>{group.title}</h3>
          <div className="splendidFormGrid">
            {group.rows.map((row) => {
              if (row.options) {
                return (
                  <div key={`${group.id}-${row.symbol}`} className="splendidRowBlock">
                    <h4>
                      {row.symbol} - {row.mutation}
                    </h4>
                    <div className="splendidParentGrid">
                      <RadioGroup
                        legend="Man 1.0"
                        name={`${row.maleField}-male`}
                        value={fields[row.maleField] || ''}
                        onChange={(next) => setFieldValue(row.maleField, next)}
                        options={row.options}
                      />
                      <RadioGroup
                        legend="Pop 0.1"
                        name={`${row.femaleField}-female`}
                        value={fields[row.femaleField] || ''}
                        onChange={(next) => setFieldValue(row.femaleField, next)}
                        options={row.options}
                      />
                    </div>
                  </div>
                )
              }

              if (row.maleOptions) {
                return (
                  <div key={`${group.id}-${row.symbol}`} className="splendidRowBlock">
                    <h4>
                      {row.symbol} - {row.mutation}
                    </h4>
                    <div className="splendidParentGrid">
                      <RadioGroup
                        legend="Man 1.0"
                        name={`${row.maleField}-male`}
                        value={fields[row.maleField] || ''}
                        onChange={(next) => setFieldValue(row.maleField, next)}
                        options={row.maleOptions}
                      />
                      <RadioGroup
                        legend="Pop 0.1"
                        name={`${row.femaleField}-female`}
                        value={fields[row.femaleField] || ''}
                        onChange={(next) => setFieldValue(row.femaleField, next)}
                        options={row.femaleOptions}
                      />
                    </div>
                  </div>
                )
              }

              if (row.seriesOptions) {
                const malePrimary = fields[row.maleFieldPrimary] || ''
                const maleSecondary = fields[row.maleFieldSecondary] || ''
                const femalePrimary = fields[row.femaleFieldPrimary] || ''
                const femaleSecondary = fields[row.femaleFieldSecondary] || ''
                const optionsNoEmpty = row.seriesOptions.filter((option) => option.value !== '')

                const disabledMale = disabledBlueSecondaryValues(malePrimary, optionsNoEmpty)
                const disabledFemale = disabledBlueSecondaryValues(femalePrimary, optionsNoEmpty)

                return (
                  <div key={`${group.id}-${row.symbol}`} className="splendidRowBlock">
                    <h4>
                      {row.symbol} - {row.mutation}
                    </h4>
                    <div className="splendidBlueSeriesGrid">
                      <RadioGroup
                        legend="Man allel 1"
                        name={`${row.maleFieldPrimary}-male-primary`}
                        value={malePrimary}
                        onChange={(next) => setFieldValue(row.maleFieldPrimary, next)}
                        options={row.seriesOptions}
                      />
                      <RadioGroup
                        legend="Man allel 2"
                        name={`${row.maleFieldSecondary}-male-secondary`}
                        value={maleSecondary}
                        onChange={(next) => setFieldValue(row.maleFieldSecondary, next)}
                        options={row.seriesOptions}
                        disabledValues={disabledMale}
                      />
                      <RadioGroup
                        legend="Pop allel 1"
                        name={`${row.femaleFieldPrimary}-female-primary`}
                        value={femalePrimary}
                        onChange={(next) => setFieldValue(row.femaleFieldPrimary, next)}
                        options={row.seriesOptions}
                      />
                      <RadioGroup
                        legend="Pop allel 2"
                        name={`${row.femaleFieldSecondary}-female-secondary`}
                        value={femaleSecondary}
                        onChange={(next) => setFieldValue(row.femaleFieldSecondary, next)}
                        options={row.seriesOptions}
                        disabledValues={disabledFemale}
                      />
                    </div>
                    <p className="splendidHint">{blueDependencyHint(malePrimary, 'Man')}</p>
                    <p className="splendidHint">{blueDependencyHint(femalePrimary, 'Pop')}</p>
                  </div>
                )
              }

              const malePrimary = fields[row.maleFieldPrimary] || ''
              const maleSecondary = fields[row.maleFieldSecondary] || ''
              const disabledSecondary = disabledInoSecondaryValues(malePrimary, row.maleSecondaryOptions.filter((option) => option.value !== ''))

              return (
                <div key={`${group.id}-${row.symbol}`} className="splendidRowBlock">
                  <h4>
                    {row.symbol} - {row.mutation}
                  </h4>
                  <div className="splendidBlueSeriesGrid">
                    <RadioGroup
                      legend="Man X1"
                      name={`${row.maleFieldPrimary}-male-primary`}
                      value={malePrimary}
                      onChange={(next) => setFieldValue(row.maleFieldPrimary, next)}
                      options={row.malePrimaryOptions}
                    />
                    <RadioGroup
                      legend="Man X2"
                      name={`${row.maleFieldSecondary}-male-secondary`}
                      value={maleSecondary}
                      onChange={(next) => setFieldValue(row.maleFieldSecondary, next)}
                      options={row.maleSecondaryOptions}
                      disabledValues={disabledSecondary}
                    />
                    <RadioGroup
                      legend="Pop visueel"
                      name={`${row.femaleField}-female`}
                      value={fields[row.femaleField] || ''}
                      onChange={(next) => setFieldValue(row.femaleField, next)}
                      options={row.femaleOptions}
                    />
                  </div>
                  <p className="splendidHint">{inoDependencyHint(malePrimary)}</p>
                </div>
              )
            })}
          </div>
        </article>
      ))}

      <article className="card splendidResultCard">
        <h3>Resultaten 1.0 (man)</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Kans</th>
                <th>Uitkomst</th>
                {showGeneticCode && <th>Genetische code</th>}
              </tr>
            </thead>
            <tbody>
              {result.maleRows.map((row, index) => (
                <tr key={`male-${index}-${row.label}`}>
                  <td>{row.percentage.toFixed(4)}%</td>
                  <td>{row.label}</td>
                  {showGeneticCode && <td>{row.code}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card splendidResultCard">
        <h3>Resultaten 0.1 (pop)</h3>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Kans</th>
                <th>Uitkomst</th>
                {showGeneticCode && <th>Genetische code</th>}
              </tr>
            </thead>
            <tbody>
              {result.femaleRows.map((row, index) => (
                <tr key={`female-${index}-${row.label}`}>
                  <td>{row.percentage.toFixed(4)}%</td>
                  <td>{row.label}</td>
                  {showGeneticCode && <td>{row.code}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
