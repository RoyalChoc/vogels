import TreeViewer from './TreeViewer'

export default function TreeTab({
  selectedBirdKey,
  birdEntries,
  activeTreeBird,
  ancestors,
  descendants,
  onSelectBird,
  onPrint,
  onExportPdf,
}) {
  return (
    <section className="panel">
      <TreeViewer
        selectedBirdKey={selectedBirdKey}
        birdEntries={birdEntries}
        activeTreeBird={activeTreeBird}
        ancestors={ancestors}
        descendants={descendants}
        onSelectBird={onSelectBird}
        onPrint={onPrint}
        onExportPdf={onExportPdf}
      />
    </section>
  )
}
