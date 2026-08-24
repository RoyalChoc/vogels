// Allele options for each locus
export const BLAUW_ALLELES = [
  { value: 'wild', label: 'Wildkleur' },
  { value: 'bl', label: 'Blauw' },
  { value: 'aq', label: 'Aqua (Zeegroen)' },
  { value: 'pb', label: 'Pastelblauw (Turquoise)' },
]

export const SEX_LINKED_ALLELES = [
  { value: 'wild', label: 'Wild' },
  { value: 'op', label: 'Opaline (Roodbuik)' },
  { value: 'cin', label: 'Cinnamon' },
  { value: 'ino', label: 'Ino (Lutino/Rubino)' },
  { value: 'pal', label: 'Pallid (Isabel)' },
]

export const DONKER_OPTIONS = [
  { value: 'none', label: 'Geen' },
  { value: 'single', label: 'D-Factor (enkelvoudig)' },
  { value: 'double', label: 'DD-Factor (dubbel)' },
]

const ALLELE_LABEL = {
  op: 'Opaline',
  cin: 'Cinnamon',
  ino: 'Ino',
  pal: 'Pallid',
}

function determineBlauwPhenotype(a1, a2) {
  const alleles = [a1, a2]
  const count = (v) => alleles.filter((a) => a === v).length

  if (count('bl') === 2) return { visual: 'Blauw', split: null }
  if (alleles.includes('aq') && alleles.includes('bl')) return { visual: 'Aqua-Blue (Zeegroen-Blauw intermediair)', split: null }
  if (count('aq') === 2) return { visual: 'Aqua (Zeegroen)', split: null }
  if (alleles.includes('pb') && alleles.includes('bl')) return { visual: 'Pastelblauw (Turquoise)', split: null }
  if (count('pb') === 2) return { visual: 'Pastelblauw (Turquoise, dubbel)', split: null }
  if (alleles.includes('pb') && alleles.includes('aq')) return { visual: 'Aqua-Pastelblauw intermediair', split: null }

  // Single recessive allele = split
  const singles = ['bl', 'aq', 'pb']
  for (const s of singles) {
    if (count(s) === 1) return { visual: null, split: BLAUW_ALLELES.find((x) => x.value === s)?.label ?? s }
  }

  return { visual: null, split: null } // wildkleur
}

function determineSexLinkedPhenotype(sex, alleles) {
  const features = []
  const splits = []

  if (sex === 'pop') {
    // Female (ZW): has one Z chromosome from father – any non-wild is visual
    for (const a of alleles) {
      if (a !== 'wild') features.push(ALLELE_LABEL[a] ?? a)
    }
  } else {
    // Male (ZZ): needs 2 copies to be visual, 1 copy = split
    const counts = {}
    for (const a of alleles) counts[a] = (counts[a] || 0) + 1
    for (const m of ['op', 'cin', 'ino', 'pal']) {
      const n = counts[m] || 0
      if (n >= 2) features.push(ALLELE_LABEL[m])
      else if (n === 1) splits.push(ALLELE_LABEL[m])
    }
  }

  return { features, splits }
}

function buildPhenotypeLabel(blauwResult, slResult, donkerAlleles) {
  const features = []
  const splits = []

  if (blauwResult.visual) features.push(blauwResult.visual)
  else if (blauwResult.split) splits.push(blauwResult.split)

  features.push(...slResult.features)
  splits.push(...slResult.splits)

  const dCount = donkerAlleles.filter((a) => a === 'D').length
  if (dCount === 1) features.push('D-Factor')
  else if (dCount >= 2) features.push('DD-Factor (Olijf / Mauve)')

  const baseColor = features.some((f) =>
    ['Blauw', 'Aqua', 'Pastelblauw'].some((c) => f.startsWith(c)),
  )
    ? ''
    : 'Wildkleur (Groen)'

  const visual = [baseColor, ...features].filter(Boolean).join(' ').trim()
  const splitStr = splits.length > 0 ? ` / split ${splits.join(', ')}` : ''
  return `${visual}${splitStr}`
}

