import { useState } from 'react'
import {
  BLAUW_ALLELES,
  SEX_LINKED_ALLELES,
  DONKER_OPTIONS,
  buildGenotype,
  calculate,
} from '../../utils/calculatorEngine'

const EMPTY_FORM = {
  vaderX1: 'wild',
  vaderX2: 'wild',
  vaderBl1: 'wild',
  vaderBl2: 'wild',
  vaderDonker: 'none',
  moederX: 'wild',
  moederBl1: 'wild',
  moederBl2: 'wild',
  moederDonker: 'none',
}

function LabeledSelect({ label, value, onChange, options }) {
  return (
    <label className="calcField">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ParentPanel({ title, badge, children }) {
  return (
    <section className="calcParent">
      <h3>
        <span className={`calcBadge calcBadge--${badge}`}>{title}</span>
      </h3>
      <div className="calcFields">{children}</div>
    </section>
  )
}

function ResultList({ title, colorClass, items }) {
  return (
    <div className="calcResultBox">
      <h4 className={colorClass}>{title}</h4>
      {items.length === 0 ? (
        <p className="calcEmpty">Geen resultaten</p>
      ) : (
        <ul className="calcResultList">
          {items.map((item) => (
            <li key={item.phenotype}>
              <span className="calcPct">{item.percentage}%</span>
              <span className="calcPheno">{item.phenotype}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function CalculatorTab() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [results, setResults] = useState(null)

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setResults(null)
  }

  function handleCalculate() {
    const genotype = buildGenotype(form)
    setResults(calculate(genotype))
  }

  function handleReset() {
    setForm(EMPTY_FORM)
    setResults(null)
  }

  return (
    <div className="calcPanel">
      <div className="calcIntro">
        <h2>Genetica Calculator</h2>
        <p>Selecteer de genotypen van vader en moeder om de verwachte nakomelingen te berekenen.</p>
      </div>

      <div className="calcParentGrid">
        <ParentPanel title="Vader (man)" badge="male">
          <fieldset className="calcGroup">
            <legend>Geslachtsgebonden (ZZ)</legend>
            <LabeledSelect
              label="Z1-allel"
              value={form.vaderX1}
              onChange={(v) => setField('vaderX1', v)}
              options={SEX_LINKED_ALLELES}
            />
            <LabeledSelect
              label="Z2-allel"
              value={form.vaderX2}
              onChange={(v) => setField('vaderX2', v)}
              options={SEX_LINKED_ALLELES}
            />
          </fieldset>

          <fieldset className="calcGroup">
            <legend>Blauw-locus</legend>
            <LabeledSelect
              label="Allel 1"
              value={form.vaderBl1}
              onChange={(v) => setField('vaderBl1', v)}
              options={BLAUW_ALLELES}
            />
            <LabeledSelect
              label="Allel 2"
              value={form.vaderBl2}
              onChange={(v) => setField('vaderBl2', v)}
              options={BLAUW_ALLELES}
            />
          </fieldset>

          <fieldset className="calcGroup">
            <legend>Donkerfactor</legend>
            <LabeledSelect
              label="Factor"
              value={form.vaderDonker}
              onChange={(v) => setField('vaderDonker', v)}
              options={DONKER_OPTIONS}
            />
          </fieldset>
        </ParentPanel>

        <ParentPanel title="Moeder (pop)" badge="female">
          <fieldset className="calcGroup">
            <legend>Geslachtsgebonden (ZW)</legend>
            <LabeledSelect
              label="Z-allel"
              value={form.moederX}
              onChange={(v) => setField('moederX', v)}
              options={SEX_LINKED_ALLELES}
            />
            <p className="calcHint">Poppen zijn hemizygoot: slechts één Z-chromosoom.</p>
          </fieldset>

          <fieldset className="calcGroup">
            <legend>Blauw-locus</legend>
            <LabeledSelect
              label="Allel 1"
              value={form.moederBl1}
              onChange={(v) => setField('moederBl1', v)}
              options={BLAUW_ALLELES}
            />
            <LabeledSelect
              label="Allel 2"
              value={form.moederBl2}
              onChange={(v) => setField('moederBl2', v)}
              options={BLAUW_ALLELES}
            />
          </fieldset>

          <fieldset className="calcGroup">
            <legend>Donkerfactor</legend>
            <LabeledSelect
              label="Factor"
              value={form.moederDonker}
              onChange={(v) => setField('moederDonker', v)}
              options={DONKER_OPTIONS}
            />
          </fieldset>
        </ParentPanel>
      </div>

      <div className="calcActions">
        <button type="button" className="primary" onClick={handleCalculate}>
          Bereken nakomelingen
        </button>
        <button type="button" className="ghost" onClick={handleReset}>
          Resetformulier
        </button>
      </div>

      {results && (
        <div className="calcResults">
          <h3>Verwachte nakomelingen</h3>
          <div className="calcResultsGrid">
            <ResultList title="Zonen (mannen)" colorClass="calcMale" items={results.zonen} />
            <ResultList title="Dochters (poppen)" colorClass="calcFemale" items={results.dochters} />
          </div>
        </div>
      )}
    </div>
  )
}
