import { FormEvent, KeyboardEvent, MutableRefObject, ReactNode, useEffect, useRef, useState } from 'react'
import { ApiCar, ApiError, CatalogField, SessionCredentials, API_BASE_URL, checkBackendConnection, clearCatalogCache, setAppLoginTokenProvider, createSession, getCatalogValues, isBackendConfigured, recoverSession, searchSession, sendChat } from './services/api'
import { CATALOG_PARENT_DEBOUNCE_MS, CatalogSelection, createRequestTracker, nextVehicleImageIndex, normalizeVehicleImages, scheduleCatalogLoad, updateCatalogSelection } from './vehicle-utils'
import { EvidenceButton, EvidenceDialog, EvidenceSubject } from './evidence/EvidenceReview'

type Vehicle = {
  id: number
  vin?: string
  year: number
  name: string
  trim: string
  price: number
  mileage: number
  dealer: string
  distance: number
  images: string[]
  features: string[]
  owners?: number | null
  miss?: string[]
  listingUrl?: string
  sample?: boolean
  historyUnknown?: boolean
  trustworthiness?: unknown
}

const exact: Vehicle[] = [
  {
    id: 1, year: 2022, name: 'Toyota RAV4', trim: 'XLE AWD', price: 28490, mileage: 31842,
    dealer: 'Greenway Toyota', distance: 11,
    images: ['https://images.unsplash.com/photo-1574023240744-64c47c8c0676?auto=format&fit=crop&w=900&q=80'],
    features: ['AWD', 'Backup camera'], owners: 1, sample: true,
  },
  {
    id: 2, year: 2021, name: 'Toyota RAV4', trim: 'XLE Premium', price: 29750, mileage: 38405,
    dealer: 'Northside Auto Group', distance: 23,
    images: ['https://images.unsplash.com/photo-1574023278969-abb7ab49945c?auto=format&fit=crop&w=900&q=80'],
    features: ['Heated seats', 'Moonroof'], sample: true,
  },
  {
    id: 3, year: 2023, name: 'Toyota RAV4', trim: 'LE AWD', price: 30995, mileage: 22170,
    dealer: 'Metro Certified Motors', distance: 37,
    images: ['https://images.unsplash.com/photo-1565043666747-69f6646db940?auto=format&fit=crop&w=900&q=80'],
    features: ['AWD', 'Adaptive cruise'], owners: 1, sample: true,
  },
]

const near: Vehicle[] = [
  {
    id: 4, year: 2022, name: 'Toyota RAV4', trim: 'Limited AWD', price: 32600, mileage: 29710,
    dealer: 'Cedar Park Toyota', distance: 18,
    images: ['https://images.unsplash.com/photo-1585390062628-be8608aa7d83?auto=format&fit=crop&w=900&q=80'],
    features: ['Leather seats', 'AWD'], owners: 2, miss: ['$1,600 over your price limit'], sample: true,
  },
  {
    id: 5, year: 2021, name: 'Toyota RAV4', trim: 'XLE AWD', price: 27900, mileage: 44280,
    dealer: 'Summit Automotive', distance: 61,
    images: ['https://images.unsplash.com/photo-1574023240744-64c47c8c0676?auto=format&fit=crop&w=900&q=80'],
    features: ['Backup camera'], miss: ['4,280 miles over your limit', '11 miles beyond your radius'], sample: true,
  },
]

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    car: <><path d="m5 11 2-5h10l2 5"/><path d="M3 11h18v7H3z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>,
    message: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    spark: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2Z"/><path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

type CatalogInputProps = {
  field: CatalogField
  label: string
  value: string
  make?: string
  model?: string
  connected: boolean
  disabled?: boolean
  emptyLabel: string
  onChange: (value: string) => void
}

