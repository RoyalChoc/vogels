import CoupleForm from './CoupleForm'
import ChildEditor from './ChildEditor'
import CoupleList from './CoupleList'
import BirdOverview from './BirdOverview'

export default function CouplesTab({
  coupleForm,
  setCoupleForm,
  maleNames,
  femaleNames,
  optionSets,
  selectedCouple,
  couples,
  validChildrenNames,
  newChild,
  setNewChild,
  onFormSave,
  onFormNew,
  onFormAdd,
  onFormPrint,
  onFormExportPdf,
  onFormDelete,
  onSelectCouple,
  onCreateCouple,
  onAddChild,
  onRemoveChild,
  selectedBreedingCouples,
  onBreedingSelectionChange,
  onPrintBreedingCards,
  birds,
}) {
  const coupleNames = Object.keys(couples).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
  )

  function handleMultiSelectChange(event) {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value)
    onBreedingSelectionChange(values)
  }

  return (
    <section className="panel split">
      <CoupleForm
        coupleForm={coupleForm}
        setCoupleForm={setCoupleForm}
        maleNames={maleNames}
        femaleNames={femaleNames}
        optionSets={optionSets}
        selectedCouple={selectedCouple}
        birds={birds}
        onSave={onFormSave}
        onNew={onFormNew}
        onAdd={onFormAdd}
        onPrint={onFormPrint}
        onExportPdf={onFormExportPdf}
        onDelete={onFormDelete}
      />

      <BirdOverview birds={birds || {}} coupleForm={coupleForm} />

      {selectedCouple && (
        <ChildEditor
          selectedCouple={selectedCouple}
          coupleChildren={couples[selectedCouple]?.jongen || []}
          newChild={newChild}
          setNewChild={setNewChild}
          availableChildrenNames={validChildrenNames}
          onAddChild={onAddChild}
          onRemoveChild={onRemoveChild}
        />
      )}

      <article className="card">
        <h2>Kweekkaarten</h2>
        <p>Selecteer een of meerdere koppels en maak uitknipbare kweekkaarten van 12cm x 7cm.</p>
        <div className="formGrid">
          <div className="fullWidth">
            <select
              multiple
              size={Math.min(Math.max(coupleNames.length, 4), 10)}
              value={selectedBreedingCouples}
              onChange={handleMultiSelectChange}
            >
              {coupleNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="rowActions">
          <button type="button" className="primary" onClick={onPrintBreedingCards}>
            Maak kweekkaart(en)
          </button>
        </div>
      </article>

      <CoupleList
        couples={couples}
        selectedCouple={selectedCouple}
        onSelectCouple={onSelectCouple}
        onCreateCouple={onCreateCouple}
      />
    </section>
  )
}
