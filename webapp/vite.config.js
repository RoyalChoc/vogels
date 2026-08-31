import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const BIRDS_FILE = path.resolve(__dirname, '../vogels.json')
const USERS_FILE = path.resolve(__dirname, '../users.json')
const SESSIONS_FILE = path.resolve(__dirname, '../sessions.json')
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

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored || '').split(':')
    const derived = crypto.scryptSync(password, salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'))
  } catch {
    return false
  }
}

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', () => resolve(''))
  })
}

function extractBearerToken(req) {
  const auth = req.headers['authorization'] || ''
  const match = /^Bearer\s+(.+)$/i.exec(auth)
  return match ? match[1].trim() : null
}

async function getSessionUser(req) {
  const token = extractBearerToken(req)
  if (!token) return null
  const sessions = await readJsonFile(SESSIONS_FILE, {})
  const session = sessions[token]
  if (!session) return null
  if (session.expiresAt && Date.now() > session.expiresAt) return null
  const users = await readJsonFile(USERS_FILE, {})
  return users[session.userId] ?? null
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

async function requireAdmin(req, res) {
  const user = await getSessionUser(req)
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
    return null
  }
  if (user.rol !== 'admin') {
    sendJson(res, 403, { ok: false, error: 'Geen toegang. Beheerder vereist.' })
    return null
  }
  return user
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
          const user = await requireAdmin(req, res)
          if (!user) return

          try {
            const bodyText = await getRequestBody(req)
            const parsed = JSON.parse(bodyText || '{}')
            const birds = parsed?.birds && typeof parsed.birds === 'object' ? parsed.birds : {}
            const couples = parsed?.couples && typeof parsed.couples === 'object' ? parsed.couples : {}

            await writeJsonFile(BIRDS_FILE, birds)
            await writeJsonFile(COUPLES_FILE, couples)

            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
          }
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
          const user = await requireAdmin(req, res)
          if (!user) return

          try {
            const bodyText = await getRequestBody(req)
            const parsed = JSON.parse(bodyText || '{}')
            await writeOptionsFiles(parsed?.options)

            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
          }
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
          const user = await requireAdmin(req, res)
          if (!user) return

          try {
            const bodyText = await getRequestBody(req)
            const parsed = JSON.parse(bodyText || '{}')
            const contacts = parsed?.contacts && typeof parsed.contacts === 'object' ? parsed.contacts : {}
            await writeJsonFile(CONTACTS_FILE, contacts)

            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
          }
          return
        }

        res.statusCode = 405
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
      })
    },
  }
}