function CatalogInput({ field, label, value, make = '', model = '', connected, disabled, emptyLabel, onChange }: CatalogInputProps) {
  const [options, setOptions] = useState<string[]>([])
  const [optionsKey, setOptionsKey] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [retry, setRetry] = useState(0)
  const requestTracker = useRef(createRequestTracker())
  const listId = `catalog-${field}`
  const parentsReady = field === 'make' || (field === 'model' ? Boolean(make.trim()) : Boolean(make.trim() && model.trim()))
  const parentKey = `${field}\u0000${make.trim().toLocaleLowerCase()}\u0000${model.trim().toLocaleLowerCase()}`
  const visibleOptions = connected && parentsReady && optionsKey === parentKey ? options : []

  useEffect(() => {
    const request = requestTracker.current.next()
    setOptions([])
    setOptionsKey('')
    if (!connected || !parentsReady) {
      setState('idle')
      return () => requestTracker.current.invalidate()
    }
    setState('loading')
    const cancelTimer = scheduleCatalogLoad(() => {
      getCatalogValues(field, make, model).then((values) => {
        if (!requestTracker.current.isCurrent(request)) return
        setOptions(values)
        setOptionsKey(parentKey)
        setState('ready')
      }).catch(() => {
        if (!requestTracker.current.isCurrent(request)) return
        setOptions([])
        setState('error')
      })
    }, field === 'make' ? 0 : CATALOG_PARENT_DEBOUNCE_MS)
    return () => {
      cancelTimer()
      requestTracker.current.invalidate()
    }
  }, [connected, field, make, model, parentKey, parentsReady, retry])

  return <Field label={label}>
    <input
      name={field}
      value={value}
      list={visibleOptions.length ? listId : undefined}
      onChange={(event) => onChange(event.target.value)}
      placeholder={emptyLabel}
      autoComplete="off"
      disabled={disabled}
      aria-describedby={`${listId}-status`}
    />
    {visibleOptions.length > 0 && <datalist id={listId}>{visibleOptions.map(option => <option value={option} key={option}/>)}</datalist>}
    <span className={`catalog-status ${state === 'error' ? 'error' : ''}`} id={`${listId}-status`} role={state === 'error' ? 'alert' : 'status'}>
      {!connected ? 'Connect the backend to load suggestions.' :
        disabled ? (field === 'model' ? 'Choose or type a make first.' : 'Choose or type a make and model first.') :
        state === 'loading' ? 'Loading all suggestions…' :
        state === 'error' ? <>Catalog unavailable. Type a custom value or <button type="button" onClick={() => setRetry(value => value + 1)}>retry</button>.</> :
        state === 'ready' ? `${visibleOptions.length.toLocaleString()} suggestions loaded. Custom values are allowed.` : ''}
    </span>
  </Field>
}

