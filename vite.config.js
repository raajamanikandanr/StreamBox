import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0)
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://172.30.16.71:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
