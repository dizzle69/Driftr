import { useState, useCallback } from 'react'
import { saveActivitiesToDb, updateActivityInDb } from '../db/indexedDb'
import { fetchWeatherBulk } from '../utils/weatherApi'
import { fetchLocationsBulk } from '../utils/geocodingApi'
import { analyzeWindImpact, analyzeWindImpactWithSamples } from '../utils/gpsCalc'

/**
 * Central hook for activity state + async enrichment (weather, wind)
 */
export function useActivities() {
  const [activities, setActivities] = useState([])
  const [weatherProgress, setWeatherProgress] = useState(null)   // { done, total } | null
  const [geocodingProgress, setGeocodingProgress] = useState(null) // { done, total } | null

  const setAndPersist = useCallback(async (newActivities) => {
    setActivities(newActivities)
    await saveActivitiesToDb(newActivities)
  }, [])

  /**
   * Kick off weather fetch for all activities
   * Updates state incrementally as each activity gets weather data
   */
  const enrichWithWeather = useCallback(async (activitiesToEnrich) => {
    setWeatherProgress({ done: 0, total: activitiesToEnrich.length })

    const enriched = await fetchWeatherBulk(
      activitiesToEnrich,
      (done, total) => setWeatherProgress({ done, total })
    )

    // After weather: calculate wind analysis for activities that have GPS track + weather
    const withWind = enriched.map(a => {
      if (!a.gpsTrack?.points?.length || !a.weather) return a

      // Prefer time-bucketed wind analysis when weather samples exist.
      const samples = a.weather.samples
      const hasSampleWind =
        samples?.start?.winddirection != null ||
        samples?.mid?.winddirection != null ||
        samples?.end?.winddirection != null

      if (hasSampleWind) {
        const windAnalysis = analyzeWindImpactWithSamples(a.gpsTrack.points, samples)
        if (windAnalysis) return { ...a, windAnalysis }
      }

      if (a.weather.winddirection == null) return a
      const windAnalysis = analyzeWindImpact(a.gpsTrack.points, a.weather.winddirection)
      return { ...a, windAnalysis }
    })

    await setAndPersist(withWind)
    setWeatherProgress(null)
    return withWind
  }, [setAndPersist])

  /**
   * Kick off reverse geocoding for all activities.
   * Updates state incrementally as each activity gets a location string.
   */
  const enrichWithGeocoding = useCallback(async (activitiesToEnrich) => {
    setGeocodingProgress({ done: 0, total: activitiesToEnrich.length })

    const enriched = await fetchLocationsBulk(
      activitiesToEnrich,
      (done, total) => setGeocodingProgress({ done, total })
    )

    await setAndPersist(enriched)
    setGeocodingProgress(null)
    return enriched
  }, [setAndPersist])

  /**
   * Update a single activity (e.g. after GPX parse)
   */
  const updateActivity = useCallback(async (updated) => {
    await updateActivityInDb(updated)
    setActivities(prev => prev.map(a => a.id === updated.id ? updated : a))
  }, [])

  return {
    activities,
    setActivities: setAndPersist,
    updateActivity,
    enrichWithWeather,
    weatherProgress,
    enrichWithGeocoding,
    geocodingProgress,
  }
}
