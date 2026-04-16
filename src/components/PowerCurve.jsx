import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import InfoTooltip from './InfoTooltip'

const tooltipStyle = { background: '#111827', border: '1px solid #374151', borderRadius: 8 }

// Window sizes in stored points (5-second intervals after downsampling)
const WINDOWS = [
  { label: '5 s',   pts: 1   },
  { label: '1 min', pts: 12  },
  { label: '5 min', pts: 60  },
  { label: '20 min',pts: 240 },
  { label: '60 min',pts: 720 },
]

/**
 * Compute best average power for a given window size (in points) across one ride's power array.
 * Returns null if the ride is shorter than the window.
 */
function bestForWindow(powers, pts) {
  if (powers.length < pts) return null
  if (pts === 1) return Math.max(...powers)

  let sum = 0
  for (let i = 0; i < pts; i++) sum += powers[i]
  let best = sum / pts

  for (let i = pts; i < powers.length; i++) {
    sum += powers[i] - powers[i - pts]
    const avg = sum / pts
    if (avg > best) best = avg
  }
  return Math.round(best)
}

export default function PowerCurve({ activities }) {
  const [ftp] = useState(() => parseInt(localStorage.getItem('ftp') || '200'))

  const curveData = useMemo(() => {
    const rides = activities.filter(a => a.hasPowerTrack && a.gpsTrack?.points?.length)
    if (rides.length === 0) return []

    return WINDOWS.map(w => {
      let best = null
      rides.forEach(a => {
        const powers = a.gpsTrack.points
          .map(p => p.power)
          .filter(v => v != null && v > 0)
        const b = bestForWindow(powers, w.pts)
        if (b != null && (best === null || b > best)) best = b
      })
      return { label: w.label, watts: best }
    }).filter(d => d.watts !== null)
  }, [activities])

  if (curveData.length === 0) return null

  const best20 = curveData.find(d => d.label === '20 min')
  const estimatedFtp = best20 ? Math.round(best20.watts * 0.95) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-200">
          Power Curve
          <InfoTooltip text="Best average power across multiple time windows over all rides. Used for FTP estimation." />
        </h2>
        {estimatedFtp && (
          <span className="text-sm text-gray-400">
            Estimated FTP: <span className="text-amber-400 font-semibold">~{estimatedFtp} W</span>
            <span className="text-gray-600 ml-1">(best 20 min × 0.95)</span>
          </span>
        )}
      </div>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={curveData}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 56, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis
              type="number"
              unit=" W"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              domain={[0, 'dataMax + 20']}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} W`, 'Best output']}
            />
            {ftp > 0 && (
              <ReferenceLine
                x={ftp}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                label={{ value: `FTP ${ftp}W`, position: 'right', fill: '#f59e0b', fontSize: 11 }}
              />
            )}
            <Bar dataKey="watts" radius={[0, 4, 4, 0]}>
              {curveData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.watts >= ftp * 1.05 ? '#ef4444'
                    : entry.watts >= ftp * 0.90 ? '#f59e0b'
                    : entry.watts >= ftp * 0.75 ? '#10b981'
                    : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
