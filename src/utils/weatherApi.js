import { getWeatherFromCache, saveWeatherToCache } from '../db/indexedDb'

// Outbound: Open-Meteo Historical API (see src/security/outbound-inventory.txt).
const BASE_URL = 'https://archive-api.open-meteo.com/v1/archive'
// Open-Meteo free tier: ~10.000 req/day → throttle to be safe
const THROTTLE_MS = 200 // 5 req/sec max

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatDate(dateString) {
  // Returns YYYY-MM-DD from any parseable date string
  return new Date(dateString).toISOString().split('T')[0]
}

function formatDateLocal(dateObj) {
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function clampInt(n, min, max) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

/**
 * Fetch weather for a single activity from Open-Meteo (with cache)
 * @param {number} lat
 * @param {number} lon
 * @param {string} date - ISO date string
 * @param {number|null} startTimeEpochSec - Strava CSV "Start Time" epoch seconds
 * @param {number|null} elapsedTimeSec - Strava CSV "Elapsed Time" in seconds
 * @returns {{ temperature, windspeed, winddirection, precipitation }}
 */
export async function fetchWeatherForActivity(lat, lon, date, startTimeEpochSec = null, elapsedTimeSec = null) {
  const dateStr = formatDate(date)
  const cacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}_${dateStr}`

  // Check cache first
  const cached = await getWeatherFromCache(cacheKey)
  if (cached) return cached

  // Open-Meteo historical data has ~2 day delay
  const activityDate = new Date(date)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  if (activityDate > twoDaysAgo) {
    return null // Too recent — no historical data yet
  }

  const url = new URL(BASE_URL)
  url.searchParams.set('latitude', lat.toFixed(4))
  url.searchParams.set('longitude', lon.toFixed(4))
  url.searchParams.set('start_date', dateStr)
  url.searchParams.set('end_date', dateStr)
  url.searchParams.set('hourly', 'temperature_2m,windspeed_10m,winddirection_10m,precipitation')
  url.searchParams.set('timezone', 'auto')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)

  const json = await res.json()
  const hourly = json.hourly

  // We still keep midday (hour 12) as a representative value for backwards compatibility.
  const midday = 12
  const activityDateLocalStr = formatDateLocal(activityDate)

  function hourIndexForTime(epochMs) {
    const d = new Date(epochMs)
    const localStr = formatDateLocal(d)
    const hour = d.getHours()
    // If the ride crosses midnight, clamp to the fetched day's hourly range.
    if (localStr !== activityDateLocalStr) {
      return localStr > activityDateLocalStr ? 23 : 0
    }
    return clampInt(hour, 0, 23)
  }

  // Sample at 3 ride moments from a single Open-Meteo hourly request.
  let startHourIdx = midday
  let midHourIdx = midday
  let endHourIdx = midday

  if (startTimeEpochSec && elapsedTimeSec && elapsedTimeSec > 0) {
    const startMs = startTimeEpochSec * 1000
    const midMs = startMs + (elapsedTimeSec * 1000) / 2
    const endMs = startMs + elapsedTimeSec * 1000

    startHourIdx = hourIndexForTime(startMs)
    midHourIdx = hourIndexForTime(midMs)
    endHourIdx = hourIndexForTime(endMs)
  }

  function sampleAtHour(hourIdx) {
    // Open-Meteo should return 24 values for a single-day request.
    const idx = clampInt(hourIdx, 0, 23)
    return {
      temperature: hourly.temperature_2m?.[idx] ?? null,
      windspeed: hourly.windspeed_10m?.[idx] ?? null,
      winddirection: hourly.winddirection_10m?.[idx] ?? null,
      precipitation: hourly.precipitation?.[idx] ?? null,
    }
  }

  const startSample = sampleAtHour(startHourIdx)
  const midSample = sampleAtHour(midHourIdx)
  const endSample = sampleAtHour(endHourIdx)

  const tempSamples = [startSample.temperature, midSample.temperature, endSample.temperature].filter(
    v => v != null && Number.isFinite(v),
  )
  const avgTemperature = tempSamples.length
    ? tempSamples.reduce((s, v) => s + v, 0) / tempSamples.length
    : null

  // Use midday (hour 12) as representative value for the day.
  const weather = {
    temperature: hourly.temperature_2m[midday] ?? null,
    windspeed: hourly.windspeed_10m[midday] ?? null,
    winddirection: hourly.winddirection_10m[midday] ?? null,
    precipitation: hourly.precipitation[midday] ?? null,
    // New: sampled values at start/mid/end of the ride.
    samples: {
      start: startSample,
      mid: midSample,
      end: endSample,
    },
    avgTemperature,
  }

  await saveWeatherToCache(cacheKey, weather)
  return weather
}

/**
 * Fetch weather for multiple activities with throttling + progress callback
 * @param {Array} activities
 * @param {Function} onProgress - called with (done, total)
 * @returns {Array} activities with weather field populated
 */
export async function fetchWeatherBulk(activities, onProgress) {
  const results = [...activities]
  let done = 0

  for (let i = 0; i < results.length; i++) {
    const a = results[i]

    // Skip if already has weather or has no GPS start point
    if (a.weather || !a.startLat || !a.startLon) {
      done++
      onProgress?.(done, results.length)
      continue
    }

    try {
      const weather = await fetchWeatherForActivity(
        a.startLat,
        a.startLon,
        a.date,
        a.startTimeEpoch,
        a.elapsedTime,
      )
      results[i] = { ...a, weather }
    } catch (err) {
      console.warn(`Weather fetch failed for activity ${a.id}:`, err.message)
    }

    done++
    onProgress?.(done, results.length)
    await sleep(THROTTLE_MS)
  }

  return results
}