function Filters({ onSearch, loading, disabled, connected }: { onSearch: (e: FormEvent<HTMLFormElement>) => void; loading: boolean; disabled: boolean; connected: boolean }) {
  const [more, setMore] = useState(false)
  const [catalog, setCatalog] = useState<CatalogSelection>({ make: '', model: '', trim: '' })
  const { make, model, trim } = catalog

  function resetCatalog() {
    setCatalog({ make: '', model: '', trim: '' })
  }

  return (
    <form className="filters" onSubmit={onSearch} onReset={resetCatalog}>
      <div className="filter-title"><div><Icon name="sliders"/><strong>Filters</strong></div><button type="reset">Reset</button></div>
      <div className="location-row">
        <Field label="ZIP code"><input name="zip" defaultValue="98101" inputMode="numeric"/></Field>
        <Field label="Radius"><select name="radius" defaultValue="50"><option value="25">25 mi</option><option value="50">50 mi</option><option value="100">100 mi</option></select></Field>
      </div>
      <CatalogInput field="make" label="Make" value={make} connected={connected} emptyLabel="All makes" onChange={(value) => setCatalog(current => updateCatalogSelection(current, 'make', value))}/>
      <CatalogInput field="model" label="Model" value={model} make={make} connected={connected} disabled={!make.trim()} emptyLabel="All models" onChange={(value) => setCatalog(current => updateCatalogSelection(current, 'model', value))}/>
      <CatalogInput field="trim" label="Trim" value={trim} make={make} model={model} connected={connected} disabled={!make.trim() || !model.trim()} emptyLabel="Any trim" onChange={(value) => setCatalog(current => updateCatalogSelection(current, 'trim', value))}/>
      <Field label="Year"><div className="range"><input name="yearMin" defaultValue="2021" aria-label="Minimum year"/><i>to</i><input name="yearMax" defaultValue="2024" aria-label="Maximum year"/></div></Field>
      <Field label="Mileage"><div className="range"><input name="mileageMin" placeholder="Min" aria-label="Minimum mileage"/><i>to</i><input name="mileageMax" defaultValue="40,000" aria-label="Maximum mileage"/></div></Field>
      <Field label="Price"><div className="range"><input name="priceMin" defaultValue="$20,000" aria-label="Minimum price"/><i>to</i><input name="priceMax" defaultValue="$31,000" aria-label="Maximum price"/></div></Field>
      <div className="tolerance">
        <button type="button" className="tolerance-toggle" onClick={() => setMore(!more)} aria-expanded={more}>
          <span><strong>Near-miss tolerance</strong><small>Broaden results slightly</small></span>
          <span className={more ? 'rotate' : ''}><Icon name="chevron"/></span>
        </button>
        {more && <div className="tolerance-fields">
          <Field label="Price"><select name="priceTolerance"><option>Up to $2,000 over</option><option>Up to $5,000 over</option></select></Field>
          <Field label="Mileage"><select name="mileageTolerance"><option>Up to 5,000 mi over</option><option>Up to 10,000 mi over</option></select></Field>
          <Field label="Distance"><select name="distanceTolerance"><option>Up to 25 mi farther</option><option>Up to 50 mi farther</option></select></Field>
        </div>}
      </div>
      <button className="search-button" type="submit" disabled={loading || disabled}><Icon name="search"/>{loading ? 'Searching…' : 'Search vehicles'}</button>
    </form>
  )
}

function VehiclePhoto({ car, compact = false }: { car: Vehicle; compact?: boolean }) {
  const [imageIndex, setImageIndex] = useState(0)
  useEffect(() => setImageIndex(0), [car.id, car.images])
  const source = car.images[imageIndex]
  if (!source) {
    return <div className={compact ? 'car-placeholder photo-unavailable' : 'image-unavailable'}><Icon name="car"/><span>Photo unavailable</span></div>
  }
  return <img
    src={source}
    alt={compact ? `${car.year} ${car.name} selected vehicle` : `${car.year} ${car.name} ${car.trim}`}
    loading="lazy"
    referrerPolicy="no-referrer"
    onError={() => setImageIndex(index => nextVehicleImageIndex(index, car.images.length))}
  />
}

function evidenceSubjectForVehicle(car: Vehicle): EvidenceSubject {
  return {
    heading: `${car.year} ${car.name} ${car.trim}`.trim(),
    vin: car.vin,
    listingUrl: car.listingUrl,
    match: { status: 'unassessed' },
    live: car.sample ? undefined : car.trustworthiness,
    price: car.price,
    mileage: car.mileage,
    demo: car.sample ? [
      { score: 81, reasons: ['10 points: ownership and inspection claims conflict with the records.', '9 points: certification and transaction details are inconsistent.'] },
      { score: 65, reasons: ['25 points: title, damage and previous-use claims conflict with the records.', '10 points: ownership and inspection claims conflict with the records.'] },
      { score: 74, reasons: ['15 points: title and damage claims conflict with the records.', '5 points: inspection claims conflict with the records.', '6 points: inspection-access and payment claims conflict with the records.'] },
    ][Math.abs(car.id - 1) % 3] : undefined,
  }
}

