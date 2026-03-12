import { useState, useCallback } from 'react'
import { fetchWeatherForActivity } from '../utils/weatherApi'

/**
 * Hook for fetching weather for a single activity (detail view)
 */
export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchForActivity = useCallback(async (activity) => {
    if (!activity?.startLat || !activity?.startLon || !activity?.date) return
    if (activity.weather) { setWeather(activity.weather); return }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchWeatherForActivity(activity.startLat, activity.startLon, activity.date)
      setWeather(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { weather, loading, error, fetchForActivity }
}
