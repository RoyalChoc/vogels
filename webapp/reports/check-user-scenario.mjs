import { calculateSplendid } from '../src/utils/splendidGeneticsEngine.js'

const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=1NeofSca'
const post = {
  'mrm[0]': 'bl',
  'ms[0]': 'cin/cin+;',
  'msm[1]': '1ino',
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parse(html) {
  const bySex = { '1.0': [], '0.1': [] }
  const blockRegex = /<th colspan="2" class="res">\s*% van alles\s*([01]\.\d)\s*<\/th>([\s\S]*?)(?=<th colspan="2" class="res">|<th colspan="2">\s*Berekend)/gi
  for (const block of html.matchAll(blockRegex)) {
    const sex = block[1]
    const content = block[2]
    const rowRegex = /<td>\s*([0-9]+(?:\.[0-9]+)?)%\s*<\/td>\s*<td>\s*([\s\S]*?)\s*<\/td>/gi
    for (const row of content.matchAll(rowRegex)) {
      bySex[sex].push({ percentage: Number.parseFloat(row[1]), label: stripTags(row[2]) })
    }
  }
  return bySex
}

const params = new URLSearchParams({ S: 'Genereer', ...post })
const response = await fetch(URL, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: params.toString(),
})
const html = await response.text()
const remote = parse(html)

const local = calculateSplendid(post, {
  visualOnly: false,
  showGeneticCode: false,
  showSplitDetails: true,
})

console.log('REMOTE MALE top6')
console.log(remote['1.0'].slice(0, 6))
console.log('LOCAL MALE top6')
console.log(local.maleRows.slice(0, 6).map((r) => ({ percentage: r.percentage, label: r.label })))
