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
import { loadActivitiesFromDb, clearActivitiesDb } from './db/indexedDb'

// App states: 'empty' | 'dashboard'
export default function App() {
  const [appState, setAppState] = useState('empty')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [timeFilter, setTimeFilter] = useState({ preset: 'all', from: '', to: '', minDistance: 0 })

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
        if (needsWeather.length > 0) enrichWithWeather(cached)

        // Geocode rides that haven't been located yet
        const needsGeo = cached.filter(a => !a.startLocation && a.startLat != null && a.startLon != null)
        if (needsGeo.length > 0) enrichWithGeocoding(cached)
      }
    }
    checkCache()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImportComplete(parsedActivities) {
    await setActivities(parsedActivities)   // persists to IndexedDB
    setAppState('dashboard')

    // Trigger both enrichments in parallel — each skips already-enriched rides
    const needsWeather = parsedActivities.filter(a => !a.weather && a.startLat != null && a.startLon != null)
    if (needsWeather.length > 0) enrichWithWeather(parsedActivities)

    const needsGeo = parsedActivities.filter(a => !a.startLocation && a.startLat != null && a.startLon != null)
    if (needsGeo.length > 0) enrichWithGeocoding(parsedActivities)
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
              await clearActivitiesDb()
              setActivities([])
              setAppState('empty')
              setTimeFilter({ preset: 'all', from: '', to: '', minDistance: 0 })
            }}
            className="text-sm text-gray-400 hover:text-white transition"
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
            <RouteHeatmap activities={filtered} />
            <ActivityList
              activities={filtered}
              selected={selectedActivity}
              onSelect={setSelectedActivity}
            />
          </div>
        )}
      </main>
    </div>
  )
}
