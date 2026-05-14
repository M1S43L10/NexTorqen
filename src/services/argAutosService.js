const API_BASE_URL = 'https://argautos.com/api/v1'
const CACHE_KEY = 'nextorqen:argautos-cache'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24
const REQUEST_TIMEOUT_MS = 9000

const memoryCache = new Map()

// Cachea catálogos de Arg Autos para que el formulario no repita consultas pesadas.
const readPersistentCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

const writePersistentCache = (cache) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

const getCached = (key) => {
  const memoryEntry = memoryCache.get(key)
  if (memoryEntry && Date.now() - memoryEntry.createdAt < CACHE_TTL_MS) {
    return memoryEntry.data
  }

  const persistentCache = readPersistentCache()
  const persistentEntry = persistentCache[key]
  if (persistentEntry && Date.now() - persistentEntry.createdAt < CACHE_TTL_MS) {
    memoryCache.set(key, persistentEntry)
    return persistentEntry.data
  }

  return null
}

const setCached = (key, data) => {
  const entry = { createdAt: Date.now(), data }
  memoryCache.set(key, entry)
  writePersistentCache({
    ...readPersistentCache(),
    [key]: entry,
  })
}

const requestJson = async (path, cacheKey, { refresh = false } = {}) => {
  if (!refresh) {
    const cached = getCached(cacheKey)
    if (cached) return cached
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Arg Autos API respondio ${response.status}`)
    }

    const payload = await response.json()
    setCached(cacheKey, payload)
    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Arg Autos API tardo demasiado en responder.', { cause: error })
    }

    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

const normalizeList = (payload) => payload?.data || []

export function clearArgAutosCache() {
  memoryCache.clear()
  localStorage.removeItem(CACHE_KEY)
}

export async function getBrands(options) {
  const payload = await requestJson('/brands', 'brands', options)
  return normalizeList(payload)
}

export async function getModelsByBrand(brandId, options) {
  if (!brandId) return []

  const payload = await requestJson(
    `/brands/${brandId}/models`,
    `brand:${brandId}:models`,
    options,
  )
  return normalizeList(payload)
}

export async function getVersionsByModel(modelId, options) {
  if (!modelId) return []

  const payload = await requestJson(
    `/models/${modelId}/versions`,
    `model:${modelId}:versions`,
    options,
  )
  return normalizeList(payload)
}

export async function getValuationsByVersion(versionId, currency = 'ars', options) {
  if (!versionId) return { currency: currency.toUpperCase(), valuations: [] }

  const normalizedCurrency = currency.toLowerCase()
  const payload = await requestJson(
    `/versions/${versionId}/valuations?currency=${encodeURIComponent(normalizedCurrency)}`,
    `version:${versionId}:valuations:${normalizedCurrency}`,
    options,
  )

  return {
    currency: payload?.meta?.currency || normalizedCurrency.toUpperCase(),
    valuations: normalizeList(payload).map((valuation) => ({
      ...valuation,
      priceNumber: Number(valuation.price),
    })),
    meta: payload?.meta,
  }
}

export async function searchVehicles(term, options) {
  const normalizedTerm = term.trim()
  if (normalizedTerm.length < 2) return []

  const payload = await requestJson(
    `/search?q=${encodeURIComponent(normalizedTerm)}`,
    `search:${normalizedTerm.toLowerCase()}`,
    options,
  )
  return normalizeList(payload)
}
