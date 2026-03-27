import { useMemo } from 'react'
import InfoTooltip from './InfoTooltip'

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
// Map JS getDay() (0=Sun) to Mon-first index
const DAY_MAP = [6, 0, 1, 2, 3, 4, 5]

export default function TimeHeatmap({ activities }) {
  const { grid, maxCount } = useMemo(() => {
    // 7 days x 24 hours
    const g = Array.from({ length: 7 }, () => Array(24).fill(0))
    let max = 0

    activities.forEach(a => {
      if (a.startHour == null) return
      const d = new Date(a.date)
      const dayIdx = DAY_MAP[d.getDay()]
      g[dayIdx][a.startHour]++
      if (g[dayIdx][a.startHour] > max) max = g[dayIdx][a.startHour]
    })

    return { grid: g, maxCount: max }
  }, [activities])

  if (maxCount === 0) return null

  function getColor(count) {
    if (count === 0) return 'bg-gray-800/50'
    const intensity = count / maxCount
    if (intensity <= 0.25) return 'bg-orange-900/40'
    if (intensity <= 0.5) return 'bg-orange-700/60'
    if (intensity <= 0.75) return 'bg-orange-500/80'
    return 'bg-orange-500'
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Tageszeit-Heatmap<InfoTooltip text="Zeigt zu welchen Tages- und Wochenzeiten du am häufigsten fährst. Dunklere Felder = mehr Aktivitäten." /></h2>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex ml-8 mb-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-gray-500">
                {h % 3 === 0 ? `${h}` : ''}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {grid.map((row, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1 mb-1">
              <span className="w-7 text-xs text-gray-500 text-right shrink-0">{DAYS[dayIdx]}</span>
              <div className="flex flex-1 gap-[2px]">
                {row.map((count, h) => (
                  <div
                    key={h}
                    className={`flex-1 h-5 rounded-sm ${getColor(count)} transition-colors`}
                    title={`${DAYS[dayIdx]} ${h}:00 — ${count} Ride${count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 ml-8">
            <span className="text-xs text-gray-500">Weniger</span>
            <div className="w-4 h-3 rounded-sm bg-gray-800/50" />
            <div className="w-4 h-3 rounded-sm bg-orange-900/40" />
            <div className="w-4 h-3 rounded-sm bg-orange-700/60" />
            <div className="w-4 h-3 rounded-sm bg-orange-500/80" />
            <div className="w-4 h-3 rounded-sm bg-orange-500" />
            <span className="text-xs text-gray-500">Mehr</span>
          </div>
        </div>
      </div>
    </div>
  )
}
