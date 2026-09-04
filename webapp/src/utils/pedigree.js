import { vogelNaam, vogelKey, findBirdByName } from './birdUtils.js'

export function formatPedigreeBirdName(bird) {
  if (!bird) return 'Onbekend'
  return `${bird.Stamnummer || ''} - ${bird.Ringnummer || ''}`.trim() || 'Onbekend'
}

// Status (overleden/verkocht) overschrijft de geslachtskleur; anders man/pop/niet gesext.
export function getPedigreeColorClass(bird) {
  const status = String(bird?.Status || '').trim().toLowerCase()
  if (status === 'overleden') return 'status-overleden'
  if (status === 'verkocht') return 'status-verkocht'
  const sex = String(bird?.Geslacht || '').trim().toLowerCase()
  if (sex === 'man') return 'male'
  if (sex === 'pop' || sex === 'vrouw' || sex === 'female') return 'female'
  return 'unsexed'
}

export const PEDIGREE_LEGEND = [
  { label: 'Man', className: 'male', color: '#1ea9d8' },
  { label: 'Pop', className: 'female', color: '#f55ea6' },
  { label: 'Overleden', className: 'status-overleden', color: '#9aa5ad' },
  { label: 'Verkocht', className: 'status-verkocht', color: '#4caf7d' },
  { label: 'Niet gesext', className: 'unsexed', color: '#f4d35e' },
]

export function buildPedigreeNodeData(node) {
  if (!node) return null

  const fields = [
    { label: 'Jaar', value: node?.Kweekjaar || '-' },
    { label: 'Stamnummer', value: node?.Stamnummer || '-' },
    { label: 'Ringnummer', value: node?.Ringnummer || '-' },
    { label: 'Mutatie', value: node?.Mutatie || '-' },
    { label: 'Split', value: [node?.Split1, node?.Split2, node?.Split3, node?.Split4].filter(Boolean).join(', ') || node?.Split || '-' },
    { label: 'Factor', value: node?.Factor || '-' },
    { label: 'Status', value: node?.Status || '-' },
  ]

  return {
    ...node,
    colorClass: getPedigreeColorClass(node),
    name: formatPedigreeBirdName(node),
    details: fields,
  }
}

// ─── Nakomelingen: parenteel-koppelboom ──────────────────────────────────────
// Elke knoop is een koppel (subject × partner). De children van een koppel zijn
// hun eigen kinderen, elk gekoppeld aan hún partner (indien die ooit zelf jongen had).

function findPartnerNamesOf(birds, bird) {
  const name = vogelNaam(bird)
  const partners = new Set()
  Object.values(birds).forEach((candidate) => {
    if (candidate.Vader === name && candidate.Moeder) partners.add(candidate.Moeder)
    if (candidate.Moeder === name && candidate.Vader) partners.add(candidate.Vader)
  })
  return [...partners]
}

function buildPartnerNodeData(birds, partnerName) {
  if (!partnerName) return null
  const partnerBird = findBirdByName(birds, partnerName)
  if (partnerBird) return buildPedigreeNodeData(partnerBird)
  return { name: partnerName, details: [], unknown: true }
}

function buildDescendantCoupleNode(birds, subject, partnerName, maxGen, gen, seen) {
  const key = vogelKey(subject)
  const node = {
    subject: buildPedigreeNodeData(subject),
    partner: buildPartnerNodeData(birds, partnerName),
    children: [],
  }

  if (seen.has(key) || gen >= maxGen) return node

  const subjectName = vogelNaam(subject)
  const kids = partnerName
    ? Object.values(birds).filter((c) => (
        (c.Vader === subjectName && c.Moeder === partnerName) ||
        (c.Moeder === subjectName && c.Vader === partnerName)
      ))
    : Object.values(birds).filter((c) => c.Vader === subjectName || c.Moeder === subjectName)

  const nextSeen = new Set(seen)
  nextSeen.add(key)

  node.children = kids.flatMap((kid) => {
    const kidPartnerNames = findPartnerNamesOf(birds, kid)
    if (kidPartnerNames.length === 0) {
      return [buildDescendantCoupleNode(birds, kid, null, maxGen, gen + 1, nextSeen)]
    }
    return kidPartnerNames.map((partner) => buildDescendantCoupleNode(birds, kid, partner, maxGen, gen + 1, nextSeen))
  })

  return node
}

export function buildDescendantsCoupleTree(birds, rootBird, maxGen = 4) {
  if (!rootBird) return null
  const partnerNames = findPartnerNamesOf(birds, rootBird)
  return buildDescendantCoupleNode(birds, rootBird, partnerNames[0] || null, maxGen, 1, new Set())
}

// ─── Voorouders: koppel-rijen top-down (oudste generatie eerst) ─────────────
// Gebruikt voor de PDF-tekenlaag: elke rij bevat de knopen op die generatiediepte,
// met childId = referentie naar de knoop in de rij eronder waar de verbindingslijn naartoe loopt.

export function buildAncestorCoupleRows(birds, rootBird, maxGen = 4) {
  const upRows = []

  function walk(bird, depth, childId, seen) {
    if (!bird || depth >= maxGen) return
    const key = vogelKey(bird)
    if (seen.has(key)) return
    if (!upRows[depth]) upRows[depth] = []
    const id = `a${depth}-${upRows[depth].length}`
    upRows[depth].push({ id, node: buildPedigreeNodeData(bird), childId })

    const nextSeen = new Set(seen)
    nextSeen.add(key)
    walk(findBirdByName(birds, bird.Vader), depth + 1, id, nextSeen)
    walk(findBirdByName(birds, bird.Moeder), depth + 1, id, nextSeen)
  }

  walk(rootBird, 0, null, new Set())

  return upRows.filter(Boolean).reverse()
}
