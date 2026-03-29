/**
 * Fictional demo dataset for onboarding (no ZIP export required).
 * Schema matches activities built from Strava CSV import (simplified).
 */
function pad2(n) {
  return String(n).padStart(2, '0')
}

function isoLocal(y, m, d, hour = 7, min = 30) {
  return `${y}-${pad2(m)}-${pad2(d)}T${pad2(hour)}:${pad2(min)}:00`
}

export function generateDemoActivities() {
  const rides = []
  let idx = 0
  // ~40 rides across ~10 months (Cologne-ish area, synthetic)
  const baseLat = 50.94
  const baseLon = 6.96

  for (let week = 0; week < 42; week++) {
    const day = 1 + (week % 28)
    const month = 1 + Math.floor(week / 4.2) % 10
    const year = 2025
    const season = month >= 11 || month <= 2 ? 'cold' : month >= 6 && month <= 8 ? 'warm' : 'mild'
    const tempBase = season === 'cold' ? 4 : season === 'warm' ? 24 : 14
    const temp = tempBase + (week % 5) - 2
    const windDir = [180, 270, 90, 200, 315][week % 5]
    const distanceM = 35000 + (week % 8) * 5000 + (week % 3) * 1200
    const movingTime = 3600 + (week % 6) * 600
    const elapsedTime = movingTime + 300 + (week % 4) * 120
    const avgSpeed = distanceM / movingTime
    const dateStr = isoLocal(year, Math.min(month, 12), Math.min(day, 28), 6 + (week % 3), 15 + (week % 4) * 10)
    const start = new Date(dateStr)
    const startTimeEpoch = Math.floor(start.getTime() / 1000)
    const startHour = start.getHours()

    const head = week % 7 === 0 ? 55 : week % 7 === 3 ? 22 : 35
    const tail = week % 7 === 3 ? 48 : 18
    const cross = 100 - head - tail

    rides.push({
      id: `demo-${idx}`,
      name: week % 5 === 0 ? 'Demo-Longride' : `Demo-Runde ${idx + 1}`,
      date: dateStr,
      type: 'Ride',
      distance: distanceM,
      movingTime,
      elapsedTime,
      elevationGain: 200 + (week % 9) * 40,
      elevationLoss: 180 + (week % 7) * 35,
      elevationLow: 40,
      elevationHigh: 220 + (week % 5) * 15,
      avgSpeed,
      maxSpeed: avgSpeed * 1.35,
      avgHeartRate: season === 'warm' ? 138 : 145,
      maxHeartRate: season === 'warm' ? 168 : 175,
      avgCadence: 82 + (week % 4),
      maxCadence: 98,
      avgWatts: week % 6 === 0 ? 185 + (week % 20) : 0,
      maxWatts: week % 6 === 0 ? 420 : 0,
      weightedAvgPower: week % 6 === 0 ? 190 : 0,
      totalWork: week % 6 === 0 ? movingTime * 180 : 0,
      calories: Math.round(movingTime * 0.2 * 12),
      relativeEffort: 40 + (week % 50) + (season === 'cold' ? 15 : 0),
      perceivedExertion: 0,
      maxGrade: 12,
      avgPositiveGrade: 3.2,
      avgNegativeGrade: -2.8,
      uphillTime: movingTime * 0.35,
      downhillTime: movingTime * 0.2,
      otherTime: movingTime * 0.45,
      newlyExploredDistance: week % 9 === 0 ? 2.5 : 0,
      dirtDistance: week % 11 === 0 ? 4 : 0,
      carbonSaved: 0,
      startHour,
      startTimeEpoch,
      sunriseEpoch: null,
      sunsetEpoch: null,
      commute: false,
      gear: 'Demo Bike',
      media: [],
      filename: null,
      weather: {
        temperature: temp,
        apparentTemperature: temp - 1,
        windspeed: 12 + (week % 8),
        windgust: 18 + (week % 10),
        winddirection: windDir,
        precipitation: week % 13 === 0 ? 0.4 : 0,
        humidity: 65,
        condition: week % 13 === 0 ? 'Leichter Regen' : 'Klar',
        cloudCover: week % 13 === 0 ? 80 : 30,
        uvIndex: season === 'warm' ? 6 : 2,
        source: 'demo',
        avgTemperature: temp,
        samples: {
          start: { temperature: temp - 0.5, windspeed: 11, winddirection: windDir, precipitation: 0 },
          mid: { temperature: temp, windspeed: 13, winddirection: (windDir + 20) % 360, precipitation: 0 },
          end: { temperature: temp + 0.5, windspeed: 14, winddirection: (windDir + 40) % 360, precipitation: 0 },
        },
      },
      windAnalysis: { headwindPct: head, tailwindPct: tail, crosswindPct: cross },
      gpsTrack: null,
      startLat: baseLat + (week % 10) * 0.01,
      startLon: baseLon + (week % 8) * 0.012,
      startLocation: 'Köln (Demo)',
    })
    idx++
  }

  return rides
}
