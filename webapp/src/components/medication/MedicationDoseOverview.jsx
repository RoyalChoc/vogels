import MedicationDoseChecklist from './MedicationDoseChecklist'

export default function MedicationDoseOverview({ records, birds, onSetDoseStatus }) {
  return (
    <article className="card adminCard">
      <h2>Medicatieschema</h2>
      <p>Bekijk geplande doses over alle vogels en registreer vervallen momenten afzonderlijk of in bulk.</p>
      <MedicationDoseChecklist records={records} birds={birds} onSetDoseStatus={onSetDoseStatus} />
    </article>
  )
}