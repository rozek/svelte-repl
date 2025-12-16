import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'svelte-compiler': ['svelte/compiler']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['svelte/compiler', 'monaco-editor']
  }
})
