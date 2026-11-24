import assert from 'node:assert/strict'
import { readLiveAssessment } from '../src/evidence/liveAssessment.ts'
import { evidenceRules } from '../src/evidence/rubric.ts'
const car={vin:'3CZRZ2H51RM731100',price:25000,mileage:30000}
const checks=evidenceRules.map(r=>({id:r.id,weight:r.weight,state:'unknown',reason:'fixture'}))
checks[0].state='supported'
const base={schema_version:'firstpass.live_evidence.v1',...car,assessed_at_utc:new Date().toISOString(),checks,score:null,supported:6,contradicted:0,unknown:94,coverage:6,alerts:[]}
assert.equal(readLiveAssessment(base,car)?.score,null)
assert.equal(readLiveAssessment(base,car)?.coverage,6)
assert.equal(readLiveAssessment({...base,score:100},car),undefined)
assert.equal(readLiveAssessment(base,{...car,mileage:30001}),undefined)
assert.equal(readLiveAssessment(base,{...car,vin:'different'}),undefined)
assert.equal(readLiveAssessment({...base,assessed_at_utc:'2020-01-01T00:00:00Z'},car),undefined)
const support=['A1','A2','A4','B1','B2','B3','B4'];const contra=['A3','D1']
const enough={...base,checks:evidenceRules.map(r=>({id:r.id,weight:r.weight,state:support.includes(r.id)?'supported':contra.includes(r.id)?'contradicted':'unknown',reason:'fixture'})),supported:40,contradicted:10,unknown:50,coverage:50,score:80}
assert.equal(readLiveAssessment(enough,car)?.score,80)
assert.equal(readLiveAssessment({...enough,score:40},car),undefined)
assert.equal(readLiveAssessment({...base,checks:checks.map(()=>checks[0])},car),undefined)
console.log('Live score mapping, unknown exclusion, coverage gate, integrity and stale checks passed.')
