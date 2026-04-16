import { useMemo, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const MS_TO_KMH = 3.6
const METERS_TO_KM = 0.001

export default function RouteHeatmap({ activities, enableTiles = true }) {
  const [selectedId, setSelectedId] = useState(null)

  const tracks = useMemo(() => {
    return activities
      .filter(a => a.gpsTrack?.points?.length > 1)
      .map(a => ({
        id: a.id,
        name: a.name,
        date: new Date(a.date).toLocaleDateString('en-US'),
        distance: (a.distance * METERS_TO_KM).toFixed(1),
        speed: (a.avgSpeed * MS_TO_KMH).toFixed(1),
        positions: a.gpsTrack.points.map(p => [p.lat, p.lon]),
      }))
  }, [activities])

  // Calculate center from all points
  const center = useMemo(() => {
    if (tracks.length === 0) return [53.55, 9.99] // Hamburg default
    let totalLat = 0, totalLon = 0, count = 0
    tracks.forEach(t => {
      const mid = t.positions[Math.floor(t.positions.length / 2)]
      totalLat += mid[0]
      totalLon += mid[1]
      count++
    })
    return [totalLat / count, totalLon / count]
  }, [tracks])

  if (tracks.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 text-gray-200">
        Route heatmap <span className="text-gray-500 font-normal text-sm">({tracks.length} rides)</span>
      </h2>
      {!enableTiles && (
        <p className="text-xs text-gray-500 mb-2">
          Map tiles are disabled. (Routes are still shown.)
        </p>
      )}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 450 }}>
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {enableTiles && (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          )}
          {tracks.map(t => (
            <Polyline
              key={t.id}
              positions={t.positions}
              pathOptions={{
                color: selectedId === t.id ? '#ffffff' : '#FC4C02',
                weight: selectedId === t.id ? 3 : 1.5,
                opacity: selectedId === t.id ? 0.95 : 0.3,
              }}
              eventHandlers={{
                click: () => setSelectedId(selectedId === t.id ? null : t.id),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{t.name}</p>
                  <p>{t.date}</p>
                  <p>{t.distance} km | {t.speed} km/h</p>
                </div>
              </Popup>
            </Polyline>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
