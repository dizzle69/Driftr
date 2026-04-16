import { useState, useRef } from 'react'
import JSZip from 'jszip'
import Papa from 'papaparse'
import { saveActivitiesToDb } from '../db/indexedDb'
import { analyzeWindImpact, calculateMaxSpeedFromGps } from '../utils/gpsCalc'

/** Limits reduce accidental browser OOM / UI freeze from huge exports (no server-side validation). */
const MAX_ZIP_FILE_BYTES = 700 * 1024 * 1024 // 700 MB archive
const MAX_CSV_ACTIVITIES = 30_000
const MAX_GPS_FILES_TO_PARSE = 4_000
const MAX_TRACK_FILE_BYTES = 45 * 1024 * 1024 // single GPX/FIT inside ZIP

/**
 * Calculate Normalized Power (NP) from GPS track points that include power values.
 * Algorithm: 30-second rolling average → raise to 4th power → mean → 4th root.
 * Assumes 1-second GPS recording (typical for Garmin/Wahoo with power meter).
 * Falls back gracefully when timestamps are missing or irregular.
 */
function calcNormalizedPower(points) {
  const powerPts = points.filter(p => p.power != null && p.power > 0)
  if (powerPts.length < 30) return 0

  const watts = powerPts.map(p => p.power)
  const window = 30
  const smoothed = []

  for (let i = window - 1; i < watts.length; i++) {
    let sum = 0
    for (let j = i - window + 1; j <= i; j++) sum += watts[j]
    smoothed.push(sum / window)
  }

  if (!smoothed.length) return 0
  const mean4th = smoothed.reduce((acc, v) => acc + Math.pow(v, 4), 0) / smoothed.length
  return Math.round(Math.pow(mean4th, 0.25))
}

