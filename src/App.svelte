<script lang="ts">
/*******************************************************************************
*                                                                              *
*                               App.svelte                                    *
*                                                                              *
*******************************************************************************/

  import { onMount, onDestroy }             from 'svelte'
  import MonacoEditor                       from './MonacoEditor.svelte'
  import SveltePreview                      from './SveltePreview.svelte'
  import ConsoleView, { type ConsoleEntry } from './Console.svelte'

//----------------------------------------------------------------------------//
//                         URL Parameter Parsing                              //
//----------------------------------------------------------------------------//

  const URLParams    = new URLSearchParams(window.location.search)
  const Name         = URLParams.get('name')
  const BackupPrefix = URLParams.get('backup-prefix') ?? ''
  const CharLimit    = parseInt(URLParams.get('console-char-limit') ?? '10000',10)
  const LineLimit    = parseInt(URLParams.get('console-line-limit') ?? '500',  10)

  const FocusOnParam = URLParams.get('focus-on')
  const initialTab:  'code'|'preview'|'console' = (
    FocusOnParam === 'preview' || FocusOnParam === 'console' ? FocusOnParam : 'code'
  )

//----------------------------------------------------------------------------//
//                            Reactive State                                  //
//----------------------------------------------------------------------------//

  let initialCode:    string                     = $state(DefaultCode())
  let Code:           string                     = $state(DefaultCode())
  let lastSavedCode:  string                     = $state(DefaultCode())
  let activeTab:      'code'|'preview'|'console' = $state(initialTab)
  let ConsoleEntries: ConsoleEntry[]             = $state([])
  let EntryCounter   = 0
  let unreadCount:   number                      = $state(0)
  let wrapLines:     boolean                     = $state(false)

/**** DefaultCode ****/

  function DefaultCode ():string {
    return `<script>
// enter JavaScript here
${'<'}/script>

<span>(enter HTML here)</span>

<style>
  /* enter CSS here */
</style>`
  }

/**** TextFromBase64URL ****/

  async function TextFromBase64URL (EncodedURL:string):Promise<string> {
    const paddedURL          = EncodedURL + '=='.slice(0, (4 - EncodedURL.length % 4) % 4)
    const binaryURL          = atob(paddedURL.replace(/-/g, '+').replace(/_/g, '/'))
    const compressedBytes    = Uint8Array.from(binaryURL, (Char) => Char.charCodeAt(0))
    const decompressedStream = new Blob([compressedBytes]).stream()
      .pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(decompressedStream).text()
  }

/**** BackupIsEnabled ****/

  function BackupIsEnabled ():boolean {
    return (BackupPrefix !== '') && (Name != null)
  }

/**** restoredCode ****/

  function restoredCode ():string {
    if (! BackupIsEnabled()) { return initialCode }
    const StorageKey = `${BackupPrefix}-${Name as string}`
    const savedCode  = localStorage.getItem(StorageKey)
    if ((savedCode == null) || (savedCode.trim() === '')) { return initialCode }
    return savedCode
  }

/**** preserveCode ****/

  function preserveCode (newCode:string):void {
    if (! BackupIsEnabled())       { return }
    if (newCode === lastSavedCode) { return }
    const StorageKey = `${BackupPrefix}-${Name as string}`
    if (newCode === '') {
      localStorage.removeItem(StorageKey)
    } else {
      localStorage.setItem(StorageKey, newCode)
    }
    lastSavedCode = newCode
  }

/**** addConsoleEntry ****/

  function addConsoleEntry (Level:ConsoleEntry['Level'], Args:unknown[]):void {
    const now  = new Date()
    const Time = String(now.getHours()).padStart(2, '0') + ':'
               + String(now.getMinutes()).padStart(2, '0') + ':'
               + String(now.getSeconds()).padStart(2, '0') + '.'
               + String(now.getMilliseconds()).padStart(3, '0')

    const Entry:ConsoleEntry = { Id:++EntryCounter, Level:Level, ArgList:Args, Time:Time }

    const nextEntries = [ ...ConsoleEntries, Entry ]
    ConsoleEntries = (nextEntries.length > LineLimit)
      ? nextEntries.slice(nextEntries.length - LineLimit)
      : nextEntries

    if (activeTab !== 'console') { unreadCount += 1 }
  }

/**** clearConsole ****/

  function clearConsole ():void {
    ConsoleEntries = []
    unreadCount    = 0
  }

