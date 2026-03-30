/**
 * Reverse geocoding via Nominatim (free OpenStreetMap API).
 * Rate limit: 1 request per second (Nominatim Terms of Service).
 * Results are cached in IndexedDB so repeated imports are instant.
 *
 * Outbound: Nominatim reverse endpoint (see src/security/outbound-inventory.txt).
 */
import { getGeocodingFromCache, saveGeocodingToCache } from '../db/indexedDb'

const BASE_URL = 'https://nominatim.openstreetmap.org/reverse'
const THROTTLE_MS = 1200  // slightly above 1s to stay safely under Nominatim's limit

/**
 * Format a Nominatim address object into a short readable location string.
 * For German addresses: show city/town only (state is too verbose).
 * For foreign addresses: show city + country.
 */
function formatLocation(address) {
  if (!address) return 'Unbekannt'
  const place = address.city || address.town || address.village || address.county || ''
  if (!place) return address.country || 'Unbekannt'
  if (address.country_code === 'de') return place
  return address.country ? `${place}, ${address.country}` : place
}

/**
 * Reverse-geocode a single coordinate pair.
 * Returns a short location string (e.g. "Hamburg" or "Vienna, Austria").
 * Cache key is rounded to 2 decimal places (~1 km precision).
 */
export async function fetchLocationForCoords(lat, lon) {
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`

  const cached = await getGeocodingFromCache(cacheKey)
  if (cached) return cached

  const url =
    `${BASE_URL}?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&format=json&zoom=10`

  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'de,en',
      // Nominatim requires a User-Agent identifying the application
      'User-Agent': 'driftr-local/1.0',
    },
  })

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)

  const json = await res.json()
  const location = formatLocation(json.address)

  await saveGeocodingToCache(cacheKey, location)
  return location
}

/**
 * Enrich an array of activities with `startLocation` strings.
 * Skips rides that already have a location or lack GPS coordinates.
 * Calls onProgress(done, total) after each activity is processed.
 *
 * Returns a new array with updated activity objects (mutations are avoided).
 */
export async function fetchLocationsBulk(activities, onProgress) {
  const results = [...activities]

  for (let i = 0; i < results.length; i++) {
    const a = results[i]

    if (!a.startLocation && a.startLat != null && a.startLon != null) {
      try {
        const location = await fetchLocationForCoords(a.startLat, a.startLon)
        results[i] = { ...a, startLocation: location }
        // Throttle: wait before next request (cache hits don't consume quota but we still wait
        // to avoid hammering the API on the first run)
        await new Promise(r => setTimeout(r, THROTTLE_MS))
      } catch (err) {
        console.warn(`Geocoding failed for activity ${a.id}:`, err.message)
        // Leave startLocation undefined — shown as "—" in the UI
      }
    }

    onProgress?.(i + 1, results.length)
  }

  return results
}
