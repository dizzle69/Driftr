import { useMemo, useState } from 'react'
import InfoTooltip from './InfoTooltip'
import PowerCurve from './PowerCurve'
import {
  BarChart, Bar, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  ComposedChart,
} from 'recharts'

const MS_TO_KMH = 3.6
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR_COLORS = ['#FC4C02', '#3b82f6', '#10b981', '#f59e0b']

const tooltipStyle = { background: '#111827', border: '1px solid #374151', borderRadius: 8 }

function formatWeekLabel(v) {
  // v is "YYYY-Www" — convert to "Jan 1" style
  const parts = v.split('-W')
  if (parts.length !== 2) return v
  const year = Number(parts[0])
  const week = Number(parts[1])
  // ISO week 1 starts on the Monday containing Jan 4
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Mon=1 … Sun=7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - (dayOfWeek - 1) + (week - 1) * 7)
  return weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

export default function DashboardCharts({ activities }) {
  // --- Weekly volume ---
  const weeklyData = useMemo(() => {
    const weeks = {}
    activities.forEach(a => {
      const d = new Date(a.date)
      const week = `${d.getFullYear()}-W${String(Math.ceil(
        (d - new Date(d.getFullYear(), 0, 1)) / 604800000
      )).padStart(2, '0')}`
      if (!weeks[week]) weeks[week] = { week, km: 0, rides: 0 }
      weeks[week].km += (a.distance * 0.001)
      weeks[week].rides++
    })
    return Object.values(weeks).slice(-24)
  }, [activities])

  // --- Speed vs Temperature ---
  const tempSpeedData = useMemo(() => {
    return activities
      .filter(a => {
        const t = a.weather?.avgTemperature ?? a.weather?.temperature
        return t != null && a.avgSpeed > 0
      })
      .map(a => ({
        temp: Math.round(a.weather.avgTemperature ?? a.weather.temperature),
        speed: parseFloat((a.avgSpeed * MS_TO_KMH).toFixed(1)),
        name: a.name,
      }))
  }, [activities])

  // --- Ride Duration Breakdown ---
  const durationData = useMemo(() => {
    return activities
      .filter(a => a.uphillTime > 0 || a.downhillTime > 0 || a.otherTime > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(a => ({
        name: a.name,
        date: new Date(a.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        uphill: Math.round(a.uphillTime / 60),
        downhill: Math.round(a.downhillTime / 60),
        flat: Math.round(a.otherTime / 60),
      }))
  }, [activities])

  // --- Exploration cumulative ---
  const explorationData = useMemo(() => {
    const sorted = activities
      .filter(a => a.newlyExploredDistance > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
    if (sorted.length === 0) return []
    let cumulative = 0
    return sorted.map(a => {
      cumulative += a.newlyExploredDistance * 0.001
      return {
        date: new Date(a.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
        newKm: parseFloat(cumulative.toFixed(1)),
        name: a.name,
      }
    })
  }, [activities])

  // --- Calorie & Effort Trends ---
  const weeklyCalorieData = useMemo(() => {
    const weeks = {}
    activities.forEach(a => {
      if (!a.calories && !a.relativeEffort) return
      const d = new Date(a.date)
      const week = `${d.getFullYear()}-W${String(Math.ceil(
        (d - new Date(d.getFullYear(), 0, 1)) / 604800000
      )).padStart(2, '0')}`
      if (!weeks[week]) weeks[week] = { week, calories: 0, efforts: [], rides: 0 }
      weeks[week].calories += (a.calories || 0)
      if (a.relativeEffort > 0) weeks[week].efforts.push(a.relativeEffort)
      weeks[week].rides++
    })
    return Object.values(weeks)
      .map(w => ({
        week: w.week,
        calories: Math.round(w.calories),
        avgEffort: w.efforts.length > 0
          ? Math.round(w.efforts.reduce((a, b) => a + b, 0) / w.efforts.length)
          : null,
      }))
      .slice(-24)
  }, [activities])

  const hasCalorieData = weeklyCalorieData.some(w => w.calories > 0)

  // --- Monthly Progression ---
  const monthlyData = useMemo(() => {
    const months = {}
    activities.forEach(a => {
      const d = new Date(a.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) months[key] = { month: key, km: 0, speeds: [], watts: [], rides: 0 }
      months[key].km += a.distance * 0.001
      if (a.avgSpeed > 0) months[key].speeds.push(a.avgSpeed * MS_TO_KMH)
      if (a.avgWatts > 0) months[key].watts.push(a.avgWatts)
      months[key].rides++
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        month: m.month,
        km: Math.round(m.km),
        avgSpeed: m.speeds.length > 0
          ? parseFloat((m.speeds.reduce((a, b) => a + b, 0) / m.speeds.length).toFixed(1))
          : null,
        avgWatts: m.watts.length > 0
          ? Math.round(m.watts.reduce((a, b) => a + b, 0) / m.watts.length)
          : null,
        rides: m.rides,
      }))
  }, [activities])

  const hasPowerTrend = monthlyData.filter(m => m.avgWatts != null).length >= 3

  // --- Power Zone Distribution ---
  const [ftp, setFtp] = useState(() => parseInt(localStorage.getItem('ftp') || '200'))
  const handleFtpChange = (v) => {
    const n = Math.max(50, Math.min(500, parseInt(v) || 200))
    setFtp(n)
    localStorage.setItem('ftp', String(n))
  }

  const powerZoneData = useMemo(() => {
    const trackedRides = activities.filter(a => a.hasPowerTrack && a.gpsTrack?.points?.length)
    if (trackedRides.length < 2) return []

    const zones = [
      { name: 'Z1 Recovery',   color: '#6b7280', min: 0,    max: 0.55 },
      { name: 'Z2 Endurance',  color: '#3b82f6', min: 0.55, max: 0.75 },
      { name: 'Z3 Tempo',      color: '#10b981', min: 0.75, max: 0.90 },
      { name: 'Z4 Threshold',  color: '#f59e0b', min: 0.90, max: 1.05 },
      { name: 'Z5 VO2max',     color: '#ef4444', min: 1.05, max: Infinity },
    ]

    const counts = zones.map(() => 0)
    let total = 0

    trackedRides.forEach(a => {
      a.gpsTrack.points.forEach(p => {
        if (p.power == null) return
        total++
        const pct = p.power / ftp
        const idx = zones.findIndex(z => pct >= z.min && pct < z.max)
        if (idx >= 0) counts[idx]++
      })
    })

    if (total === 0) return []
    return zones.map((z, i) => ({
      name: z.name,
      color: z.color,
      pct: Math.round((counts[i] / total) * 100),
    })).filter(z => z.pct > 0)
  }, [activities, ftp])

  const hasPowerZones = powerZoneData.length > 0

  // --- Year-over-Year Monthly Comparison ---
  const yoyData = useMemo(() => {
    const yearSet = new Set(activities.map(a => new Date(a.date).getFullYear()))
    const years = [...yearSet].sort()
    if (years.length < 2) return { data: [], years: [] }

    const byMonthYear = {}
    activities.forEach(a => {
      const d = new Date(a.date)
      const month = d.getMonth()   // 0–11
      const year = d.getFullYear()
      if (!byMonthYear[month]) byMonthYear[month] = { month: MONTHS_EN[month] }
      byMonthYear[month][year] = Math.round((byMonthYear[month][year] || 0) + a.distance * 0.001)
    })

    const data = Array.from({ length: 12 }, (_, i) => ({
      month: MONTHS_EN[i],
      ...(byMonthYear[i] || {}),
    }))

    return { data, years }
  }, [activities])

  const hasYoY = yoyData.years.length >= 2

  // --- Cadence Trend ---
  const cadenceData = useMemo(() => {
    const months = {}
    activities.forEach(a => {
      if (!a.avgCadence || a.avgCadence <= 0) return
      const d = new Date(a.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) months[key] = { month: key, values: [] }
      months[key].values.push(a.avgCadence)
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        month: m.month,
        avgCadence: Math.round(m.values.reduce((s, v) => s + v, 0) / m.values.length),
      }))
  }, [activities])

  const hasCadenceData = activities.filter(a => a.avgCadence > 0).length >= 5

  // --- Heart Rate Trend ---
  const hrData = useMemo(() => {
    const months = {}
    activities.forEach(a => {
      if (!a.avgHeartRate || a.avgHeartRate <= 0) return
      const d = new Date(a.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!months[key]) months[key] = { month: key, values: [] }
      months[key].values.push(a.avgHeartRate)
    })
    return Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        month: m.month,
        avgHR: Math.round(m.values.reduce((s, v) => s + v, 0) / m.values.length),
      }))
  }, [activities])

  const hasHRData = activities.filter(a => a.avgHeartRate > 0).length >= 5

  return (
    <div className="space-y-8">
      {/* Weekly Volume */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-200">
          Weekly volume <span className="text-gray-500 font-normal text-sm">(last 24 weeks)</span>
          <InfoTooltip text="Weekly distance and ride count over the last 24 weeks." />
        </h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="week"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickLine={false}
                tickFormatter={formatWeekLabel}
                interval={3}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" km" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                labelFormatter={(v) => formatWeekLabel(v)}
                formatter={(v) => [`${v.toFixed(0)} km`, 'Distance']} />
              <Bar dataKey="km" fill="#FC4C02" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Progression */}
      {monthlyData.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Monthly progression<InfoTooltip text="Monthly total distance, average speed, and optional power (watts)." /></h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis yAxisId="km" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" km" />
                <YAxis yAxisId="speed" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" km/h" />
                {hasPowerTrend && (
                  <YAxis yAxisId="watts" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" W" width={48} />
                )}
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar yAxisId="km" dataKey="km" fill="#FC4C02" radius={[4, 4, 0, 0]} name="Distance (km)" />
                <Line yAxisId="speed" dataKey="avgSpeed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Avg speed (km/h)" />
                {hasPowerTrend && (
                  <Line yAxisId="watts" dataKey="avgWatts" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="Avg watts" strokeDasharray="4 2" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Speed vs Temperature */}
      {tempSpeedData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Speed vs temperature<InfoTooltip text="Relationship between outside temperature and average speed per ride." /></h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="temp" type="number" name="Temperature" unit="°C" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis dataKey="speed" type="number" name="Speed" unit=" km/h" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle}
                  formatter={(v, name) => name === 'Temperature' ? [`${v}°C`, name] : [`${v} km/h`, name]} />
                <Scatter data={tempSpeedData} fill="#FC4C02" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Ride Duration Breakdown */}
      {durationData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Ride time breakdown<InfoTooltip text="Time share per ride split into uphill, downhill, and flat sections (in minutes)." /></h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={durationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" min" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  formatter={(v, name) => [`${v} min`, name]} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="uphill" stackId="time" fill="#FC4C02" name="Uphill" />
                <Bar dataKey="downhill" stackId="time" fill="#3b82f6" name="Downhill" />
                <Bar dataKey="flat" stackId="time" fill="#4b5563" name="Flat" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cumulative Exploration */}
      {explorationData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">New routes discovered<InfoTooltip text="Cumulative newly explored kilometers over time — routes you rode for the first time." /></h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={explorationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" km" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  formatter={(v) => [`${v} km`, 'New km total']} />
                <Line dataKey="newKm" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="New km total" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Calorie & Effort Trends */}
      {hasCalorieData && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Calories & effort per week<InfoTooltip text="Weekly calorie burn and average relative training effort (Strava Relative Effort)." /></h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={weeklyCalorieData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false}
                  tickFormatter={formatWeekLabel} interval={3} />
                <YAxis yAxisId="cal" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" kcal" />
                <YAxis yAxisId="effort" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  labelFormatter={(v) => formatWeekLabel(v)} />
                <Bar yAxisId="cal" dataKey="calories" fill="#ef4444" opacity={0.7} radius={[4, 4, 0, 0]} name="Calories" />
                <Line yAxisId="effort" dataKey="avgEffort" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="Avg Relative Effort" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Power Zone Distribution — only for users with real power meter GPX tracks */}
      {hasPowerZones && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-200">
              Power zones <span className="text-gray-500 font-normal text-sm">(from GPS tracks)</span>
              <InfoTooltip text="Share of ride time in each of five power zones relative to your FTP (Functional Threshold Power)." />
            </h2>
            <label className="flex items-center gap-2 text-sm text-gray-400">
              FTP:
              <input
                type="number"
                value={ftp}
                onChange={e => handleFtpChange(e.target.value)}
                className="w-20 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-2 py-1 text-sm focus:border-strava focus:outline-none"
                min={50} max={500}
              />
              W
            </label>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={powerZoneData}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" unit="%" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v}%`, 'Share']}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {powerZoneData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Power Curve */}
      <PowerCurve activities={activities} />

      {/* Year-over-Year Monthly Comparison */}
      {hasYoY && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">
            Year-over-year comparison <span className="text-gray-500 font-normal text-sm">(km per month)</span>
            <InfoTooltip text="Monthly distance comparison across multiple years — useful for spotting seasonal patterns." />
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yoyData.data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" km" />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  formatter={(v, name) => [`${v} km`, name]} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                {yoyData.years.map((year, i) => (
                  <Bar
                    key={year}
                    dataKey={year}
                    fill={YEAR_COLORS[i % YEAR_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    name={String(year)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cadence Trend */}
      {hasCadenceData && cadenceData.length >= 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">
            Cadence trend <span className="text-gray-500 font-normal text-sm">(avg rpm per month)</span>
            <InfoTooltip text="Monthly average cadence (rpm). Higher cadence often reduces joint stress." />
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cadenceData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" rpm"
                  domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  formatter={(v) => [`${v} rpm`, 'Avg cadence']} />
                <Line dataKey="avgCadence" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }}
                  name="Avg cadence (rpm)" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Heart Rate Trend */}
      {hasHRData && hrData.length >= 3 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">
            Heart rate trend <span className="text-gray-500 font-normal text-sm">(avg bpm per month)</span>
            <InfoTooltip text="Monthly average heart rate (bpm). Lower values at equal output can indicate improved fitness." />
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={hrData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} unit=" bpm"
                  domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }}
                  formatter={(v) => [`${v} bpm`, 'Avg heart rate']} />
                <Line dataKey="avgHR" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }}
                  name="Avg HR (bpm)" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
