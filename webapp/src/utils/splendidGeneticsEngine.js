// Genetics engine for Splendidparkiet (Neophema splendida).
// ZZ = male (1.0), ZW = female (0.1).
// Supports: autosomal-in (incomplete dominant EF/DF), autosomal-do (dominant),
//           autosomal-re (recessive), sex-linked (Z-linked recessive),
//           sex-linked-ino (Z-linked allelicGroup: ino / pallid), blue-series (multiple alleles).

import { SPLENDID_LOCI } from '../data/splendidGencalcConfig'

const SEX_MALE = '1.0'
const SEX_FEMALE = '0.1'

// ─── Genotype parsing ────────────────────────────────────────────────────────

function sortPair(pair) {
  return [...pair].sort((a, b) => String(a).localeCompare(String(b), 'nl-BE'))
}

function parseAutosomal(value, mut) {
  if (!value) return ['+', '+']
  if (value === `${mut}/${mut};`) return [mut, mut]
  if (value === `${mut}+/${mut};`) return ['+', mut]
  return ['+', '+']
}

function parseSexLinkedMale(value, mut) {
  if (!value) return ['+', '+']
  if (value === `${mut}/${mut};`) return [mut, mut]
  if (value === `${mut}/${mut}+;`) return ['+', mut]
  if (value === `${mut}+/${mut};`) return ['+', mut]
  return ['+', '+']
}

function parseSexLinkedFemale(value, mut) {
  if (!value) return ['+', 'Y']
  if (value === `${mut}/Y;`) return [mut, 'Y']
  return ['+', 'Y']
}

function parseInoMale(valueA, valueB) {
  if (valueA === 'ino' && valueB === '1ino*pd') return ['ino', 'ino*pd']
  if (valueA === 'ino*pd' && valueB === '1ino') return ['ino', 'ino*pd']
  if (valueA === 'ino') return ['ino', 'ino']
  if (valueA === 'ino*pd') return ['ino*pd', 'ino*pd']
  if (valueB === '1ino' || valueB === '2ino') return ['+', 'ino']
  if (valueB === '1ino*pd' || valueB === '2ino*pd') return ['+', 'ino*pd']
  return ['+', '+']
}

function parseInoFemale(value) {
  if (value === 'ino/Y;') return ['ino', 'Y']
  if (value === 'ino*pd/Y;') return ['ino*pd', 'Y']
  return ['+', 'Y']
}

function parseBluePair(valueA, valueB) {
  const primary = valueA || ''
  const secondary = valueB || ''
  if (!primary && !secondary) return ['+', '+']
  if (primary && !secondary) return sortPair([primary, primary])
  if (!primary && secondary) return sortPair(['+', secondary])
  return sortPair([primary, secondary])
}

function parseParent(fields, sex) {
  const genotype = { __phase: {} }

  SPLENDID_LOCI.forEach((locus) => {
    if (locus.type === 'autosomal-in' || locus.type === 'autosomal-do' || locus.type === 'autosomal-re') {
      const value = fields[sex === SEX_MALE ? locus.maleField : locus.femaleField] || ''
      genotype[locus.key] = parseAutosomal(value, locus.mut)
      return
    }

    if (locus.type === 'sex-linked') {
      const value = fields[sex === SEX_MALE ? locus.maleField : locus.femaleField] || ''
      genotype[locus.key] = sex === SEX_MALE ? parseSexLinkedMale(value, locus.mut) : parseSexLinkedFemale(value, locus.mut)
      if (sex === SEX_MALE && locus.key === 'cin') {
        if (value === 'cin/cin+;') genotype.__phase.cin = 'A'
        else if (value === 'cin+/cin;') genotype.__phase.cin = 'B'
      }
      if (sex === SEX_MALE && locus.key === 'op') {
        if (value === 'op/op+;') genotype.__phase.op = 'A'
        else if (value === 'op+/op;') genotype.__phase.op = 'B'
      }
      return
    }

    if (locus.type === 'sex-linked-ino') {
      if (sex === SEX_MALE) {
        genotype[locus.key] = parseInoMale(fields[locus.maleFieldA] || '', fields[locus.maleFieldB] || '')
      } else {
        genotype[locus.key] = parseInoFemale(fields[locus.femaleField] || '')
      }
      return
    }

    if (locus.type === 'blue-series') {
      if (sex === SEX_MALE) {
        genotype[locus.key] = parseBluePair(fields[locus.maleFieldA] || '', fields[locus.maleFieldB] || '')
      } else {
        genotype[locus.key] = parseBluePair(fields[locus.femaleFieldA] || '', fields[locus.femaleFieldB] || '')
      }
    }
  })

  return genotype
}

