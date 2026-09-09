export const ADMINISTRATION_METHODS = [
  'Via drinkwater',
  'Via voer',
  'Rechtstreeks in de bek',
  'Injectie',
]

export const DEFAULT_DOSAGE_UNITS = ['mg', 'ml', 'druppel(s)', 'tablet(ten)', 'g', 'mg/kg']

export function createMedicationId(prefix = 'med') {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function todayDateInputValue(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function medicationProfileLabel(profile) {
  if (!profile) return ''
  return [
    profile.medicijnnaam,
    `${profile.doseringWaarde} ${profile.doseringEenheid}`.trim(),
    `${profile.frequentiePerDag}x/dag`,
    `${profile.duurDagen} dag(en)`,
    profile.toedieningswijze,
  ].filter(Boolean).join(' · ')
}

export function activeDefaultProfiles(profiles) {
  return (profiles || []).filter((profile) => profile.actief && profile.isStandaard)
}

export function validateTreatmentInput(profile, startDate, times) {
  if (!profile) return 'Kies een medicijn met een actief standaardprofiel.'
  if (!startDate) return 'Kies een startdatum.'
  if (!Number.isInteger(profile.frequentiePerDag) || profile.frequentiePerDag < 1) {
    return 'Het behandelprofiel heeft geen geldige frequentie.'
  }
  if (!Number.isInteger(profile.duurDagen) || profile.duurDagen < 1) {
    return 'Het behandelprofiel heeft geen geldige duur.'
  }
  if (!Array.isArray(times) || times.length !== profile.frequentiePerDag || times.some((time) => !/^\d{2}:\d{2}$/.test(time))) {
    return `Kies ${profile.frequentiePerDag} geldig(e) tijdstip(pen).`
  }
  if (new Set(times).size !== times.length) return 'Kies verschillende tijdstippen.'
  return ''
}

export function buildDoseSchedule(startDate, times, durationDays, idFactory = () => createMedicationId('dose')) {
  const [year, month, day] = String(startDate).split('-').map(Number)
  if (!year || !month || !day || !Number.isInteger(durationDays) || durationDays < 1) return []

  const sortedTimes = [...times].sort()
  const doses = []
  for (let dayOffset = 0; dayOffset < durationDays; dayOffset += 1) {
    const date = new Date(year, month - 1, day + dayOffset)
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')

    sortedTimes.forEach((time) => {
      doses.push({
        id: idFactory(),
        geplandOp: `${datePart}T${time}`,
        toegediend: false,
        toegediendOp: '',
      })
    })
  }
  return doses
}

export function createProfileTreatment(profile, input, idFactory) {
  const { dagelijkseTijden, ...recordInput } = input
  const times = [...dagelijkseTijden].sort()
  return {
    ...recordInput,
    Medicijnnaam: profile.medicijnnaam,
    Dosering: `${profile.doseringWaarde} ${profile.doseringEenheid}`.trim(),
    DoseringWaarde: profile.doseringWaarde,
    DoseringEenheid: profile.doseringEenheid,
    Toedieningswijze: profile.toedieningswijze,
    FrequentiePerDag: profile.frequentiePerDag,
    DuurDagen: profile.duurDagen,
    DagelijkseTijden: times,
    ProfielId: profile.id,
    ProfielSnapshot: { ...profile },
    Doses: buildDoseSchedule(input.DatumToediening, times, profile.duurDagen, idFactory),
  }
}

export function isDoseDue(dose, now = new Date()) {
  if (!dose || dose.toegediend || !dose.geplandOp) return false
  const dueAt = new Date(dose.geplandOp)
  return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() <= now.getTime()
}