

// vite.config.js
import { fileURLToPath, URL } from 'node:url' // Asegúrate que estas importaciones estén

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      // Esta línea configura el alias '@' para que apunte a tu carpeta 'src'
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
  // Puede haber otras configuraciones aquí (server, build, etc.)
})