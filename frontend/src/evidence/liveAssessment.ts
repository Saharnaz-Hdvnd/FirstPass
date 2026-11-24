import { evidenceRules } from './rubric.ts'

type Check = { id: string; weight: number; state: 'supported' | 'contradicted' | 'unknown'; reason: string }
export type LiveAssessment = { score: number | null; coverage: number; checks: Check[]; alerts: { text: string }[] }

export function readLiveAssessment(value: unknown, car: { vin?: string; price?: number; mileage?: number }): LiveAssessment | undefined {
  if (!value || typeof value !== 'object') return undefined
  const v = value as Record<string, unknown>
  if (v.schema_version !== 'firstpass.live_evidence.v1' || !car.vin || typeof v.vin !== 'string' || v.vin.toUpperCase() !== car.vin.toUpperCase() || v.price !== car.price || v.mileage !== car.mileage) return undefined
  if (typeof v.assessed_at_utc !== 'string') return undefined
  const age = Date.now() - Date.parse(v.assessed_at_utc)
  if (!Number.isFinite(age) || age < -300_000 || age > 7 * 86400_000 || !Array.isArray(v.checks) || v.checks.length !== evidenceRules.length) return undefined
  const checks: Check[] = []
  const seen = new Set<string>(); const categories = new Set<string>()
  let supported = 0; let contradicted = 0
  for (const raw of v.checks) {
    if (!raw || typeof raw !== 'object') return undefined
    const c = raw as Record<string, unknown>
    const rule = evidenceRules.find(rule => rule.id === c.id)
    if (!rule || seen.has(rule.id) || c.weight !== rule.weight || !['supported','contradicted','unknown'].includes(String(c.state)) || typeof c.reason !== 'string') return undefined
    seen.add(rule.id)
    const state = c.state as Check['state']
    if (state !== 'unknown') categories.add(rule.id[0])
    if (state === 'supported') supported += rule.weight
    if (state === 'contradicted') contradicted += rule.weight
    checks.push({id:rule.id,weight:rule.weight,state,reason:c.reason.slice(0,700)})
  }
  const coverage = supported + contradicted
  if (v.coverage !== coverage || v.supported !== supported || v.contradicted !== contradicted || v.unknown !== 100 - coverage) return undefined
  const expected = coverage ? Math.round(1000 * supported / coverage) / 10 : null
  let score: number | null = null
  if (v.score !== null) {
    if (typeof v.score !== 'number' || !Number.isFinite(v.score) || coverage < 50 || categories.size < 3 || expected === null || Math.abs(v.score - expected) > 0.11) return undefined
    score = v.score
  }
  const alerts = Array.isArray(v.alerts) ? v.alerts.filter(a => a && typeof a === 'object' && typeof a.text === 'string').map(a => ({text:String(a.text).slice(0,700)})) : []
  return {score,coverage,checks,alerts}
}
