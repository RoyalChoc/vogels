const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=1NeofSca'

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
      bySex[sex].push({ percentage: Number.parseFloat(row[1]), label: stripTags(row[2]) })
    }
  }

  return bySex
}

function signature(parsed) {
  const m = parsed['1.0'].map((r) => `${r.percentage.toFixed(4)}|${r.label}`).join(' || ')
  const f = parsed['0.1'].map((r) => `${r.percentage.toFixed(4)}|${r.label}`).join(' || ')
  return `M:${m}__F:${f}`
}

async function runOnce(post) {
  const params = new URLSearchParams({ S: 'Genereer', ...post })
  const response = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const html = await response.text()
  return parseGenCalcResults(html)
}

async function verifyCase(id, post) {
  const first = await runOnce(post)
  const second = await runOnce(post)
  const sig1 = signature(first)
  const sig2 = signature(second)
  const stable = sig1 === sig2
  return {
    id,
    post,
    stable,
    sig1,
    sig2,
    topMale: first['1.0'].slice(0, 3),
    topFemale: first['0.1'].slice(0, 3),
  }
}

const msm0 = ['', 'ino', 'ino*pd']
const msm1 = ['', '1ino', '2ino', '1ino*pd', '2ino*pd']
const blue = ['', 'bl', 'bl*tq', 'bl*aq']

const cases = []
let idx = 1
for (const a of msm0) {
  for (const b of msm1) {
    const post = {}
    if (a) post['msm[0]'] = a
    if (b) post['msm[1]'] = b
    cases.push({ id: `INO-${String(idx).padStart(2, '0')}`, post })
    idx += 1
  }
}

idx = 1
for (const a of blue) {
  for (const b of blue) {
    const post = {}
    if (a) post['mrm[0]'] = a
    if (b) post['mrm[1]'] = b
    cases.push({ id: `MBL-${String(idx).padStart(2, '0')}`, post })
    idx += 1
  }
}

idx = 1
for (const a of blue) {
  for (const b of blue) {
    const post = {}
    if (a) post['frm[0]'] = a
    if (b) post['frm[1]'] = b
    cases.push({ id: `FBL-${String(idx).padStart(2, '0')}`, post })
    idx += 1
  }
}

const results = []
for (const c of cases) {
  results.push(await verifyCase(c.id, c.post))
}

const unstable = results.filter((r) => !r.stable)
const summary = {
  generatedAt: new Date().toISOString(),
  caseCount: results.length,
  unstableCount: unstable.length,
}

console.log(JSON.stringify(summary, null, 2))
if (unstable.length > 0) {
  console.log('UNSTABLE CASES:')
  unstable.forEach((u) => {
    console.log(u.id, u.post)
  })
}

import fs from 'node:fs/promises'
await fs.writeFile('reports/audit-linked-combos-double.json', JSON.stringify({ summary, results }, null, 2), 'utf8')
console.log('saved reports/audit-linked-combos-double.json')
