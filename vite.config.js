import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/US_CBAM_Exposure-dashboard/',
  plugins: [react()],
})
