// GPS calculations: bearing, wind classification, segment analysis

/**
 * Calculate compass bearing from point A to point B (0–360°)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => deg * (Math.PI / 180)
  const toDeg = (rad) => rad * (180 / Math.PI)
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/**
 * Classify wind relative to travel direction
 * @returns {'headwind' | 'tailwind' | 'crosswind'}
 */
export function classifyWind(travelBearing, windDirection) {
  const angle = Math.abs(travelBearing - windDirection) % 360
  const normalized = angle > 180 ? 360 - angle : angle
  if (normalized < 45) return 'headwind'
  if (normalized > 135) return 'tailwind'
  return 'crosswind'
}

/**
 * Haversine distance between two GPS points in meters
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg) => deg * (Math.PI / 180)
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calculate smoothed max speed from GPS track points.
 * Uses 3-point moving average to filter GPS spikes.
 * @param {Array<{lat, lon, time}>} points - GPS track points with timestamps
 * @returns {number} max speed in m/s, or 0 if not enough data
 */
export function calculateMaxSpeedFromGps(points) {
  if (!points || points.length < 3) return 0

  // Calculate raw segment speeds (m/s)
  const speeds = []
  for (let i = 1; i < points.length; i++) {
    const t1 = new Date(points[i - 1].time).getTime()
    const t2 = new Date(points[i].time).getTime()
    const dt = (t2 - t1) / 1000 // seconds
    if (dt <= 0 || dt > 300) continue // skip bad timestamps or pauses > 5min

    const dist = haversineDistance(
      points[i - 1].lat, points[i - 1].lon,
      points[i].lat, points[i].lon
    )
    speeds.push(dist / dt)
  }

  if (speeds.length < 3) return 0

  // 3-point moving average to smooth GPS noise
  let maxSmoothed = 0
  for (let i = 1; i < speeds.length - 1; i++) {
    const avg = (speeds[i - 1] + speeds[i] + speeds[i + 1]) / 3
    if (avg > maxSmoothed) maxSmoothed = avg
  }

  return maxSmoothed
}

/**
 * Analyze wind impact across entire GPS track
 * @param {Array<{lat, lon}>} points - GPS track points
 * @param {number} windDirection - degrees (0–360)
 * @returns {{ headwindPct: number, tailwindPct: number, crosswindPct: number }}
 */
export function analyzeWindImpact(points, windDirection) {
  if (!points || points.length < 2 || windDirection == null) return null

  const counts = { headwind: 0, tailwind: 0, crosswind: 0 }

  for (let i = 1; i < points.length; i++) {
    const bearing = calculateBearing(
      points[i - 1].lat, points[i - 1].lon,
      points[i].lat, points[i].lon
    )
    const classification = classifyWind(bearing, windDirection)
    counts[classification]++
  }

  const total = counts.headwind + counts.tailwind + counts.crosswind
  if (total === 0) return null

  return {
    headwindPct: Math.round((counts.headwind / total) * 100),
    tailwindPct: Math.round((counts.tailwind / total) * 100),
    crosswindPct: Math.round((counts.crosswind / total) * 100),
  }
}
