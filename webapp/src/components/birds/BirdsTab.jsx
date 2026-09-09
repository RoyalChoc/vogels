import BirdForm from './BirdForm'
import BirdList from './BirdList'
import BirdMedicationChecklist from '../medication/BirdMedicationChecklist'

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
  mediaByBird,
  onOpenCertificate,
  onOpenPhotos,
  medicationCountByBird,
  onOpenMedication,
  medicationRecords,
  birds,
  isReadOnly,
  selectedTreatmentBirdKeys,
  onSelectedTreatmentBirdKeysChange,
  onOpenBulkMedication,
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
          medicationRecords={medicationRecords}
          onOpenMedication={onOpenMedication}
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
        mediaByBird={mediaByBird}
        onOpenCertificate={onOpenCertificate}
        onOpenPhotos={onOpenPhotos}
        medicationCountByBird={medicationCountByBird}
        onOpenMedication={onOpenMedication}
      />

      {!isReadOnly && (
        <article className="card adminCard">
          <h2>Medicatie voor selectie</h2>
          <p>Vink de vogels aan die je wil behandelen en voeg in één keer medicatie toe.</p>
          <BirdMedicationChecklist
            birds={birds}
            selectedKeys={selectedTreatmentBirdKeys}
            onSelectionChange={onSelectedTreatmentBirdKeysChange}
          />
          <div className="rowActions">
            <button
              type="button"
              className="primary"
              disabled={selectedTreatmentBirdKeys.length === 0}
              onClick={onOpenBulkMedication}
            >
              Medicatie toevoegen voor selectie ({selectedTreatmentBirdKeys.length})
            </button>
          </div>
        </article>
      )}
    </section>
  )
}