// ─── Gamete generation ───────────────────────────────────────────────────────

function isHeteroMut(pair, mut) {
  return pair.includes(mut) && pair.includes('+')
}

// Model linked cin+op loci with recombination for heterozygous males.
function cinOpLinkedPartForMale(parent) {
  const cinPair = parent.cin || ['+', '+']
  const opPair = parent.op || ['+', '+']

  const cinHet = isHeteroMut(cinPair, 'cin')
  const opHet = isHeteroMut(opPair, 'op')
  const inoWild = (parent.ino || ['+', '+']).every((item) => item === '+')

  if (!cinHet || !opHet || !inoWild) return null

  const cinPhase = parent.__phase?.cin || 'A'
  const opPhase = parent.__phase?.op || 'A'

  const cinA = cinPhase === 'A' ? 'cin' : '+'
  const cinB = cinPhase === 'A' ? '+' : 'cin'
  const opA = opPhase === 'A' ? 'op' : '+'
  const opB = opPhase === 'A' ? '+' : 'op'

  const recombination = 0.33
  const parentalWeight = (1 - recombination) / 2
  const recombinantWeight = recombination / 2

  return [
    { weight: parentalWeight,   value: { cin: cinA, op: opA } },
    { weight: parentalWeight,   value: { cin: cinB, op: opB } },
    { weight: recombinantWeight, value: { cin: cinA, op: opB } },
    { weight: recombinantWeight, value: { cin: cinB, op: opA } },
  ]
}

function gametesForParent(parent, sex) {
  const linkedCinOpPart = sex === SEX_MALE ? cinOpLinkedPartForMale(parent) : null

  const parts = SPLENDID_LOCI
    .filter((locus) => !(linkedCinOpPart && (locus.key === 'cin' || locus.key === 'op')))
    .map((locus) => {
      const pair = parent[locus.key]
      const [a, b] = pair

      if (locus.type === 'sex-linked' || locus.type === 'sex-linked-ino') {
        if (sex === SEX_MALE) {
          if (a === b) return [{ weight: 1, value: { [locus.key]: a } }]
          return [
            { weight: 0.5, value: { [locus.key]: a } },
            { weight: 0.5, value: { [locus.key]: b } },
          ]
        }
        // Female: only Z-chromosome allele goes to gamete (W gamete handled separately)
        return [{ weight: 1, value: { [locus.key]: a } }]
      }

      if (a === b) return [{ weight: 1, value: { [locus.key]: a } }]
      return [
        { weight: 0.5, value: { [locus.key]: a } },
        { weight: 0.5, value: { [locus.key]: b } },
      ]
    })

  if (linkedCinOpPart) parts.push(linkedCinOpPart)

  const base = parts.reduce(
    (acc, part) => {
      const next = []
      acc.forEach((entry) => {
        part.forEach((chunk) => {
          next.push({ weight: entry.weight * chunk.weight, value: { ...entry.value, ...chunk.value } })
        })
      })
      return next
    },
    [{ weight: 1, value: {} }],
  )

  if (sex === SEX_MALE) return base

  // Female: split each gamete into Z-gamete (sex chromosome X) and W-gamete.
  return base.flatMap((entry) => {
    const yValue = { ...entry.value, __sexChromosome: 'Y' }
    SPLENDID_LOCI.forEach((locus) => {
      if (locus.type === 'sex-linked' || locus.type === 'sex-linked-ino') {
        yValue[locus.key] = 'Y'
      }
    })
    return [
      { weight: entry.weight * 0.5, value: { ...entry.value, __sexChromosome: 'X' } },
      { weight: entry.weight * 0.5, value: yValue },
    ]
  })
}

// ─── Phenotype derivation ────────────────────────────────────────────────────

function nameBlue(allele) {
  if (allele === 'bl') return '(witborst)blauw'
  if (allele === 'bl*tq') return 'pastelblauw'
  if (allele === 'bl*aq') return 'zeegroen'
  return allele
}

