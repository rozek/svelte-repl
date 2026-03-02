/*******************************************************************************
*                                                                              *
*                             build-runtime.mjs                               *
*                                                                              *
*******************************************************************************/

// Bundles src/svelte-runtime-entry.js → src/assets/svelte-runtime.js as a
// self-contained ESM module with the full Svelte 5 client runtime.
//
// Usage:  node build-runtime.mjs  |  npm run build:runtime

import { mkdirSync }   from 'node:fs'
import { rollup }      from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser          from '@rollup/plugin-terser'

const isDev = process.argv.includes('--dev')

mkdirSync('src/assets', { recursive:true })
console.log(`Building Svelte runtime bundle (${isDev ? 'dev' : 'prod'})…`)

const Bundle = await rollup({
  input: 'src/svelte-runtime-entry.js',
  plugins: [
    nodeResolve({
      browser:          true,
      exportConditions: ['svelte', 'browser', 'import', 'default'],
    }),
    ...(isDev ? [] : [ terser() ]),
  ],
  treeshake: {
    // Treat all modules as side-effect-free so Rollup can drop the server
    // renderer and any other unused code entirely.
    moduleSideEffects: false,
  },
  onwarn: (Warning, warn) => {
    if (Warning.code === 'CIRCULAR_DEPENDENCY') { return }
    if (Warning.code === 'EVAL')                { return }
    warn(Warning)
  },
})

await Bundle.write({
  file:   'src/assets/svelte-runtime.js',
  format: 'es',
})

await Bundle.close()

console.log('✓  src/assets/svelte-runtime.js written.')
