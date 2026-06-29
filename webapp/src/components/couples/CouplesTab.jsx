import CoupleForm from './CoupleForm'
import ChildEditor from './ChildEditor'
import CoupleList from './CoupleList'

export default function CouplesTab({
  coupleForm,
  setCoupleForm,
  maleNames,
  femaleNames,
  selectedCouple,
  couples,
  validChildrenNames,
  newChild,
  setNewChild,
  onFormSave,
  onFormPrint,
  onFormExportPdf,
  onFormDelete,
  onSelectCouple,
  onAddChild,
  onRemoveChild,
}) {
  return (
    <section className="panel split">
      <CoupleForm
        coupleForm={coupleForm}
        setCoupleForm={setCoupleForm}
        maleNames={maleNames}
        femaleNames={femaleNames}
        selectedCouple={selectedCouple}
        onSave={onFormSave}
        onPrint={onFormPrint}
        onExportPdf={onFormExportPdf}
        onDelete={onFormDelete}
      />

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

      <CoupleList couples={couples} selectedCouple={selectedCouple} onSelectCouple={onSelectCouple} />
    </section>
  )
}