function visualRank(name) {
  const v = String(name || '')
  if (v.startsWith('violet'))       return 10
  if (v.startsWith('khaki'))        return 20
  if (v.startsWith('gezoomd'))      return 30
  if (v.startsWith('roodbuik'))     return 31
  if (v.startsWith('dom.Bont'))     return 32
  if (v.startsWith('opaline'))      return 40
  if (v.startsWith('cinnamon'))     return 41
  if (v.startsWith('ino'))          return 42
  if (v.startsWith('pallid'))       return 43
  if (v.startsWith('pallidino'))    return 44
  if (v.startsWith('rec.Bont'))     return 90
  if (v.startsWith('dun_fallow'))   return 91
  if (v.startsWith('ashen_fallow')) return 92
  return 60
}

function sortVisualNames(values) {
  return [...values].sort((a, b) => {
    const rank = visualRank(a) - visualRank(b)
    return rank !== 0 ? rank : String(a).localeCompare(String(b), 'nl-BE')
  })
}

// Derives phenotype label from a child genotype.
// includeSplits=true  → full output with /split carriers
// includeSplits=false → visual-only output (no carrier information)
function evaluatePhenotype(childGenotype, sex, includeSplits) {
  const visuals = []
  const splitTokens = []
  let hasBlueVisual = false

  SPLENDID_LOCI.forEach((locus) => {
    const pair = childGenotype[locus.key]
    const [a, b] = pair

    if (locus.type === 'autosomal-in' || locus.type === 'autosomal-do') {
      const count = (a === locus.mut ? 1 : 0) + (b === locus.mut ? 1 : 0)
      if (count === 2) visuals.push(`${locus.label}(df)`)
      else if (count === 1) visuals.push(`${locus.label}(ef)`)
      return
    }

    if (locus.type === 'autosomal-re') {
      const count = (a === locus.mut ? 1 : 0) + (b === locus.mut ? 1 : 0)
      if (count === 2) visuals.push(locus.label)
      else if (count === 1 && includeSplits) splitTokens.push(locus.label)
      return
    }

    if (locus.type === 'sex-linked') {
      if (sex === SEX_FEMALE) {
        if (a === locus.mut) visuals.push(locus.label)
        return
      }
      const count = (a === locus.mut ? 1 : 0) + (b === locus.mut ? 1 : 0)
      if (count === 2) visuals.push(locus.label)
      else if (count === 1 && includeSplits) splitTokens.push(locus.label)
      return
    }

    if (locus.type === 'sex-linked-ino') {
      if (sex === SEX_FEMALE) {
        if (a === 'ino')    visuals.push('ino')
        if (a === 'ino*pd') visuals.push('pallid(isabel)')
        return
      }
      const sorted = sortPair([a, b])
      if (sorted[0] === 'ino' && sorted[1] === 'ino')         visuals.push('ino')
      else if (sorted[0] === 'ino*pd' && sorted[1] === 'ino*pd') visuals.push('pallid(isabel)')
      else if (sorted[0] === 'ino' && sorted[1] === 'ino*pd') visuals.push('pallidino')
      else {
        const mut = sorted.find((item) => item !== '+')
        if (mut && includeSplits) splitTokens.push(mut === 'ino*pd' ? 'pallid(isabel)' : 'ino')
      }
      return
    }

    if (locus.type === 'blue-series') {
      const vals = [a, b].filter((item) => item !== '+')
      if (vals.length === 0) return
      if (vals.length === 1) {
        if (includeSplits) splitTokens.push(nameBlue(vals[0]))
        return
      }
      hasBlueVisual = true
      visuals.push(a === b ? nameBlue(a) : 'blauw-serie')
    }
  })

  const base = hasBlueVisual ? '' : 'groen'
  const prefixVisuals = visuals.filter((item) => item.startsWith('grijs(') || item === 'grijs')
  const suffixVisuals = sortVisualNames(visuals.filter((item) => !prefixVisuals.includes(item)))

  let visualText
  if (hasBlueVisual) {
    visualText = sortVisualNames(visuals).join(' ').trim()
  } else if (visuals.length > 0) {
    visualText = `${prefixVisuals.join(' ')} ${base} ${suffixVisuals.join(' ')}`.replace(/\s+/g, ' ').trim()
  } else {
    visualText = base
  }

  const orderedSplits = sortVisualNames([...new Set(splitTokens)])
  let splitText = orderedSplits.map((item) => ` /${item}`).join('')

  if (orderedSplits.length === 2 && orderedSplits.includes('opaline') && orderedSplits.includes('cinnamon')) {
    splitText = ' /opaline-cinnamon'
  }

  return `${visualText}${splitText}`.trim()
}

