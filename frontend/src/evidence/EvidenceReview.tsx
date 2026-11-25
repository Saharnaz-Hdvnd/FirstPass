import { useEffect, useRef } from 'react'
import { AssessmentMatch, evidenceRules, getEvidenceTotals, getRuleState, isSafeEvidenceUrl } from './rubric'
import { getDialogKeyAction, getFocusWrapIndex } from './dialogFocus'

export type EvidenceSubject = {
  heading: string
  vin?: string
  listingUrl?: string
  demo?: { score: number; reasons: string[] }
  live?: unknown
  price?: number
  mileage?: number
  match: AssessmentMatch
}

export function EvidenceButton({ subject, onOpen, compact = false }: {
  subject: EvidenceSubject
  onOpen: (subject: EvidenceSubject) => void
  compact?: boolean
}) {
  const live = readLiveAssessment(subject.live, subject)
  const label = subject.demo ? `${subject.demo.score}/100`
    : live?.score != null ? `${live.score}/100`
    : live ? 'Insufficient evidence' : 'Score unavailable'
  return <button className={`evidence-button${compact ? ' compact' : ''}`} type="button" aria-label={`Explain listing score: ${label}`} onClick={() => onOpen(subject)}>{label}</button>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'America/Denver' }).format(new Date(value))
}

function ReviewContent({ subject }: { subject: EvidenceSubject }) {
  if (subject.demo) return <>
    <h3>Why this score?</h3>
    <p style={{fontSize:'2rem', fontWeight:700, margin:'8px 0'}}>{subject.demo.score}/100</p>
    <ul style={{paddingLeft:20}}>{subject.demo.reasons.map(reason => <li style={{marginBottom:12}} key={reason}>{reason}</li>)}</ul>
    <p>Missing evidence is not proof of dishonesty.</p>
  </>

  const live = readLiveAssessment(subject.live, subject)
  if (!live) return <div className="evidence-empty"><h3>Score unavailable</h3><p>This result has no current evidence assessment. Connect the updated scoring backend and search again.</p></div>
  const conflicts = live.checks.filter(check => check.state === 'contradicted')
  const supported = live.checks.filter(check => check.state === 'supported')
  return <>
    <h3>Why this score?</h3>
    <p style={{fontSize:'2rem', fontWeight:700, margin:'8px 0'}}>{live.score == null ? 'Insufficient evidence' : `${live.score}/100`}</p>
    <p>{live.coverage}% of evidence weight checked. Unknown checks are excluded from the score.</p>
    {live.score == null && <p>Too little evidence has been verified to show a meaningful score.</p>}
    {live.alerts.map((alert, index) => <p key={index}>{alert.text}</p>)}
    {conflicts.length > 0 && <ul style={{paddingLeft:20}}>{conflicts.slice(0,4).map(check => <li key={check.id}>{check.reason}</li>)}</ul>}
    {supported.length > 0 && <p>{supported[0].reason}</p>}
    <p>Seller, history, mileage, condition, photos and transaction checks may still be incomplete. This is not a probability of honesty or safety.</p>
  </>
}

export function EvidenceDialog({ subject, onClose }: { subject: EvidenceSubject; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex]:not([tabindex="-1"])') ?? [])]
    focusable()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      const action = getDialogKeyAction(event.key)
      if (action === 'close') {
        event.preventDefault()
        onClose()
        return
      }
      if (action !== 'tab') return
      const items = focusable()
      if (!items.length) return
      const activeIndex = items.findIndex(item => item === document.activeElement)
      const targetIndex = getFocusWrapIndex(activeIndex, items.length, event.shiftKey)
      if (targetIndex !== null) {
        event.preventDefault()
        items[targetIndex].focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      previousFocus.current?.focus()
    }
  }, [onClose])

  const pilot = subject.match.status === 'unassessed' ? undefined : subject.match.pilot
  const listingUrl = pilot?.listingUrl ?? subject.listingUrl
  return <div className="evidence-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="evidence-dialog" role="dialog" aria-modal="true" aria-labelledby="evidence-title" ref={dialogRef}>
      <header className="evidence-dialog-head">
        <div><span>LISTING SCORE</span><h2 id="evidence-title">{subject.heading}</h2></div>
        <button type="button" onClick={onClose}>Close</button>
      </header>
      <div className="evidence-meta">
        {!subject.demo && <span><strong>VIN</strong> {subject.vin ?? pilot?.vin ?? 'Not provided'}</span>}
        {pilot && <span><strong>Checked</strong> {formatDate(pilot.assessedAtUtc)}</span>}
        {listingUrl && isSafeEvidenceUrl(listingUrl) && <a href={listingUrl} target="_blank" rel="noopener noreferrer">Original dealer listing</a>}
      </div>
      <div className="evidence-dialog-body"><ReviewContent subject={subject}/></div>
    </div>
  </div>
}



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
