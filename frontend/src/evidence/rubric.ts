export type EvidenceState = 'supported' | 'contradicted' | 'unknown'

export type EvidenceRule = {
  id: string
  name: string
  weight: number
  supportRequirement: string
  category: string
}

export type EvidenceSource = {
  id: string
  kind: string
  url: string
  capturedAtUtc: string
}

export type EvidenceAlert = {
  severity: 'review'
  primaryRule: string
  reason: string
}

export type PilotCase = {
  caseId: string
  vin: string
  heading: string
  listingUrl: string
  snapshotPrice: number
  snapshotMileage: number
  assessedAtUtc: string
  supportedIds: string[]
  contradictedIds: string[]
  findings: Record<string, string>
  alerts: EvidenceAlert[]
  sources: EvidenceSource[]
}

export const RUBRIC_VERSION = '0.1-development'
export const REVIEW_LABEL = 'AI-assisted desk-review pilot • Nov 23, 2026 • unvalidated weights'
export const EVIDENCE_DEFINITION = 'The extent to which available evidence supports a listing’s identity, material claims, disclosures, and proposed transaction.'

const categoryNames: Record<string, string> = {
  A: 'Identity and seller',
  B: 'History and disclosures',
  C: 'Mileage and listing claims',
  D: 'Condition and transaction records',
  E: 'Vehicle-specific media',
  F: 'Price and transaction process',
}

const rawRules: Array<[string, string, number, string]> = [
  ['A1', 'VIN/specification identity', 6, 'Applicable VIN validation and compatible independently decoded core specifications; decoder limitations respected.'],
  ['A2', 'Seller identity', 6, 'Independently matched contact/business identity, including applicable license check for a dealer.'],
  ['A3', 'Authority to sell', 5, 'Title-owner or documented authorized dealer/agent relationship, evaluated through an appropriate secure verification process.'],
  ['A4', 'Possession/location', 3, 'Current vehicle-specific evidence that connects this seller to the car and stated location.'],
  ['B1', 'Title/brand disclosure', 8, 'Relevant independent title/brand record agrees with an explicit disclosure, including any adverse brand.'],
  ['B2', 'Theft/total-loss/salvage disclosure', 6, 'Applicable checked records agree with disclosure, with query scope and date recorded.'],
  ['B3', 'Accident/structural/repair claims', 7, 'Available relevant history and inspection/repair evidence support material claims; a record with no event is not enough to prove “never damaged.”'],
  ['B4', 'Ownership/prior-use claims', 4, 'Evidence supports specific owner-count or prior-use claims and material disclosures.'],
  ['C1', 'Mileage timeline', 8, 'Current reading agrees with a sufficiently informative dated history after unit and timing reconciliation.'],
  ['C2', 'Current mileage agreement', 5, 'Structured field, description and a current odometer observation agree.'],
  ['C3', 'Equipment/specification claims', 4, 'Material trim/drivetrain/options claims agree with suitable evidence.'],
  ['C4', 'Cross-source/current-listing consistency', 3, 'Material current claims and availability agree across appropriately dated sources; duplicated origin identified.'],
  ['D1', 'Condition disclosure', 5, 'Relevant inspection/diagnostic evidence agrees with stated defects, repairs and present-condition claims.'],
  ['D2', 'Maintenance/repair claims', 4, 'Specific maintenance or repair claims have dated vehicle-linked supporting records.'],
  ['D3', 'Safety/recall disclosure', 3, 'Applicable current VIN-level checks and relevant repair evidence agree with safety-related claims.'],
  ['D4', 'Specialized condition claims', 3, 'Appropriate evidence supports EV battery, modification, certification or another applicable specialized claim.'],
  ['E1', 'Vehicle-specific media', 4, 'Media can be attributed to this vehicle and no unresolved mixed-vehicle or copied-identity discrepancy remains.'],
  ['E2', 'Relevant visual coverage', 3, 'A predeclared set of views covers the actual claims being assessed, including mileage and disclosed visible defects where relevant.'],
  ['E3', 'Media/description agreement', 3, 'Visible material details agree with the description; limitations of visual assessment recorded.'],
  ['F1', 'Price/terms transparency', 4, 'Written terms clarify actual purchase price, material conditions and required charges consistently with the advertisement.'],
  ['F2', 'Verification cooperation', 3, 'Observed response supports reasonable records/independent-inspection access or a credible documented alternative.'],
  ['F3', 'Transaction legitimacy', 3, 'Proposed payee, authority, payment/escrow and transfer process are independently verifiable and consistent.'],
]

