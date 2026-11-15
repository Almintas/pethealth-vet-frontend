import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 5174 so the clinic app runs next to the owner portal (5173).
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
})
