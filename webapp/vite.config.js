import { defineConfig, loadEnv } from 'vite'
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
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
  }
})
