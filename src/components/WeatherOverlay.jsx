// Phase 4: Shows weather summary for a single activity
// Used in activity detail view

const WIND_DIR_LABELS = ['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW']

function degToCompass(deg) {
  return WIND_DIR_LABELS[Math.round(deg / 22.5) % 16]
}

export default function WeatherOverlay({ weather }) {
  if (!weather) {
    return (
      <div className="text-gray-500 text-sm">
        Keine Wetterdaten verfügbar.
      </div>
    )
  }

  const items = [
    { label: 'Temperatur', value: `${Math.round(weather.temperature)}°C`, icon: '🌡️' },
    weather.windspeed != null && {
      label: 'Wind',
      value: `${Math.round(weather.windspeed)} km/h ${degToCompass(weather.winddirection)}`,
      icon: '💨'
    },
    weather.precipitation != null && {
      label: 'Niederschlag',
      value: `${Number(weather.precipitation).toFixed(1)} mm`,
      icon: '🌧️'
    },
    weather.humidity != null && {
      label: 'Luftfeuchtigkeit',
      value: `${Math.round(weather.humidity * 100)}%`,
      icon: '💧'
    },
  ].filter(Boolean)

  return (
    <div className="flex gap-4 flex-wrap">
      {items.map(item => (
        <div key={item.label} className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <span>{item.icon}</span>
          <div>
            <p className="text-gray-500 text-xs">{item.label}</p>
            <p className="text-white text-sm font-medium">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
