import { useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import './App.css'
import { options, seedBirds, seedCouples } from './data/seedData'

const STORAGE_KEY = 'voliare-modern-webapp-v1'

const emptyBird = {
  Stamnummer: '',
  Ringnummer: '',
  Ringmaat: '',
  Geslacht: '',
  Mutatie: '',
  Status: '',
  Herkomst: '',
  Kooi: '',
  Kweekjaar: String(new Date().getFullYear()),
  Vader: '',
  Moeder: '',
}

const emptyCouple = {
  name: '',
  man: '',
  pop: '',
  kooi: '',
  kweekjaar: String(new Date().getFullYear()),
}

function vogelNaam(vogel) {
  if (!vogel) return ''
  return `${vogel.Stamnummer || ''} - ${vogel.Ringnummer || ''}`.trim()
}

function vogelKey(vogel) {
  return `${vogel.Stamnummer || ''}-${vogel.Ringnummer || ''}`
}

function findBirdByName(birds, name) {
  return Object.values(birds).find((v) => vogelNaam(v) === name) || null
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { birds: seedBirds, couples: seedCouples }
    const parsed = JSON.parse(raw)
    return {
      birds: parsed.birds || seedBirds,
      couples: parsed.couples || seedCouples,
    }
  } catch {
    return { birds: seedBirds, couples: seedCouples }
  }
}

function buildAncestorsTree(birds, bird, maxGen = 4, gen = 1, seen = new Set()) {
  if (!bird) return { label: 'Onbekend', meta: `Generatie ${gen}`, children: [] }

  const key = vogelKey(bird)
  if (seen.has(key)) {
    return { label: `${vogelNaam(bird)} (cyclus)`, meta: `Generatie ${gen}`, children: [] }
  }

  const node = {
    label: vogelNaam(bird),
    meta: `${bird.Mutatie || '-'} | ${bird.Kweekjaar || '-'}`,
    children: [],
  }

  if (gen >= maxGen) return node

  const nextSeen = new Set(seen)
  nextSeen.add(key)

  const father = findBirdByName(birds, bird.Vader)
  const mother = findBirdByName(birds, bird.Moeder)

  if (father) node.children.push(buildAncestorsTree(birds, father, maxGen, gen + 1, nextSeen))
  if (mother) node.children.push(buildAncestorsTree(birds, mother, maxGen, gen + 1, nextSeen))

  return node
}

function buildDescendantsTree(birds, bird, maxGen = 4, gen = 1, seen = new Set()) {
  if (!bird) return { label: 'Onbekend', meta: `Generatie ${gen}`, children: [] }

  const key = vogelKey(bird)
  if (seen.has(key)) {
    return { label: `${vogelNaam(bird)} (cyclus)`, meta: `Generatie ${gen}`, children: [] }
  }

  const node = {
    label: vogelNaam(bird),
    meta: `${bird.Mutatie || '-'} | ${bird.Kweekjaar || '-'}`,
    children: [],
  }

  if (gen >= maxGen) return node

  const nextSeen = new Set(seen)
  nextSeen.add(key)

  const children = Object.values(birds).filter(
    (candidate) => candidate.Vader === vogelNaam(bird) || candidate.Moeder === vogelNaam(bird),
  )

  node.children = children.map((child) => buildDescendantsTree(birds, child, maxGen, gen + 1, nextSeen))
  return node
}

