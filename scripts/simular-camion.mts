// Simulador del teléfono del camión:
// inicia sesión como conductor, crea una sesión de ruta
// y envía una posición cada 2 segundos.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!)

// Puntos clave del recorrido, en orden [longitud, latitud].
// Entra por el suroeste, cruza Luz de America y sale por el noreste.
const RECORRIDO: [number, number][] = [
  [-79.35, -2.4215],
  [-79.3478, -2.42],
  [-79.3462, -2.4187],
  [-79.3455, -2.4172],
  [-79.344, -2.415],
]
const PASO_GRADOS = 0.0001 // unos 11 metros entre cada punto enviado
const ESPERA_MS = 2000 // 2 segundos entre envíos

// Rellena los tramos entre puntos clave con puntos intermedios,
// para que el camión avance poco a poco y no "salte"
function interpolar(puntos: [number, number][]): [number, number][] {
  const resultado: [number, number][] = []
  for (let i = 0; i < puntos.length - 1; i++) {
    const [lng1, lat1] = puntos[i]
    const [lng2, lat2] = puntos[i + 1]
    const distancia = Math.hypot(lng2 - lng1, lat2 - lat1)
    const pasos = Math.max(1, Math.round(distancia / PASO_GRADOS))
    for (let k = 0; k < pasos; k++) {
      resultado.push([lng1 + ((lng2 - lng1) * k) / pasos, lat1 + ((lat2 - lat1) * k) / pasos])
    }
  }
  resultado.push(puntos[puntos.length - 1])
  return resultado
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

async function main() {
    
  // 1. Iniciar sesión como conductor
  const { data: login, error: errorLogin } = await supabase.auth.signInWithPassword({
    email: process.env.CONDUCTOR_EMAIL!,
    password: process.env.CONDUCTOR_PASSWORD!,
  })
  if (errorLogin) throw errorLogin
  console.log('Sesión iniciada como', login.user.email)

  // 2. Buscar la ruta piloto
  const { data: ruta, error: errorRuta } = await supabase
    .from('rutas')
    .select('id')
    .eq('nombre', 'Ruta piloto')
    .single()
  if (errorRuta) throw errorRuta

  // 3. "Iniciar ruta": crear la sesión
  const { data: sesion, error: errorSesion } = await supabase
    .from('sesiones_ruta')
    .insert({ ruta_id: ruta.id, conductor_id: login.user.id })
    .select('id')
    .single()
  if (errorSesion) throw errorSesion
  console.log('Ruta iniciada. Sesión número', sesion.id)

  // 4. Enviar las posiciones una por una
  const puntos = interpolar(RECORRIDO)
  for (const [i, [lng, lat]] of puntos.entries()) {
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('posiciones').insert({
      sesion_id: sesion.id,
      lat,
      lng,
      velocidad_kmh: 15,
      precision_m: 8,
      registrado_en: ahora,
    })
    if (error) throw error
    await supabase.from('sesiones_ruta').update({ ultima_senal: ahora }).eq('id', sesion.id)
    console.log(`Punto ${i + 1} de ${puntos.length}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    await esperar(ESPERA_MS)
  }

  // 5. "Finalizar ruta"
  await supabase
    .from('sesiones_ruta')
    .update({ estado: 'finalizada', fin: new Date().toISOString() })
    .eq('id', sesion.id)
  console.log('Ruta finalizada.')
}

main().catch((e) => {
  console.error('Error:', e.message ?? e)
  process.exit(1)
})