function authApiPlugin() {
  return {
    name: 'auth-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/auth/login', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        try {
          const bodyText = await getRequestBody(req)
          const { email, password } = JSON.parse(bodyText || '{}')
          if (!email || !password) {
            sendJson(res, 400, { ok: false, error: 'E-mail en wachtwoord zijn verplicht.' })
            return
          }
          const users = await readJsonFile(USERS_FILE, {})
          const user = Object.values(users).find((u) => u.email === String(email).trim().toLowerCase())
          if (!user || !verifyPassword(String(password), user.passwordHash)) {
            sendJson(res, 401, { ok: false, error: 'Ongeldige inloggegevens.' })
            return
          }
          const token = crypto.randomBytes(32).toString('hex')
          const sessions = await readJsonFile(SESSIONS_FILE, {})
          sessions[token] = {
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + 8 * 60 * 60 * 1000,
          }
          await writeJsonFile(SESSIONS_FILE, sessions)
          sendJson(res, 200, {
            ok: true,
            token,
            user: { id: user.id, voornaam: user.voornaam, naam: user.naam, email: user.email, rol: user.rol },
          })
        } catch {
          sendJson(res, 500, { ok: false, error: 'Server fout.' })
        }
      })

      server.middlewares.use('/api/auth/logout', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        try {
          const token = extractBearerToken(req)
          if (token) {
            const sessions = await readJsonFile(SESSIONS_FILE, {})
            delete sessions[token]
            await writeJsonFile(SESSIONS_FILE, sessions)
          }
          sendJson(res, 200, { ok: true })
        } catch {
          sendJson(res, 500, { ok: false, error: 'Server fout.' })
        }
      })

      server.middlewares.use('/api/auth/me', async (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        try {
          const user = await getSessionUser(req)
          if (!user) {
            sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
            return
          }
          sendJson(res, 200, {
            ok: true,
            user: { id: user.id, voornaam: user.voornaam, naam: user.naam, email: user.email, rol: user.rol },
          })
        } catch {
          sendJson(res, 500, { ok: false, error: 'Server fout.' })
        }
      })

      server.middlewares.use('/api/auth/profile', async (req, res) => {
        if (req.method !== 'PUT') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        try {
          const user = await getSessionUser(req)
          if (!user) {
            sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
            return
          }
          const bodyText = await getRequestBody(req)
          const { voornaam, naam, email } = JSON.parse(bodyText || '{}')
          if (!voornaam || !naam || !email) {
            sendJson(res, 400, { ok: false, error: 'Voornaam, naam en e-mail zijn verplicht.' })
            return
          }
          const users = await readJsonFile(USERS_FILE, {})
          const emailNorm = String(email).trim().toLowerCase()
          const emailTaken = Object.values(users).some((u) => u.email === emailNorm && u.id !== user.id)
          if (emailTaken) {
            sendJson(res, 409, { ok: false, error: 'Dit e-mailadres is al in gebruik.' })
            return
          }
          users[user.id] = {
            ...users[user.id],
            voornaam: String(voornaam).trim(),
            naam: String(naam).trim(),
            email: emailNorm,
          }
          await writeJsonFile(USERS_FILE, users)
          const updated = users[user.id]
          sendJson(res, 200, {
            ok: true,
            user: { id: updated.id, voornaam: updated.voornaam, naam: updated.naam, email: updated.email, rol: updated.rol },
          })
        } catch {
          sendJson(res, 500, { ok: false, error: 'Server fout.' })
        }
      })

      server.middlewares.use('/api/auth/password', async (req, res) => {
        if (req.method !== 'PUT') {
          sendJson(res, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        try {
          const user = await getSessionUser(req)
          if (!user) {
            sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
            return
          }
          const bodyText = await getRequestBody(req)
          const { currentPassword, newPassword } = JSON.parse(bodyText || '{}')
          if (!currentPassword || !newPassword) {
            sendJson(res, 400, { ok: false, error: 'Huidig en nieuw wachtwoord zijn verplicht.' })
            return
          }
          if (!verifyPassword(String(currentPassword), user.passwordHash)) {
            sendJson(res, 401, { ok: false, error: 'Huidig wachtwoord is incorrect.' })
            return
          }
          if (String(newPassword).length < 6) {
            sendJson(res, 400, { ok: false, error: 'Nieuw wachtwoord moet minimaal 6 tekens bevatten.' })
            return
          }
          const users = await readJsonFile(USERS_FILE, {})
          users[user.id] = { ...users[user.id], passwordHash: hashPassword(String(newPassword)) }
          await writeJsonFile(USERS_FILE, users)
          sendJson(res, 200, { ok: true })
        } catch {
          sendJson(res, 500, { ok: false, error: 'Server fout.' })
        }
      })

      server.middlewares.use('/api/auth/users', async (req, res) => {
        if (req.method === 'GET') {
          const admin = await requireAdmin(req, res)
          if (!admin) return
          const users = await readJsonFile(USERS_FILE, {})
          const list = Object.values(users)
            .map((u) => ({ id: u.id, voornaam: u.voornaam, naam: u.naam, email: u.email, rol: u.rol }))
            .sort((a, b) =>
              `${a.voornaam} ${a.naam}`.localeCompare(`${b.voornaam} ${b.naam}`, 'nl-BE', { sensitivity: 'base' }),
            )
          sendJson(res, 200, { ok: true, users: list })
          return
        }

        if (req.method === 'PUT') {
          const admin = await requireAdmin(req, res)
          if (!admin) return
          try {
            const bodyText = await getRequestBody(req)
            const { userId, rol } = JSON.parse(bodyText || '{}')
            if (!userId || !['admin', 'user'].includes(rol)) {
              sendJson(res, 400, { ok: false, error: 'Ongeldige gebruiker of rol.' })
              return
            }
            if (userId === admin.id) {
              sendJson(res, 400, { ok: false, error: 'Je kan je eigen rol niet wijzigen.' })
              return
            }
            const users = await readJsonFile(USERS_FILE, {})
            if (!users[userId]) {
              sendJson(res, 404, { ok: false, error: 'Gebruiker niet gevonden.' })
              return
            }
            users[userId] = { ...users[userId], rol }
            await writeJsonFile(USERS_FILE, users)
            const updated = users[userId]
            sendJson(res, 200, {
              ok: true,
              user: { id: updated.id, voornaam: updated.voornaam, naam: updated.naam, email: updated.email, rol: updated.rol },
            })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
          }
          return
        }

        if (req.method === 'POST') {
          const admin = await requireAdmin(req, res)
          if (!admin) return
          try {
            const bodyText = await getRequestBody(req)
            const { voornaam, naam, email, password, rol } = JSON.parse(bodyText || '{}')
            if (!voornaam || !naam || !email || !password) {
              sendJson(res, 400, { ok: false, error: 'Voornaam, naam, e-mail en wachtwoord zijn verplicht.' })
              return
            }
            if (String(password).length < 6) {
              sendJson(res, 400, { ok: false, error: 'Wachtwoord moet minimaal 6 tekens bevatten.' })
              return
            }
            const finalRol = rol === 'admin' ? 'admin' : 'user'
            const emailNorm = String(email).trim().toLowerCase()
            const users = await readJsonFile(USERS_FILE, {})
            const emailTaken = Object.values(users).some((u) => u.email === emailNorm)
            if (emailTaken) {
              sendJson(res, 409, { ok: false, error: 'Dit e-mailadres is al in gebruik.' })
              return
            }
            const id = crypto.randomUUID()
            users[id] = {
              id,
              voornaam: String(voornaam).trim(),
              naam: String(naam).trim(),
              email: emailNorm,
              passwordHash: hashPassword(String(password)),
              rol: finalRol,
              aangemaaktOp: new Date().toISOString(),
            }
            await writeJsonFile(USERS_FILE, users)
            const created = users[id]
            sendJson(res, 201, {
              ok: true,
              user: { id: created.id, voornaam: created.voornaam, naam: created.naam, email: created.email, rol: created.rol },
            })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige JSON payload.' })
          }
          return
        }

        sendJson(res, 405, { ok: false, error: 'Method not allowed' })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), authApiPlugin(), stateApiPlugin()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
