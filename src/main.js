import { mount } from 'svelte'
import App       from './App.svelte'

/**** mount App ****/

const Target = document.getElementById('svelte-repl')
if (Target == null) throw new Error('Missing #svelte-repl element in index.html')

const REPL = mount(App, { target:Target })
document.body.classList.add('app-loaded')

export default REPL