function VehicleCard({ car, nearMiss, selected, onSelect, onEvidence }: { car: Vehicle; nearMiss?: boolean; selected: boolean; onSelect: () => void; onEvidence: (subject: EvidenceSubject) => void }) {
  return (
    <article className="vehicle-card">
      <div className="car-image"><VehiclePhoto car={car}/>{car.sample && <span>Sample listing</span>}</div>
      <div className="car-body">
        <div className="card-top">
          <div><p className="eyebrow">{car.year} · {car.trim}</p><h3>{car.name}</h3></div>
          <div className="price"><strong>${car.price.toLocaleString()}</strong><span>est. $487/mo</span></div>
        </div>
        <div className="facts">
          <span><b>{car.mileage.toLocaleString()}</b> miles</span>
          <span><b>{car.distance}</b> miles away</span>
          <span><b>{car.owners ?? 'Unknown'}</b> {car.owners ? 'previous owner' + (car.owners > 1 ? 's' : '') : 'owner history'}</span>
          {car.historyUnknown && <span><b>Unknown</b> vehicle history</span>}
        </div>
        {nearMiss && <div className="miss"><strong>Why it’s a near miss</strong>{car.miss?.map(item => <span key={item}>{item}</span>)}</div>}
        <div className="card-bottom">
          <div><p>{car.dealer}</p><div className="verified">{car.features.map(f => <span key={f}><Icon name="check" size={14}/>{f}</span>)}</div></div>
          <div className="card-actions">
            <EvidenceButton subject={evidenceSubjectForVehicle(car)} onOpen={onEvidence}/>
            <button className={selected ? 'ask-car selected' : 'ask-car'} onClick={onSelect}><Icon name="message" size={15}/>{selected ? 'Selected for chat' : 'Ask about this car'}</button>
          <a href={car.sample ? '#' : car.listingUrl} target={car.sample ? undefined : '_blank'} rel="noreferrer" onClick={car.sample ? (e) => e.preventDefault() : undefined}>Dealer listing <Icon name="arrow" size={16}/></a>
          </div>
        </div>
      </div>
    </article>
  )
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function ChatPanel({ car, session, contextReady, operationLock, onRecoveryChange, onExpired, onClose, onEvidence }: {
  car?: Vehicle
  session?: SessionCredentials
  contextReady: boolean
  operationLock: MutableRefObject<boolean>
  onRecoveryChange: (recovering: boolean) => void
  onExpired: () => void
  onClose: () => void
  onEvidence: (subject: EvidenceSubject) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi, I’m your Gemini car assistant. Select a search result and ask me to compare price, mileage, or listing details.' },
  ])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [chatError, setChatError] = useState('')
  const [canRecover, setCanRecover] = useState(false)
  const connected = isBackendConfigured && Boolean(session) && contextReady && !car?.sample

  async function submitMessage(e: FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending || !connected || operationLock.current) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setSending(true)
    operationLock.current = true
    setChatError('')
    setCanRecover(false)
    try {
      const response = await sendChat(session!, content, car?.id ?? null)
      setMessages([...next, { role: 'assistant', content: response.reply }])
      setText('')
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('unknown', 'Chat could not be completed.')
      setChatError(apiError.message)
      setCanRecover(apiError.kind === 'timeout' || apiError.kind === 'provider')
      if (apiError.kind === 'expired') onExpired()
    } finally {
      setSending(false)
      operationLock.current = false
    }
  }

  async function reloadConversation() {
    if (!session || recovering || operationLock.current) return
    setRecovering(true)
    onRecoveryChange(true)
    operationLock.current = true
    setChatError('')
    try {
      const recovered = await recoverSession(session)
      const recoveredMessages = recovered.history.flatMap<ChatMessage>((entry) => {
        const items: ChatMessage[] = []
        if (entry.user) items.push({ role: 'user', content: entry.user })
        if (entry.assistant) items.push({ role: 'assistant', content: entry.assistant })
        return items
      })
      setMessages(recoveredMessages)
      setCanRecover(false)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('unknown', 'Conversation could not be reloaded.')
      setChatError(apiError.message)
      setCanRecover(apiError.kind === 'timeout' || apiError.kind === 'provider')
      if (apiError.kind === 'expired') onExpired()
    } finally {
      operationLock.current = false
      setRecovering(false)
      onRecoveryChange(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section className="assistant-panel" aria-label="Gemini car assistant">
      <div className="assistant-head">
        <div className="assistant-mark"><Icon name="spark"/></div>
        <div><h3>Gemini car assistant</h3><span>Text-only listing help</span></div>
        <button className="close-assistant" onClick={onClose} aria-label="Close assistant"><Icon name="close"/></button>
      </div>

      <div className={car ? 'selected-car' : 'selected-car empty'}>
        {car ? <><VehiclePhoto car={car} compact/><div><span>{car.sample ? 'SELECTED SAMPLE CAR' : 'SELECTED CAR'}</span><strong>{car.year} {car.name}</strong><small>{car.trim} · ${car.price.toLocaleString()}</small><EvidenceButton subject={evidenceSubjectForVehicle(car)} onOpen={onEvidence} compact/></div></> :
          <><div className="car-placeholder"><Icon name="car"/></div><div><span>NO CAR SELECTED</span><strong>Choose a listing</strong><small>Use “Ask about this car” on any result</small></div></>}
      </div>

      <div className="message-history" aria-live="polite">
        {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>
          {message.role === 'assistant' && <span className="bot-dot"><Icon name="spark" size={13}/></span>}
          <p>{message.content}</p>
        </div>)}
        {sending && <div className="chat-message assistant"><span className="bot-dot"><Icon name="spark" size={13}/></span><p className="typing">Connecting to assistant<span>…</span></p></div>}
      </div>

      {chatError && <div className="assistant-error" role="alert"><strong>Couldn’t connect</strong><span>{chatError}</span>{canRecover && <button onClick={reloadConversation} disabled={recovering}>{recovering ? 'Reloading…' : 'Reload conversation'}</button>}</div>}

      {!connected && <div className="connection-status">{!isBackendConfigured ? 'Chat is not connected yet' : car?.sample ? 'Sample cars cannot be sent to Gemini' : !contextReady ? 'Run a successful search to start chatting' : 'Select a current search result'}</div>}

      <form className="chat-compose" onSubmit={submitMessage}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={car ? `Ask about the ${car.year} ${car.name}…` : 'Select a car to ask Gemini…'} rows={2} disabled={!connected || recovering}/>
        <div className="compose-actions">
          <span>Enter to send · Shift+Enter for new line</span>
          <button className="send-button" type="submit" disabled={!text.trim() || sending || recovering || !connected}>Send <Icon name="arrow" size={15}/></button>
        </div>
      </form>
      <p className="assistant-note">Gemini responses require your configured, authenticated backend.</p>
    </section>
  )
}

