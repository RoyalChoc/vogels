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
const MEDICATIONS_FILE = path.resolve(__dirname, '../medicaties.json')
const MEDIA_FILE = path.resolve(__dirname, '../media.json')
const MEDIA_DIRECTORY = path.resolve(__dirname, '../uploads')
const DEFAULT_DOSAGE_UNITS = ['mg', 'ml', 'druppel(s)', 'tablet(ten)', 'g', 'mg/kg']
const MAX_CERTIFICATE_SIZE = 20 * 1024 * 1024
const MAX_PHOTO_SIZE = 10 * 1024 * 1024
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
  medicijnen: path.resolve(__dirname, '../medicijnen.json'),
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

function getRequestBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function emptyMedicationsStore() {
  return {
    records: [],
    profielen: [],
    doseringEenheden: DEFAULT_DOSAGE_UNITS,
    instellingen: { reminderDagenVooraf: 7 },
  }
}

async function readMedicationsStore() {
  const store = await readJsonFile(MEDICATIONS_FILE, emptyMedicationsStore())
  const reminderDagenVooraf = Number(store?.instellingen?.reminderDagenVooraf)
  return {
    records: Array.isArray(store?.records) ? store.records : [],
    profielen: Array.isArray(store?.profielen) ? store.profielen : [],
    doseringEenheden: Array.isArray(store?.doseringEenheden) ? store.doseringEenheden : DEFAULT_DOSAGE_UNITS,
    instellingen: {
      reminderDagenVooraf: Number.isFinite(reminderDagenVooraf) && reminderDagenVooraf >= 0 ? reminderDagenVooraf : 7,
    },
  }
}

function emptyMediaStore() {
  return { birds: {}, archive: [], audit: [] }
}

async function readMediaStore() {
  const store = await readJsonFile(MEDIA_FILE, emptyMediaStore())
  return {
    birds: store?.birds && typeof store.birds === 'object' ? store.birds : {},
    archive: Array.isArray(store?.archive) ? store.archive : [],
    audit: Array.isArray(store?.audit) ? store.audit : [],
  }
}

function mediaForBird(store, birdKey) {
  const media = store.birds[birdKey]
  return {
    certificate: media?.certificate || null,
    photos: Array.isArray(media?.photos) ? media.photos : [],
  }
}

function addMediaAudit(store, user, action, birdKey, fileName = '') {
  store.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), userId: user.id, action, birdKey, fileName })
  store.audit = store.audit.slice(0, 5000)
}

function decodeHeader(value) {
  try {
    return decodeURIComponent(String(value || ''))
  } catch {
    return ''
  }
}

function safeFileName(name) {
  return path.basename(String(name || 'bestand')).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 140) || 'bestand'
}

function mediaExtension(fileName) {
  return path.extname(safeFileName(fileName)).toLowerCase()
}

function acceptedMedia(kind, fileName, contentType) {
  const extension = mediaExtension(fileName)
  if (kind === 'certificate') return extension === '.pdf' && contentType === 'application/pdf'
  return ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(extension)
    && /^image\/(jpeg|png|webp|heic|heif)$/i.test(contentType)
}

