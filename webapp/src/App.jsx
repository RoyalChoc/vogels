import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadState, saveState } from './utils/storage'
import { factorOptions } from './data/factorOptions'
import { gezoomdOptions } from './data/gezoomdOptions'
import { mutatieOptions } from './data/mutatieOptions'
import { splitOptions } from './data/splitOptions'
import { 
  vogelNaam, 
  vogelKey, 
  findBirdByName, 
  buildAncestorsTree, 
  buildDescendantsTree 
} from './utils/birdUtils'
import {
  printBirdOverview,
  exportBirdOverviewPdf,
  printSelectedCouple,
  exportSelectedCouplePdf,
  printBreedingCards,
  printTree,
  exportTreePdf,
  printFullTree,
  exportFullTreePdf,
} from './utils/print'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import TabNavigation from './components/TabNavigation'
import BirdsTab from './components/birds/BirdsTab'
import CouplesTab from './components/couples/CouplesTab'
import TreeTab from './components/tree/TreeTab'

const emptyBird = {
  Stamnummer: '',
  Ringnummer: '',
  Ringmaat: '',
  Geslacht: '',
  Mutatie: '',
  Gezoomd: '',
  Factor: '',
  Split1: '',
  Split2: '',
  Split3: '',
  Split4: '',
  Status: '',
  Herkomst: '',
  Kooi: '',
  Kweekjaar: String(new Date().getFullYear()),
  Vader: '',
  Moeder: '',
  Opmerking: '',
}

const emptyCouple = {
  name: '',
  man: '',
  pop: '',
  kooi: '',
  kweekjaar: '',
  // Kweekkaart velden - rondes met eitjes
  rondes: [],
  aantalJongUit: '',
  opmerkingKweek: '',
}

const EXCLUDED_BIRD_STATUSES = new Set(['verkocht', 'overleden'])
const EMPTY_BIRDS = {}
const EMPTY_COUPLES = {}

function normalizeStatus(status) {
  return String(status || '').trim().toLowerCase()
}

function normalizeBirdSplits(bird) {
  const legacySplit = String(bird?.Split || '').trim()
  return {
    ...bird,
    Factor: bird?.Factor ?? '',
    Gezoomd: bird?.Gezoomd ?? '',
    Split1: bird?.Split1 ?? legacySplit,
    Split2: bird?.Split2 ?? '',
    Split3: bird?.Split3 ?? '',
    Split4: bird?.Split4 ?? '',
    Opmerking: bird?.Opmerking ?? '',
  }
}

function normalizeBirdsMap(birdsMap) {
  return Object.fromEntries(
    Object.entries(birdsMap || {}).map(([key, bird]) => [key, normalizeBirdSplits(bird)]),
  )
}

