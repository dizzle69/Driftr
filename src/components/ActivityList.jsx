import { useState, useMemo, Fragment } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { haversineDistance } from '../utils/gpsCalc'

const METERS_TO_KM = 0.001
const MS_TO_KMH = 3.6

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const WIND_DIR_LABELS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW']

function degToCompass(deg) {
  if (deg == null || !Number.isFinite(deg)) return '—'
  return WIND_DIR_LABELS[Math.round(deg / 22.5) % 16]
}

function WindBadge({ windAnalysis }) {
  if (!windAnalysis) return <span className="text-gray-600 text-xs">—</span>
  const { headwindPct } = windAnalysis
  const color = headwindPct > 50 ? 'text-red-400' : headwindPct > 25 ? 'text-yellow-400' : 'text-green-400'
  return <span className={`text-xs font-mono ${color}`}>{headwindPct}% GW</span>
}

// Column definitions for sorting
const COLUMNS = [
  { key: 'date',     label: 'Datum',   align: 'left' },
  { key: 'name',     label: 'Name',    align: 'left' },
  { key: 'location', label: 'Ort',     align: 'left' },
  { key: 'distance', label: 'Distanz', align: 'right' },
  { key: 'movingTime', label: 'Zeit', align: 'right' },
  { key: 'avgSpeed', label: 'Ø Speed', align: 'right' },
  { key: 'elevationGain', label: 'Hm', align: 'right' },
  { key: 'avgWatts', label: 'Ø W', align: 'right' },
  { key: 'avgHeartRate', label: 'HR', align: 'right' },
  { key: 'temperature', label: 'Temp', align: 'right' },
  { key: 'headwind', label: 'Wind', align: 'right' },
]

function getSortValue(activity, key) {
  switch (key) {
    case 'date': return new Date(activity.date).getTime() || 0
    case 'name': return activity.name.toLowerCase()
    case 'location': return (activity.startLocation || '').toLowerCase()
    case 'temperature': return activity.weather?.temperature ?? -999
    case 'headwind': return activity.windAnalysis?.headwindPct ?? -1
    default: return activity[key] || 0
  }
}

function SortArrow({ direction }) {
  return (
    <span className="ml-1 text-strava">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
  )
}

// Wind bar component for detail view
function WindBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-20">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-300 text-xs w-10 text-right">{pct}%</span>
    </div>
  )
}

/**
 * Elevation + Speed (or Power) profile chart built from GPS track points.
 * X-axis = cumulative distance (km), Left Y = elevation (m), Right Y = speed km/h or watts.
 */
