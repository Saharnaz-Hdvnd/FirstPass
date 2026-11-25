const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
const configuredUrl = (viteEnv?.VITE_API_BASE_URL || (typeof process !== 'undefined' ? process.env.FIRSTPASS_TEST_BACKEND_URL : '') || '').replace(/\/$/, '')
export const API_BASE_URL = /^https:\/\/[^/]+/i.test(configuredUrl) ? configuredUrl : ''
export const isBackendConfigured = Boolean(API_BASE_URL)

export type AppLoginTokenProvider = () => Promise<string | null>
let loginTokenProvider: AppLoginTokenProvider = async () => null

/** Inject the host app's short-lived user login token provider at startup. */
export function setAppLoginTokenProvider(provider: AppLoginTokenProvider) {
  loginTokenProvider = provider
}

export type SessionCredentials = {
  sessionId: string
  sessionToken: string
  expiresInSeconds: number
}

export type ApiCar = {
  id: number
  vin: string
  year: number
  name: string
  trim: string
  price: number
  mileage: number
  dealer: string
  distance: number
  listing_url: string
  image: string | null
  images: string[]
  features: string[]
  owners: number | null
  miss: string[]
  history: { title_status: null; accidents: null }
}

export type CatalogField = 'make' | 'model' | 'trim'
export type CatalogResponse = {
  field: CatalogField
  values: string[]
  next_offset: number | null
  source: 'marketcheck_taxonomy'
}

export type SearchPayload = {
  zip_code: string
  radius: number
  make: string
  model: string
  trim: string
  year_min: number
  year_max: number
  mileage_min: number
  mileage_max: number
  price_min: number
  price_max: number
  tol_price: number
  tol_miles: number
  tol_radius: number
  max_owners: null
  search_description: string
}

export type PreferenceStatus = 'not_requested' | 'processed' | 'failed'
export type SearchPreferenceMetadata = {
  applied_keyword_filters: {
    high_value_features?: string
    exclude_high_value_features?: string
  }
  preference_status: PreferenceStatus
  warnings: string[]
}

export type SearchResponse = SearchPreferenceMetadata & {
  session_id: string
  context_version: number
  exact: ApiCar[]
  near: ApiCar[]
}

export type SessionHistoryEntry = {
  user: string | null
  assistant: string | null
  source: string | null
}

export class ApiError extends Error {
  kind: 'configuration' | 'auth' | 'invalid' | 'busy' | 'quota' | 'provider' | 'timeout' | 'expired' | 'unknown'
  status?: number

  constructor(kind: ApiError['kind'], message: string, status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

function errorForStatus(status: number, detail?: string) {
  if (status === 401 || status === 403) return new ApiError('auth', detail ?? 'The backend password was rejected. Disconnect and enter the password from Colab again.', status)
  if (status === 404) return new ApiError('expired', detail ?? 'This conversation expired. Start a new search to continue.', status)
  if (status === 400 || status === 422) return new ApiError('invalid', detail ?? 'Check the search values and try again.', status)
  if (status === 409 || status === 423) return new ApiError('busy', detail ?? 'The assistant is busy with another request. Try again shortly.', status)
  if (status === 429) return new ApiError('quota', detail ?? 'The assistant has reached its usage limit. Try again later.', status)
  if (status >= 500) return new ApiError('provider', detail ?? 'The backend request failed. Try again later.', status)
  return new ApiError('unknown', detail ?? 'The request could not be completed.', status)
}

async function request<T>(path: string, options: { method?: string; body?: unknown; session?: SessionCredentials } = {}): Promise<T> {
  if (!isBackendConfigured) throw new ApiError('configuration', 'Chat is not connected yet.')
  const loginToken = await loginTokenProvider()
  if (!loginToken) throw new ApiError('auth', 'Enter your temporary backend password and click Connect.')
  const headers: Record<string, string> = { Authorization: `Bearer ${loginToken}`, Accept: 'application/json' }
  if (new URL(API_BASE_URL).hostname.endsWith('.ngrok-free.dev')) headers['ngrok-skip-browser-warning'] = 'true'
  if (options.session) headers['X-Conversation-Token'] = options.session.sessionToken
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) {
      let detail: string | undefined
      try {
        const errorBody: unknown = await response.json()
        if (typeof errorBody === 'object' && errorBody !== null && 'detail' in errorBody) {
          const candidate = (errorBody as { detail?: unknown }).detail
          if (typeof candidate === 'string' && candidate.trim()) detail = candidate.trim()
        }
      } catch {
        // Ignore non-JSON error bodies so HTML and other raw responses are never displayed.
      }
      throw errorForStatus(response.status, detail)
    }
    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new ApiError('timeout', 'The request timed out. You can recover the conversation without resending.')
    throw new ApiError('provider', 'Could not reach Colab. Check that the runtime and ngrok tunnel are running and this Figma preview origin is allowed.')
  }
}

