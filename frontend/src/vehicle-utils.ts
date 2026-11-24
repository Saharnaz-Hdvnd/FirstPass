export type CatalogSelection = { make: string; model: string; trim: string }

export function updateCatalogSelection(
  current: CatalogSelection,
  field: keyof CatalogSelection,
  value: string,
): CatalogSelection {
  if (field === 'make') return { make: value, model: '', trim: '' }
  if (field === 'model') return { ...current, model: value, trim: '' }
  return { ...current, trim: value }
}

export function normalizeVehicleImages(image: string | null | undefined, images: unknown): string[] {
  return [image, ...(Array.isArray(images) ? images : [])]
    .filter((value): value is string => typeof value === 'string' && /^https:\/\//i.test(value))
    .filter((value, index, all) => all.indexOf(value) === index)
}

export function nextVehicleImageIndex(current: number, imageCount: number): number {
  return Math.min(current + 1, imageCount)
}

export function createRequestTracker() {
  let latest = 0
  return {
    next() {
      latest += 1
      return latest
    },
    isCurrent(request: number) {
      return request === latest
    },
    invalidate() {
      latest += 1
    },
  }
}

export const CATALOG_PARENT_DEBOUNCE_MS = 450

export function scheduleCatalogLoad(callback: () => void, delay: number) {
  const timer = setTimeout(callback, delay)
  return () => clearTimeout(timer)
}