function RideProfile({ activity }) {
  const [mode, setMode] = useState('speed') // 'speed' | 'power'
  const track = activity.gpsTrack
  const hasPower = activity.hasPowerTrack

  const chartData = useMemo(() => {
    const pts = track?.points
    if (!pts?.length) return []
    const rows = []
    let cumDist = 0
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      if (i > 0) {
        cumDist += haversineDistance(pts[i - 1].lat, pts[i - 1].lon, p.lat, p.lon) * METERS_TO_KM
      }
      let speed = null
      if (i > 0 && p.time && pts[i - 1].time) {
        const dt = (new Date(p.time) - new Date(pts[i - 1].time)) / 1000
        if (dt > 0 && dt < 300) {
          const dist = haversineDistance(pts[i - 1].lat, pts[i - 1].lon, p.lat, p.lon)
          speed = Math.min((dist / dt) * MS_TO_KMH, 80)
        }
      }
      rows.push({
        dist: parseFloat(cumDist.toFixed(2)),
        ele: p.ele != null ? Math.round(p.ele) : null,
        speed: speed != null ? parseFloat(speed.toFixed(1)) : null,
        power: p.power ?? null,
      })
    }
    return rows.filter(d => d.ele != null)
  }, [track])

  if (!track?.points?.length) return null

  const showPower = hasPower && mode === 'power'
  const rightKey   = showPower ? 'power' : 'speed'
  const rightLabel = showPower ? 'Watt' : 'km/h'
  const rightColor = showPower ? '#FC4C02' : '#60a5fa'

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Profil</span>
        {hasPower && (
          <div className="flex gap-1">
            {['speed','power'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  mode === m ? 'bg-strava text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {m === 'speed' ? 'Speed' : 'Power'}
              </button>
            ))}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="dist"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={v => `${v} km`}
          />
          <YAxis
            yAxisId="ele"
            orientation="left"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={v => `${v}m`}
            width={45}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={v => `${v}`}
            width={40}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af', fontSize: 11 }}
            labelFormatter={v => `${v} km`}
            formatter={(val, name) =>
              name === 'Höhe' ? [`${val} m`, name]
              : [`${val} ${rightLabel}`, name]
            }
          />
          <Area
            yAxisId="ele"
            type="monotone"
            dataKey="ele"
            name="Höhe"
            fill="#374151"
            stroke="#6b7280"
            strokeWidth={1}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={rightKey}
            name={rightLabel}
            stroke={rightColor}
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function DetailPanel({ activity }) {
  const a = activity
  const km = (a.distance * METERS_TO_KM).toFixed(1)
  const speed = (a.avgSpeed * MS_TO_KMH).toFixed(1)
  const maxSpd = (a.maxSpeed * MS_TO_KMH).toFixed(1)

  // Show GPS-spike warning when original CSV value was >20% higher than smoothed GPS value
  const csvMaxSpd = a.maxSpeedCsv ? (a.maxSpeedCsv * MS_TO_KMH).toFixed(1) : null
  const spikeFiltered = csvMaxSpd && a.maxSpeedCsv > a.maxSpeed * 1.2

  const maxSpeedValue = spikeFiltered ? (
    <span className="flex items-center gap-1.5">
      {maxSpd} km/h
      <span
        title={`GPS-Spike gefiltert. Strava CSV: ${csvMaxSpd} km/h`}
        className="text-yellow-400 text-xs cursor-help"
      >
        ⚠️ GPS
      </span>
    </span>
  ) : `${maxSpd} km/h`

  return (
    <div className="p-5 bg-gray-900/50">
      <RideProfile activity={a} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Stats */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Leistung</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Stat label="Distanz" value={`${km} km`} />
          <Stat label="Dauer" value={formatDuration(a.movingTime)} />
          <Stat label="Ø Speed" value={`${speed} km/h`} />
          <Stat label="Max Speed" value={maxSpeedValue} />
          <Stat label="Höhenmeter" value={a.elevationGain > 0 ? `${Math.round(a.elevationGain)} m` : '—'} />
          <Stat label="Max Steigung" value={a.maxGrade > 0 ? `${a.maxGrade.toFixed(1)}%` : '—'} />
          <Stat label="Ø Watt" value={a.avgWatts > 0 ? `${Math.round(a.avgWatts)} W` : '—'} />
          <Stat label="Max Watt" value={a.maxWatts > 0 ? `${Math.round(a.maxWatts)} W` : '—'} />
          <Stat label="Ø HR" value={a.avgHeartRate > 0 ? `${Math.round(a.avgHeartRate)} bpm` : '—'} />
          <Stat label="Max HR" value={a.maxHeartRate > 0 ? `${Math.round(a.maxHeartRate)} bpm` : '—'} />
          <Stat label="Startort" value={a.startLocation || '—'} />
          <Stat label="Kalorien" value={a.calories > 0 ? `${Math.round(a.calories)} kcal` : '—'} />
          <Stat label="Rel. Effort" value={a.relativeEffort > 0 ? Math.round(a.relativeEffort) : '—'} />
        </div>
      </div>

      {/* Weather */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Wetter</h4>
        {a.weather ? (
          <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Stat label="Temperatur" value={`${Math.round(a.weather.temperature)}°C`} />
            <Stat label="Gefühlt" value={a.weather.apparentTemperature ? `${Math.round(a.weather.apparentTemperature)}°C` : '—'} />
            <Stat label="Wind" value={a.weather.windspeed ? `${Math.round(a.weather.windspeed)} km/h` : '—'} />
            <Stat label="Böen" value={a.weather.windgust ? `${Math.round(a.weather.windgust)} km/h` : '—'} />
            <Stat label="Luftfeuchte" value={a.weather.humidity ? `${Math.round(a.weather.humidity)}%` : '—'} />
            <Stat label="Bewölkung" value={a.weather.cloudCover != null ? `${Math.round(a.weather.cloudCover)}%` : '—'} />
            <Stat label="UV-Index" value={a.weather.uvIndex > 0 ? a.weather.uvIndex : '—'} />
            <Stat label="Niederschlag" value={a.weather.precipitation > 0 ? `${a.weather.precipitation} mm` : '—'} />
            {a.weather.condition && (
              <div className="col-span-2 text-gray-400 text-xs mt-1">{a.weather.condition}</div>
            )}
          </div>
          {a.weather.samples && (
            <div className="mt-4">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Stichproben (Start/Mitte/Ende)
              </h5>
              <div className="grid grid-cols-3 gap-3">
                {(['start', 'mid', 'end']).map(k => {
                  const s = a.weather.samples?.[k]
                  if (!s) return null
                  const temp = s.temperature != null ? `${Math.round(s.temperature)}°C` : '—'
                  const windDir = s.winddirection != null ? `${Math.round(s.winddirection)}° ${degToCompass(s.winddirection)}` : '—'
                  const windSpeed = s.windspeed != null ? `${Math.round(s.windspeed)} km/h` : '—'
                  const label = k === 'start' ? 'Start' : k === 'mid' ? 'Mitte' : 'Ende'
                  return (
                    <div key={k} className="bg-gray-800/40 border border-gray-700 rounded-lg px-3 py-2">
                      <div className="text-xs font-semibold text-gray-200 mb-1">{label}</div>
                      <div className="text-xs text-gray-300">Temp: {temp}</div>
                      <div className="text-xs text-gray-300">Wind: {windSpeed}</div>
                      <div className="text-xs text-gray-300">Richtung: {windDir}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          </>
        ) : (
          <p className="text-gray-600 text-sm">Keine Wetterdaten</p>
        )}
      </div>

      {/* Wind Analysis */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Windanalyse</h4>
        {a.windAnalysis ? (
          <div className="space-y-3">
            <WindBar label="Gegenwind" pct={a.windAnalysis.headwindPct} color="bg-red-500" />
            <WindBar label="Rückenwind" pct={a.windAnalysis.tailwindPct} color="bg-green-500" />
            <WindBar label="Seitenwind" pct={a.windAnalysis.crosswindPct} color="bg-yellow-500" />
          </div>
        ) : (
          <p className="text-gray-600 text-sm">Keine Windanalyse (kein GPS-Track)</p>
        )}

        {a.gear && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ausrüstung</h4>
            <p className="text-gray-300 text-sm">{a.gear}</p>
          </div>
        )}
      </div>
      </div> {/* end grid */}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <span className="text-gray-500 text-xs">{label}</span>
      <div className="text-gray-200">{value}</div>
    </div>
  )
}

export default function ActivityList({ activities, selected, onSelect }) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })

  const sorted = useMemo(() => {
    const { key, direction } = sortConfig
    return [...activities].sort((a, b) => {
      const va = getSortValue(a, key)
      const vb = getSortValue(b, key)
      if (va < vb) return direction === 'asc' ? -1 : 1
      if (va > vb) return direction === 'asc' ? 1 : -1
      return 0
    })
  }, [activities, sortConfig])

  function handleSort(key) {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' }
    )
  }

  if (!activities.length) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Alle Rides <span className="text-gray-500 font-normal text-sm">({activities.length})</span>
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-left">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 font-medium cursor-pointer hover:text-gray-300 transition select-none ${
                    col.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {col.label}
                  {sortConfig.key === col.key && <SortArrow direction={sortConfig.direction} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <Fragment key={a.id}>
                <tr
                  onClick={() => onSelect(a.id === selected ? null : a.id)}
                  className={`
                    border-b border-gray-800/50 cursor-pointer transition
                    ${a.id === selected ? 'bg-gray-800' : 'hover:bg-gray-900'}
                  `}
                >
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{a.name}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {a.startLocation || <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {(a.distance * METERS_TO_KM).toFixed(1)} km
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {formatDuration(a.movingTime)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {(a.avgSpeed * MS_TO_KMH).toFixed(1)} km/h
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {a.elevationGain > 0 ? `${Math.round(a.elevationGain)}m` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {a.avgWatts > 0 ? `${Math.round(a.avgWatts)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {a.avgHeartRate > 0 ? `${Math.round(a.avgHeartRate)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {a.weather?.temperature ? `${Math.round(a.weather.temperature)}°` : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <WindBadge windAnalysis={a.windAnalysis} />
                  </td>
                </tr>
                {a.id === selected && (
                  <tr className="border-b border-gray-800/50">
                    <td colSpan={11}>
                      <DetailPanel activity={a} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
