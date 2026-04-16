import { useMemo } from 'react'

const MS_TO_KMH = 3.6
const METERS_TO_KM = 0.001

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function RecordCard({ icon, label, value, ride, date }) {
  return (
    <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4 flex gap-3 items-start">
      <span className="text-xl">{icon}</span>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-bold text-lg">{value}</p>
        <p className="text-gray-500 text-sm truncate" title={ride}>{ride}</p>
        <p className="text-gray-600 text-xs">{date}</p>
      </div>
    </div>
  )
}

export default function PersonalRecords({ activities }) {
  const records = useMemo(() => {
    if (!activities.length) return []

    const result = []

    // Longest distance
    const longest = activities.reduce((best, a) => a.distance > best.distance ? a : best, activities[0])
    result.push({
      icon: '📏',
        label: 'Longest ride',
      value: `${(longest.distance * METERS_TO_KM).toFixed(1)} km`,
      ride: longest.name,
      date: new Date(longest.date).toLocaleDateString('en-US'),
    })

    // Fastest avg speed
    const fastest = activities.reduce((best, a) => a.avgSpeed > best.avgSpeed ? a : best, activities[0])
    result.push({
      icon: '⚡',
        label: 'Highest avg speed',
      value: `${(fastest.avgSpeed * MS_TO_KMH).toFixed(1)} km/h`,
      ride: fastest.name,
      date: new Date(fastest.date).toLocaleDateString('en-US'),
    })

    // Most elevation
    const climbiest = activities.reduce((best, a) => (a.elevationGain || 0) > (best.elevationGain || 0) ? a : best, activities[0])
    if (climbiest.elevationGain > 0) {
      result.push({
        icon: '⛰️',
        label: 'Most elevation gain',
        value: `${Math.round(climbiest.elevationGain)} m`,
        ride: climbiest.name,
        date: new Date(climbiest.date).toLocaleDateString('en-US'),
      })
    }

    // Longest duration
    const longestTime = activities.reduce((best, a) => a.movingTime > best.movingTime ? a : best, activities[0])
    result.push({
      icon: '⏱️',
      label: 'Longest moving time',
      value: formatDuration(longestTime.movingTime),
      ride: longestTime.name,
      date: new Date(longestTime.date).toLocaleDateString('en-US'),
    })

    // Highest max speed — skip rides where max/avg ratio is implausibly high
    // (GPS spikes on rides without a track file show up as e.g. 200+ km/h)
    const plausibleSpeed = (a) => {
      if (!a.maxSpeed || a.maxSpeed <= 0) return false
      if (a.gpsTrack) return true          // GPS-smoothed value, always trust it
      const ratio = a.maxSpeed / (a.avgSpeed || 1)
      return ratio <= 3.5                  // CSV-only: reject if >3.5× avg speed
    }
    const speedCandidates = activities.filter(plausibleSpeed)
    if (speedCandidates.length) {
      const topSpeed = speedCandidates.reduce((best, a) => a.maxSpeed > best.maxSpeed ? a : best, speedCandidates[0])
      result.push({
        icon: '🏎️',
        label: 'Top speed',
        value: `${(topSpeed.maxSpeed * MS_TO_KMH).toFixed(1)} km/h`,
        ride: topSpeed.name,
        date: new Date(topSpeed.date).toLocaleDateString('en-US'),
      })
    }

    // Most calories
    const mostCalories = activities.reduce((best, a) => (a.calories || 0) > (best.calories || 0) ? a : best, activities[0])
    if (mostCalories.calories > 0) {
      result.push({
        icon: '🔥',
        label: 'Most calories',
        value: `${Math.round(mostCalories.calories)} kcal`,
        ride: mostCalories.name,
        date: new Date(mostCalories.date).toLocaleDateString('en-US'),
      })
    }

    return result
  }, [activities])

  if (!records.length) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Personal records</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((r, i) => (
          <RecordCard key={i} {...r} />
        ))}
      </div>
    </div>
  )
}
