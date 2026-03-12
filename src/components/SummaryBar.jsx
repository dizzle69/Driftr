import { useMemo } from 'react'

// ─── Streak helpers ──────────────────────────────────────────────────────────

/**
 * Returns the longest streak of consecutive calendar days with at least one ride.
 */
export function longestStreak(activities) {
  if (!activities.length) return 0

  // De-duplicate to one entry per calendar day, sort ascending
  const timestamps = [...new Set(
    activities.map(a => {
      const d = new Date(a.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )].sort((a, b) => a - b)

  let best = 1
  let current = 1
  for (let i = 1; i < timestamps.length; i++) {
    const diffDays = Math.round((timestamps[i] - timestamps[i - 1]) / 86400000)
    if (diffDays === 1) {
      current++
      if (current > best) best = current
    } else {
      current = 1
    }
  }
  return best
}

/**
 * Returns the current active streak (consecutive days ending today or yesterday).
 */
export function currentStreak(activities) {
  if (!activities.length) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  // De-duplicate, sort descending
  const timestamps = [...new Set(
    activities.map(a => {
      const d = new Date(a.date)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )].sort((a, b) => b - a)

  if (!timestamps.length) return 0

  // Streak must end today or yesterday; otherwise it's broken
  if (timestamps[0] < yesterday.getTime()) return 0

  let streak = 1
  for (let i = 1; i < timestamps.length; i++) {
    const diffDays = Math.round((timestamps[i - 1] - timestamps[i]) / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Percentage of calendar weeks (within the data's date range) that contain at least one ride.
 */
function weeklyConsistency(activities) {
  if (activities.length < 2) return 0

  const sorted = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date))
  const firstDate = new Date(sorted[0].date)
  const lastDate  = new Date(sorted[sorted.length - 1].date)
  firstDate.setHours(0, 0, 0, 0)
  lastDate.setHours(0, 0, 0, 0)

  const totalWeeks = Math.max(1, Math.ceil((lastDate - firstDate) / (7 * 86400000)) + 1)

  const weeks = new Set(activities.map(a => {
    const d = new Date(a.date)
    const year = d.getFullYear()
    const week = Math.ceil((d - new Date(year, 0, 1)) / 604800000)
    return `${year}-W${week}`
  }))

  return Math.min(100, Math.round((weeks.size / totalWeeks) * 100))
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function Tile({ value, label, accent = false }) {
  return (
    <div className={`bg-gray-900 rounded-xl p-4 text-center border ${accent ? 'border-strava/40' : 'border-gray-800'}`}>
      <p className={`text-2xl font-bold ${accent ? 'text-strava' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SummaryBar({ activities }) {
  const stats = useMemo(() => {
    if (!activities.length) return []

    const totalKm    = Math.round(activities.reduce((s, a) => s + a.distance * 0.001, 0))
    const totalHm    = Math.round(activities.reduce((s, a) => s + (a.elevationGain || 0), 0))
    const rides      = activities.length
    const bestStreak = longestStreak(activities)
    const activeStreak = currentStreak(activities)
    const consistency  = weeklyConsistency(activities)

    const fmt = (n) => n.toLocaleString('de-DE')

    return [
      { value: `${fmt(totalKm)} km`,  label: 'Gesamt',           accent: false },
      { value: `${fmt(totalHm)} m`,   label: 'Höhenmeter',       accent: false },
      { value: rides,                 label: 'Rides',            accent: false },
      { value: `${bestStreak} T`,     label: 'Längste Serie',    accent: false },
      { value: `${activeStreak} T`,   label: 'Akt. Serie',       accent: activeStreak > 0 },
      { value: `${consistency} %`,    label: 'Wöch. Konsistenz', accent: false },
    ]
  }, [activities])

  if (!stats.length) return null

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {stats.map(s => (
        <Tile key={s.label} {...s} />
      ))}
    </div>
  )
}