function donkerOptionToAlleles(option) {
  if (option === 'double') return ['D', 'D']
  if (option === 'single') return ['wild', 'D']
  return ['wild', 'wild']
}

export function buildGenotype(form) {
  return {
    vader: {
      sexLinked: [form.vaderX1 || 'wild', form.vaderX2 || 'wild'],
      blauwLocus: [form.vaderBl1 || 'wild', form.vaderBl2 || 'wild'],
      donkerLocus: donkerOptionToAlleles(form.vaderDonker || 'none'),
    },
    moeder: {
      sexLinked: [form.moederX || 'wild'],
      blauwLocus: [form.moederBl1 || 'wild', form.moederBl2 || 'wild'],
      donkerLocus: donkerOptionToAlleles(form.moederDonker || 'none'),
    },
  }
}

export function calculate(genotype) {
  const { vader, moeder } = genotype

  // Father (ZZ) gametes: X1 allele or X2 allele (sex-linked only)
  const fSex = [
    { allele: vader.sexLinked[0], prob: 0.5 },
    { allele: vader.sexLinked[1], prob: 0.5 },
  ]
  // Mother (ZW) gametes: Z-chromosome or W (nothing)
  const mSex = [
    { type: 'X', allele: moeder.sexLinked[0], prob: 0.5 },
    { type: 'Y', allele: null, prob: 0.5 },
  ]

  // Autosomal gametes (one allele from each parent)
  const fBl = [
    { allele: vader.blauwLocus[0], prob: 0.5 },
    { allele: vader.blauwLocus[1], prob: 0.5 },
  ]
  const mBl = [
    { allele: moeder.blauwLocus[0], prob: 0.5 },
    { allele: moeder.blauwLocus[1], prob: 0.5 },
  ]
  const fDk = [
    { allele: vader.donkerLocus[0], prob: 0.5 },
    { allele: vader.donkerLocus[1], prob: 0.5 },
  ]
  const mDk = [
    { allele: moeder.donkerLocus[0], prob: 0.5 },
    { allele: moeder.donkerLocus[1], prob: 0.5 },
  ]

  const zonenList = []
  const dochtersList = []

  for (const fs of fSex) {
    for (const ms of mSex) {
      for (const fb of fBl) {
        for (const mb of mBl) {
          for (const fd of fDk) {
            for (const md of mDk) {
              const prob = fs.prob * ms.prob * fb.prob * mb.prob * fd.prob * md.prob * 100
              const sex = ms.type === 'Y' ? 'pop' : 'man'

              // Daughters get only father's Z; sons get father's Z + mother's Z
              const slAlleles = ms.type === 'Y' ? [fs.allele] : [fs.allele, ms.allele]
              const blauwAlleles = [fb.allele, mb.allele]
              const donkerAlleles = [fd.allele, md.allele]

              const blauwResult = determineBlauwPhenotype(blauwAlleles[0], blauwAlleles[1])
              const slResult = determineSexLinkedPhenotype(sex, slAlleles)
              const label = buildPhenotypeLabel(blauwResult, slResult, donkerAlleles)

              if (sex === 'pop') dochtersList.push([label, prob])
              else zonenList.push([label, prob])
            }
          }
        }
      }
    }
  }

  function aggregate(list) {
    const summary = {}
    for (const [pheno, prob] of list) {
      summary[pheno] = (summary[pheno] || 0) + prob
    }
    return Object.entries(summary)
      .map(([phenotype, percentage]) => ({ phenotype, percentage: Math.round(percentage * 10) / 10 }))
      .sort((a, b) => b.percentage - a.percentage)
  }

  return {
    zonen: aggregate(zonenList),
    dochters: aggregate(dochtersList),
  }
}