function findMediaFile(store, fileId) {
  for (const media of Object.values(store.birds)) {
    if (media?.certificate?.id === fileId) return media.certificate
    const photo = (media?.photos || []).find((item) => item.id === fileId)
    if (photo) return photo
  }
  for (const archive of store.archive) {
    if (archive.media?.certificate?.id === fileId) return archive.media.certificate
    const photo = (archive.media?.photos || []).find((item) => item.id === fileId)
    if (photo) return photo
  }
  return null
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

async function requireUser(req, res) {
  const user = await getSessionUser(req)
  if (!user) {
    sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
    return null
  }
  return user
}

function localDateParts(dateValue) {
  const [year, month, day] = String(dateValue || '').split('-').map(Number)
  return year && month && day ? { year, month, day } : null
}

function expectedDoseTimes(startDate, times, durationDays) {
  const dateParts = localDateParts(startDate)
  if (!dateParts) return []
  const result = []
  for (let offset = 0; offset < durationDays; offset += 1) {
    const date = new Date(dateParts.year, dateParts.month - 1, dateParts.day + offset)
    const dateText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    times.forEach((time) => result.push(`${dateText}T${time}`))
  }
  return result
}

function sanitizeNewUserMedication(record, profiles) {
  const profile = profiles.find((item) => item.id === record?.ProfielId && item.actief && item.isStandaard)
  const frequency = Number(profile?.frequentiePerDag)
  const duration = Number(profile?.duurDagen)
  const times = Array.isArray(record?.DagelijkseTijden) ? [...record.DagelijkseTijden].sort() : []
  if (!profile || !Number.isInteger(frequency) || frequency < 1 || !Number.isInteger(duration) || duration < 1) return null
  if (times.length !== frequency || new Set(times).size !== frequency || times.some((time) => !/^\d{2}:\d{2}$/.test(time))) return null

  const plannedTimes = expectedDoseTimes(record.DatumToediening, times, duration)
  if (plannedTimes.length !== frequency * duration) return null
  const incomingDoses = Array.isArray(record.Doses) ? record.Doses : []

  return {
    id: String(record.id || crypto.randomUUID()),
    VogelKey: String(record.VogelKey || ''),
    DatumToediening: String(record.DatumToediening || ''),
    Medicijnnaam: profile.medicijnnaam,
    Dosering: `${profile.doseringWaarde} ${profile.doseringEenheid}`.trim(),
    DoseringWaarde: profile.doseringWaarde,
    DoseringEenheid: profile.doseringEenheid,
    Toedieningswijze: profile.toedieningswijze,
    FrequentiePerDag: frequency,
    DuurDagen: duration,
    DagelijkseTijden: times,
    ProfielId: profile.id,
    ProfielSnapshot: { ...profile },
    RedenDiagnose: String(record.RedenDiagnose || ''),
    Dierenarts: String(record.Dierenarts || ''),
    DatumHercontrole: String(record.DatumHercontrole || ''),
    Afgerond: false,
    Opmerking: String(record.Opmerking || ''),
    Doses: plannedTimes.map((geplandOp, index) => ({
      id: String(incomingDoses[index]?.id || crypto.randomUUID()),
      geplandOp,
      toegediend: false,
      toegediendOp: '',
    })),
  }
}

function mergeUserMedicationRecords(currentRecords, incomingRecords, profiles) {
  const incomingById = new Map(incomingRecords.map((record) => [record.id, record]))
  const currentIds = new Set(currentRecords.map((record) => record.id))
  const merged = currentRecords.map((record) => {
    const incoming = incomingById.get(record.id)
    if (!incoming) return record
    const incomingDoses = new Map((incoming.Doses || []).map((dose) => [dose.id, dose]))
    return {
      ...record,
      Afgerond: Boolean(incoming.Afgerond),
      Doses: (record.Doses || []).map((dose) => {
        const changed = incomingDoses.get(dose.id)
        const plannedAt = new Date(dose.geplandOp)
        const canAdminister = !Number.isNaN(plannedAt.getTime()) && plannedAt.getTime() <= Date.now()
        if (!changed || (changed.toegediend && !canAdminister)) return dose
        return {
          ...dose,
          toegediend: Boolean(changed.toegediend),
          toegediendOp: changed.toegediend ? String(changed.toegediendOp || '') : '',
        }
      }),
    }
  })

  incomingRecords.forEach((record) => {
    if (currentIds.has(record.id)) return
    const sanitized = sanitizeNewUserMedication(record, profiles)
    if (sanitized?.VogelKey) merged.push(sanitized)
  })
  return merged
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

      server.middlewares.use('/api/medicaties', async (req, res) => {
        if (req.method === 'GET') {
          const medicaties = await readMedicationsStore()
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ medicaties }))
          return
        }

        if (req.method === 'POST') {
          const user = await requireUser(req, res)
          if (!user) return

          try {
            const bodyText = await getRequestBody(req)
            const parsed = JSON.parse(bodyText || '{}')
            const current = await readMedicationsStore()
            const incoming = parsed?.medicaties && typeof parsed.medicaties === 'object' ? parsed.medicaties : {}
            const incomingRecords = Array.isArray(incoming.records) ? incoming.records : []

            if (user.rol === 'admin') {
              const reminderDagenVooraf = Number(incoming?.instellingen?.reminderDagenVooraf)
              await writeJsonFile(MEDICATIONS_FILE, {
                records: incomingRecords,
                profielen: Array.isArray(incoming.profielen) ? incoming.profielen : current.profielen,
                doseringEenheden: Array.isArray(incoming.doseringEenheden)
                  ? dedupeAndSortOptionValues(incoming.doseringEenheden.map((value) => String(value || '').trim()).filter(Boolean))
                  : current.doseringEenheden,
                instellingen: {
                  reminderDagenVooraf: Number.isFinite(reminderDagenVooraf) && reminderDagenVooraf >= 0 ? reminderDagenVooraf : 7,
                },
              })
            } else {
              await writeJsonFile(MEDICATIONS_FILE, {
                ...current,
                records: mergeUserMedicationRecords(current.records, incomingRecords, current.profielen),
              })
            }

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

function mediaApiPlugin() {
  return {
    name: 'media-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/media', async (req, res) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost')
        const pathname = requestUrl.pathname
        const user = await getSessionUser(req)
        if (!user) {
          sendJson(res, 401, { ok: false, error: 'Niet aangemeld.' })
          return
        }

        if (req.method === 'GET' && pathname === '/') {
          const birdKey = requestUrl.searchParams.get('birdKey') || ''
          const store = await readMediaStore()
          sendJson(res, 200, { ok: true, media: mediaForBird(store, birdKey) })
          return
        }

        if (req.method === 'GET' && pathname === '/file') {
          const store = await readMediaStore()
          const file = findMediaFile(store, requestUrl.searchParams.get('id'))
          if (!file || file.url) {
            sendJson(res, 404, { ok: false, error: 'Bestand niet gevonden.' })
            return
          }
          try {
            const content = await fs.readFile(path.join(MEDIA_DIRECTORY, file.id))
            res.statusCode = 200
            res.setHeader('Content-Type', file.contentType)
            res.setHeader('Content-Disposition', `inline; filename="${safeFileName(file.name)}"`)
            res.end(content)
          } catch {
            sendJson(res, 404, { ok: false, error: 'Bestand niet gevonden.' })
          }
          return
        }

        if (['POST', 'DELETE'].includes(req.method || '') && user.rol !== 'admin') {
          sendJson(res, 403, { ok: false, error: 'Alleen beheerders kunnen media beheren.' })
          return
        }

        if (req.method === 'POST' && ['/certificate', '/photo'].includes(pathname)) {
          const kind = pathname === '/certificate' ? 'certificate' : 'photo'
          const birdKey = decodeHeader(req.headers['x-bird-key'])
          const fileName = safeFileName(decodeHeader(req.headers['x-file-name']))
          const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase()
          const content = await getRequestBuffer(req)
          const maxSize = kind === 'certificate' ? MAX_CERTIFICATE_SIZE : MAX_PHOTO_SIZE
          if (!birdKey || !acceptedMedia(kind, fileName, contentType) || content.length === 0 || content.length > maxSize) {
            sendJson(res, 400, { ok: false, error: kind === 'certificate' ? 'Kies een PDF tot 20 MB.' : 'Kies een geldige foto tot 10 MB.' })
            return
          }
          if (kind === 'certificate' && !content.subarray(0, 4).equals(Buffer.from('%PDF'))) {
            sendJson(res, 400, { ok: false, error: 'Het certificaat is geen geldige PDF.' })
            return
          }
          const store = await readMediaStore()
          const media = mediaForBird(store, birdKey)
          if (kind === 'photo' && media.photos.length >= 10) {
            sendJson(res, 400, { ok: false, error: 'Deze vogel heeft al 10 foto\'s.' })
            return
          }
          const fileId = `${crypto.randomUUID()}${mediaExtension(fileName)}`
          await fs.mkdir(MEDIA_DIRECTORY, { recursive: true })
          await fs.writeFile(path.join(MEDIA_DIRECTORY, fileId), content)
          const record = { id: fileId, name: fileName, contentType, size: content.length, uploadedAt: new Date().toISOString() }
          if (kind === 'certificate') media.certificate = record
          else media.photos.push(record)
          store.birds[birdKey] = media
          addMediaAudit(store, user, kind === 'certificate' ? 'certificate-uploaded' : 'photo-uploaded', birdKey, fileName)
          await writeJsonFile(MEDIA_FILE, store)
          sendJson(res, 201, { ok: true, media })
          return
        }

        if (req.method === 'POST' && pathname === '/certificate-link') {
          try {
            const { birdKey, url } = JSON.parse(await getRequestBody(req))
            const parsedUrl = new URL(String(url || ''))
            if (!birdKey || !['https:', 'http:'].includes(parsedUrl.protocol)) throw new Error('invalid')
            const store = await readMediaStore()
            const media = mediaForBird(store, birdKey)
            media.certificate = { id: crypto.randomUUID(), name: parsedUrl.hostname, url: parsedUrl.toString(), uploadedAt: new Date().toISOString() }
            store.birds[birdKey] = media
            addMediaAudit(store, user, 'certificate-linked', birdKey, parsedUrl.hostname)
            await writeJsonFile(MEDIA_FILE, store)
            sendJson(res, 200, { ok: true, media })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Gebruik een geldige http(s)-link.' })
          }
          return
        }

        if (req.method === 'POST' && pathname === '/rename') {
          try {
            const { fromBirdKey, toBirdKey } = JSON.parse(await getRequestBody(req))
            const store = await readMediaStore()
            if (fromBirdKey && toBirdKey && store.birds[fromBirdKey]) {
              store.birds[toBirdKey] = store.birds[fromBirdKey]
              delete store.birds[fromBirdKey]
              addMediaAudit(store, user, 'bird-renamed', toBirdKey)
              await writeJsonFile(MEDIA_FILE, store)
            }
            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Ongeldige hernoeming.' })
          }
          return
        }

        if (req.method === 'POST' && pathname === '/archive-bird') {
          try {
            const { birdKey, bird } = JSON.parse(await getRequestBody(req))
            const store = await readMediaStore()
            const media = mediaForBird(store, birdKey)
            if (birdKey && (media.certificate || media.photos.length > 0)) {
              store.archive.unshift({ id: crypto.randomUUID(), birdKey, bird, media, archivedAt: new Date().toISOString() })
              delete store.birds[birdKey]
              addMediaAudit(store, user, 'bird-archived', birdKey)
              await writeJsonFile(MEDIA_FILE, store)
            }
            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'Archiveren is mislukt.' })
          }
          return
        }

        if (req.method === 'DELETE' && pathname === '/file') {
          try {
            const { birdKey, kind, fileId } = JSON.parse(await getRequestBody(req))
            const store = await readMediaStore()
            const media = mediaForBird(store, birdKey)
            let removed = null
            if (kind === 'certificate' && media.certificate?.id === fileId) {
              removed = media.certificate
              media.certificate = null
            }
            if (kind === 'photo') {
              const index = media.photos.findIndex((photo) => photo.id === fileId)
              if (index >= 0) removed = media.photos.splice(index, 1)[0]
            }
            if (!removed) throw new Error('missing')
            if (!removed.url) await fs.rm(path.join(MEDIA_DIRECTORY, removed.id), { force: true })
            store.birds[birdKey] = media
            addMediaAudit(store, user, `${kind}-deleted`, birdKey, removed.name)
            await writeJsonFile(MEDIA_FILE, store)
            sendJson(res, 200, { ok: true, media })
          } catch {
            sendJson(res, 404, { ok: false, error: 'Bestand niet gevonden.' })
          }
          return
        }

        sendJson(res, 405, { ok: false, error: 'Method not allowed' })
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
  plugins: [react(), authApiPlugin(), stateApiPlugin(), mediaApiPlugin()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) {
            return 'pdf-vendor'
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('node_modules')) {
            return 'vendor'
          }

          return undefined
        },
      },
    },
  },
})
