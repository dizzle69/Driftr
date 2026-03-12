import { useMemo } from 'react'
import { generateInsights } from '../utils/insights'

// Phase 6: Top actionable insights from aggregated activity data
// Each card: icon + headline + supporting stat

function Card({ icon, title, value, sub, color = 'orange' }) {
  const leftBorder = {
    orange: 'border-l-orange-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    red: 'border-l-red-500',
  }[color] ?? 'border-l-gray-500'

  return (
    <div className={`bg-gray-900 border border-gray-800 border-l-4 ${leftBorder} rounded-xl p-5 flex gap-4 items-start`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</p>
        <p className="text-white font-semibold text-lg leading-tight">{value}</p>
        {sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function InsightCards({ activities }) {
  const insights = useMemo(() => generateInsights(activities), [activities])

  if (!insights.length) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, i) => (
          <Card key={i} {...insight} />
        ))}
      </div>
    </div>
  )
}
