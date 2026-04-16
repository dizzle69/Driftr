// Insight Engine — generates actionable cards from aggregated activity data
// Each insight: { icon, title, value, sub, color }

const MS_TO_KMH = 3.6

/**
 * Group activities by temperature bucket and find best performing range
 */
function bestTemperatureRange(activities) {
  const withTemp = activities.filter(a => {
    const t = a.weather?.avgTemperature ?? a.weather?.temperature
    return t != null && a.avgSpeed > 0
  })
  if (withTemp.length < 10) return null

  const buckets = {}
  withTemp.forEach(a => {
    const t = a.weather.avgTemperature ?? a.weather.temperature
    const bucket = Math.floor(t / 5) * 5 // 5°C buckets
    if (!buckets[bucket]) buckets[bucket] = []
    buckets[bucket].push(a.avgSpeed * MS_TO_KMH)
  })

  let bestBucket = null
  let bestAvg = 0
  for (const [bucket, speeds] of Object.entries(buckets)) {
    if (speeds.length < 3) continue // not enough data
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
    if (avg > bestAvg) { bestAvg = avg; bestBucket = Number(bucket) }
  }

  if (bestBucket == null) return null
  return {
    icon: '🌡️',
    title: 'Best temperature range',
    value: `${bestBucket}–${bestBucket + 5}°C`,
    sub: `Avg ${bestAvg.toFixed(1)} km/h in this range`,
    color: 'orange',
  }
}

/**
 * Headwind impact: average speed difference headwind vs tailwind
 */
function headwindImpact(activities) {
  const withWind = activities.filter(a => a.windAnalysis && a.avgSpeed > 0)
  if (withWind.length < 5) return null

  const headwindRides = withWind.filter(a => a.windAnalysis.headwindPct > 50)
  const tailwindRides = withWind.filter(a => a.windAnalysis.tailwindPct > 50)

  if (headwindRides.length < 3 || tailwindRides.length < 3) return null

  const avgHead = headwindRides.reduce((s, a) => s + a.avgSpeed * MS_TO_KMH, 0) / headwindRides.length
  const avgTail = tailwindRides.reduce((s, a) => s + a.avgSpeed * MS_TO_KMH, 0) / tailwindRides.length
  const diff = avgTail - avgHead

  return {
    icon: '💨',
    title: 'Headwind impact',
    value: `−${diff.toFixed(1)} km/h`,
    sub: `Headwind vs. tailwind (average across all rides)`,
    color: 'blue',
  }
}

/**
 * Best day of week by average speed
 */
function bestDayOfWeek(activities) {
  if (activities.length < 14) return null
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const byDay = {}

  activities.forEach(a => {
    const day = new Date(a.date).getDay()
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(a.avgSpeed * MS_TO_KMH)
  })

  let bestDay = null
  let bestAvg = 0
  for (const [day, speeds] of Object.entries(byDay)) {
    if (speeds.length < 3) continue
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length
    if (avg > bestAvg) { bestAvg = avg; bestDay = Number(day) }
  }

  if (bestDay == null) return null
  return {
    icon: '📅',
    title: 'Strongest weekday',
    value: DAYS[bestDay],
    sub: `Ø ${bestAvg.toFixed(1)} km/h`,
    color: 'green',
  }
}

/**
 * Total stats summary
 */
function totalStats(activities) {
  const totalKm = activities.reduce((s, a) => s + a.distance * 0.001, 0)
  const totalHm = activities.reduce((s, a) => s + (a.elevationGain || 0), 0)
  return {
    icon: '🚴',
    title: 'Overall output',
    value: `${Math.round(totalKm).toLocaleString('en-US')} km`,
    sub: `${Math.round(totalHm).toLocaleString('en-US')} m elevation gain across ${activities.length} rides`,
    color: 'orange',
  }
}

/**
 * Exploration stats: total newly explored km
 */
