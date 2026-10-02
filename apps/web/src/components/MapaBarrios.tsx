import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import type { BarrioMapa } from '../types'
import { useCamionEnVivo } from '../hooks/useCamionEnVivo'
import MarcadorCamion from './MarcadorCamion'

const CENTRO_LA_TRONCAL: [number, number] = [-2.4185, -79.346]

export default function MapaBarrios() {
  const [barrios, setBarrios] = useState<BarrioMapa[]>([])
  const [error, setError] = useState<string | null>(null)
  const posicion = useCamionEnVivo() // ← aquí se conecta la "antena"

  // Reloj interno: cambia cada segundo para recalcular "hace X s"
  const [ahora, setAhora] = useState(Date.now())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(reloj)
  }, [])

  useEffect(() => {
    async function cargarBarrios() {
      const { data, error } = await supabase.from('barrios_mapa').select('*')
      if (error) setError(error.message)
      else setBarrios(data as BarrioMapa[])
    }
    cargarBarrios()
  }, [])

  const segundosDesdeSenal = posicion
    ? Math.max(0, Math.round((ahora - Date.parse(posicion.registrado_en)) / 1000))
    : null

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

        {posicion && <MarcadorCamion posicion={posicion} />}
      </MapContainer>

      <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl bg-white p-4 shadow-lg">
        {posicion ? (
          <>
            <p className="text-lg font-extrabold">Camión en ruta</p>
            <p className="text-sm text-[#4E5F55]">Última señal hace {segundosDesdeSenal} s</p>
          </>
        ) : (
          <>
            <p className="text-lg font-extrabold">Sin recorrido en este momento</p>
            <p className="text-sm text-[#4E5F55]">Te avisaremos cuando el camión inicie su ruta.</p>
          </>
        )}
      </div>
    </div>
  )
}