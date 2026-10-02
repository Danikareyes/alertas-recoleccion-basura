import { divIcon } from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'
import type { PosicionCamion } from '../hooks/useCamionEnVivo'

const iconoCamion = divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#F2A516;
         border:3px solid #fff;box-shadow:0 0 0 7px rgba(242,165,22,.28)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function MarcadorCamion({ posicion }: { posicion: PosicionCamion }) {
  return (
    <Marker position={[posicion.lat, posicion.lng]} icon={iconoCamion}>
      <Tooltip direction="top" offset={[0, -16]}>
        Camión recolector
      </Tooltip>
    </Marker>
  )
}