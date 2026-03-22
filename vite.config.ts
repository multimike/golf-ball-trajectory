import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/golf-ball-trajectory/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        fit: 'fit.html',
      },
    },
  },
})
