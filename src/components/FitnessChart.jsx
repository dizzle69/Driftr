import { useMemo } from 'react'
import InfoTooltip from './InfoTooltip'
import {
  ComposedChart, Area, Line, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

const tooltipStyle = { background: '#111827', border: '1px solid #374151', borderRadius: 8 }

/**
 * Fitness / Form Curve using exponential moving averages of Strava's relativeEffort.
 *
 * CTL (Chronic Training Load / "Fitness"): 42-day EMA  → how fit you are
 * ATL (Acute Training Load / "Fatigue"):    7-day EMA  → how tired you are
 * TSB (Training Stress Balance / "Form"):   CTL − ATL  → positive = fresh, negative = fatigued
 *
 * Only renders when ≥ 20 activities have a relativeEffort value.
 */
export default function FitnessChart({ activities }) {
  const chartData = useMemo(() => {
    const withEffort = activities.filter(a => a.relativeEffort > 0)
    if (withEffort.length < 20) return []

    // Build daily effort totals (multiple rides in one day are summed)
    const dailyEffort = {}
    withEffort.forEach(a => {
      const d = new Date(a.date)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().split('T')[0]
      dailyEffort[key] = (dailyEffort[key] || 0) + a.relativeEffort
    })

    // Walk from first ride date → today, computing EMA each day
    const sorted = [...withEffort].sort((a, b) => new Date(a.date) - new Date(b.date))
    const startDate = new Date(sorted[0].date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date()
    endDate.setHours(0, 0, 0, 0)

    let ctl = 0  // 42-day EMA
    let atl = 0  //  7-day EMA
    const all = []

    const cur = new Date(startDate)
    while (cur <= endDate) {
      const key = cur.toISOString().split('T')[0]
      const load = dailyEffort[key] || 0

      ctl = ctl + (load - ctl) / 42
      atl = atl + (load - atl) / 7
      const tsb = ctl - atl

      all.push({
        date: key,
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
      })
      cur.setDate(cur.getDate() + 1)
    }

    // Sample to every 7th day so the chart stays readable (~80–100 points)
    return all.filter((_, i) => i % 7 === 0 || i === all.length - 1)
  }, [activities])

  if (!chartData.length) return null

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-lg font-semibold text-gray-200">Fitness-Kurve<InfoTooltip text="CTL (Fitness) = 42-Tage-EMA, ATL (Erschöpfung) = 7-Tage-EMA, TSB (Form) = CTL − ATL. Positiver TSB = frisch, negativer TSB = müde." /></h2>
        <span className="text-xs text-gray-500">basierend auf Relative Effort</span>
      </div>
      <p className="text-xs text-gray-600 mb-3">
        🔵 CTL = Fitness (42-Tage) &nbsp;·&nbsp;
        🟠 ATL = Ermüdung (7-Tage) &nbsp;·&nbsp;
        🟢 TSB &gt; 0 = frisch &nbsp; 🔴 TSB &lt; 0 = müde
      </p>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 50, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              tickFormatter={(v) =>
                new Date(v).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
              }
              interval="preserveStartEnd"
            />
            {/* Left axis: CTL / ATL values */}
            <YAxis
              yAxisId="ctl"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              domain={[0, 'auto']}
            />
            {/* Right axis: TSB (can be negative) */}
            <YAxis
              yAxisId="tsb"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#9ca3af' }}
              labelFormatter={(v) => new Date(v).toLocaleDateString('de-DE')}
              formatter={(v, name) => [v.toFixed(1), name]}
            />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />

            {/* TSB as thin color-coded bars — rendered first so it sits behind the lines */}
            <Bar yAxisId="tsb" dataKey="tsb" name="Form (TSB)" maxBarSize={5} opacity={0.75}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.tsb >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>

            {/* CTL — blue filled area */}
            <Area
              yAxisId="ctl"
              dataKey="ctl"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              name="Fitness (CTL)"
            />

            {/* ATL — orange dashed line */}
            <Line
              yAxisId="ctl"
              dataKey="atl"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              name="Ermüdung (ATL)"
              strokeDasharray="5 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
