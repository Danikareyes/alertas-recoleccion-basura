import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import type { BarrioMapa } from '../types'

// Leaflet usa el orden [latitud, longitud] (al revés que GeoJSON)
const CENTRO_LA_TRONCAL: [number, number] = [-2.4185, -79.346]

export default function MapaBarrios() {
  const [barrios, setBarrios] = useState<BarrioMapa[]>([])
  const [error, setError] = useState<string | null>(null)

  // Se ejecuta una vez, cuando el mapa aparece en pantalla
  useEffect(() => {
    async function cargarBarrios() {
      const { data, error } = await supabase.from('barrios_mapa').select('*')
      if (error) {
        setError(error.message)
      } else {
        setBarrios(data as BarrioMapa[])
      }
    }
    cargarBarrios()
  }, [])

  return (
    <div className="relative h-[75vh] w-full overflow-hidden rounded-2xl shadow">
      {error && (
        <p className="absolute left-3 right-3 top-3 z-[1000] rounded-xl bg-red-100 p-3 text-sm text-red-900">
          No se pudieron cargar los barrios: {error}
        </p>
      )}

      <MapContainer center={CENTRO_LA_TRONCAL} zoom={16} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {barrios.map((barrio) => (
          <GeoJSON
            key={barrio.id}
            data={barrio.geojson}
            style={{ color: '#1F6B43', weight: 2, fillColor: '#1F6B43', fillOpacity: 0.15 }}
          >
            <Tooltip permanent direction="center">
              {barrio.nombre}
            </Tooltip>
          </GeoJSON>
        ))}
      </MapContainer>
    </div>
  )
}