import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDescendantsCoupleTree, buildAncestorCoupleRows } from './pedigree.js'

function makeBirds(list) {
  const birds = {}
  list.forEach((bird, index) => { birds[`key-${index}`] = bird })
  return birds
}

test('buildDescendantsCoupleTree pairs each child with its own partner on the next level', () => {
  const birds = makeBirds([
    { Stamnummer: '1', Ringnummer: 'A', Geslacht: 'man' },
    { Stamnummer: '2', Ringnummer: 'B', Geslacht: 'pop' },
    { Stamnummer: '3', Ringnummer: 'C', Geslacht: 'man', Vader: '1 - A', Moeder: '2 - B' },
    { Stamnummer: '4', Ringnummer: 'D', Geslacht: 'pop' },
    { Stamnummer: '5', Ringnummer: 'E', Geslacht: 'pop', Vader: '3 - C', Moeder: '4 - D' },
  ])

  const tree = buildDescendantsCoupleTree(birds, birds['key-0'])

  assert.equal(tree.subject.name, '1 - A')
  assert.equal(tree.partner.name, '2 - B')
  assert.equal(tree.children.length, 1)
  assert.equal(tree.children[0].subject.name, '3 - C')
  assert.equal(tree.children[0].partner.name, '4 - D')
  assert.equal(tree.children[0].children[0].subject.name, '5 - E')
  assert.equal(tree.children[0].children[0].partner, null)
})

test('buildAncestorCoupleRows returns rows oldest-first with a link to the child row', () => {
  const birds = makeBirds([
    { Stamnummer: '1', Ringnummer: 'A', Geslacht: 'man', Vader: '2 - B', Moeder: '3 - C' },
    { Stamnummer: '2', Ringnummer: 'B', Geslacht: 'man' },
    { Stamnummer: '3', Ringnummer: 'C', Geslacht: 'pop' },
  ])

  const rows = buildAncestorCoupleRows(birds, birds['key-0'], 4)

  assert.equal(rows.length, 2)
  assert.deepEqual(rows[0].map((entry) => entry.node.name).sort(), ['2 - B', '3 - C'])
  assert.equal(rows[1][0].node.name, '1 - A')
  const childId = rows[1][0].id
  rows[0].forEach((entry) => assert.equal(entry.childId, childId))
})
