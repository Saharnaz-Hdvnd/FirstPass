import assert from 'node:assert/strict'
import {
  clearCatalogCache,
  getCatalogValues,
  searchSession,
  setAppLoginTokenProvider,
} from '../src/services/api.ts'
import {
  CATALOG_PARENT_DEBOUNCE_MS,
  createRequestTracker,
  nextVehicleImageIndex,
  normalizeVehicleImages,
  scheduleCatalogLoad,
  updateCatalogSelection,
} from '../src/vehicle-utils.ts'

setAppLoginTokenProvider(async () => 'mock-login-token')

const originalFetch = globalThis.fetch
let calls: URL[] = []

globalThis.fetch = (async (input, init) => {
  const url = new URL(String(input))
  calls.push(url)
  assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer mock-login-token')
  assert.equal((init?.headers as Record<string, string>)['X-Conversation-Token'], undefined)
  assert.equal((init?.headers as Record<string, string>)['ngrok-skip-browser-warning'], 'true')
  const offset = Number(url.searchParams.get('offset'))
  const values = Array.from({ length: offset === 0 ? 100 : 37 }, (_, index) => `Make ${offset + index}`)
  return new Response(JSON.stringify({
    field: 'make',
    values,
    next_offset: offset === 0 ? 100 : null,
    source: 'marketcheck_taxonomy',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}) as typeof fetch

clearCatalogCache()
const [first, shared] = await Promise.all([getCatalogValues('make'), getCatalogValues('make')])
assert.equal(first.length, 137, 'loads all pages instead of stopping at 100')
assert.deepEqual(shared, first, 'deduplicates an in-flight catalog load')
assert.equal(calls.length, 2, 'one two-page request serves concurrent consumers')
await getCatalogValues('make')
assert.equal(calls.length, 2, 'completed catalog is cached in memory')

let selection = { make: 'Toyota', model: 'RAV4', trim: 'XLE' }
selection = updateCatalogSelection(selection, 'make', 'Honda')
assert.deepEqual(selection, { make: 'Honda', model: '', trim: '' }, 'make clears model and trim')
selection = updateCatalogSelection({ make: 'Honda', model: 'CR-V', trim: 'EX' }, 'model', 'Pilot')
assert.deepEqual(selection, { make: 'Honda', model: 'Pilot', trim: '' }, 'model clears trim')
assert.deepEqual(updateCatalogSelection(selection, 'make', ''), { make: '', model: '', trim: '' }, 'empty values support broad search/reset')

const tracker = createRequestTracker()
const oldRequest = tracker.next()
const currentRequest = tracker.next()
assert.equal(tracker.isCurrent(oldRequest), false, 'a response from an old parent selection is stale')
assert.equal(tracker.isCurrent(currentRequest), true, 'only the latest catalog response may update suggestions')
tracker.invalidate()
assert.equal(tracker.isCurrent(currentRequest), false, 'disconnect invalidates an outstanding catalog response')

let scheduledCalls = 0
const cancelScheduledLoad = scheduleCatalogLoad(() => { scheduledCalls += 1 }, CATALOG_PARENT_DEBOUNCE_MS)
cancelScheduledLoad()
await new Promise(resolve => setTimeout(resolve, CATALOG_PARENT_DEBOUNCE_MS + 25))
assert.equal(scheduledCalls, 0, 'parent-driven catalog timer is canceled on cleanup')
assert.ok(CATALOG_PARENT_DEBOUNCE_MS >= 400 && CATALOG_PARENT_DEBOUNCE_MS <= 500, 'parent catalog debounce is 400–500 ms')

const photos = normalizeVehicleImages(
  'https://dealer.example/primary.jpg',
  ['http://unsafe.example/car.jpg', 'https://dealer.example/primary.jpg', 'https://dealer.example/fallback.jpg'],
)
assert.deepEqual(photos, ['https://dealer.example/primary.jpg', 'https://dealer.example/fallback.jpg'], 'keeps unique HTTPS dealer photos')
assert.equal(nextVehicleImageIndex(0, photos.length), 1, 'image error advances to fallback')
assert.equal(nextVehicleImageIndex(1, photos.length), 2, 'final image error reaches unavailable state')

globalThis.fetch = (async () => new Response('unavailable', { status: 503 })) as typeof fetch
clearCatalogCache()
await assert.rejects(getCatalogValues('make'), /backend request failed/)

globalThis.fetch = (async () => new Response(JSON.stringify({
  detail: 'MarketCheck inventory request failed: upstream gateway timeout.',
}), {
  status: 502,
  headers: { 'Content-Type': 'application/json' },
})) as typeof fetch
clearCatalogCache()
await assert.rejects(
  getCatalogValues('make'),
  (error: unknown) => error instanceof Error && error.message === 'MarketCheck inventory request failed: upstream gateway timeout.',
  'uses a backend JSON detail for a MarketCheck 502',
)

globalThis.fetch = (async () => new Response('<html>proxy failure</html>', {
  status: 503,
  headers: { 'Content-Type': 'text/html' },
})) as typeof fetch
clearCatalogCache()
await assert.rejects(
  getCatalogValues('make'),
  (error: unknown) => error instanceof Error && error.message === 'The backend request failed. Try again later.',
  'uses a neutral message and does not display a non-JSON 5xx body',
)

for (const invalidOffset of [0, 1.5, Number.POSITIVE_INFINITY]) {
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      field: 'make',
      values: ['Invalid offset'],
      next_offset: invalidOffset,
      source: 'marketcheck_taxonomy',
    }),
  })) as typeof fetch
  clearCatalogCache()
  await assert.rejects(getCatalogValues('make'), /could not finish loading/, `rejects invalid next_offset ${invalidOffset}`)
}

