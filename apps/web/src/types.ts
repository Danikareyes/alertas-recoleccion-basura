import type { Polygon } from 'geojson'

export type BarrioMapa = {
  id: number
  nombre: string
  radio_aviso_m: number
  geojson: Polygon
}