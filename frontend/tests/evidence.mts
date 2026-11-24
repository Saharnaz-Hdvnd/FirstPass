import assert from 'node:assert/strict'
import { getDialogKeyAction, getFocusWrapIndex } from '../src/evidence/dialogFocus.ts'
import { pilotCases } from '../src/evidence/pilotData.ts'
import {
  evidenceRules,
  getEvidenceTotals,
  getRuleState,
  isSafeEvidenceUrl,
  matchPilotAssessment,
} from '../src/evidence/rubric.ts'

assert.equal(evidenceRules.length, 22)
assert.equal(evidenceRules.reduce((total, rule) => total + rule.weight, 0), 100)

for (const pilot of pilotCases) {
  const totals = getEvidenceTotals(pilot)
  assert.equal(totals.supported + totals.contradicted + totals.unknown, 100)
  assert.equal(totals.coverage, totals.supported + totals.contradicted)
}
assert.deepEqual(getEvidenceTotals(pilotCases[0]), { supported: 24, contradicted: 0, unknown: 76, coverage: 24 })

const contradictedPilot = { ...pilotCases[0], supportedIds: [], contradictedIds: ['A1'] }
assert.deepEqual(getEvidenceTotals(contradictedPilot), { supported: 0, contradicted: 6, unknown: 94, coverage: 6 })
assert.equal(getRuleState(contradictedPilot, evidenceRules[0]), 'contradicted')
assert.equal(getRuleState(contradictedPilot, evidenceRules[1]), 'unknown')

const first = pilotCases[0]
assert.equal(matchPilotAssessment(pilotCases, {
  vin: first.vin.toLocaleLowerCase(),
  price: first.snapshotPrice,
  mileage: first.snapshotMileage,
}).status, 'assessed', 'exact VIN, price, and mileage use the cached pilot')
assert.equal(matchPilotAssessment(pilotCases, {
  vin: first.vin,
  price: first.snapshotPrice + 1,
  mileage: first.snapshotMileage,
}).status, 'stale', 'material price mismatch makes the cached review stale')
assert.equal(matchPilotAssessment(pilotCases, {
  vin: first.vin,
  price: first.snapshotPrice,
  mileage: first.snapshotMileage + 1,
}).status, 'stale', 'material mileage mismatch makes the cached review stale')
assert.equal(matchPilotAssessment(pilotCases, {
  vin: first.vin,
  price: first.snapshotPrice,
  mileage: first.snapshotMileage,
  sample: true,
}).status, 'unassessed', 'sample listings never inherit pilot findings')
assert.equal(matchPilotAssessment(pilotCases, {
  vin: 'UNMAPPED',
  price: first.snapshotPrice,
  mileage: first.snapshotMileage,
}).status, 'unassessed')

assert.equal(isSafeEvidenceUrl('https://example.com/report'), true)
assert.equal(isSafeEvidenceUrl('http://example.com/report'), false)
assert.equal(isSafeEvidenceUrl('javascript:alert(1)'), false)
assert.equal(isSafeEvidenceUrl('/private/local-record'), false)

assert.equal(getDialogKeyAction('Escape'), 'close')
assert.equal(getDialogKeyAction('Tab'), 'tab')
assert.equal(getDialogKeyAction('Enter'), 'none')
assert.equal(getFocusWrapIndex(2, 3, false), 0, 'Tab wraps from last to first')
assert.equal(getFocusWrapIndex(0, 3, true), 2, 'Shift+Tab wraps from first to last')
assert.equal(getFocusWrapIndex(1, 3, false), null, 'focus remains in normal document order within the drawer')

console.log('Evidence totals, matching, URL safety, and dialog keyboard checks passed.')
