import { calculateSplendid } from '../src/utils/splendidGeneticsEngine.js'

const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=1NeofSca'

const CASES = [
  { id: 'C01', post: {} },
  { id: 'C02', post: { 'md[0]': 'V+/V;' } },
  { id: 'C03', post: { 'md[0]': 'V+/V;', 'fd[0]': 'V+/V;' } },
  { id: 'C04', post: { 'md[1]': 'G+/G;' } },
  { id: 'C05', post: { 'md[2]': 'Kh+/Kh;', 'fd[1]': 'G+/G;' } },
  { id: 'C06', post: { 'ms[0]': 'cin/cin+;', 'fs[0]': 'cin/Y;' } },
  { id: 'C07', post: { 'ms[0]': 'cin/cin;' } },
  { id: 'C08', post: { 'ms[1]': 'op/op+;', 'fs[1]': 'op/Y;' } },
  { id: 'C09', post: { 'md[3]': 'Pi+/Pi;' } },
  { id: 'C10', post: { 'mr[0]': 's+/s;', 'fr[0]': 's+/s;' } },
  { id: 'C11', post: { 'mr[1]': 'df+/df;', 'fr[1]': 'df+/df;' } },
  { id: 'C12', post: { 'mr[2]': 'af+/af;', 'fr[2]': 'af+/af;' } },
  { id: 'C13', post: { 'mrm[0]': 'bl', 'mrm[1]': 'bl', 'frm[0]': 'bl', 'frm[1]': 'bl' } },
  { id: 'C14', post: { 'mrm[0]': 'bl*tq', 'mrm[1]': 'bl*tq' } },
  { id: 'C15', post: { 'md[4]': 'Ed+/Ed;' } },
  { id: 'C16', post: { 'md[5]': 'Rs+/Rs;' } },
  { id: 'C17', post: { 'md[0]': 'V+/V;', 'md[4]': 'Ed+/Ed;' } },
  { id: 'C18', post: { 'md[1]': 'G+/G;', 'md[5]': 'Rs+/Rs;' } },
  { id: 'C19', post: { 'ms[0]': 'cin/cin+;', 'ms[1]': 'op/op+;' } },
  { id: 'C20', post: { 'md[0]': 'V+/V;', 'mr[0]': 's+/s;', 'fd[4]': 'Ed+/Ed;', 'fr[0]': 's+/s;' } },
]

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseGenCalcResults(html) {
  const bySex = { '1.0': [], '0.1': [] }
  const blockRegex = /<th colspan="2" class="res">\s*% van alles\s*([01]\.\d)\s*<\/th>([\s\S]*?)(?=<th colspan="2" class="res">|<th colspan="2">\s*Berekend)/gi

  for (const block of html.matchAll(blockRegex)) {
    const sex = block[1]
    const content = block[2]
    const rowRegex = /<td>\s*([0-9]+(?:\.[0-9]+)?)%\s*<\/td>\s*<td>\s*([\s\S]*?)\s*<\/td>/gi
    for (const row of content.matchAll(rowRegex)) {
      bySex[sex].push({
        percentage: Number.parseFloat(row[1]),
        label: stripTags(row[2]),
      })
    }
  }

  return bySex
}

function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^\s*[01]\.\d\s+/g, '')
    .replace(/\bman\b|\bpop\b/g, '')
    .replace(/wildkleur/g, 'groen')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTo100(rows) {
  const total = rows.reduce((sum, row) => sum + row.percentage, 0)
  if (total <= 0) return []
  return rows.map((row) => ({ ...row, percentage: (row.percentage / total) * 100 }))
}

function score(gen, local) {
  const genN = normalizeTo100(gen)
  const locN = normalizeTo100(local)
  const map = new Map()
  locN.forEach((row) => {
    map.set(normalizeLabel(row.label), row.percentage)
  })
  let hit = 0
  genN.forEach((row) => {
    if (map.has(normalizeLabel(row.label))) hit += 1
  })
  return genN.length === 0 ? 1 : hit / genN.length
}

async function runCase(caseItem) {
  const params = new URLSearchParams({ S: 'Genereer', ...caseItem.post })
  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const html = await response.text()
  const gen = parseGenCalcResults(html)

  const localResult = calculateSplendid(caseItem.post, {
    visualOnly: false,
    showGeneticCode: false,
    showSplitDetails: true,
  })

  const maleScore = score(gen['1.0'], localResult.maleRows)
  const femaleScore = score(gen['0.1'], localResult.femaleRows)
  return { id: caseItem.id, maleScore, femaleScore, avg: (maleScore + femaleScore) / 2 }
}

async function main() {
  const results = []
  for (const caseItem of CASES) {
    results.push(await runCase(caseItem))
  }
  const avg = results.reduce((sum, row) => sum + row.avg, 0) / results.length
  results.forEach((row) => {
    console.log(`${row.id}: man=${row.maleScore.toFixed(4)} pop=${row.femaleScore.toFixed(4)} avg=${row.avg.toFixed(4)}`)
  })
  console.log(`Gemiddelde: ${avg.toFixed(4)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
