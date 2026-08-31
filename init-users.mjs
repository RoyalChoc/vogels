/**
 * Init script: maakt de eerste admin-gebruiker aan.
 * Gebruik: node init-users.mjs
 */
import { randomBytes, scryptSync, randomUUID } from 'node:crypto'
import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const USERS_FILE = resolve(__dirname, 'users.json')

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function main() {
  let users = {}
  try {
    const raw = await readFile(USERS_FILE, 'utf8')
    users = JSON.parse(raw)
  } catch {
    users = {}
  }

  const existing = Object.values(users).find((u) => u.email === 'davy@royalchocolates.be')
  if (existing) {
    console.log('Gebruiker davy@royalchocolates.be bestaat al. Niets gewijzigd.')
    return
  }

  const id = randomUUID()
  users[id] = {
    id,
    voornaam: 'Davy',
    naam: 'Aerts',
    email: 'davy@royalchocolates.be',
    passwordHash: hashPassword('Davy123'),
    rol: 'admin',
    aangemaaktOp: new Date().toISOString(),
  }

  await writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, 'utf8')
  console.log('✓ Gebruiker Davy Aerts (davy@royalchocolates.be) aangemaakt als admin.')
  console.log('  Wachtwoord: Davy123 (gehashed opgeslagen in users.json)')
}

main().catch((err) => {
  console.error('Fout bij aanmaken gebruiker:', err)
  process.exit(1)
})
