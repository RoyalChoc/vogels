import { PrintIcon, PdfIcon } from '../icons'
import { options } from '../../data/seedData'

export default function CoupleForm({
  coupleForm,
  setCoupleForm,
  maleNames,
  femaleNames,
  selectedCouple,
  onSave,
  onPrint,
  onExportPdf,
  onDelete,
}) {
  return (
    <article className="card">
      <h2>Koppel editor</h2>
      <div className="formGrid">
        <input
          placeholder="Koppelnaam"
          value={coupleForm.name}
          onChange={(e) => setCoupleForm({ ...coupleForm, name: e.target.value })}
        />

        <select value={coupleForm.man} onChange={(e) => setCoupleForm({ ...coupleForm, man: e.target.value })}>
          <option value="">Man</option>
          {maleNames.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select value={coupleForm.pop} onChange={(e) => setCoupleForm({ ...coupleForm, pop: e.target.value })}>
          <option value="">Pop</option>
          {femaleNames.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={coupleForm.kooi}
          onChange={(e) => setCoupleForm({ ...coupleForm, kooi: e.target.value })}
        >
          <option value="">Kooi</option>
          {options.kooien.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          value={coupleForm.kweekjaar}
          onChange={(e) => setCoupleForm({ ...coupleForm, kweekjaar: e.target.value })}
        >
          <option value="">Kweekjaar</option>
          {options.jaren.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="rowActions singleLineActions">
        <button type="button" className="primary" onClick={onSave}>
          {selectedCouple ? 'Wijzig koppel' : 'Nieuw koppel'}
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
    </article>
  )
}