function TreeNode({ node }) {
  if (!node) return null

  return (
    <li>
      <article className="treeNode">
        <h4>{node.label}</h4>
        <p>{node.meta}</p>
      </article>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={`${child.label}-${child.meta}`} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 9V4h12v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect
        x="4"
        y="9"
        width="16"
        height="8"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect x="7" y="14" width="10" height="6" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 16.8h6.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.6 13.7h3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function App() {
  const initial = loadState()
  const [birds, setBirds] = useState(initial.birds)
  const [couples, setCouples] = useState(initial.couples)

  const [tab, setTab] = useState('vogels')
  const [search, setSearch] = useState('')

  const [selectedBirdKey, setSelectedBirdKey] = useState('')
  const [editingBirdKey, setEditingBirdKey] = useState(null)
  const [birdForm, setBirdForm] = useState(emptyBird)

  const [selectedCouple, setSelectedCouple] = useState(null)
  const [coupleForm, setCoupleForm] = useState(emptyCouple)
  const [newChild, setNewChild] = useState('')

  const [status, setStatus] = useState('Klaar voor beheer.')

  function persist(nextBirds, nextCouples) {
    setBirds(nextBirds)
    setCouples(nextCouples)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ birds: nextBirds, couples: nextCouples }))
  }

  const birdEntries = useMemo(
    () =>
      Object.entries(birds).sort((a, b) => {
        const aa = `${a[1].Kweekjaar}-${a[1].Stamnummer}-${a[1].Ringnummer}`
        const bb = `${b[1].Kweekjaar}-${b[1].Stamnummer}-${b[1].Ringnummer}`
        return aa.localeCompare(bb)
      }),
    [birds],
  )

  const filteredBirds = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return birdEntries
    return birdEntries.filter(([key, bird]) => `${key} ${Object.values(bird).join(' ')}`.toLowerCase().includes(q))
  }, [birdEntries, search])

  const maleNames = useMemo(
    () => birdEntries.map(([, b]) => b).filter((b) => b.Geslacht === 'Man').map((b) => vogelNaam(b)),
    [birdEntries],
  )

  const femaleNames = useMemo(
    () => birdEntries.map(([, b]) => b).filter((b) => b.Geslacht === 'Pop').map((b) => vogelNaam(b)),
    [birdEntries],
  )

  const allBirdNames = useMemo(() => birdEntries.map(([, b]) => vogelNaam(b)).sort(), [birdEntries])

  const totalChildren = useMemo(
    () => Object.values(couples).reduce((sum, c) => sum + (c.jongen?.length || 0), 0),
    [couples],
  )

  function openPrintDocument(title, bodyHtml) {
    const w = window.open('', '_blank', 'width=1200,height=860')
    if (!w) {
      setStatus('Popup geblokkeerd. Sta popups toe om af te drukken.')
      return
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

  function treeToHtml(node) {
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

  function printBirdOverview() {
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

  function exportBirdOverviewPdf() {
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
    setStatus('PDF opgeslagen: vogeloverzicht.')
  }

  function printSelectedCouple() {
    if (!selectedCouple || !couples[selectedCouple]) {
      setStatus('Selecteer eerst een koppel om af te drukken.')
      return
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

  function printTree(type) {
    if (!activeTreeBird) {
      setStatus('Selecteer eerst een vogel in de stamboom-tab.')
      return
    }

    const label = type === 'descendants' ? 'Nakomelingen' : 'Voorouders'
    const tree = type === 'descendants' ? descendants : ancestors
    const html = `<p><strong>Startvogel:</strong> ${esc(vogelNaam(activeTreeBird))}</p><ul class="tree">${treeToHtml(tree)}</ul>`
    openPrintDocument(`Stamboom - ${label}`, html)
  }

  function clearBirdForm() {
    setBirdForm(emptyBird)
    setEditingBirdKey(null)
  }

  function selectBird(key) {
    const bird = birds[key]
    if (!bird) return
    setSelectedBirdKey(key)
    setEditingBirdKey(key)
    setBirdForm({ ...bird })
  }

  function saveBird() {
    if (!birdForm.Stamnummer.trim()) {
      setStatus('Stamnummer is verplicht.')
      return
    }

    const key = vogelKey(birdForm)
    const duplicate = Object.entries(birds).some(([k, v]) => {
      if (editingBirdKey && k === editingBirdKey) return false
      return v.Kweekjaar === birdForm.Kweekjaar && String(v.Ringnummer || '') === String(birdForm.Ringnummer || '')
    })

    if (duplicate) {
      setStatus('Dubbele ring binnen hetzelfde jaar.')
      return
    }

    const nextBirds = { ...birds, [key]: { ...birdForm } }
    let nextCouples = { ...couples }

    if (editingBirdKey && editingBirdKey !== key) {
      const oldBird = birds[editingBirdKey]
      delete nextBirds[editingBirdKey]
      const oldName = vogelNaam(oldBird)
      const newName = vogelNaam(birdForm)

      Object.entries(nextCouples).forEach(([coupleName, info]) => {
        nextCouples[coupleName] = {
          ...info,
          man: info.man === oldName ? newName : info.man,
          pop: info.pop === oldName ? newName : info.pop,
          jongen: (info.jongen || []).map((child) => (child === oldName ? newName : child)),
        }
      })
    }

    persist(nextBirds, nextCouples)
    setSelectedBirdKey(key)
    clearBirdForm()
    setStatus(`Vogel opgeslagen: ${vogelNaam(birdForm)}`)
  }

  function deleteBird() {
    if (!selectedBirdKey) {
      setStatus('Selecteer eerst een vogel.')
      return
    }

    const target = birds[selectedBirdKey]
    if (!target) return

    const targetName = vogelNaam(target)
    const inCouple = Object.entries(couples).find(([, c]) => {
      return c.man === targetName || c.pop === targetName || (c.jongen || []).includes(targetName)
    })

    if (inCouple) {
      setStatus(`Kan niet verwijderen: vogel zit nog in ${inCouple[0]}.`)
      return
    }

    const nextBirds = { ...birds }
    delete nextBirds[selectedBirdKey]
    persist(nextBirds, couples)
    setSelectedBirdKey('')
    clearBirdForm()
    setStatus(`Vogel verwijderd: ${targetName}`)
  }

  function selectCouple(name) {
    const c = couples[name]
    if (!c) return
    setSelectedCouple(name)
    setCoupleForm({
      name,
      man: c.man,
      pop: c.pop,
      kooi: c.kooi,
      kweekjaar: c.kweekjaar,
    })
  }

  function saveCouple() {
    const name = coupleForm.name.trim()

    if (!name || !coupleForm.man || !coupleForm.pop || !coupleForm.kooi || !coupleForm.kweekjaar) {
      setStatus('Vul alle koppelvelden in.')
      return
    }

    if (coupleForm.man === coupleForm.pop) {
      setStatus('Man en pop moeten verschillend zijn.')
      return
    }

    if (findBirdByName(birds, coupleForm.man)?.Geslacht !== 'Man') {
      setStatus('Gekozen man is ongeldig.')
      return
    }

    if (findBirdByName(birds, coupleForm.pop)?.Geslacht !== 'Pop') {
      setStatus('Gekozen pop is ongeldig.')
      return
    }

    const dup = Object.entries(couples).some(([k, c]) => {
      if (selectedCouple && k === selectedCouple) return false
      return c.man === coupleForm.man && c.pop === coupleForm.pop
    })

    if (dup) {
      setStatus('Dit koppel bestaat al.')
      return
    }

    if (!selectedCouple && couples[name]) {
      setStatus('Koppelnaam bestaat al.')
      return
    }

    if (selectedCouple && selectedCouple !== name && couples[name]) {
      setStatus('Nieuwe koppelnaam bestaat al.')
      return
    }

    const nextCouples = { ...couples }
    const oldChildren = selectedCouple ? couples[selectedCouple]?.jongen || [] : []

    if (selectedCouple && selectedCouple !== name) {
      delete nextCouples[selectedCouple]
    }

    nextCouples[name] = {
      man: coupleForm.man,
      pop: coupleForm.pop,
      kooi: coupleForm.kooi,
      kweekjaar: coupleForm.kweekjaar,
      jongen: oldChildren,
    }

    persist(birds, nextCouples)
    setSelectedCouple(name)
    setStatus(`Koppel opgeslagen: ${name}`)
  }

  function deleteCouple() {
    if (!selectedCouple) {
      setStatus('Selecteer eerst een koppel.')
      return
    }
    const next = { ...couples }
    delete next[selectedCouple]
    persist(birds, next)
    setSelectedCouple(null)
    setCoupleForm(emptyCouple)
    setNewChild('')
    setStatus('Koppel verwijderd.')
  }

  function addChildToCouple() {
    if (!selectedCouple || !newChild) {
      setStatus('Selecteer een koppel en jong.')
      return
    }

    const c = couples[selectedCouple]
    if (!c) return

    if (newChild === c.man || newChild === c.pop) {
      setStatus('Partner kan niet als jong toegevoegd worden.')
      return
    }

    if ((c.jongen || []).includes(newChild)) {
      setStatus('Jong staat al in dit koppel.')
      return
    }

    const inOtherCouple = Object.entries(couples).find(([name, info]) => {
      if (name === selectedCouple) return false
      return (info.jongen || []).includes(newChild)
    })

    if (inOtherCouple) {
      setStatus(`Jong staat al in ${inOtherCouple[0]}.`)
      return
    }

    const next = {
      ...couples,
      [selectedCouple]: {
        ...c,
        jongen: [...(c.jongen || []), newChild].sort(),
      },
    }

    persist(birds, next)
    setNewChild('')
    setStatus('Jong toegevoegd aan koppel.')
  }

  function removeChildFromCouple(childName) {
    if (!selectedCouple) return
    const c = couples[selectedCouple]
    if (!c) return

    const next = {
      ...couples,
      [selectedCouple]: {
        ...c,
        jongen: (c.jongen || []).filter((x) => x !== childName),
      },
    }

    persist(birds, next)
    setStatus('Jong verwijderd uit koppel.')
  }

  const activeTreeBird = selectedBirdKey ? birds[selectedBirdKey] : null
  const ancestors = activeTreeBird ? buildAncestorsTree(birds, activeTreeBird) : null
  const descendants = activeTreeBird ? buildDescendantsTree(birds, activeTreeBird) : null

  return (
    <main className="appShell">
      <header className="heroBar">
        <div>
          <p className="eyebrow">Splendid Parkieten</p>
          <h1>Voliere Command Center</h1>
          <p className="subline">Moderne webapp voor vogels, koppels en stambomen.</p>
        </div>

        <div className="kpiGrid">
          <article>
            <span>Vogels</span>
            <strong>{Object.keys(birds).length}</strong>
          </article>
          <article>
            <span>Koppels</span>
            <strong>{Object.keys(couples).length}</strong>
          </article>
          <article>
            <span>Jongen links</span>
            <strong>{totalChildren}</strong>
          </article>
        </div>
      </header>

      <p className="statusBar">{status}</p>

      <nav className="tabs">
        <button type="button" className={tab === 'vogels' ? 'active' : ''} onClick={() => setTab('vogels')}>
          Vogels
        </button>
        <button type="button" className={tab === 'koppels' ? 'active' : ''} onClick={() => setTab('koppels')}>
          Koppels
        </button>
        <button type="button" className={tab === 'stamboom' ? 'active' : ''} onClick={() => setTab('stamboom')}>
          Stamboom
        </button>
      </nav>

      {tab === 'vogels' && (
        <section className="panel">
          <article className="card">
            <h2>Vogel formulier</h2>
            <div className="formGrid">
              <input
                placeholder="Stamnummer *"
                value={birdForm.Stamnummer}
                onChange={(e) => setBirdForm({ ...birdForm, Stamnummer: e.target.value })}
              />
              <input
                placeholder="Ringnummer"
                value={birdForm.Ringnummer}
                onChange={(e) => setBirdForm({ ...birdForm, Ringnummer: e.target.value })}
              />

              <select value={birdForm.Ringmaat} onChange={(e) => setBirdForm({ ...birdForm, Ringmaat: e.target.value })}>
                <option value="">Ringmaat</option>
                {options.ringmaten.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Geslacht} onChange={(e) => setBirdForm({ ...birdForm, Geslacht: e.target.value })}>
                <option value="">Geslacht</option>
                {options.geslachten.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Mutatie} onChange={(e) => setBirdForm({ ...birdForm, Mutatie: e.target.value })}>
                <option value="">Mutatie</option>
                {options.mutaties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Status} onChange={(e) => setBirdForm({ ...birdForm, Status: e.target.value })}>
                <option value="">Status</option>
                {options.statussen.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Herkomst} onChange={(e) => setBirdForm({ ...birdForm, Herkomst: e.target.value })}>
                <option value="">Herkomst</option>
                {options.herkomsten.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Kooi} onChange={(e) => setBirdForm({ ...birdForm, Kooi: e.target.value })}>
                <option value="">Kooi</option>
                {options.kooien.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Kweekjaar} onChange={(e) => setBirdForm({ ...birdForm, Kweekjaar: e.target.value })}>
                <option value="">Kweekjaar</option>
                {options.jaren.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Vader} onChange={(e) => setBirdForm({ ...birdForm, Vader: e.target.value })}>
                <option value="">Vader</option>
                {maleNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select value={birdForm.Moeder} onChange={(e) => setBirdForm({ ...birdForm, Moeder: e.target.value })}>
                <option value="">Moeder</option>
                {femaleNames.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="rowActions">
              <button type="button" className="primary" onClick={saveBird}>
                {editingBirdKey ? 'Wijzig vogel' : 'Vogel toevoegen'}
              </button>
              <button type="button" className="ghost" onClick={clearBirdForm}>
                Leeg formulier
              </button>
              <button type="button" className="danger" onClick={deleteBird}>
                Verwijderen
              </button>
            </div>
          </article>

          <article className="card">
            <div className="listHead">
              <h2>Vogeloverzicht</h2>
              <div className="listHeadActions">
                <input
                  placeholder="Zoek op stam, ring, mutatie..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="button" className="iconAction print" onClick={printBirdOverview}>
                  <PrintIcon />
                  <span>Afdrukken</span>
                </button>
                <button type="button" className="iconAction pdf" onClick={exportBirdOverviewPdf}>
                  <PdfIcon />
                  <span>Opslaan als PDF</span>
                </button>
              </div>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Naam</th>
                    <th>Geslacht</th>
                    <th>Mutatie</th>
                    <th>Kooi</th>
                    <th>Jaar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBirds.map(([key, bird]) => (
                    <tr
                      key={key}
                      className={selectedBirdKey === key ? 'selected' : ''}
                      onClick={() => selectBird(key)}
                    >
                      <td>{vogelNaam(bird)}</td>
                      <td>{bird.Geslacht || '-'}</td>
                      <td>{bird.Mutatie || '-'}</td>
                      <td>{bird.Kooi || '-'}</td>
                      <td>{bird.Kweekjaar || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {tab === 'koppels' && (
        <section className="panel split">
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

              <select value={coupleForm.kooi} onChange={(e) => setCoupleForm({ ...coupleForm, kooi: e.target.value })}>
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

            <div className="rowActions">
              <button type="button" className="primary" onClick={saveCouple}>
                {selectedCouple ? 'Wijzig koppel' : 'Nieuw koppel'}
              </button>
              <button type="button" className="ghost" onClick={printSelectedCouple}>
                Afdruk koppel
              </button>
              <button type="button" className="danger" onClick={deleteCouple}>
                Verwijder koppel
              </button>
            </div>

            {selectedCouple && (
              <div className="childEditor">
                <h3>Jongen voor {selectedCouple}</h3>
                <div className="rowActions compact">
                  <select value={newChild} onChange={(e) => setNewChild(e.target.value)}>
                    <option value="">Kies jong</option>
                    {allBirdNames.map((child) => (
                      <option key={child} value={child}>
                        {child}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="ghost" onClick={addChildToCouple}>
                    Voeg toe
                  </button>
                </div>

                <ul className="chips">
                  {(couples[selectedCouple]?.jongen || []).map((child) => (
                    <li key={child}>
                      <span>{child}</span>
                      <button type="button" onClick={() => removeChildFromCouple(child)}>
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <aside className="card">
            <h2>Koppellijst</h2>
            <div className="coupleCards">
              {Object.entries(couples).map(([name, info]) => (
                <button
                  key={name}
                  type="button"
                  className={selectedCouple === name ? 'coupleCard active' : 'coupleCard'}
                  onClick={() => selectCouple(name)}
                >
                  <strong>{name}</strong>
                  <p>
                    {info.man} x {info.pop}
                  </p>
                  <small>
                    {info.kooi} | {info.kweekjaar} | {info.jongen?.length || 0} jongen
                  </small>
                </button>
              ))}
            </div>
          </aside>
        </section>
      )}

      {tab === 'stamboom' && (
        <section className="panel">
          <article className="card">
            <h2>Stamboom viewer</h2>
            <div className="rowActions compact">
              <select value={selectedBirdKey} onChange={(e) => setSelectedBirdKey(e.target.value)}>
                <option value="">Selecteer startvogel</option>
                {birdEntries.map(([key, bird]) => (
                  <option key={key} value={key}>
                    {vogelNaam(bird)}
                  </option>
                ))}
              </select>
              <button type="button" className="ghost" onClick={() => printTree('ancestors')}>
                Afdruk voorouders
              </button>
              <button type="button" className="ghost" onClick={() => printTree('descendants')}>
                Afdruk nakomelingen
              </button>
            </div>

            {!activeTreeBird ? (
              <p>Kies een vogel voor een 4-generatie overzicht.</p>
            ) : (
              <div className="treeGrid">
                <div>
                  <h3>Voorouders</h3>
                  <div className="treeWrap">
                    <ul className="treeRoot">
                      <TreeNode node={ancestors} />
                    </ul>
                  </div>
                </div>
                <div>
                  <h3>Nakomelingen</h3>
                  <div className="treeWrap">
                    <ul className="treeRoot">
                      <TreeNode node={descendants} />
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  )
}

export default App
