import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.PORT || 5173)
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, '..'))
const SEED_DIR = process.env.SEED_DIR ? path.resolve(process.env.SEED_DIR) : null
const DIST_DIR = path.resolve(__dirname, 'dist')

const BIRDS_FILE = path.join(DATA_DIR, 'vogels.json')
const COUPLES_FILE = path.join(DATA_DIR, 'koppels.json')
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json')
const OPTION_FILES = {
  factor: path.join(DATA_DIR, 'factor.json'),
  geslacht: path.join(DATA_DIR, 'geslacht.json'),
  gezoomd: path.join(DATA_DIR, 'gezoomd.json'),
  herkomst: path.join(DATA_DIR, 'herkomst.json'),
  jaren: path.join(DATA_DIR, 'jaren.json'),
  kooien: path.join(DATA_DIR, 'kooien.json'),
  mutaties: path.join(DATA_DIR, 'mutaties.json'),
  ringmaten: path.join(DATA_DIR, 'ringmaten.json'),
  split: path.join(DATA_DIR, 'split.json'),
  status: path.join(DATA_DIR, 'status.json'),
  contactvelden: path.join(DATA_DIR, 'contactvelden.json'),
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function sortOptionValues(values) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
  )
}

async function readOptionsFiles() {
  const pairs = await Promise.all(
    Object.entries(OPTION_FILES).map(async ([key, filePath]) => {
      const parsed = await readJsonFile(filePath, [])
      return [key, Array.isArray(parsed) ? parsed : []]
    }),
  )
  return Object.fromEntries(pairs)
}

async function writeOptionsFiles(optionsPayload) {
  await Promise.all(
    Object.entries(OPTION_FILES).map(async ([key, filePath]) => {
      const incoming = optionsPayload?.[key]
      const rows = Array.isArray(incoming)
        ? sortOptionValues(
            Array.from(new Set(incoming.map((value) => String(value ?? '').trim()).filter(Boolean))),
          )
        : []
      await writeJsonFile(filePath, rows)
    }),
  )
}

// Populate an empty mounted volume with the JSON files baked into the image.
async function seedDataDir() {
  if (!SEED_DIR) return
  await fs.mkdir(DATA_DIR, { recursive: true })
  const entries = await fs.readdir(SEED_DIR).catch(() => [])
  for (const name of entries) {
    if (!name.endsWith('.json')) continue
    const target = path.join(DATA_DIR, name)
    try {
      await fs.access(target)
    } catch {
      await fs.copyFile(path.join(SEED_DIR, name), target)
    }
  }
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 20_000_000) reject(new Error('Payload te groot.'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function handleApi(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' })
    return true
  }

  const isPost = req.method === 'POST'
  let parsed = null
  if (isPost) {
    try {
      parsed = JSON.parse((await readBody(req)) || '{}')
    } catch {
      sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
      return true
    }
  }

  if (pathname === '/api/state') {
    if (!isPost) {
      sendJson(res, 200, {
        birds: await readJsonFile(BIRDS_FILE, {}),
        couples: await readJsonFile(COUPLES_FILE, {}),
      })
      return true
    }
    await writeJsonFile(BIRDS_FILE, typeof parsed?.birds === 'object' && parsed.birds ? parsed.birds : {})
    await writeJsonFile(COUPLES_FILE, typeof parsed?.couples === 'object' && parsed.couples ? parsed.couples : {})
    sendJson(res, 200, { ok: true })
    return true
  }

  if (pathname === '/api/options') {
    if (!isPost) {
      sendJson(res, 200, { options: await readOptionsFiles() })
      return true
    }
    await writeOptionsFiles(parsed?.options)
    sendJson(res, 200, { ok: true })
    return true
  }

  if (pathname === '/api/contacts') {
    if (!isPost) {
      const contacts = await readJsonFile(CONTACTS_FILE, {})
      sendJson(res, 200, { contacts: contacts && typeof contacts === 'object' ? contacts : {} })
      return true
    }
    await writeJsonFile(CONTACTS_FILE, typeof parsed?.contacts === 'object' && parsed.contacts ? parsed.contacts : {})
    sendJson(res, 200, { ok: true })
    return true
  }

  return false
}

async function serveStatic(res, pathname) {
  const relative = path.normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '')
  let filePath = path.join(DIST_DIR, relative)

  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  let stat = await fs.stat(filePath).catch(() => null)
  if (!stat || stat.isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html')
    stat = await fs.stat(filePath).catch(() => null)
  }

  if (!stat) {
    res.statusCode = 404
    res.end('Not found')
    return
  }

  res.setHeader('Content-Type', MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream')
  res.end(await fs.readFile(filePath))
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost')
    if (pathname.startsWith('/api/') && (await handleApi(req, res, pathname))) return
    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { ok: false, error: 'Not found' })
      return
    }
    await serveStatic(res, pathname)
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('Internal server error')
    }
  }
})

await seedDataDir()
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Vogels webapp draait op http://localhost:${PORT} (data: ${DATA_DIR})`)
})
