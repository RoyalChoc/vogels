import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/auth/LoginPage'
import ProfilePage from './components/auth/ProfilePage'
import { loadState, saveState } from './utils/storage'
import { loadOptions, saveOptions } from './utils/optionsStorage'
import { loadContacts, saveContacts } from './utils/contactStorage'
import {
  exportContactsExcel,
  exportContactsPdf,
  mergeContactsNonDestructive,
  parseContactsFromExcelXml,
} from './utils/contactExport'
import { factorOptions } from './data/factorOptions'
import { contactveldOptions } from './data/contactveldOptions'
import { geslachtOptions } from './data/geslachtOptions'
import { gezoomdOptions } from './data/gezoomdOptions'
import { herkomstOptions } from './data/herkomstOptions'
import { kooienOptions } from './data/kooiOptions'
import { kweekjaarOptions } from './data/kweekjaarOptions'
import { mutatieOptions } from './data/mutatieOptions'
import { ringmaatOptions } from './data/ringmaatOptions'
import { splitOptions } from './data/splitOptions'
import { statusOptions } from './data/statusOptions'
import { vogelsoortOptions } from './data/vogelsoortOptions'
import { monstertypeOptions } from './data/monstertypeOptions'
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
  printFullTree,
  exportFullTreePdf,
  printGeslachtsbepalingCards,
} from './utils/print'
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import TabNavigation from './components/TabNavigation'
import BirdsTab from './components/birds/BirdsTab'
import CouplesTab from './components/couples/CouplesTab'
import TreeTab from './components/tree/TreeTab'
import AdminTab from './components/admin/AdminTab'
import ContactsTab from './components/contacts/ContactsTab'
import SplendidCalculatorTab from './components/splendid/SplendidCalculatorTab'
import GeslachtsbepalingTab from './components/geslachtsbepaling/GeslachtsbepalingTab'

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
  AankoopContactId: '',
  AankoopDatum: '',
  Vader: '',
  Moeder: '',
  Opmerking: '',
  Vogelsoort: '',
  WetenschappelijkeNaam: '',
  Monstertype: '',
  EigenaarContactId: '',
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

const emptyContact = {
  Naam: '',
  Voornaam: '',
  Straat: '',
  Nummer: '',
  Postcode: '',
  Gemeente: '',
  Provincie: '',
  Gsmnummer: '',
  Website: '',
  Extra: {},
}

const EXCLUDED_BIRD_STATUSES = new Set(['verkocht', 'overleden'])
const EMPTY_BIRDS = {}
const EMPTY_COUPLES = {}
const EMPTY_CONTACTS = {}
const STANDARD_CONTACT_FIELD_NAMES = new Set([
  'Naam',
  'Voornaam',
  'Straat',
  'Nummer',
  'Postcode',
  'Gemeente',
  'Provincie',
  'Gsmnummer',
  'Website',
])
const ADMIN_DEFAULT_PIN = '0000'
const OPTION_DEFINITIONS = [
  { key: 'factor', label: 'Factor', fileName: 'factor.json' },
  { key: 'geslacht', label: 'Geslacht', fileName: 'geslacht.json' },
  { key: 'gezoomd', label: 'Gezoomd', fileName: 'gezoomd.json' },
  { key: 'herkomst', label: 'Herkomst', fileName: 'herkomst.json' },
  { key: 'jaren', label: 'Jaren', fileName: 'jaren.json' },
  { key: 'kooien', label: 'Kooien', fileName: 'kooien.json' },
  { key: 'mutaties', label: 'Mutaties', fileName: 'mutaties.json' },
  { key: 'ringmaten', label: 'Ringmaten', fileName: 'ringmaten.json' },
  { key: 'split', label: 'Split', fileName: 'split.json' },
  { key: 'status', label: 'Status', fileName: 'status.json' },
  { key: 'contactvelden', label: 'Contactvelden', fileName: 'contactvelden.json' },
  {
    key: 'vogelsoorten',
    label: 'Vogelsoorten (formaat: Naam — Wetenschappelijke naam)',
    fileName: 'vogelsoorten.json',
  },
  { key: 'monstertypes', label: 'Monstertypes', fileName: 'monstertypes.json' },
]
const DEFAULT_OPTION_SETS = {
  factor: factorOptions,
  contactvelden: contactveldOptions,
  geslacht: geslachtOptions,
  gezoomd: gezoomdOptions,
  herkomst: herkomstOptions,
  jaren: kweekjaarOptions,
  kooien: kooienOptions,
  mutaties: mutatieOptions,
  ringmaten: ringmaatOptions,
  split: splitOptions,
  status: statusOptions,
  vogelsoorten: vogelsoortOptions,
  monstertypes: monstertypeOptions,
}

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
    AankoopContactId: bird?.AankoopContactId ?? '',
    AankoopDatum: bird?.AankoopDatum ?? '',
    Opmerking: bird?.Opmerking ?? '',
    Vogelsoort: bird?.Vogelsoort ?? '',
    WetenschappelijkeNaam: bird?.WetenschappelijkeNaam ?? '',
    Monstertype: bird?.Monstertype ?? '',
    EigenaarContactId: bird?.EigenaarContactId ?? '',
  }
}

