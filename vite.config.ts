/*******************************************************************************
*                                                                              *
*                              vite.config.ts                                 *
*                                                                              *
*******************************************************************************/

import { defineConfig }                        from 'vite'
import { svelte }                              from '@sveltejs/vite-plugin-svelte'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname }                    from 'node:path'
import { fileURLToPath }                       from 'node:url'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const AssetsDir  = resolve(__dirname, 'src', 'assets')  // dev + build source
const AssetFiles = ['svelte-runtime.js', 'svelte-compiler.js']

// During dev, Vite serves src/ — so src/assets/svelte-runtime.js is reachable
// as /src/assets/svelte-runtime.js, which is what import.meta.url resolves to
// from SveltePreview.svelte (also in src/).
//
// During build, closeBundle() copies the two files from src/assets/ into
// dist/assets/ alongside the other JS chunks, so import.meta.url-relative
// URLs keep working identically in production.
//
// public/ is not used at all — the files never need to be served from /.

/**** copyRuntimeAssets ****/

function copyRuntimeAssets () {
  return {
    name: 'copy-svelte-assets',

    buildStart () {
      AssetFiles.forEach((File) => {
        if (! existsSync(resolve(AssetsDir, File))) {
          this.warn(`src/assets/${File} is missing — run "npm run build:assets" first.`)
        }
      })
    },

    closeBundle () {
      const DestDir = resolve(__dirname, 'dist', 'assets')
      if (! existsSync(DestDir)) { mkdirSync(DestDir, { recursive:true }) }
      AssetFiles.forEach((File) => {
        const Source = resolve(AssetsDir, File)
        if (existsSync(Source)) {
          copyFileSync(Source, resolve(DestDir, File))
          console.log(`✓  copied ${File} → dist/assets/${File}`)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [ svelte(), copyRuntimeAssets() ],

  // Relative base so index.html uses ./assets/... instead of /assets/...
  base: './',

  // No publicDir needed — runtime/compiler files live in src/assets/ and are
  // served naturally by Vite's dev server as part of the src/ tree.
  publicDir: false,

  build: {
    outDir:      'dist',
    emptyOutDir: true,
  },

  optimizeDeps: {
    exclude: ['svelte/compiler'],
  },
})
