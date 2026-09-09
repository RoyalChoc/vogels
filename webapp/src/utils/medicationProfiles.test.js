import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDoseSchedule, createProfileTreatment, validateTreatmentInput } from './medicationProfiles.js'

const profile = {
  id: 'profile-1',
  medicijnnaam: 'Soludox',
  doseringWaarde: '0,5',
  doseringEenheid: 'ml',
  frequentiePerDag: 2,
  duurDagen: 3,
  toedieningswijze: 'Via drinkwater',
  actief: true,
  isStandaard: true,
}

test('validateTreatmentInput requires one distinct time per daily dose', () => {
  assert.match(validateTreatmentInput(profile, '2026-09-09', ['08:00']), /2 geldig/)
  assert.match(validateTreatmentInput(profile, '2026-09-09', ['08:00', '08:00']), /verschillende/)
  assert.equal(validateTreatmentInput(profile, '2026-09-09', ['08:00', '20:00']), '')
})

test('buildDoseSchedule creates every daily moment using local calendar dates', () => {
  let nextId = 0
  const doses = buildDoseSchedule('2026-12-31', ['20:00', '08:00'], 2, () => `dose-${++nextId}`)

  assert.deepEqual(doses.map((dose) => dose.geplandOp), [
    '2026-12-31T08:00',
    '2026-12-31T20:00',
    '2027-01-01T08:00',
    '2027-01-01T20:00',
  ])
})

test('createProfileTreatment stores a profile snapshot and generated doses', () => {
  const treatment = createProfileTreatment(profile, {
    VogelKey: 'bird-1',
    DatumToediening: '2026-09-09',
    dagelijkseTijden: ['20:00', '08:00'],
    Afgerond: false,
  }, () => 'dose-id')

  assert.equal(treatment.Dosering, '0,5 ml')
  assert.equal(treatment.Doses.length, 6)
  assert.notEqual(treatment.ProfielSnapshot, profile)
  assert.deepEqual(treatment.DagelijkseTijden, ['08:00', '20:00'])
})