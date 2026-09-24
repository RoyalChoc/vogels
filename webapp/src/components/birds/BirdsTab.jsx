import BirdForm from './BirdForm'
import BirdList from './BirdList'

export default function BirdsTab({
  birdForm,
  setBirdForm,
  editingBirdKey,
  maleNames,
  femaleNames,
  optionSets,
  contactOptions,
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
      <div className="stickyFormWrap">
        <BirdForm
          birdForm={birdForm}
          setBirdForm={setBirdForm}
          editingBirdKey={editingBirdKey}
          maleNames={maleNames}
          femaleNames={femaleNames}
          optionSets={optionSets}
          contactOptions={contactOptions}
          onSave={onFormSave}
          onClear={onFormClear}
          onDelete={onFormDelete}
        />
      </div>

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
