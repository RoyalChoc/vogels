/**
 * Print and PDF export functionality
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { esc } from './helpers'
import { vogelNaam, findBirdByName } from './birdUtils'
import {
  buildPedigreeNodeData,
  PEDIGREE_LEGEND,
} from './pedigree'

function splitLabel(bird = {}) {
  const values = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (values.length > 0) return values.join(', ')
  return bird.Split || '-'
}

function partnerTraitsLabel(bird) {
  return `Mutatie: ${bird?.Mutatie || '-'} | Factor: ${bird?.Factor || '-'} | Split: ${splitLabel(bird)}`
}

function hasFactorValue(bird = {}) {
  const value = String(bird?.Factor || '').trim()
  return value !== '' && value !== '-'
}

function hasSplitValue(bird = {}) {
  const splitValues = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (splitValues.length > 0) return true

  const legacySplit = String(bird?.Split || '').trim()
  return legacySplit !== '' && legacySplit !== '-'
}

function breedingCardPartnerTraitsLabel(bird) {
  const traits = [`Mutatie: ${bird?.Mutatie || '-'}`]

  if (hasFactorValue(bird)) {
    traits.push(`Factor: ${bird.Factor}`)
  }

  if (hasSplitValue(bird)) {
    traits.push(`Split: ${splitLabel(bird)}`)
  }

  return traits.join(' | ')
}

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
      --line: #2d3940;
      --ink: #1d2730;
      --muted: #5b6873;
      --male: #1ea9d8;
      --female: #f55ea6;
      --paper: #f5f8fa;
      --card: #ffffff;
      --shadow: rgba(0, 0, 0, 0.04);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: var(--ink);
      background: var(--paper);
    }
    .wrap { max-width: 1400px; margin: 0 auto; padding: 18px; }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 18px;
      padding: 12px 18px;
      border: 1px solid #dfe7ec;
      background: rgba(255,255,255,0.75);
      border-radius: 12px;
    }
    .head h1 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 400;
    }
    .head p {
      margin: 0; color: var(--muted); font-size: 12px;
    }
    .panel {
      border: 1px solid #dfe7ec;
      border-radius: 12px;
      background: rgba(255,255,255,0.85);
      padding: 12px;
      overflow: auto;
    }
    .pedigree-print-sheet {
      width: 100%;
      min-width: 980px;
      background: #fff;
      padding: 10px 12px 18px;
      break-after: page;
      page-break-after: always;
    }
    .pedigree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding: 4px 0 2px;
      color: var(--ink);
    }
    .pedigree-title {
      font-size: 44px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-weight: 300;
      line-height: 1.1;
      color: var(--ink);
    }
    .pedigree-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 4px 0 14px;
    }
    .pedigree-legend-item {
      font-size: 12px;
      font-weight: 600;
      color: #1d2730;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .pedigree-print-sheet > .pedigree-body {
      display: grid;
      gap: 12px;
      padding-top: 4px;
    }
    .pedigree-tree,
    .pedigree-tree-ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      gap: 22px;
    }
    .pedigree-tree {
      padding: 8px 0 20px;
    }
    .pedigree-tree-ul {
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }
    .pedigree-tree-li {
      display: flex;
      flex-direction: column;
      align-items: center;
      list-style: none;
    }
    .pedigree-stem {
      width: 1px;
      height: 16px;
      background: var(--line);
    }
    .pedigree-couple {
      display: flex;
      align-items: flex-end;
      gap: 6px;
    }
    .pedigree-mate {
      font-weight: 700;
      font-size: 16px;
      color: var(--ink);
      padding-bottom: 18px;
    }
    .pedigree-mate-li {
      display: flex;
      align-items: flex-end;
      list-style: none;
      padding-bottom: 18px;
    }
    .pedigree-tree--up .pedigree-tree-li--up {
      justify-content: flex-end;
    }
    .pedigree-tree--up .pedigree-tree-ul--up {
      padding-top: 0;
      padding-bottom: 10px;
      border-top: none;
      border-bottom: 1px solid var(--line);
      align-items: flex-end;
    }
    .pedigree-node {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 0 4px 4px;
      background: transparent;
      border: 1px solid var(--line);
      border-radius: 0;
      box-shadow: none;
      width: min(150px, 100%);
      min-width: 96px;
      max-width: 150px;
      z-index: 1;
    }
    .pedigree-node .pedigree-name {
      width: 100%;
      padding: 3px 4px;
      margin: -1px -1px 2px;
      width: calc(100% + 2px);
    }
    .pedigree-node.male .pedigree-name { background: #1ea9d8; }
    .pedigree-node.female .pedigree-name { background: #f55ea6; }
    .pedigree-node.status-overleden .pedigree-name { background: #9aa5ad; }
    .pedigree-node.status-verkocht .pedigree-name { background: #4caf7d; }
    .pedigree-node.unsexed .pedigree-name { background: #f4d35e; }
    .pedigree-node .pedigree-body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      align-items: center;
    }
    .pedigree-name {
      font-size: 10px;
      font-weight: 700;
      color: #1d2730;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pedigree-meta,
    .pedigree-extra {
      font-size: 8px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pedigree-extra {
      display: flex;
      flex-direction: column;
      gap: 5px;
      align-items: center;
      font-size: 8px;
    }
    .pedigree-fields { width: 100%; text-align: center; }
    .pedigree-field { font-size: 7px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pedigree-field span { color: var(--muted); }
    .pedigree-print-sheet:last-child { break-after: auto; page-break-after: auto; }
    @media print {
      body { background: #fff; }
      .wrap { max-width: none; padding: 6mm; }
      .head { display: none; }
      .panel { border: 0; padding: 0; }
      .pedigree-print-sheet { min-width: 0; padding: 0; }
      .pedigree-node, .pedigree-tree-li { break-inside: avoid; page-break-inside: avoid; }
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

export function printBirdOverview(filteredBirds) {
  const rows = filteredBirds
    .map(
      ([, bird]) => `<tr>
    <td>${esc(vogelNaam(bird))}</td>
    <td>${esc(bird.Vogelsoort || '-')}</td>
    <td>${esc(bird.Ringmaat || '-')}</td>
    <td>${esc(bird.Geslacht || '-')}</td>
    <td>${esc(bird.Mutatie || '-')}</td>
    <td>${esc(bird.Factor || '-')}</td>
    <td>${esc(splitLabel(bird))}</td>
    <td>${esc(bird.Status || '-')}</td>
    <td>${esc(bird.Herkomst || '-')}</td>
    <td>${esc(bird.Kooi || '-')}</td>
    <td>${esc(bird.Kweekjaar || '-')}</td>
    <td>${esc(bird.Vader || '-')}</td>
    <td>${esc(bird.Moeder || '-')}</td>
    <td>${esc(bird.Opmerking || '-')}</td>
  </tr>`,
    )
    .join('')

  const html = `<table>
    <thead>
      <tr>
        <th>Naam</th><th>Vogelsoort</th><th>Ringmaat</th><th>Geslacht</th><th>Mutatie</th><th>Factor</th><th>Split</th><th>Status</th>
        <th>Herkomst</th><th>Kooi</th><th>Jaar</th><th>Vader</th><th>Moeder</th><th>Opmerking</th>
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
    head: [['Naam', 'Vogelsoort', 'Ringmaat', 'Geslacht', 'Mutatie', 'Factor', 'Split', 'Status', 'Herkomst', 'Kooi', 'Jaar', 'Vader', 'Moeder', 'Opmerking']],
    body: filteredBirds.map(([, bird]) => [
      vogelNaam(bird),
      bird.Vogelsoort || '-',
      bird.Ringmaat || '-',
      bird.Geslacht || '-',
      bird.Mutatie || '-',
      bird.Factor || '-',
      splitLabel(bird),
      bird.Status || '-',
      bird.Herkomst || '-',
      bird.Kooi || '-',
      bird.Kweekjaar || '-',
      bird.Vader || '-',
      bird.Moeder || '-',
      bird.Opmerking || '-',
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
      if (!j) return `<tr><td>${esc(naam)}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`
      return `<tr>
        <td>${esc(naam)}</td>
        <td>${esc(j.Ringmaat || '-')}</td>
        <td>${esc(j.Geslacht || '-')}</td>
        <td>${esc(j.Mutatie || '-')}</td>
        <td>${esc(j.Gezoomd || '-')}</td>
        <td>${esc(j.Factor || '-')}</td>
        <td>${esc(splitLabel(j))}</td>
        <td>${esc(j.Status || '-')}</td>
        <td>${esc(j.Herkomst || '-')}</td>
        <td>${esc(j.Kweekjaar || '-')}</td>
        <td>${esc(j.Opmerking || '-')}</td>
      </tr>`
    })
    .join('')

  const html = `
    <p><strong>Koppel:</strong> ${esc(selectedCouple)}</p>
    <p><strong>Man:</strong> ${esc(c.man)} <span class="muted">| ${esc(partnerTraitsLabel(man))} | Status: ${esc(man?.Status || '-')}</span></p>
    <p><strong>Pop:</strong> ${esc(c.pop)} <span class="muted">| ${esc(partnerTraitsLabel(pop))} | Status: ${esc(pop?.Status || '-')}</span></p>
    <p><strong>Kooi/Jaar:</strong> ${esc(c.kooi || '-')} / ${esc(c.kweekjaar || '-')}</p>
    <table>
      <thead>
        <tr><th>Jong</th><th>Ringmaat</th><th>Geslacht</th><th>Mutatie</th><th>Gezoomd</th><th>Factor</th><th>Split</th><th>Status</th><th>Herkomst</th><th>Jaar</th><th>Opmerking</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="11">Geen jongen geregistreerd</td></tr>'}</tbody>
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
  doc.text(`Man: ${c.man} (${partnerTraitsLabel(man)} | Status: ${man?.Status || '-'})`, 12, 22)
  doc.text(`Pop: ${c.pop} (${partnerTraitsLabel(pop)} | Status: ${pop?.Status || '-'})`, 12, 27)
  doc.text(`Kooi/Jaar: ${c.kooi || '-'} / ${c.kweekjaar || '-'}`, 12, 32)

  autoTable(doc, {
    startY: 36,
    head: [['Jong', 'Ringmaat', 'Geslacht', 'Mutatie', 'Gezoomd', 'Factor', 'Split', 'Status', 'Herkomst', 'Jaar', 'Opmerking']],
    body: (c.jongen || []).length
      ? (c.jongen || []).map((naam) => {
          const j = findBirdByName(birds, naam)
          return [
            naam,
            j?.Ringmaat || '-',
            j?.Geslacht || '-',
            j?.Mutatie || '-',
            j?.Gezoomd || '-',
            j?.Factor || '-',
            splitLabel(j || {}),
            j?.Status || '-',
            j?.Herkomst || '-',
            j?.Kweekjaar || '-',
            j?.Opmerking || '-',
          ]
        })
      : [['Geen jongen geregistreerd', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']],
    margin: { left: 10, right: 10 },
    styles: { fontSize: 8, cellPadding: 1.6, lineWidth: 0.1 },
    headStyles: { fillColor: [15, 115, 115] },
    alternateRowStyles: { fillColor: [247, 251, 252] },
  })

  doc.save(`koppelkaart-${selectedCouple}-${fileStamp}.pdf`)
  return 'PDF opgeslagen: koppelkaart.'
}

export function printBreedingCards(selectedCouples, couples, birds, mutatieOptions, splitOptions, gezoomdOptions, factorOptions) {
  const targetCouples = (selectedCouples || []).filter((name) => couples[name])
  if (targetCouples.length === 0) {
    throw new Error('Selecteer minstens een koppel voor kweekkaarten.')
  }

  const w = window.open('', '_blank', 'width=1280,height=900')
  if (!w) {
    throw new Error('Popup geblokkeerd. Sta popups toe om kweekkaarten te maken.')
  }

  const mutatieList = Array.isArray(mutatieOptions) ? mutatieOptions : []
  const splitList = Array.isArray(splitOptions) ? splitOptions : []
  const gezoomdList = Array.isArray(gezoomdOptions) ? gezoomdOptions : []
  const factorList = Array.isArray(factorOptions) ? factorOptions : []
  const mutatieDatalistId = 'mutatiesList'
  const splitDatalistId = 'splitList'
  const mutatieOptionsHtml = mutatieList.map((m) => `<option value="${esc(m)}">`).join('')
  const splitOptionsHtml = splitList.map((s) => `<option value="${esc(s)}">`).join('')
  const gezoomdOptionsHtml = gezoomdList.map((g) => `<option value="${esc(g)}">`).join('')
  const factorOptionsHtml = factorList.map((f) => `<option value="${esc(f)}">`).join('')

  function splitSummary(ei) {
    return [ei?.split1, ei?.split2, ei?.split3, ei?.split4].filter(Boolean).join(' ')
  }

  function dateValueAttr(value) {
    const text = String(value || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return ''
    return ` value="${text}"`
  }

  function kooiJaarLine(couple) {
    const kooi = String(couple?.kooi || '').trim()
    const jaar = String(couple?.kweekjaar || '').trim()
    if (kooi && jaar) return `<strong>Kooi:</strong> ${esc(kooi)} <span class="sep">|</span> <strong>Jaar:</strong> ${esc(jaar)}`
    if (kooi) return `<strong>Kooi:</strong> ${esc(kooi)}`
    if (jaar) return `<strong>Jaar:</strong> ${esc(jaar)}`
    return ''
  }

  function partnerLabel(role, birdName, bird) {
    const nameValue = String(birdName || '').trim()
    const rightSide = ` <span class="muted">(${esc(breedingCardPartnerTraitsLabel(bird))})</span>`
    return `<strong>${role}:</strong> ${esc(nameValue)}${rightSide}`
  }

  function partnersLine(couple, manBird, popBird) {
    const manName = String(couple?.man || '').trim()
    const popName = String(couple?.pop || '').trim()

    if (manName && popName) {
      return `${partnerLabel('Man', manName, manBird)}<br>${partnerLabel('Pop', popName, popBird)}`
    }

    if (manName) return partnerLabel('Man', manName, manBird)
    if (popName) return partnerLabel('Pop', popName, popBird)
    return ''
  }

  const cardItems = targetCouples
    .flatMap((name) => {
      const c = couples[name]
      const man = findBirdByName(birds, c.man)
      const pop = findBirdByName(birds, c.pop)
      const rondes = c.rondes || []

      // If no rondes, show empty card
      if (rondes.length === 0) {
        const eggRows = Array.from({ length: 7 }, (_, i) => {
          const eggNr = i + 1
          return `
            <tr>
              <td class="eggNr">${eggNr}e ei</td>
              <td class="cellInput"><input type="date" class="legDate" data-egg-index="${eggNr}" aria-label="Legdatum ei ${eggNr} voor ${esc(name)}" /></td>
              <td class="cellInput"><input type="date" class="candlingDate" aria-label="Schouwdatum ei ${eggNr} voor ${esc(name)}" /></td>
              <td class="cellInput"><input type="date" class="hatchDate" aria-label="Uitkomstdatum ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /></td>
              <td class="cellInput"><input type="text" class="mutationField" list="${mutatieDatalistId}" aria-label="Mutatie jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;"></span></td>
              <td class="cellInput"><input type="text" class="gezoomdField" list="gezoomdList" aria-label="Gezoomd jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;"></span></td>
              <td class="cellInput"><input type="text" class="factorField" list="factorList" aria-label="Factor jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;"></span></td>
              <td class="cellInput"><input type="text" class="splitField" list="${splitDatalistId}" aria-label="Split jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;"></span></td>
            </tr>
          `
        }).join('')

        return [`
          <article class="kweekCard">
            <header>
              <h2>${esc(name)}</h2>
              <p>${kooiJaarLine(c)}</p>
              <p class="partners">${partnersLine(c, man, pop)}</p>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Ei</th>
                  <th>Legdatum</th>
                  <th>Schouwdatum</th>
                  <th>Dag van uitkomst</th>
                  <th>Mutatie jong</th>
                  <th>Gezoomd</th>
                  <th>Factor</th>
                  <th>Split jong</th>
                </tr>
              </thead>
              <tbody>
                ${eggRows}
              </tbody>
            </table>
          </article>
        `]
      }

      // Show a card for each ronde
      return rondes.map((ronde) => {
        const eitjes = ronde.eitjes || []
        const eggRows = Array.from({ length: 7 }, (_, i) => {
          const eggNr = i + 1
          const ei = eitjes[i] || {}
          const legdatumValue = ei.legdatum || ''
          const schouwdatumValue = ei.schouwdatum || ''
          const uitkomdatumValue = ei.uitkomdatum || ''
          const mutatieValue = ei.mutatie || ''
          const gezoomdValue = ei.gezoomd || ''
          const factorValue = ei.factor || ''
          const splitValue = splitSummary(ei)
          return `
            <tr>
              <td class="eggNr">${eggNr}e ei</td>
              <td class="cellInput"><input type="date" class="legDate" data-egg-index="${eggNr}"${dateValueAttr(legdatumValue)} aria-label="Legdatum ei ${eggNr} voor ${esc(name)}" /></td>
              <td class="cellInput"><input type="date" class="candlingDate"${dateValueAttr(schouwdatumValue)} aria-label="Schouwdatum ei ${eggNr} voor ${esc(name)}" /></td>
              <td class="cellInput"><input type="date" class="hatchDate"${dateValueAttr(uitkomdatumValue)} aria-label="Uitkomstdatum ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /></td>
              <td class="cellInput"><input type="text" class="mutationField" value="${esc(mutatieValue)}" list="${mutatieDatalistId}" aria-label="Mutatie jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;">${esc(mutatieValue)}</span></td>
              <td class="cellInput"><input type="text" class="gezoomdField" value="${esc(gezoomdValue)}" list="gezoomdList" aria-label="Gezoomd jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;">${esc(gezoomdValue)}</span></td>
              <td class="cellInput"><input type="text" class="factorField" value="${esc(factorValue)}" list="factorList" aria-label="Factor jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;">${esc(factorValue)}</span></td>
              <td class="cellInput"><input type="text" class="splitField" value="${esc(splitValue)}" list="${splitDatalistId}" aria-label="Split jong ei ${eggNr} voor ${esc(name)}" style="cursor: text; background-color: #ffffff;" /><span class="value" style="display: none;">${esc(splitValue)}</span></td>
            </tr>
          `
        }).join('')

        return `
          <article class="kweekCard">
            <header>
              <h2>${esc(name)} - Ronde ${ronde.number}</h2>
              <p>${kooiJaarLine(c)}</p>
              <p class="partners">${partnersLine(c, man, pop)}</p>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Ei</th>
                  <th>Legdatum</th>
                  <th>Schouwdatum</th>
                  <th>Dag van uitkomst</th>
                  <th>Mutatie jong</th>
                  <th>Gezoomd</th>
                  <th>Factor</th>
                  <th>Split jong</th>
                </tr>
              </thead>
              <tbody>
                ${eggRows}
              </tbody>
            </table>
          </article>
        `
      })
    })

  const cardsPerPage = 3
  const pagesHtml = []
  for (let i = 0; i < cardItems.length; i += cardsPerPage) {
    const pageCards = cardItems.slice(i, i + cardsPerPage).join('')
    pagesHtml.push(`<section class="sheetPage">${pageCards}</section>`)
  }

  w.document.write(`<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kweekkaarten</title>
  <style>
    :root {
      --line: #27343e;
      --ink: #14212a;
      --muted: #566472;
      --bg: #f5f8fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: var(--ink);
      background: var(--bg);
      padding: 10mm;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
      border: 1px solid #d0dae2;
      border-radius: 10px;
      background: #ffffff;
      padding: 8px 10px;
    }
    .toolbar p {
      margin: 0;
      font-size: 13px;
      color: var(--muted);
    }
    .toolbarActions {
      display: flex;
      gap: 8px;
    }
    .toolbar button {
      border: 1px solid #b9c8d4;
      border-radius: 8px;
      background: #ffffff;
      color: var(--ink);
      padding: 7px 10px;
      font: inherit;
      cursor: pointer;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      gap: 6mm;
    }
    .sheetPage {
      width: 100%;
      min-height: calc(297mm - 16mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 5mm;
      padding-top: 2mm;
      padding-bottom: 2mm;
    }
    .kweekCard {
      width: 12cm;
      height: 7cm;
      border: 2px dashed var(--line);
      background: #ffffff;
      padding: 2.6mm;
      display: grid;
      grid-template-rows: auto 1fr;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .kweekCard h2 {
      margin: 0 0 1px;
      font-size: 13px;
      line-height: 1.1;
    }
    .kweekCard p {
      margin: 0;
      font-size: 9px;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .kweekCard p.partners {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }
    .kweekCard .muted { color: var(--muted); }
    .kweekCard .sep { color: #9ba8b4; padding: 0 4px; }
    .kweekCard table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.2mm;
      table-layout: fixed;
    }
    .kweekCard th,
    .kweekCard td {
      border: 1px solid #d0dae2;
      padding: 0.45mm;
      font-size: 8px;
      line-height: 1.1;
      text-align: left;
    }
    .kweekCard th {
      background: #eef4f7;
      font-weight: 700;
    }
    .kweekCard .eggNr {
      width: 11%;
      font-weight: 600;
    }
    .kweekCard th:nth-child(2),
    .kweekCard th:nth-child(3),
    .kweekCard th:nth-child(4) {
      width: 14%;
    }
    .kweekCard th:nth-child(5),
    .kweekCard th:nth-child(6),
    .kweekCard th:nth-child(7),
    .kweekCard th:nth-child(8) {
      width: 10%;
    }
    .kweekCard input {
      width: 100%;
      border: 1px solid #cad6df;
      border-radius: 3px;
      padding: 0.28mm 0.45mm;
      min-height: 3.9mm;
      font: inherit;
      font-size: 8px;
      background: #ffffff;
    }
    @media print {
      @page { size: A4 portrait; margin: 8mm; }
      body { padding: 0; background: #ffffff; }
      .toolbar { display: none; }
      .sheet { gap: 0; }
      .sheetPage {
        min-height: auto;
        height: calc(297mm - 16mm);
        page-break-after: always;
        break-after: page;
      }
      .sheetPage:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      .kweekCard input {
        border: none;
        padding: 0;
        display: none;
      }
      .kweekCard .cellInput .value {
        display: inline !important;
        font-size: 8px;
      }
      .kweekCard {
        border-style: solid;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <p>Vul optioneel data/mutaties in en druk daarna af. Kaarten zijn exact 12cm x 7cm.</p>
    <div class="toolbarActions">
      <button type="button" onclick="window.print()">Afdrukken</button>
      <button type="button" onclick="window.close()">Sluiten</button>
    </div>
  </div>
  <datalist id="${mutatieDatalistId}">
    ${mutatieOptionsHtml}
  </datalist>
  <datalist id="${splitDatalistId}">
    ${splitOptionsHtml}
  </datalist>
  <datalist id="gezoomdList">
    ${gezoomdOptionsHtml}
  </datalist>
  <datalist id="factorList">
    ${factorOptionsHtml}
  </datalist>
  <section class="sheet">${pagesHtml.join('')}</section>
  <script>
    (function () {
      function addDays(dateValue, days) {
        if (!dateValue) return ''
        var date = new Date(dateValue + 'T00:00:00')
        if (Number.isNaN(date.getTime())) return ''
        date.setDate(date.getDate() + days)
        var year = date.getFullYear()
        var month = String(date.getMonth() + 1).padStart(2, '0')
        var day = String(date.getDate()).padStart(2, '0')
        return year + '-' + month + '-' + day
      }

      function handleLegDateChange(event) {
        var input = event.target
        if (!input.classList.contains('legDate')) return

        var eggIndex = Number.parseInt(input.dataset.eggIndex || '0', 10)
        if (eggIndex < 4) return

        var row = input.closest('tr')
        if (!row) return

        var candlingInput = row.querySelector('.candlingDate')
        var hatchInput = row.querySelector('.hatchDate')
        var sourceDate = input.value
        if (!sourceDate) return

        if (candlingInput && !candlingInput.value) {
          candlingInput.value = addDays(sourceDate, 10)
        }

        if (hatchInput && !hatchInput.value) {
          hatchInput.value = addDays(sourceDate, 21)
        }
      }

      function setDateInputDisplay(input) {
        if (!input) return
        if (input.value) {
          input.type = 'date'
          return
        }
        input.type = 'text'
      }

      function setupDateInputs() {
        var dateInputs = document.querySelectorAll('.legDate, .candlingDate, .hatchDate')
        dateInputs.forEach(function (input) {
          setDateInputDisplay(input)

          input.addEventListener('focus', function () {
            input.type = 'date'
          })

          input.addEventListener('blur', function () {
            setDateInputDisplay(input)
          })

          input.addEventListener('change', function () {
            setDateInputDisplay(input)
          })
        })
      }

      function beforePrint() {
        var dateInputs = document.querySelectorAll('.legDate, .candlingDate, .hatchDate')
        dateInputs.forEach(function (input) {
          if (!input.value) {
            input.type = 'text'
          }
        })
      }

      function afterPrint() {
        var dateInputs = document.querySelectorAll('.legDate, .candlingDate, .hatchDate')
        dateInputs.forEach(function (input) {
          setDateInputDisplay(input)
        })
      }

      setupDateInputs()
      document.addEventListener('change', handleLegDateChange)
      window.addEventListener('beforeprint', beforePrint)
      window.addEventListener('afterprint', afterPrint)
    })()
  </script>
</body>
</html>`)

  w.document.close()
  w.focus()
}

export function printGeslachtsbepalingCards(selectedBirdKeys, birds, contacts) {
  const targetKeys = (selectedBirdKeys || []).filter((key) => birds[key])
  if (targetKeys.length === 0) {
    throw new Error('Selecteer minstens een vogel voor geslachtsbepaling-kaartjes.')
  }

  const w = window.open('', '_blank', 'width=1280,height=900')
  if (!w) {
    throw new Error('Popup geblokkeerd. Sta popups toe om kaartjes te maken.')
  }

  function kleurMutatieLine(bird) {
    const values = [bird.Mutatie, bird.Factor, splitLabel(bird)].filter((value) => value && value !== '-')
    return values.length > 0 ? values.join(', ') : '-'
  }

  function ringLine(bird) {
    const values = [bird.Stamnummer, bird.Ringnummer].filter(Boolean)
    return values.length > 0 ? values.join(' ') : '-'
  }

  function eigenaarLine(bird) {
    const contact = contacts?.[bird.EigenaarContactId]
    if (!contact) return '-'
    const voornaam = String(contact.Voornaam || '').trim()
    const naam = String(contact.Naam || '').trim()
    const gemeente = String(contact.Gemeente || '').trim()
    const fullName = `${voornaam} ${naam}`.trim()
    return fullName || gemeente || '-'
  }

  const cardsPerPage = 4
  const pagesHtml = []
  for (let i = 0; i < targetKeys.length; i += cardsPerPage) {
    const pageCards = targetKeys
      .slice(i, i + cardsPerPage)
      .map((key, index) => {
        const bird = birds[key]
        const cardNr = i + index + 1
        return `
          <article class="sexCard">
            <span class="cardNr">#${cardNr}</span>
            <p class="line1"><strong>Vogelsoort:</strong> ${esc(bird.Vogelsoort || '-')}</p>
            <p class="line2"><strong>Wetenschappelijke naam:</strong> ${esc(bird.WetenschappelijkeNaam || '-')}</p>
            <p class="line3"><strong>Kleur, mutatie:</strong> ${esc(kleurMutatieLine(bird))}</p>
            <p class="line4"><strong>Ring:</strong> ${esc(ringLine(bird))}</p>
            <p class="line5"><strong>Monstertype:</strong> ${esc(bird.Monstertype || '-')}</p>
            <p class="line6"><strong>Eigenaar:</strong> ${esc(eigenaarLine(bird))}</p>
          </article>
        `
      })
      .join('')
    pagesHtml.push(`<section class="sheetPage">${pageCards}</section>`)
  }

  w.document.write(`<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Geslachtsbepaling-kaartjes</title>
  <style>
    :root {
      --line: #27343e;
      --ink: #14212a;
      --muted: #566472;
      --bg: #f5f8fa;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: var(--ink);
      background: var(--bg);
      padding: 10mm;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
      border: 1px solid #d0dae2;
      border-radius: 10px;
      background: #ffffff;
      padding: 8px 10px;
    }
    .toolbar p { margin: 0; font-size: 13px; color: var(--muted); }
    .toolbar button {
      border: 1px solid #b9c8d4;
      border-radius: 8px;
      background: #ffffff;
      color: var(--ink);
      padding: 7px 10px;
      font: inherit;
      cursor: pointer;
    }
    .sheet { display: flex; flex-direction: column; gap: 6mm; }
    .sheetPage {
      width: 100%;
      min-height: calc(297mm - 16mm);
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      gap: 5mm;
      padding-top: 2mm;
      padding-bottom: 2mm;
    }
    .sexCard {
      width: 9cm;
      height: 6cm;
      border: 2px dashed var(--line);
      background: #ffffff;
      padding: 4mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2.2mm;
      position: relative;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sexCard .cardNr {
      position: absolute;
      top: 2.5mm;
      right: 3mm;
      font-size: 9px;
      font-weight: 700;
      color: var(--muted);
    }
    .sexCard p { margin: 0; font-size: 12px; line-height: 1.3; }
    .sexCard .line1 { font-size: 16px; font-weight: 700; }
    @media print {
      @page { size: A4 portrait; margin: 8mm; }
      body { padding: 0; background: #ffffff; }
      .toolbar { display: none; }
      .sheet { gap: 0; }
      .sheetPage {
        min-height: auto;
        height: calc(297mm - 16mm);
        page-break-after: always;
        break-after: page;
      }
      .sheetPage:last-child { page-break-after: auto; break-after: auto; }
      .sexCard { border-style: solid; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <p>Controleer de gegevens en druk daarna af. Kaarten zijn 9cm x 6cm.</p>
    <div>
      <button type="button" onclick="window.print()">Afdrukken</button>
      <button type="button" onclick="window.close()">Sluiten</button>
    </div>
  </div>
  <section class="sheet">${pagesHtml.join('')}</section>
</body>
</html>`)

  w.document.close()
  w.focus()
}

function renderPedigreeNodeCell(nodeData) {
  if (!nodeData) return ''

  if (nodeData.unknown) {
    return `
      <div class="pedigree-node unknown">
        <div class="pedigree-body"><div class="pedigree-name">${esc(nodeData.name || 'Onbekend')}</div></div>
      </div>
    `
  }

  const colorClass = nodeData.colorClass || 'unsexed'
  const detailRows = (nodeData.details || []).map((row) => `<div class="pedigree-field"><span>${esc(row.label)}:</span> ${esc(row.value)}</div>`).join('')

  return `
    <div class="pedigree-node ${colorClass}">
      <div class="pedigree-body">
        <div class="pedigree-name">${esc(nodeData.name || 'Onbekend')}</div>
        <div class="pedigree-fields">${detailRows}</div>
      </div>
    </div>
  `
}

// ─── Nakomelingen: koppel bovenaan, elk kind (met eigen partner) eronder ─────
function renderDescendantNodeLi(node) {
  if (!node) return ''

  const coupleHtml = `
    <div class="pedigree-couple">
      ${renderPedigreeNodeCell(node.subject)}
      ${node.partner ? `<span class="pedigree-mate">×</span>${renderPedigreeNodeCell(node.partner)}` : ''}
    </div>
  `

  const childrenHtml = node.children && node.children.length > 0
    ? `<div class="pedigree-stem"></div><ul class="pedigree-tree-ul">${node.children.map(renderDescendantNodeLi).join('')}</ul>`
    : ''

  return `<li class="pedigree-tree-li">${coupleHtml}${childrenHtml}</li>`
}

function buildDescendantPedigreeHtml(tree) {
  if (!tree) return '<p>Geen nakomelingen gevonden.</p>'
  return `<ul class="pedigree-tree">${renderDescendantNodeLi(tree)}</ul>`
}

// ─── Voorouders: oudste koppel bovenaan, lijnen zakken naar het kind eronder ─
function renderAncestorNodeLi(bird) {
  if (!bird) return ''

  const [father, mother] = bird.children || []
  const hasParents = Boolean(father || mother)

  const parentsHtml = hasParents
    ? `<ul class="pedigree-tree-ul pedigree-tree-ul--up">
        ${father ? renderAncestorNodeLi(father) : ''}
        ${father && mother ? '<li class="pedigree-mate-li" aria-hidden="true"><span class="pedigree-mate">×</span></li>' : ''}
        ${mother ? renderAncestorNodeLi(mother) : ''}
      </ul>`
    : ''

  const stemHtml = hasParents ? '<div class="pedigree-stem"></div>' : ''

  return `<li class="pedigree-tree-li pedigree-tree-li--up">${parentsHtml}${stemHtml}<div class="pedigree-couple">${renderPedigreeNodeCell(buildPedigreeNodeData(bird))}</div></li>`
}

function buildAncestorPedigreeHtml(tree) {
  if (!tree || !(tree.Vader || tree.Moeder)) return '<p>Geen voorouders gevonden.</p>'
  return `<ul class="pedigree-tree pedigree-tree--up">${renderAncestorNodeLi(tree)}</ul>`
}

function buildPedigreeLegendHtml() {
  return `<div class="pedigree-legend">${PEDIGREE_LEGEND.map((item) => `<span class="pedigree-legend-item ${item.className}" style="background:${item.color};">${esc(item.label)}</span>`).join('')}</div>`
}

function buildPedigreePrintHtml(rootNode, title, sectionTitle, isDescendant) {
  const treeHtml = isDescendant ? buildDescendantPedigreeHtml(rootNode) : buildAncestorPedigreeHtml(rootNode)

  return `
    <div class="pedigree-print-sheet">
      <div class="pedigree-header">
        <div class="pedigree-title">${esc(title)}</div>
      </div>
      <div class="pedigree-body">
        <section class="pedigree-section">
          <h2>${esc(sectionTitle)}</h2>
          ${buildPedigreeLegendHtml()}
          ${treeHtml}
        </section>
      </div>
    </div>
  `
}

export function printFullTree(selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const selectedBird = birds[selectedBirdKey]
  const ancestorTree = ancestors || selectedBird
  const descendantTree = descendants || { subject: buildPedigreeNodeData(selectedBird), partner: null, children: [] }

  const html = `${buildPedigreePrintHtml(ancestorTree, 'VOORBEELDSCHEMA PARENTEEL - VOOROUDERS', 'Voorouders', false)}
    ${buildPedigreePrintHtml(descendantTree, 'VOORBEELDSCHEMA PARENTEEL - NAKOMELINGEN', 'Nakomelingen', true)}`

  openPrintDocument('Volledige stamboom', html)
}

// ─── PDF: generieke boom-layout (kind gecentreerd onder het koppel dat het produceerde) ─
function countLeaves(node) {
  const children = node?.children || []
  if (children.length === 0) return 1
  return children.reduce((sum, child) => sum + countLeaves(child), 0) || 1
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  const bigint = parseInt(value, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

const PEDIGREE_LEGEND_COLORS = Object.fromEntries(PEDIGREE_LEGEND.map((item) => [item.className, hexToRgb(item.color)]))

function layoutCoupleTree(node, depth, x0, x1) {
  if (!node) return null
  const children = node.children || []
  const entry = { node, depth, x: (x0 + x1) / 2, children: [] }
  if (children.length === 0) return entry

  const weights = children.map((child) => countLeaves(child))
  const total = weights.reduce((sum, w) => sum + w, 0) || 1
  let cursor = x0
  children.forEach((child, index) => {
    const width = (weights[index] / total) * (x1 - x0)
    const childEntry = layoutCoupleTree(child, depth + 1, cursor, cursor + width)
    if (childEntry) entry.children.push(childEntry)
    cursor += width
  })
  return entry
}

function drawPdfPersonBox(doc, x, y, boxWidth, nodeData) {
  if (!nodeData) return 0

  if (nodeData.unknown) {
    const height = 9
    doc.setDrawColor(45, 57, 64)
    doc.setLineWidth(0.3)
    doc.rect(x - boxWidth / 2, y, boxWidth, height)
    doc.setFontSize(4.4)
    doc.setTextColor(120, 130, 138)
    doc.text('Onbekend', x, y + height / 2 + 1.2, { align: 'center' })
    return height
  }

  const rows = [
    ['Vogel', nodeData.name || 'Onbekend'],
    ['Geslacht', nodeData.Geslacht || '-'],
    ['Jaar', nodeData.Kweekjaar || '-'],
    ['Stamnummer', nodeData.Stamnummer || '-'],
    ['Ringnummer', nodeData.Ringnummer || '-'],
    ['Mutatie', nodeData.Mutatie || '-'],
    ['Split', [nodeData.Split1, nodeData.Split2, nodeData.Split3, nodeData.Split4].filter(Boolean).join(', ') || nodeData.Split || '-'],
    ['Factor', nodeData.Factor || '-'],
    ['Status', nodeData.Status || '-'],
  ]
  const rowHeight = 4.2
  const [fillR, fillG, fillB] = PEDIGREE_LEGEND_COLORS[nodeData.colorClass] || PEDIGREE_LEGEND_COLORS.unsexed
  doc.setDrawColor(45, 57, 64)
  doc.setLineWidth(0.35)
  doc.rect(x - boxWidth / 2, y, boxWidth, rowHeight * rows.length)
  rows.forEach(([label, value], rowIndex) => {
    const rowTop = y + rowIndex * rowHeight
    if (rowIndex === 0) {
      doc.setFillColor(fillR, fillG, fillB)
      doc.rect(x - boxWidth / 2, rowTop, boxWidth, rowHeight, 'F')
      doc.rect(x - boxWidth / 2, rowTop, boxWidth, rowHeight, 'S')
    }
    if (rowIndex > 0) doc.line(x - boxWidth / 2, rowTop, x + boxWidth / 2, rowTop)
    doc.setTextColor(25, 31, 36)
    doc.setFontSize(rowIndex === 0 ? 4.6 : 3.8)
    doc.text(`${label}: ${String(value).slice(0, 32)}`, x - boxWidth / 2 + 1.5, rowTop + 3, { maxWidth: boxWidth - 3 })
  })
  return rowHeight * rows.length
}

function drawPdfLegend(doc, startX, y) {
  doc.setFontSize(7.5)
  let x = startX
  PEDIGREE_LEGEND.forEach((item) => {
    const [r, g, b] = PEDIGREE_LEGEND_COLORS[item.className] || [200, 200, 200]
    doc.setFillColor(r, g, b)
    doc.setDrawColor(45, 57, 64)
    doc.setLineWidth(0.2)
    doc.rect(x, y - 3, 4, 4, 'FD')
    doc.setTextColor(25, 31, 36)
    doc.text(item.label, x + 6, y)
    x += 6 + doc.getTextWidth(item.label) + 10
  })
}

export function exportFullTreePdf(selectedBirdKey, birds, ancestors, descendants) {
  if (!selectedBirdKey) {
    throw new Error('Selecteer eerst een vogel in de stamboom-tab.')
  }

  const selectedBird = birds[selectedBirdKey]
  const fileStamp = new Date().toISOString().slice(0, 10)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageWidth = 297
  const pageHeight = 210
  const marginX = 16
  const contentWidth = pageWidth - marginX * 2
  const rowHeight = 46
  const startY = 34
  const boxWidth = 58

  const drawSection = (rootEntry, title, addPage, isDescendant) => {
    if (addPage) doc.addPage()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setTextColor(25, 31, 36)
    doc.setFontSize(16)
    doc.setFont(undefined, 'normal')
    doc.text(`VOORBEELDSCHEMA PARENTEEL - ${title.toUpperCase()}`, 8, 10)
    drawPdfLegend(doc, 8, 20)

    if (!rootEntry) {
      doc.setFontSize(11)
      doc.setTextColor(90, 100, 110)
      doc.text(isDescendant ? 'Geen nakomelingen gevonden' : 'Geen voorouders gevonden', marginX, startY)
      return
    }

    const maxDepth = (() => {
      let max = 0
      const walk = (entry) => { max = Math.max(max, entry.depth); entry.children.forEach(walk) }
      walk(rootEntry)
      return max
    })()
    const depthToY = (depth) => (isDescendant ? startY + depth * rowHeight : startY + (maxDepth - depth) * rowHeight)

    const drawEntry = (entry) => {
      const y = depthToY(entry.depth)
      let boxHeight = 0

      if (isDescendant) {
        const { subject, partner } = entry.node
        if (partner) {
          boxHeight = Math.max(
            drawPdfPersonBox(doc, entry.x - boxWidth / 2 - 3, y, boxWidth, subject),
            drawPdfPersonBox(doc, entry.x + boxWidth / 2 + 3, y, boxWidth, partner),
          )
          doc.setFontSize(6.5)
          doc.setTextColor(25, 31, 36)
          doc.text('×', entry.x, y + boxHeight / 2 + 1, { align: 'center' })
        } else {
          boxHeight = drawPdfPersonBox(doc, entry.x, y, boxWidth, subject)
        }
      } else {
        boxHeight = drawPdfPersonBox(doc, entry.x, y, boxWidth, buildPedigreeNodeData(entry.node))
        if (entry.children.length === 2) {
          const midX = (entry.children[0].x + entry.children[1].x) / 2
          doc.setFontSize(6.5)
          doc.setTextColor(25, 31, 36)
          doc.text('×', midX, depthToY(entry.depth + 1) - 4, { align: 'center' })
        }
      }

      entry.children.forEach((childEntry) => {
        const childY = depthToY(childEntry.depth)
        const midY = isDescendant ? y + boxHeight + (rowHeight - boxHeight) / 2 : childY - (rowHeight - boxHeight) / 2
        doc.setDrawColor(45, 57, 64)
        doc.setLineWidth(0.35)
        doc.line(entry.x, y + boxHeight, entry.x, midY)
        doc.line(entry.x, midY, childEntry.x, midY)
        doc.line(childEntry.x, midY, childEntry.x, childY)
        drawEntry(childEntry)
      })
    }

    drawEntry(rootEntry)
  }

  const ancestorRoot = layoutCoupleTree(ancestors || selectedBird, 0, marginX, marginX + contentWidth)
  const descendantRoot = layoutCoupleTree(descendants || { subject: buildPedigreeNodeData(selectedBird), partner: null, children: [] }, 0, marginX, marginX + contentWidth)

  drawSection(ancestorRoot, 'Voorouders', false, false)
  drawSection(descendantRoot, 'Nakomelingen', true, true)

  doc.save(`stamboom-volledig-${fileStamp}.pdf`)
  return 'PDF opgeslagen: volledige stamboom.'
}

// ─── Splendid calculator exports ─────────────────────────────────────────────

export function exportSplendidResultPdf(maleRows, femaleRows, viewOptions, maleSummary, femaleSummary) {
  const { visualOnly = false, showSplitDetails = false, showGeneticCode = false } = viewOptions
  const showCode = showGeneticCode && !visualOnly

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const generatedAt = new Date().toLocaleString('nl-BE')
  const fileStamp = new Date().toISOString().slice(0, 10)

  // Title block
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(15, 115, 115)
  doc.text('Splendidparkiet – Genetica', 12, 14)
  doc.setFont(undefined, 'italic')
  doc.setFontSize(10)
  doc.setTextColor(75, 99, 105)
  doc.text('Neophema splendida', 12, 20)
  doc.setFont(undefined, 'normal')

  // Crossing block
  doc.setFontSize(9.5)
  doc.setTextColor(28, 43, 47)
  doc.text('Kruising', 12, 28)
  doc.setTextColor(75, 99, 105)
  const maleLines = doc.splitTextToSize(`1.0  ${maleSummary}`, 186)
  doc.text(maleLines, 12, 33)
  let y = 33 + maleLines.length * 4.5
  doc.text('×', 12, y)
  y += 4
  const femaleLines = doc.splitTextToSize(`0.1  ${femaleSummary}`, 186)
  doc.text(femaleLines, 12, y)
  y += femaleLines.length * 4.5 + 3

  // View options badge
  const optLabels = []
  if (visualOnly) optLabels.push('Enkel visueel')
  if (showSplitDetails && !visualOnly) optLabels.push('Splits tonen')
  if (showCode) optLabels.push('Genetische code')
  doc.setFontSize(8)
  doc.setTextColor(140, 155, 160)
  doc.text(`Weergave: ${optLabels.length ? optLabels.join(', ') : 'Standaard'}`, 12, y)
  y += 6

  const cols = showCode ? ['%', 'Uitkomst', 'Code'] : ['%', 'Uitkomst']
  const colStyles = showCode
    ? { 0: { cellWidth: 16 }, 1: { cellWidth: 100 }, 2: { fontSize: 6, cellWidth: 'auto' } }
    : { 0: { cellWidth: 16 } }

  function stripSexPrefix(label) {
    return String(label || '').replace(/^[01]\.\d\s+/, '')
  }

  // Male results
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(21, 101, 192)
  doc.text('1.0 – Mannen', 12, y)
  doc.setFont(undefined, 'normal')
  y += 3

  autoTable(doc, {
    startY: y,
    head: [cols],
    body: maleRows.map((r) => {
      const row = [`${r.percentage.toFixed(2)}%`, stripSexPrefix(r.label)]
      if (showCode) row.push(r.code || '')
      return row
    }),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [21, 101, 192], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 246, 255] },
    columnStyles: colStyles,
    margin: { left: 12, right: 12 },
  })

  y = doc.lastAutoTable.finalY + 8
  if (y > 262) { doc.addPage(); y = 14 }

  // Female results
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(136, 14, 79)
  doc.text('0.1 – Poppen', 12, y)
  doc.setFont(undefined, 'normal')
  y += 3

  autoTable(doc, {
    startY: y,
    head: [cols],
    body: femaleRows.map((r) => {
      const row = [`${r.percentage.toFixed(2)}%`, stripSexPrefix(r.label)]
      if (showCode) row.push(r.code || '')
      return row
    }),
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [136, 14, 79], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 242, 248] },
    columnStyles: colStyles,
    margin: { left: 12, right: 12 },
  })

  // Page footer
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(170, 180, 185)
    doc.text(`Gegenereerd op ${generatedAt}`, 12, 289)
    doc.text(`${p} / ${totalPages}`, 198, 289, { align: 'right' })
  }

  doc.save(`splendid-nakomelingen-${fileStamp}.pdf`)
  return 'PDF opgeslagen.'
}

export function printSplendidResult(maleRows, femaleRows, viewOptions, maleSummary, femaleSummary) {
  const { visualOnly = false, showSplitDetails = false, showGeneticCode = false } = viewOptions
  const showCode = showGeneticCode && !visualOnly

  const optLabels = []
  if (visualOnly) optLabels.push('Enkel visueel')
  if (showSplitDetails && !visualOnly) optLabels.push('Splits tonen')
  if (showCode) optLabels.push('Genetische code')

  function stripSexPrefix(label) {
    return String(label || '').replace(/^[01]\.\d\s+/, '')
  }

  const thCode = showCode ? '<th class="code-col">Code</th>' : ''

  function buildRows(rows) {
    return rows.map((r) => {
      const codeCell = showCode ? `<td class="code-col">${esc(r.code || '')}</td>` : ''
      return `<tr><td class="pct">${esc(r.percentage.toFixed(2))}%</td><td>${esc(stripSexPrefix(r.label))}</td>${codeCell}</tr>`
    }).join('')
  }

  const w = window.open('', '_blank', 'width=900,height=860')
  if (!w) throw new Error('Popup geblokkeerd. Sta popups toe om af te drukken.')

  w.document.write(`<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Splendidparkiet – Nakomelingen</title>
  <style>
    :root{--line:#d7e5e7;--ink:#1c2b2f;--muted:#4b6369;--male:#1565c0;--female:#880e4f;--accent-deep:#0f7373}
    *{box-sizing:border-box}
    body{margin:0;font-family:'Segoe UI',Arial,sans-serif;color:var(--ink);background:#f4f7f9;font-size:13px}
    .wrap{max-width:820px;margin:0 auto;padding:18px}
    .head{border:1px solid var(--line);border-left:6px solid var(--accent-deep);background:#fff;border-radius:12px;padding:14px 16px;margin-bottom:12px}
    .head h1{margin:0 0 3px;font-size:20px;color:var(--accent-deep)}
    .head em{color:var(--muted);font-size:11px}
    .panel{border:1px solid var(--line);border-radius:10px;background:#fff;padding:12px 14px;margin-bottom:10px}
    h2{margin:0 0 6px;font-size:14px;color:var(--ink)}
    h3{font-size:12px;font-weight:700;margin:10px 0 4px}
    h3.male{color:var(--male)}
    h3.female{color:var(--female)}
    .cross-block p{margin:2px 0;font-size:12.5px}
    .cross-sep{font-size:18px;font-weight:700;color:var(--muted);margin:1px 0}
    .view-opts{font-size:10px;color:var(--muted);margin:6px 0 0;border-top:1px dashed var(--line);padding-top:4px}
    table{width:100%;border-collapse:collapse;font-size:11.5px}
    th,td{border-bottom:1px solid var(--line);text-align:left;padding:5px 7px}
    thead{background:#f5f8fb}
    td.pct{font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap;width:48px}
    td.code-col,th.code-col{font-family:monospace;font-size:9px;color:var(--muted);word-break:break-all;max-width:200px}
    @media print{
      body{background:#fff}
      .wrap{max-width:none;padding:8mm}
      .panel,.head{border-radius:0;break-inside:avoid;page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Splendidparkiet – Nakomelingen</h1>
      <em>Neophema splendida &nbsp;·&nbsp; ${esc(new Date().toLocaleString('nl-BE'))}</em>
    </div>
    <div class="panel">
      <h2>Kruising</h2>
      <div class="cross-block">
        <p><strong>1.0</strong> ${esc(maleSummary)}</p>
        <p class="cross-sep">×</p>
        <p><strong>0.1</strong> ${esc(femaleSummary)}</p>
      </div>
      <p class="view-opts">Weergave: ${esc(optLabels.length ? optLabels.join(', ') : 'Standaard')}</p>
      <h3 class="male">1.0 – Mannen</h3>
      <table><thead><tr><th>%</th><th>Uitkomst</th>${thCode}</tr></thead>
        <tbody>${buildRows(maleRows)}</tbody></table>
      <h3 class="female">0.1 – Poppen</h3>
      <table><thead><tr><th>%</th><th>Uitkomst</th>${thCode}</tr></thead>
        <tbody>${buildRows(femaleRows)}</tbody></table>
    </div>
  </div>
</body>
</html>`)
  w.document.close()
  w.focus()
  w.print()
}
