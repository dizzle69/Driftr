import { useMemo } from 'react'

const TYPE_LABELS = {
  Ride: 'Straße',
  VirtualRide: 'Indoor',
  EBikeRide: 'E-Bike',
  GravelRide: 'Gravel',
  MountainBikeRide: 'MTB',
}

const PRESETS = [
  { label: 'Alle', value: 'all' },
  { label: '7 Tage', value: '7d' },
  { label: '30 Tage', value: '30d' },
  { label: '90 Tage', value: '90d' },
  { label: '6 Monate', value: '6m' },
  { label: '1 Jahr', value: '1y' },
  { label: 'Custom', value: 'custom' },
]

const DISTANCE_PRESETS = [
  { label: 'Alle', value: 0 },
  { label: '>5 km', value: 5 },
  { label: '>10 km', value: 10 },
  { label: '>20 km', value: 20 },
]

export default function TimeframeFilter({ filter, onChange, activities }) {
  const availableTypes = useMemo(() => {
    const seen = new Set()
    activities.forEach(a => { if (a.type) seen.add(a.type) })
    return [...seen].sort()
  }, [activities])

  const selectedTypes = filter.types || []

  function toggleType(type) {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    onChange({ ...filter, types: next })
  }

  // Compute date range from activities for the date inputs
  const dateRange = useMemo(() => {
    if (!activities.length) return { min: '', max: '' }
    const dates = activities.map(a => new Date(a.date)).filter(d => !isNaN(d))
    const min = new Date(Math.min(...dates))
    const max = new Date(Math.max(...dates))
    return {
      min: min.toISOString().split('T')[0],
      max: max.toISOString().split('T')[0],
    }
  }, [activities])

  const activeCount = useMemo(() => {
    return filterActivities(activities, filter).length
  }, [activities, filter])

  const minDist = filter.minDistance || 0

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-500 text-sm mr-1">Zeitraum:</span>
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange({ ...filter, preset: p.value })}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              filter.preset === p.value
                ? 'bg-strava text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
        {filter.preset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={filter.from || dateRange.min}
              min={dateRange.min}
              max={filter.to || dateRange.max}
              onChange={e => onChange({ ...filter, from: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-2 py-1
                         focus:border-strava focus:outline-none"
            />
            <span className="text-gray-500">–</span>
            <input
              type="date"
              value={filter.to || dateRange.max}
              min={filter.from || dateRange.min}
              max={dateRange.max}
              onChange={e => onChange({ ...filter, to: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-2 py-1
                         focus:border-strava focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-500 text-sm mr-1">Mindestdistanz:</span>
        {DISTANCE_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange({ ...filter, minDistance: p.value })}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              minDist === p.value
                ? 'bg-strava text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-2">
          {activeCount} Ride{activeCount !== 1 ? 's' : ''}
        </span>
      </div>

      {availableTypes.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 text-sm mr-1">Typ:</span>
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1 text-sm rounded-lg transition ${
                selectedTypes.includes(type)
                  ? 'bg-strava text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {TYPE_LABELS[type] || type}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Apply timeframe filter to activities array.
 * Exported so App.jsx can use it too.
 */
export function filterActivities(activities, filter) {
  const minKm = filter.minDistance || 0

  // Apply distance filter first
  let result = minKm > 0
    ? activities.filter(a => a.distance * 0.001 >= minKm)
    : activities

  // Activity type filter
  if (filter.types?.length > 0) {
    result = result.filter(a => filter.types.includes(a.type))
  }

  if (filter.preset === 'all') return result

  const now = new Date()
  let fromDate, toDate

  if (filter.preset === 'custom') {
    fromDate = filter.from ? new Date(filter.from) : new Date(0)
    toDate = filter.to ? new Date(filter.to + 'T23:59:59') : now
  } else {
    toDate = now
    switch (filter.preset) {
      case '7d':  fromDate = new Date(now - 7 * 86400000); break
      case '30d': fromDate = new Date(now - 30 * 86400000); break
      case '90d': fromDate = new Date(now - 90 * 86400000); break
      case '6m':  fromDate = new Date(now); fromDate.setMonth(fromDate.getMonth() - 6); break
      case '1y':  fromDate = new Date(now); fromDate.setFullYear(fromDate.getFullYear() - 1); break
      default:    return result
    }
  }

  return result.filter(a => {
    const d = new Date(a.date)
    return d >= fromDate && d <= toDate
  })
}
