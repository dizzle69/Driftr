const MS_TO_KMH = 3.6
/** Avoid huge prompts when the filter includes thousands of rides (cost + context window). */
const MAX_ACTIVITIES_FOR_COACH = 2500

/**
 * Build a compact German text summary of the given activities for the AI coach context.
 * Keeps output under ~800 tokens. Uses the most recent rides if the list exceeds MAX_ACTIVITIES_FOR_COACH.
 */
export function buildCoachContext(activities) {
  if (!activities.length) return 'Keine Aktivitäten vorhanden.'

  const sorted = [...activities].sort((a, b) => new Date(a.date) - new Date(b.date))
  const slice =
    sorted.length > MAX_ACTIVITIES_FOR_COACH
      ? sorted.slice(-MAX_ACTIVITIES_FOR_COACH)
      : sorted
  const truncatedNote =
    sorted.length > MAX_ACTIVITIES_FOR_COACH
      ? `\n(Hinweis: es gibt ${sorted.length} Fahrten im Filter; für den Kontext werden die letzten ${MAX_ACTIVITIES_FOR_COACH} verwendet.)\n`
      : ''

  activities = slice

  const totalKm = activities.reduce((s, a) => s + a.distance * 0.001, 0)
  const totalHm = activities.reduce((s, a) => s + (a.elevationGain || 0), 0)
  const totalTime = activities.reduce((s, a) => s + (a.movingTime || 0), 0)
  const withSpeed = activities.filter(a => a.avgSpeed > 0)
  const avgSpeed = withSpeed.length
    ? withSpeed.reduce((s, a) => s + a.avgSpeed * MS_TO_KMH, 0) / withSpeed.length
    : 0
  const withHR = activities.filter(a => a.avgHeartRate > 0)
  const avgHR = withHR.length
    ? Math.round(withHR.reduce((s, a) => s + a.avgHeartRate, 0) / withHR.length)
    : null
  const withCad = activities.filter(a => a.avgCadence > 0)
  const avgCad = withCad.length
    ? Math.round(withCad.reduce((s, a) => s + a.avgCadence, 0) / withCad.length)
    : null
  const withWatts = activities.filter(a => a.avgWatts > 0)
  const avgWatts = withWatts.length
    ? Math.round(withWatts.reduce((s, a) => s + a.avgWatts, 0) / withWatts.length)
    : null

  // Monthly km (last 6 months)
  const monthlyKm = {}
  activities.forEach(a => {
    const key = a.date.slice(0, 7)
    monthlyKm[key] = (monthlyKm[key] || 0) + a.distance * 0.001
  })
  const monthKeys = Object.keys(monthlyKm).sort().slice(-6)
  const monthlyLines = monthKeys.map(k => `  ${k}: ${Math.round(monthlyKm[k])} km`).join('\n')

  // CTL/ATL/TSB (simplified — last computed values from the last 60 days)
  const withEffort = [...activities]
    .filter(a => a.relativeEffort > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  let ctl = 0, atl = 0
  withEffort.forEach(a => {
    ctl = ctl * (1 - 1 / 42) + a.relativeEffort * (1 / 42)
    atl = atl * (1 - 1 / 7) + a.relativeEffort * (1 / 7)
  })
  const tsb = ctl - atl

  // Personal records
  const longestRide = activities.reduce((best, a) => a.distance > (best?.distance || 0) ? a : best, null)
  const fastestRide = withSpeed.reduce((best, a) => a.avgSpeed > (best?.avgSpeed || 0) ? a : best, null)

  // Date range
  const dates = activities.map(a => new Date(a.date)).filter(d => !isNaN(d))
  const minDate = new Date(Math.min(...dates)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const maxDate = new Date(Math.max(...dates)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const lines = [
    `TRAININGSDATEN (${minDate} – ${maxDate})`,
    `Fahrten: ${activities.length}`,
    `Distanz gesamt: ${Math.round(totalKm).toLocaleString('de-DE')} km`,
    `Höhenmeter gesamt: ${Math.round(totalHm).toLocaleString('de-DE')} m`,
    `Fahrzeit gesamt: ${Math.round(totalTime / 3600)} h`,
    `Ø Geschwindigkeit: ${avgSpeed.toFixed(1)} km/h`,
    avgHR    ? `Ø Herzfrequenz: ${avgHR} bpm`       : null,
    avgCad   ? `Ø Trittfrequenz: ${avgCad} rpm`     : null,
    avgWatts ? `Ø Leistung: ${avgWatts} W`           : null,
    '',
    'MONATLICHE DISTANZ (letzte 6 Monate):',
    monthlyLines,
    '',
    'FITNESS-METRIKEN (CTL/ATL/TSB):',
    `CTL (Fitness, 42-Tage-EMA): ${ctl.toFixed(1)}`,
    `ATL (Erschöpfung, 7-Tage-EMA): ${atl.toFixed(1)}`,
    `TSB (Form = CTL−ATL): ${tsb > 0 ? '+' : ''}${tsb.toFixed(1)}`,
    '',
    'PERSÖNLICHE REKORDE:',
    longestRide ? `Längste Fahrt: ${(longestRide.distance * 0.001).toFixed(1)} km (${longestRide.name}, ${longestRide.date.slice(0, 10)})` : null,
    fastestRide ? `Schnellste Ø-Geschwindigkeit: ${(fastestRide.avgSpeed * MS_TO_KMH).toFixed(1)} km/h (${fastestRide.name})` : null,
  ]

  return truncatedNote + lines.filter(l => l !== null).join('\n')
}