const catalogCache = new Map<string, string[]>()
const catalogLoads = new Map<string, Promise<string[]>>()
let catalogGeneration = 0

function catalogKey(field: CatalogField, make = '', model = '') {
  return `${field}\u0000${make.trim().toLocaleLowerCase()}\u0000${model.trim().toLocaleLowerCase()}`
}

/**
 * Loads the complete taxonomy for one parent combination. Calls sharing a key
 * reuse one promise, and successful results remain in memory for this page load.
 */
export function getCatalogValues(field: CatalogField, make = '', model = ''): Promise<string[]> {
  if (field === 'model' && !make.trim()) return Promise.resolve([])
  if (field === 'trim' && (!make.trim() || !model.trim())) return Promise.resolve([])

  const key = catalogKey(field, make, model)
  const cached = catalogCache.get(key)
  if (cached) return Promise.resolve(cached)
  const pending = catalogLoads.get(key)
  if (pending) return pending
  const generation = catalogGeneration

  const load = (async () => {
    const values = new Set<string>()
    let offset: number | null = 0
    while (offset !== null) {
      const params: URLSearchParams = new URLSearchParams({ field, offset: String(offset), limit: '100' })
      if (make.trim()) params.set('make', make.trim())
      if (model.trim()) params.set('model', model.trim())
      const page: CatalogResponse = await request<CatalogResponse>(`/catalog?${params.toString()}`)
      if (page.field !== field || page.source !== 'marketcheck_taxonomy' || !Array.isArray(page.values)) {
        throw new ApiError('provider', 'The catalog returned an unexpected response. You can still type a custom value.')
      }
      page.values.forEach((value) => {
        const clean = String(value).trim()
        if (clean) values.add(clean)
      })
      const nextOffset: unknown = page.next_offset
      if (nextOffset !== null && (
        typeof nextOffset !== 'number' ||
        !Number.isFinite(nextOffset) ||
        !Number.isInteger(nextOffset) ||
        nextOffset <= offset
      )) {
        throw new ApiError('provider', 'The catalog could not finish loading. You can still type a custom value.')
      }
      offset = nextOffset
    }
    const complete = [...values].sort((a, b) => a.localeCompare(b))
    if (generation === catalogGeneration) catalogCache.set(key, complete)
    return complete
  })()

  catalogLoads.set(key, load)
  load.finally(() => {
    if (catalogLoads.get(key) === load) catalogLoads.delete(key)
  }).catch(() => undefined)
  return load
}

/** Intended for disconnect cleanup and deterministic mocked checks. */
export function clearCatalogCache() {
  catalogGeneration += 1
  catalogCache.clear()
  catalogLoads.clear()
}

export async function createSession(): Promise<SessionCredentials> {
  const data = await request<{ session_id: string; session_token: string; expires_in_seconds: number }>('/sessions', { method: 'POST' })
  return { sessionId: data.session_id, sessionToken: data.session_token, expiresInSeconds: data.expires_in_seconds }
}

export function searchSession(session: SessionCredentials, payload: SearchPayload) {
  return request<SearchResponse>(
    `/sessions/${encodeURIComponent(session.sessionId)}/search`,
    { method: 'POST', session, body: payload },
  )
}

export function sendChat(session: SessionCredentials, message: string, selectedCarId: number | null) {
  return request<{ session_id: string; reply: string; context_version: number }>('/chat', {
    method: 'POST',
    session,
    body: { session_id: session.sessionId, message, selected_car_id: selectedCarId },
  })
}

export function recoverSession(session: SessionCredentials) {
  return request<{ session_id: string; context?: unknown; history: SessionHistoryEntry[] }>(
    `/sessions/${encodeURIComponent(session.sessionId)}`,
    { session },
  )
}

/** Authentication-only check; does not call MarketCheck or Gemini. */
export function checkBackendConnection() {
  return request<unknown>('/health')
}