export default function FileUploader({ onImportComplete, onTryDemo }) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState(null) // null | 'parsing' | 'error'
  const [progress, setProgress] = useState('')
  const inputRef = useRef()

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.zip')) {
      setStatus('error')
      setProgress('Please upload a .zip file (Strava export)')
      return
    }

    if (file.size > MAX_ZIP_FILE_BYTES) {
      setStatus('error')
      setProgress(
        `ZIP is too large (max ${Math.round(MAX_ZIP_FILE_BYTES / (1024 * 1024))} MB). Please choose a smaller export.`
      )
      return
    }

    setStatus('parsing')
    setProgress('Extracting ZIP...')

    try {
      const zip = await JSZip.loadAsync(file)

      // Find activities.csv (can be nested in folder)
      const csvFile = Object.values(zip.files).find(f =>
        f.name.endsWith('activities.csv')
      )
      if (!csvFile) throw new Error('activities.csv was not found in the ZIP')

      setProgress('Reading activities...')
      const csvText = await csvFile.async('string')

      const { data } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
      })

      if (data.length > MAX_CSV_ACTIVITIES) {
        throw new Error(
          `Too many rows in activities.csv (${data.length}). Maximum is ${MAX_CSV_ACTIVITIES}.`
        )
      }

      setProgress(`${data.length} activities found. Saving...`)

      // NOTE: PapaParse uses the FIRST of two duplicate 'Distance' columns.
      // That first column is already in km → multiply by 1000 to store as meters.
      // (Display code uses * 0.001 back to km, so this keeps everything consistent.)
      //
      // NOTE: Strava CSV already includes weather for most rides — read it directly.
      // Open-Meteo fallback (Phase 4) only needed for the few rows without weather.
      const activities = data.map((row, i) => {
        // Weather from CSV (already present for ~97% of rides)
        const csvWeather = row['Weather Temperature']
          ? {
              temperature: parseFloat(row['Weather Temperature']),
              apparentTemperature: parseFloat(row['Apparent Temperature'] || 0),
              windspeed: parseFloat(row['Wind Speed'] || 0),
              windgust: parseFloat(row['Wind Gust'] || 0),
              winddirection: parseFloat(row['Wind Bearing'] || 0),
              precipitation: parseFloat(row['Precipitation Intensity'] || 0),
              humidity: parseFloat(row['Humidity'] || 0),
              condition: row['Weather Condition'] || '',
              cloudCover: parseFloat(row['Cloud Cover'] || 0),
              uvIndex: parseFloat(row['UV Index'] || 0),
              source: 'csv',
            }
          : null

        // Parse start time into hour (0-23) for time-of-day analysis
        const startTimeRaw = row['Start Time']
        let startHour = null
        let startTimeEpoch = null
        if (startTimeRaw) {
          const epoch = parseFloat(startTimeRaw)
          if (!isNaN(epoch) && epoch > 0) {
            startHour = new Date(epoch * 1000).getHours()
            startTimeEpoch = epoch
          }
        }

        // Parse sunrise/sunset epochs
        const sunriseEpoch = parseFloat(row['Sunrise Time'] || 0)
        const sunsetEpoch = parseFloat(row['Sunset Time'] || 0)

        return {
          id: row['Activity ID'] || String(i),
          name: row['Activity Name'] || 'Unnamed',
          date: row['Activity Date'] || '',
          type: row['Activity Type'] || '',
          distance: parseFloat(row['Distance'] || 0) * 1000, // CSV km → meters
          movingTime: parseInt(row['Moving Time'] || 0),
          elapsedTime: parseInt(row['Elapsed Time'] || 0),
          elevationGain: parseFloat(row['Elevation Gain'] || 0),
          elevationLoss: parseFloat(row['Elevation Loss'] || 0),
          elevationLow: parseFloat(row['Elevation Low'] || 0),
          elevationHigh: parseFloat(row['Elevation High'] || 0),
          avgSpeed: parseFloat(row['Average Speed'] || 0), // m/s
          maxSpeed: parseFloat(row['Max Speed'] || 0),      // m/s
          avgHeartRate: parseFloat(row['Average Heart Rate'] || 0),
          maxHeartRate: parseFloat(row['Max Heart Rate'] || 0),
          avgCadence: parseFloat(row['Average Cadence'] || 0),
          maxCadence: parseFloat(row['Max Cadence'] || 0),
          // Power
          avgWatts: parseFloat(row['Average Watts'] || 0),
          maxWatts: parseFloat(row['Max Watts'] || 0),
          weightedAvgPower: parseFloat(row['Weighted Average Power'] || 0),
          totalWork: parseFloat(row['Total Work'] || 0),
          // Effort & calories
          calories: parseFloat(row['Calories'] || 0),
          relativeEffort: parseFloat(row['Relative Effort'] || 0),
          perceivedExertion: parseFloat(row['Perceived Exertion'] || 0),
          // Grades
          maxGrade: parseFloat(row['Max Grade'] || 0),
          avgPositiveGrade: parseFloat(row['Average Positive Grade'] || 0),
          avgNegativeGrade: parseFloat(row['Average Negative Grade'] || 0),
          // Time splits
          uphillTime: parseFloat(row['Uphill Time'] || 0),
          downhillTime: parseFloat(row['Downhill Time'] || 0),
          otherTime: parseFloat(row['Other Time'] || 0),
          // Exploration
          newlyExploredDistance: parseFloat(row['Newly Explored Distance'] || 0),
          dirtDistance: parseFloat(row['Dirt Distance'] || 0),
          carbonSaved: parseFloat(row['Carbon Saved'] || 0),
          // Time of day
          startHour,
          startTimeEpoch,
          sunriseEpoch: sunriseEpoch > 0 ? sunriseEpoch : null,
          sunsetEpoch: sunsetEpoch > 0 ? sunsetEpoch : null,
          // Meta
          commute: row['Commute'] === 'true',
          gear: row['Activity Gear'] || row['Bike'] || '',
          media: row['Media'] ? row['Media'].split('|').filter(Boolean) : [],
          filename: row['Filename'] || null,
          weather: csvWeather,
          windAnalysis: null, // calculated after GPS parsing (Phase 5)
          gpsTrack: null,     // populated after GPX/TCX parsing (Phase 2)
        }
      })

      // Filter out non-cycling + indoor (no GPS)
      const rides = activities.filter(a =>
        ['Ride', 'VirtualRide', 'EBikeRide'].includes(a.type) &&
        a.filename // skip manually entered activities without GPS file
      )

      // Parse GPX/FIT files from ZIP for GPS tracks + wind analysis.
      // Parsing is offloaded to a Web Worker to keep the UI responsive.
      const supportedRides = rides.filter(a => {
        const fn = (a.filename || '').toLowerCase()
        return fn.endsWith('.gpx') || fn.endsWith('.fit') || fn.endsWith('.fit.gz')
      })

      if (supportedRides.length > MAX_GPS_FILES_TO_PARSE) {
        throw new Error(
          `Too many GPS files (${supportedRides.length}). Maximum is ${MAX_GPS_FILES_TO_PARSE} per import.`
        )
      }

      const worker = new Worker(new URL('../workers/parseWorker.js', import.meta.url), { type: 'module' })
      let parsed = 0

      try {
        for (const ride of supportedRides) {
          const trackFile =
            zip.file(ride.filename) ||
            Object.values(zip.files).find(f => f.name === ride.filename)
          if (!trackFile) continue

          try {
            setProgress(`Parsing tracks... ${++parsed}/${supportedRides.length}`)

            const lower = String(ride.filename || '').toLowerCase()
            const content = lower.endsWith('.gpx')
              ? await trackFile.async('string')
              : await trackFile.async('arraybuffer')

            const byteSize =
              typeof content === 'string' ? new Blob([content]).size : content.byteLength
            if (byteSize > MAX_TRACK_FILE_BYTES) {
              console.warn(`Skip track (too large ${byteSize} B): ${ride.filename}`)
              continue
            }

            const track = await new Promise((resolve, reject) => {
              function onMessage(e) {
                const msg = e.data || {}
                if (msg.id !== ride.id) return
                worker.removeEventListener('message', onMessage)
                if (msg.error) reject(new Error(msg.error))
                else resolve(msg.result)
              }
              worker.addEventListener('message', onMessage)

              if (content instanceof ArrayBuffer) {
                worker.postMessage({ id: ride.id, filename: ride.filename, content }, [content])
              } else {
                worker.postMessage({ id: ride.id, filename: ride.filename, content })
              }
            })

            if (track?.points?.length > 0) {
              // Calculate smoothed max speed from FULL track before downsampling.
              const gpsMaxSpeed = calculateMaxSpeedFromGps(track.points)
              if (gpsMaxSpeed > 0) {
                ride.maxSpeedCsv = ride.maxSpeed   // original CSV value for reference
                ride.maxSpeed = gpsMaxSpeed         // GPS-derived, spike-filtered
              }

              // Store extension flags on activity
              ride.hasPowerTrack = track.hasPower
              ride.hasHrTrack = track.hasHR
              ride.hasCadenceTrack = track.hasCadence

              // Compute Normalized Power from full-res track if power data present.
              if (track.hasPower) {
                ride.normalizedPower = calcNormalizedPower(track.points)
                // Override empty CSV weightedAvgPower with GPS-derived NP
                if (!ride.weightedAvgPower && ride.normalizedPower > 0) {
                  ride.weightedAvgPower = ride.normalizedPower
                }
              }

              // Downsample: keep every 5th point for storage efficiency.
              // Power/HR/cad fields are included automatically (null-safe).
              const sampled = track.points.filter((_, i) => i % 5 === 0)
              ride.gpsTrack = { points: sampled, startLat: track.startLat, startLon: track.startLon }

              // Hoist GPS start coordinates to activity root (required by weatherApi + geocodingApi).
              ride.startLat = track.startLat
              ride.startLon = track.startLon

              // Wind analysis if weather data available
              if (ride.weather?.winddirection != null) {
                ride.windAnalysis = analyzeWindImpact(sampled, ride.weather.winddirection)
              }
            }
          } catch (e) {
            console.warn(`Track parse failed for ${ride.filename}:`, e.message)
          }
        }
      } finally {
        worker.terminate()
      }

      await saveActivitiesToDb(rides)
      setProgress(`Imported ${rides.length} rides (${parsed} tracks).`)
      setStatus(null)
      onImportComplete(rides)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setProgress(err.message)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center max-w-lg">
        <h2 className="text-3xl font-bold mb-2">Analyze your cycling activities</h2>
        <p className="text-gray-400">
          Upload an export ZIP (for example from Strava). Processing runs locally in your browser.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Strava → Settings → My Account → Download Archive
        </p>
        <p className="text-gray-600 text-xs mt-3 leading-relaxed">
          Driftr is independent and not affiliated with Strava. Strava is a trademark of its owner. You are responsible for the content and lawful use of your export.
        </p>
      </div>

      {typeof onTryDemo === 'function' && (
        <button
          type="button"
          onClick={onTryDemo}
          data-testid="btn-demo-data"
          className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm font-medium transition"
        >
          Try demo data
        </button>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full max-w-lg border-2 border-dashed rounded-xl p-12
          flex flex-col items-center gap-3 cursor-pointer transition
          ${isDragging ? 'border-strava bg-orange-950/20' : 'border-gray-700 hover:border-gray-500'}
        `}
      >
        <span className="text-4xl">📦</span>
        <p className="font-medium">Drop your ZIP here or click to upload</p>
        <p className="text-gray-500 text-sm">Strava export ZIP</p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {(status || progress) && (
        <div className={`text-sm px-4 py-2 rounded-lg ${
          status === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-300'
        }`}>
          {status === 'parsing' && <span className="mr-2 animate-spin inline-block">⏳</span>}
          {progress}
        </div>
      )}
    </div>
  )
}
