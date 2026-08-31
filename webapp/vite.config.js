import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'

const BIRDS_FILE = path.resolve(__dirname, '../vogels.json')
const COUPLES_FILE = path.resolve(__dirname, '../koppels.json')
const CONTACTS_FILE = path.resolve(__dirname, '../contacts.json')
const OPTION_FILES = {
  factor: path.resolve(__dirname, '../factor.json'),
  geslacht: path.resolve(__dirname, '../geslacht.json'),
  gezoomd: path.resolve(__dirname, '../gezoomd.json'),
  herkomst: path.resolve(__dirname, '../herkomst.json'),
  jaren: path.resolve(__dirname, '../jaren.json'),
  kooien: path.resolve(__dirname, '../kooien.json'),
  mutaties: path.resolve(__dirname, '../mutaties.json'),
  ringmaten: path.resolve(__dirname, '../ringmaten.json'),
  split: path.resolve(__dirname, '../split.json'),
  status: path.resolve(__dirname, '../status.json'),
  contactvelden: path.resolve(__dirname, '../contactvelden.json'),
  vogelsoorten: path.resolve(__dirname, '../vogelsoorten.json'),
  monstertypes: path.resolve(__dirname, '../monstertypes.json'),
}

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
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

function sortOptionValues(values) {
  return [...values].sort((a, b) =>
    String(a).localeCompare(String(b), 'nl-BE', { numeric: true, sensitivity: 'base' }),
  )
}

function dedupeAndSortOptionValues(values) {
  return sortOptionValues(Array.from(new Set(values)))
}

async function writeOptionsFiles(optionsPayload) {
  await Promise.all(
    Object.entries(OPTION_FILES).map(async ([key, filePath]) => {
      const incoming = optionsPayload?.[key]
      const rows = Array.isArray(incoming)
        ? dedupeAndSortOptionValues(incoming.map((value) => String(value ?? '').trim()).filter(Boolean))
        : []

      await writeJsonFile(filePath, rows)
    }),
  )
}

function stateApiPlugin() {
  return {
    name: 'state-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/state', async (req, res) => {
        if (req.method === 'GET') {
          const birds = await readJsonFile(BIRDS_FILE, {})
          const couples = await readJsonFile(COUPLES_FILE, {})
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ birds, couples }))
          return
        }

        if (req.method === 'POST') {
          let body = ''

          req.on('data', (chunk) => {
            body += chunk
          })

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}')
              const birds = parsed?.birds && typeof parsed.birds === 'object' ? parsed.birds : {}
              const couples = parsed?.couples && typeof parsed.couples === 'object' ? parsed.couples : {}

              await writeJsonFile(BIRDS_FILE, birds)
              await writeJsonFile(COUPLES_FILE, couples)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: false, error: 'Ongeldige JSON payload.' }))
            }
          })

          req.on('error', () => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'Kon request body niet lezen.' }))
          })

          return
        }

        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      })

      server.middlewares.use('/api/options', async (req, res) => {
        if (req.method === 'GET') {
          const options = await readOptionsFiles()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ options }))
          return
        }

        if (req.method === 'POST') {
          let body = ''

          req.on('data', (chunk) => {
            body += chunk
          })

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}')
              await writeOptionsFiles(parsed?.options)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: false, error: 'Ongeldige JSON payload.' }))
            }
          })

          req.on('error', () => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'Kon request body niet lezen.' }))
          })

          return
        }

        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      })

      server.middlewares.use('/api/contacts', async (req, res) => {
        if (req.method === 'GET') {
          const contacts = await readJsonFile(CONTACTS_FILE, {})
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ contacts: contacts && typeof contacts === 'object' ? contacts : {} }))
          return
        }

        if (req.method === 'POST') {
          let body = ''

          req.on('data', (chunk) => {
            body += chunk
          })

          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}')
              const contacts = parsed?.contacts && typeof parsed.contacts === 'object' ? parsed.contacts : {}
              await writeJsonFile(CONTACTS_FILE, contacts)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: true }))
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ ok: false, error: 'Ongeldige JSON payload.' }))
            }
          })

          req.on('error', () => {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'Kon request body niet lezen.' }))
          })

          return
        }

        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stateApiPlugin()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
