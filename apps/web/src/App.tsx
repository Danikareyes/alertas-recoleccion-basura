import MapaBarrios from './components/MapaBarrios'

export default function App() {
  return (
    <main className="min-h-screen bg-[#F3F5EF] text-[#13261C]">
      <header className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F6B43] text-sm font-bold text-white">
          YV
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ya Viene</h1>
      </header>

      <section className="px-3 pb-6">
        <MapaBarrios />
      </section>
    </main>
  )
}