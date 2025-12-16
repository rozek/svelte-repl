import App from './App.svelte'

const REPL = new App({
  target:document.getElementById('svelte-repl')
})

document.body.classList.add('app-loaded')

export default REPL
