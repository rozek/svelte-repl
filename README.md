# svelte-repl

A browser-based REPL for [Svelte 5](https://svelte.dev/) that runs entirely in the browser — no server, no bundler required.

## Live Demo

[**→ Open Live Demo**](https://rozek.github.io/svelte-repl/Demo.html)

## Overview

**svelte-repl** provides an interactive editor for Svelte 5 components with live preview and console output. The Svelte compiler runs directly in the browser, making the REPL completely self-contained and deployable as static HTML — no backend, no build step at runtime.

I originally built svelte-repl to give my students a possibility to tinker around with Svelte 5 in their browsers - GDPR-compliant and without having to install anything. But, perhaps, other people may find this little tool useful as well.

## Features

- **Monaco Editor** — the same editor as VS Code, with syntax highlighting for Svelte/HTML/CSS/JS
- **Live Preview** — compiled Svelte components render in a sandboxed `<iframe>`
- **Console** — `console.log`, `warn`, `error`, `info`, and `dir` output is forwarded from the iframe, with an unread-message badge on the Console tab
- **Word wrap** toggle for the editor
- **URL sharing** — encode a Svelte snippet into a URL via the `initial-code` parameter
- **Optional localStorage backup** — configurable via URL parameters, so the host page controls whether saving is enabled

## Svelte 5 / Runes Mode

The REPL runs Svelte 5 in **runes mode** without a bundler. Only Svelte 5 syntax is supported. The most important difference from Svelte 4 is event handling:

- `on:click={handler}`  → `onclick={handler}` 
- `on:input`, `on:focus`, `on:blur`, …  → `oninput`, `onfocus`, `onblur`, … 
- `createEventDispatcher`  → callback props 
- `beforeUpdate` / `afterUpdate`  → `$effect` 

> **Rule of thumb:** replace every `on:eventname` with `oneventname` (remove the colon). Everything else — transitions, `{#if}`, `{#each}`, `{#await}`, `bind:value`, `bind:this` — remains unchanged.

The following Svelte packages are available in user code (all bundled into `svelte-runtime.js`):

- from `svelte`: `mount`, `onMount`, `onDestroy`, `getContext`, `setContext`, `tick`, …
- from `svelte/store`: `writable`, `readable`, `readonly`, `fromStore`, `toStore`
- from `svelte/transition`: `fade`, `fly`, `slide`, `scale`, `draw`, `crossfade`
- from `svelte/animate`: `flip`
- from `svelte/motion`: `tweened`, `spring`
- from `svelte/easing`: all easing functions
- from `svelte/reactivity`: `SvelteMap`, `SvelteSet`, `SvelteURL`, …
- from `svelte/events`: `on`

`svelte/legacy` is intentionally excluded — it is not needed in runes mode.

### Limitations

- **No npm packages** — only the Svelte packages listed above are available; any other bare import is silently removed
- **Single-file components only** — no multi-file projects, no imports between user files
- **No SSR** — components always render to the DOM

## URL Parameters

- `initial-code` — initial editor content, encoded as deflate-raw + base64url (see below); defaults to a minimal template
- `name` — key suffix for the localStorage backup key (see below); backup is disabled when absent
- `backup-prefix` — prefix for the localStorage backup key; backup is disabled when empty
- `console-char-limit` — maximum characters shown per console value; default: `10000`
- `console-line-limit` — maximum number of console lines kept in the Console tab; default: `500`

### Encoding `initial-code`

The `initial-code` value is a URL-safe base64 string of the deflate-raw compressed source. To generate it from JavaScript:

```js
async function encodeForURL (Code) {
  const encodedText = new TextEncoder().encode(Code)
  const Stream = new Blob([encodedText]).stream()
    .pipeThrough(new CompressionStream('deflate-raw'))
  const compressedCode = await new Response(Stream).arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(compressedCode)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
```

Example URL:

```
https://example.com/repl/?initial-code=<encoded-svelte-code>
```

### Optional localStorage Backup

When `backup-prefix` is set, the editor content is automatically saved to and restored from `localStorage['{backup-prefix}-{name}']`. _This switch had to be provided because of the GDPR_

Example:

```
https://example.com/repl/?backup-prefix=my-app&name=my-project
```

With this URL, the REPL saves and restores code via `localStorage['my-app-my-project']`. Backup is disabled when `backup-prefix` is absent or empty.

## Build

**Prerequisites:** Node.js ≥ 18, npm

### 1. Install dependencies

```bash
npm install
```

### 2. Build Svelte runtime and compiler bundles

```bash
npm run build:assets
```

This runs `build-runtime.mjs` and `build-compiler.mjs` via Rollup, producing:

- `src/assets/svelte-runtime.js` — the Svelte 5 runtime as a self-contained ESM module
- `src/assets/svelte-compiler.js` — the Svelte 5 compiler bundled for browser use

These two files must exist before running `dev` or `build`. Re-run `build:assets` after upgrading the `svelte` package version.

### 3a. Development server

```bash
npm run dev
```

Vite serves the app with hot module replacement. The two asset files are served directly from `src/assets/` during development.

### 3b. Production build

```bash
npm run build
```

Output goes to `dist/`. The result is a fully static site — just serve the `dist/` folder from any web server or CDN. No server-side logic is required.

### Preview production build

```bash
npm run preview
```

## License

[MIT License](LICENSE.md)