function parseYear(value) {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function isAllowedChildYear(childYear, coupleYear) {
  if (childYear === null || coupleYear === null) return false
  return childYear === coupleYear || childYear === coupleYear + 1
}

function App() {
  const [birds, setBirds] = useState(() => normalizeBirdsMap(EMPTY_BIRDS))
  const [couples, setCouples] = useState(EMPTY_COUPLES)

  const [tab, setTab] = useState('vogels')
  const [search, setSearch] = useState('')

  const [selectedBirdKey, setSelectedBirdKey] = useState('')
  const [editingBirdKey, setEditingBirdKey] = useState(null)
  const [birdForm, setBirdForm] = useState(emptyBird)

  const [selectedCouple, setSelectedCouple] = useState(null)
  const [coupleForm, setCoupleForm] = useState(emptyCouple)
  const [newChild, setNewChild] = useState('')
  const [selectedBreedingCouples, setSelectedBreedingCouples] = useState([])

  const [status, setStatus] = useState('Klaar voor beheer.')

  useEffect(() => {
    let cancelled = false

    async function hydrateFromFiles() {
      const nextState = await loadState(EMPTY_BIRDS, EMPTY_COUPLES)
      if (cancelled) return

      setBirds(normalizeBirdsMap(nextState.birds))
      setCouples(nextState.couples)
    }

    hydrateFromFiles()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSelectedBreedingCouples((current) => current.filter((name) => Boolean(couples[name])))
  }, [couples])

  function persist(nextBirds, nextCouples) {
    setBirds(nextBirds)
    setCouples(nextCouples)

    void saveState(nextBirds, nextCouples)
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

  const totalBirds = useMemo(
    () =>
      birdEntries.reduce(
        (sum, [, bird]) => (EXCLUDED_BIRD_STATUSES.has(normalizeStatus(bird.Status)) ? sum : sum + 1),
        0,
      ),
    [birdEntries],
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

  const availableMaleNamesForNewCouple = useMemo(() => {
    const targetYear = String(coupleForm.kweekjaar || '').trim()
    if (!targetYear) return []

    const usedMen = new Set(
      Object.values(couples)
        .filter((c) => String(c.kweekjaar || '').trim() === targetYear)
        .map((c) => c.man),
    )

    return maleNames.filter((name) => !usedMen.has(name))
  }, [coupleForm.kweekjaar, couples, maleNames])

  const availableFemaleNamesForNewCouple = useMemo(() => {
    const targetYear = String(coupleForm.kweekjaar || '').trim()
    if (!targetYear) return []

    const usedWomen = new Set(
      Object.values(couples)
        .filter((c) => String(c.kweekjaar || '').trim() === targetYear)
        .map((c) => c.pop),
    )

    return femaleNames.filter((name) => !usedWomen.has(name))
  }, [coupleForm.kweekjaar, couples, femaleNames])

  const maleNamesForCoupleForm = selectedCouple ? maleNames : availableMaleNamesForNewCouple
  const femaleNamesForCoupleForm = selectedCouple ? femaleNames : availableFemaleNamesForNewCouple

  const allBirdNames = useMemo(() => birdEntries.map(([, b]) => vogelNaam(b)).sort(), [birdEntries])

  const validChildrenForSelectedCouple = useMemo(() => {
    if (!selectedCouple || !couples[selectedCouple]) return allBirdNames

    const couple = couples[selectedCouple]
    const coupleYear = parseYear(couple.kweekjaar)
    if (coupleYear === null) return []

    const usedChildrenInOtherCouples = new Set()
    const birdsUsedAsPartnerInOtherCouples = new Set()

    Object.entries(couples).forEach(([name, c]) => {
      if (name === selectedCouple) return

      ;(c.jongen || []).forEach((child) => usedChildrenInOtherCouples.add(child))
      if (c.man) birdsUsedAsPartnerInOtherCouples.add(c.man)
      if (c.pop) birdsUsedAsPartnerInOtherCouples.add(c.pop)
    })

    return allBirdNames.filter((childName) => {
      if (childName === couple.man || childName === couple.pop) return false
      if (usedChildrenInOtherCouples.has(childName)) return false
      if (birdsUsedAsPartnerInOtherCouples.has(childName)) return false

      const child = findBirdByName(birds, childName)
      if (!child) return false

      const childYear = parseYear(child.Kweekjaar)
      if (!isAllowedChildYear(childYear, coupleYear)) return false

      return true
    })
  }, [selectedCouple, couples, allBirdNames, birds])

  const childrenPerBirthYear = useMemo(() => {
    const totalsByYear = {}

    birdEntries.forEach(([, bird]) => {
      const hasParent = Boolean(String(bird.Vader || '').trim() || String(bird.Moeder || '').trim())
      if (!hasParent) return

      if (EXCLUDED_BIRD_STATUSES.has(normalizeStatus(bird.Status))) return

      const year = String(bird.Kweekjaar || 'Onbekend')
      if (totalsByYear[year] === undefined) {
        totalsByYear[year] = 0
      }

      totalsByYear[year] += 1
    })

    return Object.entries(totalsByYear)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(([year, count]) => ({ year, count }))
  }, [birdEntries])

  const totalChildren = useMemo(
    () => childrenPerBirthYear.reduce((sum, item) => sum + item.count, 0),
    [childrenPerBirthYear],
  )

  const activeTreeBird = selectedBirdKey ? birds[selectedBirdKey] : null
  const ancestors = activeTreeBird ? buildAncestorsTree(birds, activeTreeBird) : null
  const descendants = activeTreeBird ? buildDescendantsTree(birds, activeTreeBird) : null

  // BIRD HANDLERS
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

  // COUPLE HANDLERS
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
      rondes: Array.isArray(c.rondes) ? c.rondes : [],
      aantalJongUit: c.aantalJongUit || '',
      opmerkingKweek: c.opmerkingKweek || '',
    })
  }

  function createExtraCouple() {
    setSelectedCouple(null)
    setCoupleForm(emptyCouple)
    setNewChild('')
    setStatus('Formulier klaar voor een extra koppel.')
  }

  function saveCouple() {
    const name = coupleForm.name.trim()
    const isEditingCurrent = Boolean(selectedCouple && selectedCouple === name)

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
      if (isEditingCurrent && k === selectedCouple) return false
      if (c.man !== coupleForm.man || c.pop !== coupleForm.pop) return false
      return String(c.kweekjaar || '').trim() === coupleForm.kweekjaar
    })

    if (dup) {
      setStatus('Dit koppel bestaat al.')
      return
    }

    if (!isEditingCurrent) {
      const usedManInYear = Object.values(couples).some(
        (c) => String(c.kweekjaar || '').trim() === coupleForm.kweekjaar && c.man === coupleForm.man,
      )
      if (usedManInYear) {
        setStatus('Deze man is al gekozen in dit kweekjaar.')
        return
      }

      const usedPopInYear = Object.values(couples).some(
        (c) => String(c.kweekjaar || '').trim() === coupleForm.kweekjaar && c.pop === coupleForm.pop,
      )
      if (usedPopInYear) {
        setStatus('Deze pop is al gekozen in dit kweekjaar.')
        return
      }
    }

    if (!isEditingCurrent && couples[name]) {
      setStatus('Koppelnaam bestaat al.')
      return
    }

    const nextCouples = { ...couples }
    const oldChildren = isEditingCurrent ? couples[selectedCouple]?.jongen || [] : []

    nextCouples[name] = {
      man: coupleForm.man,
      pop: coupleForm.pop,
      kooi: coupleForm.kooi,
      kweekjaar: coupleForm.kweekjaar,
      jongen: oldChildren,
      rondes: Array.isArray(coupleForm.rondes) ? coupleForm.rondes : [],
      aantalJongUit: coupleForm.aantalJongUit || '',
      opmerkingKweek: coupleForm.opmerkingKweek || '',
    }

    persist(birds, nextCouples)
    setSelectedCouple(name)
    setStatus(isEditingCurrent ? `Koppel gewijzigd: ${name}` : `Nieuw koppel toegevoegd: ${name}`)
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

    const childBird = findBirdByName(birds, newChild)
    const childYear = parseYear(childBird?.Kweekjaar)
    const coupleYear = parseYear(c.kweekjaar)
    if (!isAllowedChildYear(childYear, coupleYear)) {
      if (coupleYear === null) {
        setStatus('Koppel heeft geen geldig kweekjaar.')
      } else {
        setStatus(`Jong moet kweekjaar ${coupleYear} of ${coupleYear + 1} hebben.`)
      }
      return
    }

    const inOtherPair = Object.entries(couples).find(([name, info]) => {
      if (name === selectedCouple) return false
      return info.man === newChild || info.pop === newChild
    })

    if (inOtherPair) {
      setStatus(`Vogel zit als partner in ${inOtherPair[0]} en kan geen jong zijn.`)
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

  // PRINT/PDF HANDLERS
  function handlePrintBirds() {
    try {
      printBirdOverview(filteredBirds)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handleExportBirdsPdf() {
    try {
      const msg = exportBirdOverviewPdf(filteredBirds)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handlePrintCouple() {
    try {
      printSelectedCouple(selectedCouple, couples, birds)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handleExportCouplePdf() {
    try {
      const msg = exportSelectedCouplePdf(selectedCouple, couples, birds)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handlePrintBreedingCards() {
    try {
      printBreedingCards(selectedBreedingCouples, couples, birds, mutatieOptions, splitOptions, gezoomdOptions, factorOptions)
      setStatus(`Kweekkaarten geopend: ${selectedBreedingCouples.length} geselecteerd(e) koppel(s).`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handlePrintTree(type) {
    try {
      printTree(type, selectedBirdKey, birds, ancestors, descendants)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handleExportTreePdf(type) {
    try {
      const msg = exportTreePdf(type, selectedBirdKey, birds, ancestors, descendants)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handlePrintFullTree() {
    try {
      printFullTree(selectedBirdKey, birds, ancestors, descendants)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handleExportFullTreePdf() {
    try {
      const msg = exportFullTreePdf(selectedBirdKey, birds, ancestors, descendants)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message)
    }
  }

  return (
    <main className="appShell">
      <Header
        totalBirds={totalBirds}
        totalCouples={Object.keys(couples).length}
        totalChildren={totalChildren}
        childrenPerBirthYear={childrenPerBirthYear}
      />

      <StatusBar message={status} />

      <TabNavigation activeTab={tab} onTabChange={setTab} />

      {tab === 'vogels' && (
        <BirdsTab
          birdForm={birdForm}
          setBirdForm={setBirdForm}
          editingBirdKey={editingBirdKey}
          maleNames={maleNames}
          femaleNames={femaleNames}
          filteredBirds={filteredBirds}
          selectedBirdKey={selectedBirdKey}
          search={search}
          setSearch={setSearch}
          onFormSave={saveBird}
          onFormClear={clearBirdForm}
          onFormDelete={deleteBird}
          onSelectBird={selectBird}
          onPrintBirds={handlePrintBirds}
          onExportBirdsPdf={handleExportBirdsPdf}
        />
      )}

      {tab === 'koppels' && (
        <CouplesTab
          coupleForm={coupleForm}
          setCoupleForm={setCoupleForm}
          maleNames={maleNamesForCoupleForm}
          femaleNames={femaleNamesForCoupleForm}
          selectedCouple={selectedCouple}
          couples={couples}
          validChildrenNames={validChildrenForSelectedCouple}
          newChild={newChild}
          setNewChild={setNewChild}
          onFormSave={saveCouple}
          onFormNew={createExtraCouple}
          onFormPrint={handlePrintCouple}
          onFormExportPdf={handleExportCouplePdf}
          onFormDelete={deleteCouple}
          onSelectCouple={selectCouple}
          onCreateCouple={createExtraCouple}
          onAddChild={addChildToCouple}
          onRemoveChild={removeChildFromCouple}
          selectedBreedingCouples={selectedBreedingCouples}
          onBreedingSelectionChange={setSelectedBreedingCouples}
          onPrintBreedingCards={handlePrintBreedingCards}
          birds={birds}
        />
      )}

      {tab === 'stamboom' && (
        <TreeTab
          selectedBirdKey={selectedBirdKey}
          birdEntries={birdEntries}
          activeTreeBird={activeTreeBird}
          ancestors={ancestors}
          descendants={descendants}
          onSelectBird={setSelectedBirdKey}
          onPrint={handlePrintFullTree}
          onExportPdf={handleExportFullTreePdf}
        />
      )}
    </main>
  )
}

export default App
