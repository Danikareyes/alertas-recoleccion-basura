import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type PosicionCamion = {
  sesion_id: number
  lat: number
  lng: number
  registrado_en: string
}

export function useCamionEnVivo() {
  const [posicion, setPosicion] = useState<PosicionCamion | null>(null)

  useEffect(() => {
    // 1. Última posición conocida
    supabase
      .from('posiciones')
      .select('sesion_id, lat, lng, registrado_en')
      .order('registrado_en', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error al cargar la última posición:', error.message)
        console.log('Última posición conocida:', data)
        if (data) setPosicion(data)
      })

    // 2. Suscripción en tiempo real, con un nombre de canal único
    const canal = supabase
      .channel(`posiciones-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posiciones' },
        (payload) => {
          console.log('Nueva posición recibida:', payload.new)
          setPosicion(payload.new as PosicionCamion)
        },
      )
      .subscribe((estado, error) => {
        console.log('Estado de Realtime:', estado, error ?? '')
      })

    // 3. Limpieza al salir de la página
    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  return posicion
}