export const evidenceRules: EvidenceRule[] = rawRules.map(([id, name, weight, supportRequirement]) => ({
  id,
  name,
  weight,
  supportRequirement,
  category: categoryNames[id[0]],
}))

export type EvidenceTotals = { supported: number; contradicted: number; unknown: number; coverage: number }

export function getEvidenceTotals(pilot: PilotCase): EvidenceTotals {
  return evidenceRules.reduce<EvidenceTotals>((totals, rule) => {
    if (pilot.supportedIds.includes(rule.id)) totals.supported += rule.weight
    else if (pilot.contradictedIds.includes(rule.id)) totals.contradicted += rule.weight
    else totals.unknown += rule.weight
    totals.coverage = totals.supported + totals.contradicted
    return totals
  }, { supported: 0, contradicted: 0, unknown: 0, coverage: 0 })
}

export function getRuleState(pilot: PilotCase, rule: EvidenceRule): EvidenceState {
  if (pilot.supportedIds.includes(rule.id)) return 'supported'
  if (pilot.contradictedIds.includes(rule.id)) return 'contradicted'
  return 'unknown'
}

const supportedScope: Record<string, string> = {
  A1: 'An official decoder supports compatible core identity only. This does not establish physical authenticity.',
  A2: 'Official DBA/license/address information matches and a registry contact was recorded. No call was made, and this does not prove authority to sell.',
  C1: 'The available dated mileage timeline is nondecreasing. This conclusion is limited to the available timeline.',
  E1: 'A readable matching VIN label and coherent vehicle images support vehicle-specific media. This does not establish possession or original authorship.',
  F1: 'The published price and disclosed handling/tax exclusions are supported. This is not a guaranteed final quote.',
}

export function getRuleReason(pilot: PilotCase, rule: EvidenceRule) {
  const state = getRuleState(pilot, rule)
  const finding = pilot.findings[rule.id]
  if (state === 'supported') return [supportedScope[rule.id], finding].filter(Boolean).join(' ')
  if (finding) return finding
  if (state === 'contradicted') return `Reviewed evidence conflicts with this check. ${rule.supportRequirement}`
  return `No reviewed evidence currently satisfies this check: ${rule.supportRequirement}`
}

export function getEarnedPoints(pilot: PilotCase, rule: EvidenceRule) {
  return getRuleState(pilot, rule) === 'supported' ? rule.weight : 0
}

export function isSafeEvidenceUrl(url: string) {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export function sourcesForRule(pilot: PilotCase, rule: EvidenceRule) {
  const kinds = rule.id === 'A1'
    ? ['official_vin_decode']
    : rule.id === 'A2'
      ? ['official_dealer_license']
      : rule.id.startsWith('B') || rule.id === 'C1'
        ? ['third_party_history_report']
        : ['seller_listing']
  return pilot.sources.filter(source => kinds.includes(source.kind) && isSafeEvidenceUrl(source.url))
}

export type AssessmentMatch =
  | { status: 'assessed'; pilot: PilotCase }
  | { status: 'stale'; pilot: PilotCase }
  | { status: 'unassessed' }

export function matchPilotAssessment(
  cases: PilotCase[],
  vehicle: { vin?: string; price: number; mileage: number; sample?: boolean },
): AssessmentMatch {
  if (vehicle.sample || !vehicle.vin) return { status: 'unassessed' }
  const pilot = cases.find(item => item.vin.toLocaleUpperCase() === vehicle.vin?.trim().toLocaleUpperCase())
  if (!pilot) return { status: 'unassessed' }
  if (pilot.snapshotPrice !== vehicle.price || pilot.snapshotMileage !== vehicle.mileage) return { status: 'stale', pilot }
  return { status: 'assessed', pilot }
}
