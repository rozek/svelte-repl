/*******************************************************************************
*                                                                              *
*                            build-compiler.mjs                               *
*                                                                              *
*******************************************************************************/

// Bundles the Svelte 5 compiler + all its dependencies (zimmerframe etc.)
// into a single self-contained ESM file at src/assets/svelte-compiler.js.
//
// Run once after install and after every "npm update svelte".
//
// Usage:  node build-compiler.mjs  |  npm run build:compiler

import { mkdirSync }     from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rollup }        from 'rollup'
import { nodeResolve }   from '@rollup/plugin-node-resolve'
import commonjs          from '@rollup/plugin-commonjs'
import terser            from '@rollup/plugin-terser'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev     = process.argv.includes('--dev')

console.log(`Bundling Svelte compiler (${isDev ? 'dev' : 'prod'})…`)

const Bundle = await rollup({
  // Use the public svelte/compiler subpath — Rollup + nodeResolve will
  // find the correct ESM entry via the package.json exports map.
  input: 'svelte/compiler',
  plugins: [
    nodeResolve({
      browser:          false,
      exportConditions: ['import', 'default'],
    }),
    commonjs(),  // handles CJS deps like aria-query, axobject-query
    ...(isDev ? [] : [ terser() ]),
  ],
  onwarn: (Warning, warn) => {
    if (Warning.code === 'CIRCULAR_DEPENDENCY') { return }
    warn(Warning)
  },
})

mkdirSync(join(__dirname, 'src', 'assets'), { recursive:true })

await Bundle.write({
  file:    join(__dirname, 'src', 'assets', 'svelte-compiler.js'),
  format:  'es',
  exports: 'named',
})

await Bundle.close()

console.log('✓  src/assets/svelte-compiler.js written (self-contained ESM bundle).')
