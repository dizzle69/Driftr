// Dispatch GPX vs FIT parsing and normalize to a common format
// Called from Web Worker (see workers/parseWorker.js)

import GpxParser from 'gpxparser'

/**
 * Normalized GPS point format
 * @typedef {{ lat: number, lon: number, ele: number, time: string, power: number|null, hr: number|null, cad: number|null }} GpsPoint
 */

/**
 * Extract a numeric value from an XML element by trying multiple tag names.
 * Uses getElementsByTagName which matches local names regardless of namespace prefix.
 */
function extractExt(extEl, ...tagNames) {
  for (const name of tagNames) {
    const found = extEl.getElementsByTagName(name)[0]
    if (found?.textContent) {
      const v = parseFloat(found.textContent)
      return isNaN(v) ? null : v
    }
  }
  return null
}

/**
 * Parse a GPX file string into normalized GPS track.
 * Extracts power, HR, and cadence from Garmin TrainingPeaks extensions when present.
 *
 * Supports both Strava GPX extension formats:
 *   Format A (modern):  <gpxtpx:TrackPointExtension><gpxtpx:hr>145</gpxtpx:hr>...
 *   Format B (legacy):  <power>250</power> directly inside <extensions>
 *
 * @param {string} gpxString
 * @returns {{ points: GpsPoint[], startLat: number, startLon: number, hasPower: boolean, hasHR: boolean, hasCadence: boolean }}
 */
export function parseGpx(gpxString) {
  const gpx = new GpxParser()
  gpx.parse(gpxString)

  if (!gpx.tracks.length) {
    return { points: [], startLat: null, startLon: null, hasPower: false, hasHR: false, hasCadence: false }
  }

  // Parse extensions via DOMParser (browser API) — gracefully skipped if unavailable
  let extData = []
  if (typeof DOMParser !== 'undefined') {
    try {
      const dom = new DOMParser().parseFromString(gpxString, 'text/xml')
      const trkpts = dom.getElementsByTagName('trkpt')

      extData = Array.from(trkpts).map(trkpt => {
        const extEls = trkpt.getElementsByTagName('extensions')
        if (!extEls.length) return {}
        const ext = extEls[0]

        return {
          // power: directly in <extensions> (legacy) OR nested in TrackPointExtension
          power: extractExt(ext, 'power', 'PowerInWatts'),
          // hr: always nested in gpxtpx:TrackPointExtension as <gpxtpx:hr>
          hr: extractExt(ext, 'hr', 'HeartRateBpm'),
          // cadence: <gpxtpx:cad>
          cad: extractExt(ext, 'cad', 'Cadence'),
        }
      })
    } catch {
      // Extension parsing is best-effort — silently skip on any error
    }
  }

  const rawPoints = gpx.tracks[0].points
  const points = rawPoints.map((p, i) => ({
    lat: p.lat,
    lon: p.lon,
    ele: p.ele ?? null,
    time: p.time?.toISOString() ?? null,
    power: extData[i]?.power ?? null,
    hr:    extData[i]?.hr    ?? null,
    cad:   extData[i]?.cad   ?? null,
  }))

  const hasPower    = points.some(p => p.power != null)
  const hasHR       = points.some(p => p.hr    != null)
  const hasCadence  = points.some(p => p.cad   != null)

  return {
    points,
    startLat: points[0]?.lat ?? null,
    startLon: points[0]?.lon ?? null,
    hasPower,
    hasHR,
    hasCadence,
  }
}

/**
 * Parse a FIT file (ArrayBuffer) into normalized GPS track
 * @param {ArrayBuffer} buffer
 * @returns {{ points: GpsPoint[], startLat: number, startLon: number, hasPower: boolean, hasHR: boolean, hasCadence: boolean }}
 */
export async function parseFit(buffer) {
  // Dynamic import — fit-file-parser is chunky, load on demand
  const { default: FitParser } = await import('fit-file-parser')

  return new Promise((resolve, reject) => {
    const parser = new FitParser({ force: true, speedUnit: 'km/h', lengthUnit: 'm' })

    parser.parse(buffer, (err, data) => {
      if (err) return reject(err)

      const records = data.records ?? []
      const points = records
        .filter(r => r.position_lat != null && r.position_long != null)
        .map(r => ({
          lat:   r.position_lat,
          lon:   r.position_long,
          ele:   r.altitude ?? null,
          time:  r.timestamp?.toISOString() ?? null,
          power: r.power        != null ? r.power        : null,
          hr:    r.heart_rate   != null ? r.heart_rate   : null,
          cad:   r.cadence      != null ? r.cadence      : null,
        }))

      const hasPower   = points.some(p => p.power != null)
      const hasHR      = points.some(p => p.hr    != null)
      const hasCadence = points.some(p => p.cad   != null)

      resolve({
        points,
        startLat: points[0]?.lat ?? null,
        startLon: points[0]?.lon ?? null,
        hasPower,
        hasHR,
        hasCadence,
      })
    })
  })
}

/**
 * Detect format and parse accordingly
 * @param {string} filename
 * @param {string|ArrayBuffer} content - string for GPX, ArrayBuffer for FIT
 */
export async function parseActivityFile(filename, content) {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.gpx')) {
    return parseGpx(content)
  }
  if (lower.endsWith('.fit.gz')) {
    const ds = new DecompressionStream('gzip')
    const writer = ds.writable.getWriter()
    writer.write(new Uint8Array(content))
    writer.close()
    const decompressed = await new Response(ds.readable).arrayBuffer()
    return parseFit(decompressed)
  }
  if (lower.endsWith('.fit')) {
    return parseFit(content)
  }

  throw new Error(`Unsupported file format: ${filename}`)
}