/**** handleMessage — receives postMessage from IFrame ****/

  function handleMessage (Event:MessageEvent):void {
    const Data = Event.data
    if ((Data == null) || (typeof Data !== 'object')) { return }

    switch (Data.type) {
      case 'console-log':   addConsoleEntry('log',   Data.args); break
      case 'console-warn':  addConsoleEntry('warn',  Data.args); break
      case 'console-error': addConsoleEntry('error', Data.args); break
      case 'console-info':  addConsoleEntry('info',  Data.args); break
      case 'console-dir':   addConsoleEntry('dir',   Data.args); break
      case 'console-clear': clearConsole(); break
    }
  }

//----------------------------------------------------------------------------//
//                              Reactive Effects                              //
//----------------------------------------------------------------------------//

  $effect(() => {
    if (Code != null) {
      preserveCode(Code)
      if (Code === '') { Code = initialCode }
    }
  })

  $effect(() => {
    if (activeTab === 'console') { unreadCount = 0 }
  })

/**** onMount — async initialization ****/

  onMount(async () => {
    window.addEventListener('message', handleMessage)

    const rawParam = URLParams.get('initial-code')
    initialCode = rawParam
      ? await TextFromBase64URL(rawParam)
      : DefaultCode()

    Code          = restoredCode()
    lastSavedCode = Code
  })

  onDestroy(() => {
    window.removeEventListener('message', handleMessage)
  })
</script>

<div class="repl-container">
  <div class="tab-bar">
    <!-- left: tabs -->
    <div class="tab-group">
      <button
        class="tab-button"
        class:active={activeTab === 'code'}
        onclick={() => (activeTab = 'code')}
      >Code</button>
      <button
        class="tab-button"
        class:active={activeTab === 'preview'}
        onclick={() => (activeTab = 'preview')}
      >Preview</button>
      <button
        class="tab-button"
        class:active={activeTab === 'console'}
        onclick={() => (activeTab = 'console')}
      >
        Console
        {#if unreadCount > 0}
          <span class="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        {/if}
      </button>
    </div>

    <!-- right: toolbar -->
    <div class="tab-toolbar">
      <button
        class="toolbar-btn"
        title="Clear console output"
        onclick={clearConsole}
      >Clear Console</button>

      <label class="toolbar-checkbox" title="Toggle word wrap in the code editor">
        <input
          type="checkbox"
          bind:checked={wrapLines}
        />
        Wrap lines
      </label>
    </div>
  </div>

  <div class="content-area">
    <div class="tab-content" class:hidden={activeTab !== 'code'}>
      <MonacoEditor bind:Value={Code} WordWrap={wrapLines ? 'on' : 'off'} />
    </div>
    <div class="tab-content" class:hidden={activeTab !== 'preview'}>
      <SveltePreview code={Code} active={activeTab === 'preview'} />
    </div>
    <div class="tab-content" class:hidden={activeTab !== 'console'}>
      <ConsoleView Entries={ConsoleEntries} {CharLimit} {wrapLines} />
    </div>
  </div>
</div>

<style>
  .repl-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #1e1e1e;
  }

  .tab-bar {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    background: #252526;
    border-bottom: 1px solid #3e3e42;
    height: 42px;
    flex-shrink: 0;
  }

  .tab-group   { display: flex; align-items: stretch; }
  .tab-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
  }

  .tab-button {
    position: relative;
    padding: 0 20px;
    background: transparent;
    color: #cccccc;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.15s;
    border-bottom: 2px solid transparent;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tab-button:hover  { background: #2d2d30; color: #ffffff; }
  .tab-button.active { color: #ffffff; border-bottom-color: #ff3e00; background: #1e1e1e; }

  .unread-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: #ff3e00;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  .toolbar-btn {
    padding: 4px 10px;
    background: #3a3a3a;
    color: #cccccc;
    border: 1px solid #555;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .toolbar-btn:hover { background: #4a4a4a; color: #fff; }

  .toolbar-checkbox {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #aaaaaa;
    font-size: 12px;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  .toolbar-checkbox input[type="checkbox"] {
    accent-color: #ff3e00;
    width: 13px;
    height: 13px;
    cursor: pointer;
  }
  .toolbar-checkbox:hover { color: #cccccc; }

  .content-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .tab-content {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    overflow: hidden;
  }
  .tab-content.hidden { display: none; }
</style>
