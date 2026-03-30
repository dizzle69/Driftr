import { openDB } from 'idb'

const DB_NAME = 'driftr'
const DB_VERSION = 2

function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Activities store
      if (!db.objectStoreNames.contains('activities')) {
        const store = db.createObjectStore('activities', { keyPath: 'id' })
        store.createIndex('date', 'date')
        store.createIndex('type', 'type')
      }
      // Weather cache store
      if (!db.objectStoreNames.contains('weather_cache')) {
        db.createObjectStore('weather_cache', { keyPath: 'key' })
      }
      // Geocoding cache store (v2)
      if (!db.objectStoreNames.contains('geocoding_cache')) {
        db.createObjectStore('geocoding_cache', { keyPath: 'key' })
      }
    },
  })
}

// --- Activities ---

export async function saveActivitiesToDb(activities) {
  const db = await getDb()
  const tx = db.transaction('activities', 'readwrite')
  await Promise.all([
    ...activities.map(a => tx.store.put(a)),
    tx.done,
  ])
}

export async function loadActivitiesFromDb() {
  const db = await getDb()
  return db.getAll('activities')
}

export async function updateActivityInDb(activity) {
  const db = await getDb()
  return db.put('activities', activity)
}

export async function clearActivitiesDb() {
  const db = await getDb()
  return db.clear('activities')
}

export async function clearWeatherCacheDb() {
  const db = await getDb()
  return db.clear('weather_cache')
}

// --- Weather Cache ---

export async function getWeatherFromCache(key) {
  const db = await getDb()
  const entry = await db.get('weather_cache', key)
  return entry?.data ?? null
}

export async function saveWeatherToCache(key, data) {
  const db = await getDb()
  return db.put('weather_cache', { key, data, cachedAt: new Date().toISOString() })
}

// --- Geocoding Cache ---

export async function getGeocodingFromCache(key) {
  const db = await getDb()
  const entry = await db.get('geocoding_cache', key)
  return entry?.data ?? null
}

export async function saveGeocodingToCache(key, data) {
  const db = await getDb()
  return db.put('geocoding_cache', { key, data, cachedAt: new Date().toISOString() })
}

export async function clearGeocodingCacheDb() {
  const db = await getDb()
  return db.clear('geocoding_cache')
}
