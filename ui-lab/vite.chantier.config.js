// Build config for the Chantier app (second entry). The main lab keeps vite.config.js (single-file artifact).
import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: 'dist-chantier', emptyOutDir: true, rollupOptions: { input: path.resolve(__dirname, 'chantier.html') } },
})