type DeferredResponse = { resolve: (response: Response) => void; promise: Promise<Response> }
function deferredResponse(): DeferredResponse {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>(done => { resolve = done })
  return { resolve, promise }
}
function catalogResponse(value: string) {
  return new Response(JSON.stringify({
    field: 'make',
    values: [value],
    next_offset: null,
    source: 'marketcheck_taxonomy',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const oldResponse = deferredResponse()
const newResponse = deferredResponse()
let deferredCall = 0
globalThis.fetch = (async () => {
  deferredCall += 1
  return deferredCall === 1 ? oldResponse.promise : newResponse.promise
}) as typeof fetch
clearCatalogCache()
const oldLoad = getCatalogValues('make')
clearCatalogCache()
const newLoad = getCatalogValues('make')
oldResponse.resolve(catalogResponse('Old result'))
assert.deepEqual(await oldLoad, ['Old result'])
assert.equal(getCatalogValues('make'), newLoad, 'old completion cannot remove a newer in-flight promise')
newResponse.resolve(catalogResponse('New result'))
assert.deepEqual(await newLoad, ['New result'])
assert.deepEqual(await getCatalogValues('make'), ['New result'], 'cleared in-flight load cannot repopulate the cache')
assert.equal(deferredCall, 2)

let submittedBody: Record<string, unknown> | undefined
globalThis.fetch = (async (_input, init) => {
  submittedBody = JSON.parse(String(init?.body))
  return new Response(JSON.stringify({ session_id: 'session', context_version: 1, exact: [], near: [], warnings: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}) as typeof fetch
await searchSession({ sessionId: 'session', sessionToken: 'conversation', expiresInSeconds: 300 }, {
  zip_code: '98101',
  radius: 50,
  make: '',
  model: '',
  trim: '',
  year_min: 0,
  year_max: 0,
  mileage_min: 0,
  mileage_max: 0,
  price_min: 0,
  price_max: 0,
  tol_price: 2000,
  tol_miles: 5000,
  tol_radius: 25,
  max_owners: null,
})
assert.equal(submittedBody?.make, '')
assert.equal(submittedBody?.model, '')
assert.equal(submittedBody?.trim, '')

globalThis.fetch = originalFetch
console.log('Mocked catalog, reset, broad-filter, and photo checks passed.')
