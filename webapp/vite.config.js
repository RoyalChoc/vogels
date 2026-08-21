import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'

const BIRDS_FILE = path.resolve(__dirname, '../vogels.json')
const COUPLES_FILE = path.resolve(__dirname, '../koppels.json')

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
