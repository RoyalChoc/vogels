/**
 * Bird utility functions
 */

export function vogelNaam(vogel) {
  if (!vogel) return ''
  return `${vogel.Stamnummer || ''} - ${vogel.Ringnummer || ''}`.trim()
}

export function vogelKey(vogel) {
  return `${vogel.Stamnummer || ''}-${vogel.Ringnummer || ''}`
}

export function findBirdByName(birds, name) {
  return Object.values(birds).find((v) => vogelNaam(v) === name) || null
}

export function buildAncestorsTree(birds, bird, maxGen = 4, gen = 1, seen = new Set()) {
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

export function buildDescendantsTree(birds, bird, maxGen = 4, gen = 1, seen = new Set()) {
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
