import { getWeatherFromCache, saveWeatherToCache } from '../db/indexedDb'

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

/**
 * Fetch weather for a single activity from Open-Meteo (with cache)
 * @param {number} lat
 * @param {number} lon
 * @param {string} date - ISO date string
 * @returns {{ temperature, windspeed, winddirection, precipitation }}
 */
export async function fetchWeatherForActivity(lat, lon, date) {
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

  // Use midday (hour 12) as representative value for the day
  const midday = 12
  const weather = {
    temperature: hourly.temperature_2m[midday],
    windspeed: hourly.windspeed_10m[midday],
    winddirection: hourly.winddirection_10m[midday],
    precipitation: hourly.precipitation[midday],
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
      const weather = await fetchWeatherForActivity(a.startLat, a.startLon, a.date)
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
