import BirdForm from './BirdForm'
import BirdList from './BirdList'

export default function BirdsTab({
  birdForm,
  setBirdForm,
  editingBirdKey,
  maleNames,
  femaleNames,
  filteredBirds,
  selectedBirdKey,
  search,
  setSearch,
  onFormSave,
  onFormClear,
  onFormDelete,
  onSelectBird,
  onPrintBirds,
  onExportBirdsPdf,
}) {
  return (
    <section className="panel">
      <BirdForm
        birdForm={birdForm}
        setBirdForm={setBirdForm}
        editingBirdKey={editingBirdKey}
        maleNames={maleNames}
        femaleNames={femaleNames}
        onSave={onFormSave}
        onClear={onFormClear}
        onDelete={onFormDelete}
      />

      <BirdList
        filteredBirds={filteredBirds}
        selectedBirdKey={selectedBirdKey}
        search={search}
        setSearch={setSearch}
        onSelectBird={onSelectBird}
        onPrint={onPrintBirds}
        onExportPdf={onExportBirdsPdf}
      />
    </section>
  )
}
