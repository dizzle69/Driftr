import { useState, useEffect, useMemo } from 'react'
import FileUploader from './components/FileUploader'
import ActivityList from './components/ActivityList'
import DashboardCharts from './components/DashboardCharts'
import InsightCards from './components/InsightCards'
import PersonalRecords from './components/PersonalRecords'
import TimeHeatmap from './components/TimeHeatmap'
import RouteHeatmap from './components/RouteHeatmap'
import TimeframeFilter, { filterActivities } from './components/TimeframeFilter'
import SummaryBar from './components/SummaryBar'
import FitnessChart from './components/FitnessChart'
import { useActivities } from './hooks/useActivities'
import {
  loadActivitiesFromDb,
  clearActivitiesDb,
  clearWeatherCacheDb,
  clearGeocodingCacheDb,
} from './db/indexedDb'
import AiCoach from './components/AiCoach'

// App states: 'empty' | 'dashboard'
export default function App() {
  const [appState, setAppState] = useState('empty')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [timeFilter, setTimeFilter] = useState({ preset: 'all', from: '', to: '', minDistance: 0, types: [] })
  const [consent, setConsent] = useState(() => ({
    weather: localStorage.getItem('consent_weather') !== 'false',
    geocoding: localStorage.getItem('consent_geocoding') !== 'false',
    mapTiles: localStorage.getItem('consent_mapTiles') !== 'false',
  }))

  const {
    activities,
    setActivities,
    enrichWithWeather,
    weatherProgress,
    enrichWithGeocoding,
    geocodingProgress,
  } = useActivities()

  // On mount: load cached activities + trigger background enrichment for any missing data
  useEffect(() => {
    async function checkCache() {
      const cached = await loadActivitiesFromDb()
      if (cached && cached.length > 0) {
        setActivities(cached)
        setAppState('dashboard')

        // Weather fill for rides missing it (e.g. rides imported before this feature)
        const needsWeather = cached.filter(a => !a.weather && a.startLat != null && a.startLon != null)
        if (consent.weather && needsWeather.length > 0) enrichWithWeather(cached)

        // Geocode rides that haven't been located yet
        const needsGeo = cached.filter(a => !a.startLocation && a.startLat != null && a.startLon != null)
        if (consent.geocoding && needsGeo.length > 0) enrichWithGeocoding(cached)
      }
    }
    checkCache()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImportComplete(parsedActivities) {
    await setActivities(parsedActivities)   // persists to IndexedDB
    setAppState('dashboard')

    // Trigger both enrichments in parallel — each skips already-enriched rides
    const needsWeather = parsedActivities.filter(a => !a.weather && a.startLat != null && a.startLon != null)
    if (consent.weather && needsWeather.length > 0) enrichWithWeather(parsedActivities)

    const needsGeo = parsedActivities.filter(a => !a.startLocation && a.startLat != null && a.startLon != null)
    if (consent.geocoding && needsGeo.length > 0) enrichWithGeocoding(parsedActivities)
  }

  const filtered = useMemo(
    () => filterActivities(activities, timeFilter),
    [activities, timeFilter]
  )

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* Weather enrichment — thin orange progress bar pinned to top */}
      {weatherProgress && (
        <div className="fixed top-0 inset-x-0 z-50">
          <div className="h-1 bg-gray-800">
            <div
              className="h-1 bg-strava transition-all duration-300"
              style={{ width: `${(weatherProgress.done / weatherProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 bg-gray-950/90 py-0.5 leading-none">
            🌤 Wetter: {weatherProgress.done}/{weatherProgress.total}
          </p>
        </div>
      )}

      {/* Geocoding — blue bar stacked below weather bar when both run simultaneously */}
      {geocodingProgress && (
        <div
          className="fixed inset-x-0 z-50"
          style={{ top: weatherProgress ? '28px' : '0px' }}
        >
          <div className="h-1 bg-gray-800">
            <div
              className="h-1 bg-blue-500 transition-all duration-300"
              style={{ width: `${(geocodingProgress.done / geocodingProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-center text-xs text-gray-500 bg-gray-950/90 py-0.5 leading-none">
            📍 Orte: {geocodingProgress.done}/{geocodingProgress.total}
          </p>
        </div>
      )}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-strava">Strava Analytics</h1>
        {appState === 'dashboard' && (
          <button
            onClick={async () => {
              await Promise.all([clearActivitiesDb(), clearWeatherCacheDb(), clearGeocodingCacheDb()])
              setActivities([])
              setAppState('empty')
              setTimeFilter({ preset: 'all', from: '', to: '', minDistance: 0, types: [] })
            }}
            disabled={weatherProgress || geocodingProgress}
            className="text-sm text-gray-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {appState === 'empty' && (
          <FileUploader onImportComplete={handleImportComplete} />
        )}

        {appState === 'dashboard' && (
          <>
          <AiCoach activities={filtered} />
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-2">
            <h2 className="text-sm font-semibold text-gray-200">Datenfreigaben</h2>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={consent.weather}
                  onChange={e => {
                    const v = e.target.checked
                    setConsent(prev => ({ ...prev, weather: v }))
                    localStorage.setItem('consent_weather', v ? 'true' : 'false')
                  }}
                  className="mt-0.5"
                />
                Wetterdaten nachladen (Open-Meteo)
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={consent.geocoding}
                  onChange={e => {
                    const v = e.target.checked
                    setConsent(prev => ({ ...prev, geocoding: v }))
                    localStorage.setItem('consent_geocoding', v ? 'true' : 'false')
                  }}
                  className="mt-0.5"
                />
                Ortsnamen bestimmen (Nominatim)
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={consent.mapTiles}
                  onChange={e => {
                    const v = e.target.checked
                    setConsent(prev => ({ ...prev, mapTiles: v }))
                    localStorage.setItem('consent_mapTiles', v ? 'true' : 'false')
                  }}
                  className="mt-0.5"
                />
                Kartenkacheln laden (CARTO)
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Wird beim Laden/Import verwendet; schon berechnete Daten bleiben im Browser gespeichert.
            </p>
          </div>
          <div className="space-y-8">
            <TimeframeFilter
              filter={timeFilter}
              onChange={setTimeFilter}
              activities={activities}
            />
            <SummaryBar activities={filtered} />
            <FitnessChart activities={filtered} />
            <InsightCards activities={filtered} />
            <PersonalRecords activities={filtered} />
            <TimeHeatmap activities={filtered} />
            <DashboardCharts activities={filtered} />
            <RouteHeatmap activities={filtered} enableTiles={consent.mapTiles} />
            <ActivityList
              activities={filtered}
              selected={selectedActivity}
              onSelect={setSelectedActivity}
            />
          </div>
          </>
        )}
      </main>
    </div>
  )
}