function normalizeContact(contact) {
  return {
    ...emptyContact,
    ...(contact || {}),
    Extra: contact?.Extra && typeof contact.Extra === 'object' ? contact.Extra : {},
  }
}

function contactSortKey(contact) {
  const voornaam = String(contact?.Voornaam || '').trim()
  const naam = String(contact?.Naam || '').trim()
  const gemeente = String(contact?.Gemeente || '').trim()
  return `${voornaam} ${naam} ${gemeente}`.trim()
}

function sortContactsMap(rawContacts) {
  return Object.fromEntries(
    Object.entries(rawContacts || {}).sort(([, a], [, b]) =>
      contactSortKey(a).localeCompare(contactSortKey(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
    ),
  )
}

function normalizeContactsMap(rawContacts) {
  const normalized = Object.fromEntries(
    Object.entries(rawContacts || {}).map(([id, contact]) => [id, normalizeContact(contact)]),
  )
  return sortContactsMap(normalized)
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

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Bestand kon niet worden gelezen.'))
    reader.readAsText(file)
  })
}

function AppContent() {
  const { isAdmin, isAuthenticated, authLoading, currentUser, token } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  const [birds, setBirds] = useState(() => normalizeBirdsMap(EMPTY_BIRDS))
  const [couples, setCouples] = useState(EMPTY_COUPLES)
  const [contacts, setContacts] = useState(() => normalizeContactsMap(EMPTY_CONTACTS))
  const [optionSets, setOptionSets] = useState(DEFAULT_OPTION_SETS)

  const [tab, setTab] = useState('vogels')
  const [search, setSearch] = useState('')

  const [selectedBirdKey, setSelectedBirdKey] = useState('')
  const [editingBirdKey, setEditingBirdKey] = useState(null)
  const [birdForm, setBirdForm] = useState(emptyBird)

  const [selectedCouple, setSelectedCouple] = useState(null)
  const [coupleForm, setCoupleForm] = useState(emptyCouple)
  const [selectedContactId, setSelectedContactId] = useState('')
  const [contactForm, setContactForm] = useState(emptyContact)
  const [newChild, setNewChild] = useState('')
  const [selectedBreedingCouples, setSelectedBreedingCouples] = useState([])
  const [selectedSexDeterminationKeys, setSelectedSexDeterminationKeys] = useState([])

  const [status, setStatus] = useState('Klaar voor beheer.')
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState(false)

  const isReadOnly = !isAdmin
  const [adminPinInput, setAdminPinInput] = useState('')
  const [pendingContactsImport, setPendingContactsImport] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function hydrateFromFiles() {
      const [nextState, nextOptions, nextContacts] = await Promise.all([
        loadState(EMPTY_BIRDS, EMPTY_COUPLES),
        loadOptions(DEFAULT_OPTION_SETS),
        loadContacts(EMPTY_CONTACTS),
      ])
      if (cancelled) return

      setBirds(normalizeBirdsMap(nextState.birds))
      setCouples(nextState.couples)
      setOptionSets(nextOptions)
      setContacts(normalizeContactsMap(nextContacts))
    }

    hydrateFromFiles()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSelectedBreedingCouples((current) => current.filter((name) => Boolean(couples[name])))
  }, [couples])

  useEffect(() => {
    setSelectedSexDeterminationKeys((current) => current.filter((key) => Boolean(birds[key])))
  }, [birds])

  useEffect(() => {
    if (isAdmin) setIsAdminUnlocked(true)
  }, [isAdmin])

  function persist(nextBirds, nextCouples) {
    if (isReadOnly) {
      setStatus('Geen schrijfrechten. Alleen beheerders kunnen gegevens aanpassen.')
      return
    }
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

  const unsexedBirdEntries = useMemo(
    () =>
      birdEntries.filter(
        ([, bird]) => !String(bird.Geslacht || '').trim() && !EXCLUDED_BIRD_STATUSES.has(normalizeStatus(bird.Status)),
      ),
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

  const customContactFieldNames = useMemo(
    () =>
      Array.isArray(optionSets.contactvelden)
        ? optionSets.contactvelden.filter((value) => {
            const fieldName = String(value || '').trim()
            return fieldName && !STANDARD_CONTACT_FIELD_NAMES.has(fieldName)
          })
        : [],
    [optionSets.contactvelden],
  )

  const contactOptions = useMemo(
    () =>
      Object.entries(contacts)
        .map(([id, contact]) => {
          const voornaam = String(contact.Voornaam || '').trim()
          const naam = String(contact.Naam || '').trim()
          const gemeente = String(contact.Gemeente || '').trim()
          const fullName = `${voornaam} ${naam}`.trim()
          const label = fullName && gemeente ? `${fullName} (${gemeente})` : fullName || gemeente || 'Onbekend contact'

          return { id, label }
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'nl-BE', { numeric: true, sensitivity: 'base' })),
    [contacts],
  )

  useEffect(() => {
    setContactForm((current) => {
      const nextExtra = {}
      customContactFieldNames.forEach((fieldName) => {
        nextExtra[fieldName] = current.Extra?.[fieldName] || ''
      })

      return {
        ...current,
        Extra: nextExtra,
      }
    })
  }, [customContactFieldNames])

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

  function addCouple() {
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

    if (couples[name]) {
      setStatus('Koppelnaam bestaat al.')
      return
    }

    const dup = Object.values(couples).some(
      (c) => c.man === coupleForm.man && c.pop === coupleForm.pop && String(c.kweekjaar || '').trim() === coupleForm.kweekjaar,
    )
    if (dup) {
      setStatus('Dit koppel bestaat al.')
      return
    }

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

    const nextCouples = {
      ...couples,
      [name]: {
        man: coupleForm.man,
        pop: coupleForm.pop,
        kooi: coupleForm.kooi,
        kweekjaar: coupleForm.kweekjaar,
        jongen: [],
        rondes: Array.isArray(coupleForm.rondes) ? coupleForm.rondes : [],
        aantalJongUit: coupleForm.aantalJongUit || '',
        opmerkingKweek: coupleForm.opmerkingKweek || '',
      },
    }

    persist(birds, nextCouples)
    setSelectedCouple(name)
    setStatus(`Nieuw koppel toegevoegd: ${name}`)
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

  // CONTACT HANDLERS
  function clearContactForm() {
    const nextExtra = {}
    customContactFieldNames.forEach((fieldName) => {
      nextExtra[fieldName] = ''
    })

    setContactForm({
      ...emptyContact,
      Extra: nextExtra,
    })
    setSelectedContactId('')
  }

  function selectContact(contactId) {
    const contact = contacts[contactId]
    if (!contact) return

    const nextExtra = {}
    customContactFieldNames.forEach((fieldName) => {
      nextExtra[fieldName] = contact.Extra?.[fieldName] || ''
    })

    setSelectedContactId(contactId)
    setContactForm({
      ...normalizeContact(contact),
      Extra: nextExtra,
    })
  }

  async function saveContact() {
    if (isReadOnly) {
      setStatus('Geen schrijfrechten. Alleen beheerders kunnen gegevens aanpassen.')
      return
    }
    const naam = String(contactForm.Naam || '').trim()
    const voornaam = String(contactForm.Voornaam || '').trim()
    if (!naam && !voornaam) {
      setStatus('Naam of voornaam is verplicht voor een contact.')
      return
    }

    const normalized = normalizeContact(contactForm)
    const nextContact = {
      ...normalized,
      Naam: naam,
      Voornaam: voornaam,
      Straat: String(normalized.Straat || '').trim(),
      Nummer: String(normalized.Nummer || '').trim(),
      Postcode: String(normalized.Postcode || '').trim(),
      Gemeente: String(normalized.Gemeente || '').trim(),
      Provincie: String(normalized.Provincie || '').trim(),
      Gsmnummer: String(normalized.Gsmnummer || '').trim(),
      Website: String(normalized.Website || '').trim(),
      Extra: Object.fromEntries(
        customContactFieldNames.map((fieldName) => [fieldName, String(normalized.Extra?.[fieldName] || '').trim()]),
      ),
    }

    const nextId = selectedContactId || `contact-${Date.now()}`
    const nextContacts = sortContactsMap({
      ...contacts,
      [nextId]: nextContact,
    })

    try {
      await saveContacts(nextContacts)
      setContacts(nextContacts)
      setSelectedContactId(nextId)
      setContactForm(nextContact)
      setStatus('Contact opgeslagen.')
    } catch (error) {
      setStatus(error.message || 'Kon contact niet opslaan.')
    }
  }

  async function deleteContact() {
    if (isReadOnly) {
      setStatus('Geen schrijfrechten. Alleen beheerders kunnen gegevens aanpassen.')
      return
    }
    if (!selectedContactId) {
      setStatus('Selecteer eerst een contact.')
      return
    }

    const isUsedByBird = Object.values(birds).some(
      (bird) => String(bird.AankoopContactId || '') === String(selectedContactId),
    )

    if (isUsedByBird) {
      setStatus('Contact wordt nog gebruikt bij een vogel en kan niet verwijderd worden.')
      return
    }

    const nextContacts = { ...contacts }
    delete nextContacts[selectedContactId]
    const sortedContacts = sortContactsMap(nextContacts)

    try {
      await saveContacts(sortedContacts)
      setContacts(sortedContacts)
      clearContactForm()
      setStatus('Contact verwijderd.')
    } catch (error) {
      setStatus(error.message || 'Kon contact niet verwijderen.')
    }
  }

  function handleExportContactsExcel() {
    try {
      const msg = exportContactsExcel(contacts, customContactFieldNames)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message || 'Kon contacten niet exporteren naar Excel.')
    }
  }

  function handleExportContactsPdf() {
    try {
      const msg = exportContactsPdf(contacts, customContactFieldNames)
      setStatus(msg)
    } catch (error) {
      setStatus(error.message || 'Kon contacten niet exporteren naar PDF.')
    }
  }

  async function handleImportContactsExcel(file) {
    const lowerName = String(file?.name || '').toLowerCase()
    if (!lowerName.endsWith('.xls')) {
      setStatus('Alleen .xls bestanden worden ondersteund voor contacten-import.')
      return
    }

    try {
      const xmlText = await readFileAsText(file)
      const importedContacts = parseContactsFromExcelXml(xmlText, customContactFieldNames)
      const mergedResult = mergeContactsNonDestructive(contacts, importedContacts)
      const sortedContacts = sortContactsMap(mergedResult.contacts)

      if (mergedResult.addedCount === 0 && mergedResult.updatedCount === 0) {
        setStatus('Import bevatte geen nieuwe contactgegevens. Data bleef ongewijzigd.')
        return
      }

      setPendingContactsImport({
        sourceName: String(file.name || 'contacten.xls'),
        mergedContacts: sortedContacts,
        addedCount: mergedResult.addedCount,
        updatedCount: mergedResult.updatedCount,
        addedLabels: mergedResult.addedLabels || [],
        updatedLabels: mergedResult.updatedLabels || [],
      })
      setStatus('Import geanalyseerd. Controleer de preview en bevestig om op te slaan.')
    } catch (error) {
      setStatus(error.message || 'Kon contacten niet importeren vanuit Excel.')
    }
  }

  async function confirmContactsImport() {
    if (!pendingContactsImport) return

    try {
      exportContactsExcel(contacts, customContactFieldNames, 'contacten-backup-voor-import')
      await saveContacts(pendingContactsImport.mergedContacts)
      setContacts(pendingContactsImport.mergedContacts)
      setStatus(
        `Contacten geïmporteerd. Back-up gemaakt. Toegevoegd: ${pendingContactsImport.addedCount}, bijgewerkt: ${pendingContactsImport.updatedCount}.`,
      )
      setPendingContactsImport(null)
    } catch (error) {
      setStatus(error.message || 'Kon contacten-import niet bevestigen.')
    }
  }

  function cancelContactsImport() {
    setPendingContactsImport(null)
    setStatus('Contacten-import geannuleerd. Er werd niets opgeslagen.')
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
      printBreedingCards(
        selectedBreedingCouples,
        couples,
        birds,
        optionSets.mutaties,
        optionSets.split,
        optionSets.gezoomd,
        optionSets.factor,
      )
      setStatus(`Kweekkaarten geopend: ${selectedBreedingCouples.length} geselecteerd(e) koppel(s).`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  function handlePrintSexDeterminationCards() {
    try {
      printGeslachtsbepalingCards(selectedSexDeterminationKeys, birds, contacts)
      setStatus(`Geslachtsbepaling-kaartjes geopend: ${selectedSexDeterminationKeys.length} geselecteerde vogel(s).`)
    } catch (error) {
      setStatus(error.message)
    }
  }

  async function handleSaveOptions(nextOptions) {
    if (isReadOnly) {
      setStatus('Geen schrijfrechten. Alleen beheerders kunnen gegevens aanpassen.')
      return
    }
    await saveOptions(nextOptions)
    setOptionSets(nextOptions)
  }

  function handleTabChange(nextTab) {
    if (nextTab !== 'beheer') {
      setTab(nextTab)
      return
    }

    if (!isAdmin) {
      setStatus('Geen toegang. Alleen beheerders kunnen de beheerpagina openen.')
      return
    }

    if (isAdminUnlocked) {
      setTab('beheer')
      return
    }

    setShowAdminPinPrompt(true)
    setAdminPinInput('')
    setStatus('Voer pincode in om Beheer te openen.')
  }

  function unlockAdminTab() {
    if (adminPinInput.trim() !== ADMIN_DEFAULT_PIN) {
      setStatus('Onjuiste pincode voor Beheer.')
      return
    }

    setIsAdminUnlocked(true)
    setShowAdminPinPrompt(false)
    setAdminPinInput('')
    setTab('beheer')
    setStatus('Beheer ontgrendeld.')
  }

  function cancelAdminPinPrompt() {
    setShowAdminPinPrompt(false)
    setAdminPinInput('')
    setStatus('Beheer blijft vergrendeld.')
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

  if (authLoading) {
    return (
      <div className="authLoadingScreen" aria-label="Laden">
        <div className="authLoadingSpinner" aria-hidden="true" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (showProfile) {
    return (
      <main className="appShell">
        <ProfilePage onBack={() => setShowProfile(false)} />
      </main>
    )
  }

  return (
    <main className="appShell">
      <Header
        totalBirds={totalBirds}
        totalCouples={Object.keys(couples).length}
        totalChildren={totalChildren}
        childrenPerBirthYear={childrenPerBirthYear}
        onOpenProfile={() => setShowProfile(true)}
      />

      <StatusBar message={status} />

      <TabNavigation activeTab={tab} onTabChange={handleTabChange} />

      {showAdminPinPrompt && (
        <div className="pinGateBackdrop" role="dialog" aria-modal="true" aria-label="Beheer pincode">
          <article className="card pinGateCard">
            <h2>Beheer vergrendeld</h2>
            <p>Voer de pincode in om de beheerpagina te openen.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={adminPinInput}
              onChange={(event) => setAdminPinInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  unlockAdminTab()
                }
              }}
              placeholder="Pincode"
            />
            <div className="rowActions">
              <button type="button" className="primary" onClick={unlockAdminTab}>
                Ontgrendel Beheer
              </button>
              <button type="button" className="ghost" onClick={cancelAdminPinPrompt}>
                Annuleer
              </button>
            </div>
          </article>
        </div>
      )}

      {pendingContactsImport && (
        <div className="pinGateBackdrop" role="dialog" aria-modal="true" aria-label="Contacten import preview">
          <article className="card pinGateCard">
            <h2>Controleer contacten-import</h2>
            <p>
              Bestand: <strong>{pendingContactsImport.sourceName}</strong>
            </p>
            <p>
              Toe te voegen: <strong>{pendingContactsImport.addedCount}</strong> | Bij te werken:{' '}
              <strong>{pendingContactsImport.updatedCount}</strong>
            </p>

            {pendingContactsImport.addedLabels.length > 0 && (
              <div className="importPreviewBlock">
                <h3>Voorbeeld toe te voegen</h3>
                <ul>
                  {pendingContactsImport.addedLabels.slice(0, 8).map((label) => (
                    <li key={`add-${label}`}>{label}</li>
                  ))}
                </ul>
              </div>
            )}

            {pendingContactsImport.updatedLabels.length > 0 && (
              <div className="importPreviewBlock">
                <h3>Voorbeeld bij te werken</h3>
                <ul>
                  {pendingContactsImport.updatedLabels.slice(0, 8).map((label) => (
                    <li key={`update-${label}`}>{label}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rowActions">
              <button type="button" className="primary" onClick={confirmContactsImport}>
                Bevestig import
              </button>
              <button type="button" className="ghost" onClick={cancelContactsImport}>
                Annuleer
              </button>
            </div>
          </article>
        </div>
      )}

      {tab === 'vogels' && (
        <BirdsTab
          birdForm={birdForm}
          setBirdForm={setBirdForm}
          editingBirdKey={editingBirdKey}
          maleNames={maleNames}
          femaleNames={femaleNames}
          optionSets={optionSets}
          contactOptions={contactOptions}
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
          optionSets={optionSets}
          selectedCouple={selectedCouple}
          couples={couples}
          validChildrenNames={validChildrenForSelectedCouple}
          newChild={newChild}
          setNewChild={setNewChild}
          onFormSave={saveCouple}
          onFormNew={createExtraCouple}
          onFormAdd={addCouple}
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

      {tab === 'contacten' && (
        <ContactsTab
          contacts={contacts}
          selectedContactId={selectedContactId}
          contactForm={contactForm}
          customFieldNames={customContactFieldNames}
          onContactFieldChange={(field, value) => setContactForm((current) => ({ ...current, [field]: value }))}
          onCustomFieldChange={(field, value) =>
            setContactForm((current) => ({
              ...current,
              Extra: {
                ...(current.Extra || {}),
                [field]: value,
              },
            }))
          }
          onSelectContact={selectContact}
          onSaveContact={saveContact}
          onNewContact={clearContactForm}
          onDeleteContact={deleteContact}
          onExportExcel={handleExportContactsExcel}
          onExportPdf={handleExportContactsPdf}
          onImportExcel={handleImportContactsExcel}
        />
      )}

      {tab === 'splendid-calculator' && <SplendidCalculatorTab />}

      {tab === 'geslachtsbepaling' && (
        <GeslachtsbepalingTab
          birdEntries={unsexedBirdEntries}
          selectedKeys={selectedSexDeterminationKeys}
          onSelectionChange={setSelectedSexDeterminationKeys}
          onPrintCards={handlePrintSexDeterminationCards}
        />
      )}

      {tab === 'beheer' && (
        <AdminTab
          optionDefinitions={OPTION_DEFINITIONS}
          optionsMap={optionSets}
          contacts={contacts}
          customContactFieldNames={customContactFieldNames}
          onSave={handleSaveOptions}
          onSaveContacts={async (nextContacts) => {
            await saveContacts(nextContacts)
            setContacts(sortContactsMap(nextContacts))
          }}
          onStatus={setStatus}
          token={token}
          currentUserId={currentUser?.id}
        />
      )}
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