export default function App() {
  const [tab, setTab] = useState<'exact' | 'near'>('exact')
  const [mobileFilters, setMobileFilters] = useState(false)
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>('ready')
  const [results, setResults] = useState({ exact, near })
  const [selectedCar, setSelectedCar] = useState<Vehicle | undefined>()
  const [assistantOpen, setAssistantOpen] = useState(true)
  const [session, setSession] = useState<SessionCredentials>()
  const [contextReady, setContextReady] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [demoResults, setDemoResults] = useState(true)
  const [recovering, setRecovering] = useState(false)
  const [evidenceSubject, setEvidenceSubject] = useState<EvidenceSubject>()
  const operationLock = useRef(false)

  const [password, setPassword] = useState('')
  const [connectionReady, setConnectionReady] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('Enter the temporary backend password from Colab. Your API keys stay in Colab.')

  function clearConnection() {
    setAppLoginTokenProvider(async () => null)
    setConnectionReady(false)
    setPassword('')
    setSession(undefined)
    setContextReady(false)
    setSelectedCar(undefined)
    setResults({ exact, near })
    setDemoResults(true)
    setStatus('ready')
    setSearchError('')
    clearCatalogCache()
  }

  async function connectBackend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (operationLock.current || !password) return
    operationLock.current = true
    const token = password
    clearConnection()
    setConnecting(true)
    setConnectionMessage('Checking backend…')
    setAppLoginTokenProvider(async () => token)
    try {
      await checkBackendConnection()
      setConnectionReady(true)
      setConnectionMessage('Connected — ready to search. No MarketCheck or Gemini request was made by this check.')
    } catch (error) {
      clearConnection()
      setConnectionMessage(error instanceof Error ? error.message : 'Connection failed.')
    } finally {
      setConnecting(false)
      operationLock.current = false
    }
  }

  function disconnectBackend() {
    if (operationLock.current) return
    clearConnection()
    setConnectionMessage('Disconnected. Enter your temporary backend password to reconnect.')
  }

  function numberValue(value: FormDataEntryValue | undefined) {
    return Number(String(value ?? '').replace(/[^\d.-]/g, '')) || 0
  }

  function toVehicle(car: ApiCar): Vehicle {
    const images = normalizeVehicleImages(car.image, car.images)
    return {
      id: car.id,
      vin: car.vin,
      trustworthiness: (car as ApiCar & { trustworthiness?: unknown }).trustworthiness,
      year: car.year,
      name: car.name,
      trim: car.trim,
      price: car.price,
      mileage: car.mileage,
      dealer: car.dealer,
      distance: car.distance,
      images,
      features: car.features,
      owners: car.owners,
      miss: car.miss,
      listingUrl: car.listing_url,
      historyUnknown: car.history.title_status === null || car.history.accidents === null,
    }
  }

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (operationLock.current || !connectionReady) return
    operationLock.current = true
    setStatus('loading')
    const form = Object.fromEntries(new FormData(e.currentTarget))
    setContextReady(false)
    setSearchError('')
    try {
      const activeSession = session ?? await createSession()
      if (!session) setSession(activeSession)
      const data = await searchSession(activeSession, {
        zip_code: String(form.zip ?? ''),
        radius: numberValue(form.radius),
        make: String(form.make ?? ''),
        model: String(form.model ?? ''),
        trim: String(form.trim ?? ''),
        year_min: numberValue(form.yearMin),
        year_max: numberValue(form.yearMax),
        mileage_min: numberValue(form.mileageMin),
        mileage_max: numberValue(form.mileageMax),
        price_min: numberValue(form.priceMin),
        price_max: numberValue(form.priceMax),
        tol_price: numberValue(form.priceTolerance ?? 2000),
        tol_miles: numberValue(form.mileageTolerance ?? 5000),
        tol_radius: numberValue(form.distanceTolerance ?? 25),
        max_owners: null,
      })
      setResults({ exact: data.exact.map(toVehicle), near: data.near.map(toVehicle) })
      setDemoResults(false)
      setSelectedCar(undefined)
      setContextReady(true)
      setStatus('ready')
      setMobileFilters(false)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('unknown', 'Search could not be completed.')
      setSearchError(apiError.message)
      if (apiError.kind === 'expired') {
        setSession(undefined)
      }
      setResults({ exact, near })
      setDemoResults(true)
      setSelectedCar(undefined)
      setStatus('error')
    } finally {
      operationLock.current = false
    }
  }

  const cars = tab === 'exact' ? results.exact : results.near
  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#"><span><Icon name="car" size={22}/></span>Auto<span>Scout</span></a>
        <nav><a href="#" className="active">Search cars</a><a href="#">Saved</a><a href="#">How it works</a></nav>
        <div className="header-actions"><button className="saved">Saved vehicles <span>2</span></button></div>
      </header>


      <section className="hero">
        <div><p className="kicker">SMARTER USED-CAR SEARCH</p><h1>Find the right car.<br/><em>Not just any car.</em></h1></div>
        <p>Set your exact criteria and we’ll show you perfect matches—plus smart alternatives that only miss by a little.</p>
      </section>

      <section aria-label="Backend connection" style={{ margin: '0 auto 24px', maxWidth: 1280, padding: '20px 24px', background: '#eff6f5', border: '1px solid #c7ded8', borderRadius: 12 }}>
        <strong>Connect your Colab backend</strong>
        <p style={{ fontSize: 13, overflowWrap: 'anywhere', margin: '8px 0' }}>Backend: {API_BASE_URL}</p>
        <form onSubmit={connectBackend} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          {!connectionReady && <label style={{ display: 'grid', gap: 6 }}>Temporary backend password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="off" spellCheck={false} required disabled={connecting} style={{ border: '1px solid #9fb7b1', borderRadius: 6, padding: 10, width: 290, maxWidth: '100%' }}/>
          </label>}
          {!connectionReady ? <button className="search-button" style={{ width: 'auto', padding: '10px 20px' }} type="submit" disabled={connecting || !password}>{connecting ? 'Checking…' : 'Connect'}</button> : <button className="search-button" style={{ width: 'auto', padding: '10px 20px' }} type="button" onClick={disconnectBackend} disabled={status === 'loading' || recovering}>Disconnect</button>}
        </form>
        <p role="status" style={{ fontSize: 13, margin: '10px 0 0' }}>{connectionMessage}</p>
        <p style={{ fontSize: 12, margin: '6px 0 0' }}>Password stays in memory only and is cleared on disconnect or page reload. Keep Colab running.</p>
      </section>

      <main>
        <aside className={mobileFilters ? 'open' : ''}><Filters onSearch={search} connected={connectionReady} disabled={!connectionReady || connecting} loading={status === 'loading' || recovering}/></aside>
        <section className="results">
          <div className="results-head">
            <div>{demoResults && <div className="sample-badge">DEMO · SAMPLE DATA</div>}<h2>Vehicles near Seattle, WA</h2><p>Based on your preferred criteria</p></div>
            <button className="mobile-filter" onClick={() => setMobileFilters(!mobileFilters)}><Icon name="sliders"/> Filters</button>
            <label className="sort">Sort by <select><option>Best match</option><option>Lowest price</option><option>Lowest mileage</option></select></label>
          </div>

          <div className="tabs" role="tablist">
            <button className={tab === 'exact' ? 'selected' : ''} onClick={() => setTab('exact')}>Exact matches <span>{results.exact.length}</span></button>
            <button className={tab === 'near' ? 'selected' : ''} onClick={() => setTab('near')}>Near misses <span>{results.near.length}</span></button>
          </div>

          {status === 'loading' && <div className="state"><div className="spinner"/><h3>Searching every listing…</h3><p>Comparing vehicles against your exact preferences.</p></div>}
          {status === 'error' && <div className="state error"><div className="state-icon">!</div><h3>We couldn’t complete that search</h3><p>{searchError || 'The search service is unavailable. Your sample listings are still available.'}</p><button onClick={() => setStatus('ready')}>Show sample results</button></div>}
          {status === 'ready' && cars.length === 0 && <div className="state"><div className="state-icon"><Icon name="search" size={24}/></div><h3>No vehicles found</h3><p>Try increasing your radius or expanding a price or mileage range.</p><button onClick={() => setMobileFilters(true)}>Adjust filters</button></div>}
          {status === 'ready' && cars.length > 0 && <div className="cards">{cars.map(car => <VehicleCard car={car} nearMiss={tab === 'near'} selected={selectedCar?.id === car.id} onSelect={() => { setSelectedCar(car); setAssistantOpen(true) }} onEvidence={setEvidenceSubject} key={car.id}/>)}</div>}
          {status === 'ready' && cars.length > 0 && demoResults && <p className="results-note">Showing clearly labeled sample listings for interface preview. Sample IDs are never sent to Gemini.</p>}
        </section>
      </main>
      {!assistantOpen && <button className="assistant-launcher" onClick={() => setAssistantOpen(true)}><Icon name="spark"/> Ask Gemini car assistant</button>}
      {assistantOpen && <ChatPanel key={session?.sessionId ?? 'demo'} car={selectedCar} session={session} contextReady={contextReady && status === 'ready'} operationLock={operationLock} onRecoveryChange={setRecovering} onExpired={() => { setSession(undefined); setSelectedCar(undefined); setContextReady(false) }} onClose={() => setAssistantOpen(false)} onEvidence={setEvidenceSubject}/>}
      {evidenceSubject && <EvidenceDialog subject={evidenceSubject} onClose={() => setEvidenceSubject(undefined)}/>}
    </div>
  )
}
