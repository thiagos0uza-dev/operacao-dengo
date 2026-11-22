import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No GitHub Pages o site fica em https://USUARIO.github.io/NOME-DO-REPOSITORIO/
// O workflow define BASE_PATH automaticamente com o nome do repositório.
// Localmente (npm run dev) usamos a raiz.
const base = process.env.BASE_PATH ?? (process.env.NODE_ENV === 'production' ? '/operacao-dengo/' : '/')

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('@react-three')) return 'r3f'
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