function genotypeCode(childGenotype, sex) {
  return SPLENDID_LOCI.map((locus) => {
    const [a, b] = childGenotype[locus.key]
    if ((locus.type === 'sex-linked' || locus.type === 'sex-linked-ino') && sex === SEX_FEMALE) {
      return `${locus.key}:${a}/Y`
    }
    return `${locus.key}:${a}/${b}`
  }).join(' | ')
}

// ─── Normalization ───────────────────────────────────────────────────────────

function normalizeBySex(rows) {
  const norm = (arr) => {
    const total = arr.reduce((sum, row) => sum + row.probability, 0)
    if (total <= 0) return []
    return arr.map((row) => ({ ...row, percentage: (row.probability / total) * 100 }))
  }
  return [
    ...norm(rows.filter((row) => row.sex === SEX_MALE)),
    ...norm(rows.filter((row) => row.sex === SEX_FEMALE)),
  ]
}

// ─── Main calculation ────────────────────────────────────────────────────────

// Architecture: parseParent → gametesForParent → combine → evaluatePhenotype(full & visual)
//               → group by fullGenotypeKey OR visualPhenotypeKey → normalize → return
//
// visualOnly changes ONLY how results are grouped and displayed — the genetics never change.
export function calculateSplendid(fields, options = {}) {
  const { visualOnly = false, showGeneticCode = true, showSplitDetails = true } = options

  const maleParent = parseParent(fields, SEX_MALE)
  const femaleParent = parseParent(fields, SEX_FEMALE)

  const maleGametes = gametesForParent(maleParent, SEX_MALE)
  const femaleGametes = gametesForParent(femaleParent, SEX_FEMALE)

  const map = new Map()

  maleGametes.forEach((mg) => {
    femaleGametes.forEach((fg) => {
      const sex = fg.value.__sexChromosome === 'Y' ? SEX_FEMALE : SEX_MALE
      const childGenotype = {}

      SPLENDID_LOCI.forEach((locus) => {
        const ma = mg.value[locus.key]
        const fa = fg.value[locus.key]

        if (locus.type === 'sex-linked' || locus.type === 'sex-linked-ino') {
          childGenotype[locus.key] = sex === SEX_FEMALE ? [ma, 'Y'] : sortPair([ma, fa])
        } else {
          childGenotype[locus.key] = sortPair([ma, fa])
        }
      })

      // Always compute both phenotypes for grouping accuracy.
      const fullPhenotype = evaluatePhenotype(childGenotype, sex, true)
      const visualPhenotype = evaluatePhenotype(childGenotype, sex, false)
      const fullCode = genotypeCode(childGenotype, sex)

      // Grouping key: visual mode groups by visual phenotype only (no code, no splits).
      // Full mode groups by complete phenotype + optional code.
      const groupKey = visualOnly
        ? `${sex}__${visualPhenotype}`
        : `${sex}__${fullPhenotype}__${showGeneticCode ? fullCode : ''}`

      // Display values chosen after grouping decision.
      const displayPhenotype = visualOnly ? visualPhenotype : (showSplitDetails ? fullPhenotype : visualPhenotype)
      const displayCode = showGeneticCode && !visualOnly ? fullCode : ''

      const prob = mg.weight * fg.weight

      if (map.has(groupKey)) {
        map.get(groupKey).probability += prob
      } else {
        map.set(groupKey, {
          sex,
          label: `${sex} ${displayPhenotype}`,
          phenotype: displayPhenotype,
          code: displayCode,
          probability: prob,
        })
      }
    })
  })

  const normalized = normalizeBySex([...map.values()]).map((row) => ({
    ...row,
    percentage: Number(row.percentage.toFixed(4)),
  }))

  normalized.sort((a, b) => {
    if (a.sex !== b.sex) return a.sex.localeCompare(b.sex)
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    return a.label.localeCompare(b.label, 'nl-BE')
  })

  return {
    rows: normalized,
    maleRows: normalized.filter((row) => row.sex === SEX_MALE),
    femaleRows: normalized.filter((row) => row.sex === SEX_FEMALE),
  }
}
