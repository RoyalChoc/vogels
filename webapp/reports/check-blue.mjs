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

const cases = [
  {id:'a', post:{'mrm[0]':'bl'}},
  {id:'b', post:{'mrm[0]':'bl','mrm[1]':'bl'}},
  {id:'c', post:{'mrm[0]':'bl*tq'}},
  {id:'d', post:{'mrm[0]':'bl*tq','mrm[1]':'bl'}},
  {id:'e', post:{'mrm[0]':'bl*aq'}},
  {id:'f', post:{'mrm[0]':'bl*aq','mrm[1]':'bl'}},
  {id:'g', post:{'mrm[0]':'bl*aq','mrm[1]':'bl*tq'}},
]
for (const c of cases) {
  const p = new URLSearchParams({ S: 'Genereer', ...c.post })
  const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const h = await r.text()
  const parsed = parseGenCalcResults(h)
  console.log(c.id, c.post, parsed['1.0'].slice(0,3), parsed['0.1'].slice(0,3))
}
