import fs from 'node:fs/promises'

const raw = JSON.parse(await fs.readFile('reports/audit-linked-combos-double.json', 'utf8'))

function keyFor(group, post) {
  if (group === 'ino') {
    return `${post['msm[0]'] || ''}__${post['msm[1]'] || ''}`
  }
  if (group === 'mblue') {
    return `${post['mrm[0]'] || ''}__${post['mrm[1]'] || ''}`
  }
  return `${post['frm[0]'] || ''}__${post['frm[1]'] || ''}`
}

function groupOf(id) {
  if (id.startsWith('INO-')) return 'ino'
  if (id.startsWith('MBL-')) return 'mblue'
  return 'fblue'
}

const canonical = new Map()
for (const r of raw.results) {
  const group = groupOf(r.id)
  const k = keyFor(group, r.post)
  if (!canonical.has(group)) canonical.set(group, new Map())
  canonical.get(group).set(k, r.sig1)
}

function equivalentPairs(group) {
  const g = canonical.get(group)
  const pairs = []
  const entries = [...g.entries()]
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (entries[i][1] === entries[j][1]) {
        pairs.push([entries[i][0], entries[j][0]])
      }
    }
  }
  return pairs
}

const out = {
  summary: raw.summary,
  equivalent: {
    ino: equivalentPairs('ino'),
    mblue: equivalentPairs('mblue'),
    fblue: equivalentPairs('fblue'),
  },
}

await fs.writeFile('reports/derive-allowed-linked.json', JSON.stringify(out, null, 2), 'utf8')
console.log('saved reports/derive-allowed-linked.json')
console.log('ino equivalents', out.equivalent.ino.length)
console.log('mblue equivalents', out.equivalent.mblue.length)
console.log('fblue equivalents', out.equivalent.fblue.length)
