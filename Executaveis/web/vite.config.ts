import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // React + Refine + React Query juntos passam um pouco de 500 kB (160 kB gzip);
    // a tela de check-in (leitor de QR) já é carregada separadamente.
    chunkSizeWarningLimit: 600,
  },
})
