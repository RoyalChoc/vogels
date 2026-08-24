const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=1NeofSca'
const A = ['', 'ino', 'ino*pd']
const B = ['', '1ino', '2ino', '1ino*pd', '2ino*pd']

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTopLabels(html) {
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
  return {
    male: bySex['1.0'].slice(0, 3).map((r) => `${r.percentage}% ${r.label}`).join(' | '),
    female: bySex['0.1'].slice(0, 3).map((r) => `${r.percentage}% ${r.label}`).join(' | '),
  }
}

for (const a of A) {
  for (const b of B) {
    const params = new URLSearchParams({ S: 'Genereer' })
    if (a) params.set('msm[0]', a)
    if (b) params.set('msm[1]', b)
    const response = await fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const html = await response.text()
    const top = parseTopLabels(html)
    console.log(`${a || '-'} + ${b || '-'} => M: ${top.male} || F: ${top.female}`)
  }
}
