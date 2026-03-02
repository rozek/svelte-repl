/*******************************************************************************
*                                                                              *
*                          svelte-runtime-entry.js                            *
*                                                                              *
*******************************************************************************/

// Entry point for the Svelte 5 runtime ES module bundle.
// Rollup bundles this into src/assets/svelte-runtime.js.
// Re-run "npm run build:runtime" after updating the svelte version.
//
// svelte/legacy is intentionally omitted — it exports only legacy-specific
// functions (asClassComponent, createBubbler, etc.) not needed in runes mode,
// and it causes a "run" namespace conflict with svelte/internal/client.

export * from 'svelte/internal/client'

// Flag control functions (relative path — not a valid package export path)
export {
  enable_async_mode_flag,
  disable_async_mode_flag,
  enable_legacy_mode_flag,
  enable_tracing_mode_flag,
} from '../node_modules/svelte/src/internal/flags/index.js'

export {
  afterUpdate, beforeUpdate, createContext, createEventDispatcher,
  createRawSnippet, flushSync, fork, getAbortSignal, getAllContexts,
  getContext, hasContext, hydratable, hydrate, mount, onDestroy, onMount,
  setContext, settled, unmount,
} from 'svelte'

export { fromStore, readable, readonly, toStore, writable } from 'svelte/store'

export * from 'svelte/transition'
export * from 'svelte/animate'
export * from 'svelte/motion'
export * from 'svelte/easing'
export * from 'svelte/reactivity'
export * from 'svelte/events'
export * from 'zimmerframe'
