import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Web Workers support
  worker: {
    format: 'es',
  },
})
