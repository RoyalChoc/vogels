/**
 * Print and PDF export functionality
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { esc, flattenTreeRows } from './helpers'
import { vogelNaam, findBirdByName } from './birdUtils'

export function openPrintDocument(title, bodyHtml) {
  const w = window.open('', '_blank', 'width=1200,height=860')
  if (!w) {
    throw new Error('Popup geblokkeerd. Sta popups toe om af te drukken.')
  }

  w.document.write(`<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>
    :root {
      --line: #d9e1e6;
      --ink: #14212a;
      --muted: #51606f;
      --accent: #1b9c8a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: var(--ink);
      background: #f4f7f9;
    }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .head {
      border: 1px solid var(--line);
      border-left: 6px solid var(--accent);
      background: #ffffff;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .head h1 { margin: 0 0 6px; font-size: 24px; }
    .head p { margin: 0; color: var(--muted); font-size: 13px; }
    .panel {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #ffffff;
      padding: 12px;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid var(--line); text-align: left; padding: 8px; }
    thead { background: #f5f8fb; }
    .muted { color: var(--muted); }
    .tree, .tree ul { list-style: none; margin: 0; padding-left: 18px; }
    .tree > li { padding-left: 0; }
    .node {
      border: 1px solid var(--line);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      padding: 8px 10px;
      margin: 8px 0;
      background: #fff;
    }
    .node strong { display: block; margin-bottom: 2px; }
    @media print {
      body { background: #fff; }
      .wrap { max-width: none; padding: 8mm; }
      .node, .panel, .head { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>${esc(title)}</h1>
      <p>Gegenereerd op ${new Date().toLocaleString('nl-BE')}</p>
    </div>
    <div class="panel">${bodyHtml}</div>
  </div>
</body>
</html>`)
  w.document.close()
  w.focus()
  w.print()
}

export function treeToHtml(node) {
  if (!node) return '<li><div class="node"><strong>Onbekend</strong></div></li>'

  const children = (node.children || []).map((child) => treeToHtml(child)).join('')
  return `<li>
    <div class="node">
      <strong>${esc(node.label)}</strong>
      <span class="muted">${esc(node.meta)}</span>
    </div>
    ${children ? `<ul>${children}</ul>` : ''}
  </li>`
}

export function printBirdOverview(filteredBirds) {
  const rows = filteredBirds
    .map(
      ([, bird]) => `<tr>
    <td>${esc(vogelNaam(bird))}</td>
    <td>${esc(bird.Ringmaat || '-')}</td>
    <td>${esc(bird.Geslacht || '-')}</td>
    <td>${esc(bird.Mutatie || '-')}</td>
    <td>${esc(bird.Status || '-')}</td>
    <td>${esc(bird.Herkomst || '-')}</td>
    <td>${esc(bird.Kooi || '-')}</td>
    <td>${esc(bird.Kweekjaar || '-')}</td>
    <td>${esc(bird.Vader || '-')}</td>
    <td>${esc(bird.Moeder || '-')}</td>
  </tr>`,
    )
    .join('')

  const html = `<table>
    <thead>
      <tr>
        <th>Naam</th><th>Ringmaat</th><th>Geslacht</th><th>Mutatie</th><th>Status</th>
        <th>Herkomst</th><th>Kooi</th><th>Jaar</th><th>Vader</th><th>Moeder</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`

  openPrintDocument('Vogeloverzicht', html)
}

export function exportBirdOverviewPdf(filteredBirds) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const generatedAt = new Date().toLocaleString('nl-BE')
  const fileStamp = new Date().toISOString().slice(0, 10)

  doc.setFontSize(16)
  doc.text('Vogeloverzicht', 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${generatedAt}`, 12, 17)

  autoTable(doc, {
    startY: 21,
    head: [['Naam', 'Ringmaat', 'Geslacht', 'Mutatie', 'Status', 'Herkomst', 'Kooi', 'Jaar', 'Vader', 'Moeder']],
    body: filteredBirds.map(([, bird]) => [
      vogelNaam(bird),
      bird.Ringmaat || '-',
      bird.Geslacht || '-',
      bird.Mutatie || '-',
      bird.Status || '-',
      bird.Herkomst || '-',
      bird.Kooi || '-',
      bird.Kweekjaar || '-',
      bird.Vader || '-',
      bird.Moeder || '-',
    ]),
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 8,
      cellPadding: 1.9,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 115, 115],
    },
    alternateRowStyles: {
      fillColor: [247, 251, 252],
    },
  })

  doc.save(`vogeloverzicht-${fileStamp}.pdf`)
  return 'PDF opgeslagen: vogeloverzicht.'
}

export function printSelectedCouple(selectedCouple, couples, birds) {
  if (!selectedCouple || !couples[selectedCouple]) {
    throw new Error('Selecteer eerst een koppel om af te drukken.')
  }

  const c = couples[selectedCouple]
  const man = findBirdByName(birds, c.man)
  const pop = findBirdByName(birds, c.pop)

  const rows = (c.jongen || [])
    .map((naam) => {
      const j = findBirdByName(birds, naam)
      if (!j) return `<tr><td>${esc(naam)}</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`
      return `<tr>
        <td>${esc(naam)}</td>
        <td>${esc(j.Ringmaat || '-')}</td>
        <td>${esc(j.Geslacht || '-')}</td>
        <td>${esc(j.Mutatie || '-')}</td>
        <td>${esc(j.Kweekjaar || '-')}</td>
      </tr>`
    })
    .join('')

  const html = `
    <p><strong>Koppel:</strong> ${esc(selectedCouple)}</p>
    <p><strong>Man:</strong> ${esc(c.man)} <span class="muted">| ${esc(man?.Mutatie || '-')} | ${esc(man?.Status || '-')}</span></p>
    <p><strong>Pop:</strong> ${esc(c.pop)} <span class="muted">| ${esc(pop?.Mutatie || '-')} | ${esc(pop?.Status || '-')}</span></p>
    <p><strong>Kooi/Jaar:</strong> ${esc(c.kooi || '-')} / ${esc(c.kweekjaar || '-')}</p>
    <table>
      <thead>
        <tr><th>Jong</th><th>Ringmaat</th><th>Geslacht</th><th>Mutatie</th><th>Jaar</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5">Geen jongen geregistreerd</td></tr>'}</tbody>
    </table>
  `

  openPrintDocument(`Koppelkaart - ${selectedCouple}`, html)
}

export function exportSelectedCouplePdf(selectedCouple, couples, birds) {
  if (!selectedCouple || !couples[selectedCouple]) {
    throw new Error('Selecteer eerst een koppel om op te slaan als PDF.')
  }

  const c = couples[selectedCouple]
  const man = findBirdByName(birds, c.man)
  const pop = findBirdByName(birds, c.pop)
  const generatedAt = new Date().toLocaleString('nl-BE')
  const fileStamp = new Date().toISOString().slice(0, 10)

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFontSize(16)
  doc.text(`Koppelkaart - ${selectedCouple}`, 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${generatedAt}`, 12, 17)
  doc.text(`Man: ${c.man} (${man?.Mutatie || '-'} | ${man?.Status || '-'})`, 12, 22)
  doc.text(`Pop: ${c.pop} (${pop?.Mutatie || '-'} | ${pop?.Status || '-'})`, 12, 27)
  doc.text(`Kooi/Jaar: ${c.kooi || '-'} / ${c.kweekjaar || '-'}`, 12, 32)

  autoTable(doc, {
    startY: 36,
    head: [['Jong', 'Ringmaat', 'Geslacht', 'Mutatie', 'Jaar']],
    body: (c.jongen || []).length
      ? (c.jongen || []).map((naam) => {
          const j = findBirdByName(birds, naam)
          return [naam, j?.Ringmaat || '-', j?.Geslacht || '-', j?.Mutatie || '-', j?.Kweekjaar || '-']
        })
      : [['Geen jongen geregistreerd', '-', '-', '-', '-']],
    margin: { left: 10, right: 10 },
    styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
  })

  doc.save(`koppelkaart-${selectedCouple}-${fileStamp}.pdf`)
  return 'PDF opgeslagen: koppelkaart.'
}

export function printTree(type, selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const label = type === 'descendants' ? 'Nakomelingen' : 'Voorouders'
  const tree = type === 'descendants' ? descendants : ancestors
  const html = `<p><strong>Startvogel:</strong> ${esc(vogelNaam(birds[selectedBirdKey]))}</p><ul class="tree">${treeToHtml(tree)}</ul>`
  openPrintDocument(`Stamboom - ${label}`, html)
}

export function exportTreePdf(type, selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const label = type === 'descendants' ? 'Nakomelingen' : 'Voorouders'
  const tree = type === 'descendants' ? descendants : ancestors
  const rows = flattenTreeRows(tree)
  const generatedAt = new Date().toLocaleString('nl-BE')
  const fileStamp = new Date().toISOString().slice(0, 10)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setFontSize(16)
  doc.text(`Stamboom - ${label}`, 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${generatedAt}`, 12, 17)
  doc.text(`Startvogel: ${vogelNaam(birds[selectedBirdKey])}`, 12, 22)

  autoTable(doc, {
    startY: 26,
    head: [['Vogel', 'Info']],
    body: rows,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 9, cellPadding: 2, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
    columnStyles: { 0: { cellWidth: 92 } },
  })

  doc.save(`stamboom-${label.toLowerCase()}-${fileStamp}.pdf`)
  return `PDF opgeslagen: stamboom ${label.toLowerCase()}.`
}

export function printFullTree(selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const ancestorsHtml = treeToHtml(ancestors)
  const descendantsHtml = treeToHtml(descendants)
  
  const html = `
    <p><strong>Startvogel:</strong> ${esc(vogelNaam(birds[selectedBirdKey]))}</p>
    
    <h2 style="margin-top: 20px; margin-bottom: 10px;">Voorouders</h2>
    <ul class="tree">${ancestorsHtml}</ul>
    
    <h2 style="margin-top: 20px; margin-bottom: 10px;">Nakomelingen</h2>
    <ul class="tree">${descendantsHtml}</ul>
  `
  
  openPrintDocument('Volledige stamboom', html)
}

export function exportFullTreePdf(selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const ancestorsRows = flattenTreeRows(ancestors)
  const descendantsRows = flattenTreeRows(descendants)
  const generatedAt = new Date().toLocaleString('nl-BE')
  const fileStamp = new Date().toISOString().slice(0, 10)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  // Header
  doc.setFontSize(16)
  doc.text('Volledige stamboom', 12, 12)
  doc.setFontSize(10)
  doc.setTextColor(84, 102, 114)
  doc.text(`Gegenereerd op ${generatedAt}`, 12, 17)
  doc.text(`Startvogel: ${vogelNaam(birds[selectedBirdKey])}`, 12, 22)

  // Ancestors table
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(11)
  autoTable(doc, {
    startY: 28,
    head: [['Voorouders', 'Info']],
    body: ancestorsRows,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
    columnStyles: { 0: { cellWidth: 80 } },
  })

  // Descendants table
  const descendantsStartY = doc.lastAutoTable.finalY + 10
  autoTable(doc, {
    startY: descendantsStartY,
    head: [['Nakomelingen', 'Info']],
    body: descendantsRows,
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 1.5, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
    columnStyles: { 0: { cellWidth: 80 } },
  })

  doc.save(`stamboom-volledig-${fileStamp}.pdf`)
  return 'PDF opgeslagen: volledige stamboom.'
}