function explorationStats(activities) {
  const totalNew = activities.reduce((s, a) => s + (a.newlyExploredDistance || 0), 0) * 0.001
  if (totalNew <= 0) return null
  const totalKm = activities.reduce((s, a) => s + a.distance * 0.001, 0)
  const pct = totalKm > 0 ? ((totalNew / totalKm) * 100).toFixed(0) : 0
  return {
    icon: '🗺️',
    title: 'Explorer score',
    value: `${Math.round(totalNew)} km new`,
    sub: `${pct}% of your total distance was on new routes`,
    color: 'green',
  }
}

/**
 * Dirt/gravel ratio
 */
function dirtRatio(activities) {
  const totalDirt = activities.reduce((s, a) => s + (a.dirtDistance || 0), 0) * 0.001
  if (totalDirt <= 0) return null
  const totalKm = activities.reduce((s, a) => s + a.distance * 0.001, 0)
  const pct = totalKm > 0 ? ((totalDirt / totalKm) * 100).toFixed(0) : 0
  return {
    icon: '🌲',
    title: 'Off-road share',
    value: `${Math.round(totalDirt)} km Gravel`,
    sub: `${pct}% of your distance was on unpaved terrain`,
    color: 'green',
  }
}

/**
 * Carbon saved — calculated from total distance
 * Average EU car: ~120g CO₂/km → cycling saves ~0.21 kg CO₂/km
 * (accounts for food production emissions of cycling)
 */
function carbonSaved(activities) {
  const totalKm = activities.reduce((s, a) => s + a.distance * 0.001, 0)
  if (totalKm <= 0) return null
  const co2Kg = totalKm * 0.21
  return {
    icon: '🌿',
    title: 'CO₂ saved',
    value: co2Kg >= 1000 ? `${(co2Kg / 1000).toFixed(1)} t` : `${Math.round(co2Kg)} kg`,
    sub: `~0.21 kg/km vs. driving (${Math.round(totalKm).toLocaleString('en-US')} km)`,
    color: 'green',
  }
}

/**
 * Power stats — prefers Normalized Power from GPS tracks when available,
 * falls back to avgWatts (Strava estimated virtual power).
 * Shows Variability Index (NP/avgWatts) for rides with real power meter data.
 */
function powerStats(activities) {
  const withPower = activities.filter(a => a.avgWatts > 0)
  if (withPower.length < 5) return null

  const avgPower = withPower.reduce((s, a) => s + a.avgWatts, 0) / withPower.length
  const best = withPower.reduce((b, a) => a.avgWatts > b.avgWatts ? a : b, withPower[0])

  // Real power meter rides: show NP and Variability Index
  const withNP = activities.filter(a => a.normalizedPower > 0 && a.avgWatts > 0)
  let sub = `Bester Ride: ${Math.round(best.avgWatts)} W (${best.name})`
  if (withNP.length >= 3) {
    const avgNP = withNP.reduce((s, a) => s + a.normalizedPower, 0) / withNP.length
    const avgVI = withNP.reduce((s, a) => s + (a.normalizedPower / a.avgWatts), 0) / withNP.length
    sub = `Avg NP: ${Math.round(avgNP)} W · VI: ${avgVI.toFixed(2)} · ${withNP.length} rides with power`
  }

  const label = withNP.length >= 3 ? 'Avg watts (estimated)' : 'Avg power'
  return {
    icon: '⚡',
    title: label,
    value: `${Math.round(avgPower)} W`,
    sub,
    color: 'blue',
  }
}

/**
 * Main export — returns array of insight objects
 */
export function generateInsights(activities) {
  if (!activities.length) return []

  const insights = [
    totalStats(activities),
    bestTemperatureRange(activities),
    headwindImpact(activities),
    bestDayOfWeek(activities),
    powerStats(activities),
    explorationStats(activities),
    dirtRatio(activities),
    carbonSaved(activities),
  ].filter(Boolean)

  return insights
}
