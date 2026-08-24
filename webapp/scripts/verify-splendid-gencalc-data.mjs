import fs from 'node:fs/promises'
import path from 'node:path'
import { splendidKnownFieldValues } from '../src/data/splendidGencalcConfig.js'

const URL = 'http://www.gencalc.com/gen/dutch_genc.php?sp=0NeofSca'

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'nl-BE'))
}

function parseFormValueMap(html) {
  const map = {}
  const inputRegex = /<input\s+([^>]*?)>/gi

  for (const match of html.matchAll(inputRegex)) {
    const attrs = match[1]
    const typeMatch = attrs.match(/type="([^"]+)"/i)
    const nameMatch = attrs.match(/name="([^"]+)"/i)
    const valueMatch = attrs.match(/value="([^"]*)"/i)

    if (!typeMatch || !nameMatch) continue
    const type = String(typeMatch[1]).toLowerCase()
    const name = nameMatch[1]
    const value = valueMatch ? valueMatch[1] : ''

    if (!['radio', 'checkbox'].includes(type)) continue

    if (!map[name]) map[name] = []
    map[name].push(value)
  }

  return Object.fromEntries(
    Object.entries(map).map(([name, values]) => [name, uniqueSorted(values)]),
  )
}

function diffMaps(remoteMap, localMap) {
  const names = uniqueSorted([...Object.keys(remoteMap), ...Object.keys(localMap)])
  const diffs = []

  names.forEach((name) => {
    const remote = uniqueSorted(remoteMap[name] || [])
    const local = uniqueSorted(localMap[name] || [])

    const remoteOnly = remote.filter((item) => !local.includes(item))
    const localOnly = local.filter((item) => !remote.includes(item))

    if (remoteOnly.length === 0 && localOnly.length === 0) return

    diffs.push({
      name,
      remote,
      local,
      remoteOnly,
      localOnly,
    })
  })

  return diffs
}

async function main() {
  const response = await fetch(URL)
  const html = await response.text()
  const remote = parseFormValueMap(html)
  const local = Object.fromEntries(
    Object.entries(splendidKnownFieldValues).map(([name, values]) => [name, uniqueSorted(values)]),
  )

  const diffs = diffMaps(remote, local)

  const report = {
    generatedAt: new Date().toISOString(),
    source: URL,
    fieldCountRemote: Object.keys(remote).length,
    fieldCountLocal: Object.keys(local).length,
    exactMatch: diffs.length === 0,
    diffs,
  }

  const reportsDir = path.resolve(process.cwd(), 'reports')
  await fs.mkdir(reportsDir, { recursive: true })

  const stamp = new Date().toISOString().slice(0, 10)
  const outPath = path.join(reportsDir, `splendid-data-parity-${stamp}.json`)

  await fs.writeFile(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log(`Parity rapport: ${outPath}`)
  console.log(`Remote velden: ${report.fieldCountRemote}`)
  console.log(`Lokale velden: ${report.fieldCountLocal}`)
  console.log(`Exact match: ${report.exactMatch ? 'JA' : 'NEE'}`)

  if (!report.exactMatch) {
    console.log(`Aantal verschillen: ${report.diffs.length}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
