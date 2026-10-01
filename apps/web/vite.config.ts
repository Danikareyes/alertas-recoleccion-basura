import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/alertas-recoleccion-basura/', // ruta de GitHub Pages
  plugins: [react(), tailwindcss()],
})
