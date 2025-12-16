<script>
  import { onMount, onDestroy } from 'svelte';
  import MonacoEditor from './MonacoEditor.svelte';
  import SveltePreview from './SveltePreview.svelte';

/**** parse query string ****/

  const URLParams    = new URLSearchParams(window.location.search);
  const Name         = URLParams.get('name') || 'default-repl';
  const initialCode  = URLParams.get('initial-code') || getDefaultCode();
  const BackupMarker = URLParams.get('backup-marker') || '';

  let Code          = restoredCode();                          // or initialcode
  let lastSavedCode = Code;
  let activeTab     = 'code';                             // 'code' or 'preview'

/**** getDefaultCode ****/

  function getDefaultCode () {
    return `<script>
// enter JavaScript here
<\/script>

<span>(enter HTML here)</span>

<style>
  /* enter CSS here */
</style>`;
  }

/**** isBackupEnabled ****/

  function BackupIsEnabled () {
    if (BackupMarker === '') { return false };

    const  MarkerValue = localStorage.getItem(BackupMarker);
    return (MarkerValue !== null) && (MarkerValue.trim() !== '');
  }

/**** restoreCode ****/

  function restoredCode () {
    if (! BackupIsEnabled()) {
      return initialCode;
    }

    const StorageKey = `svelte-repl-${Name}`;
    const savedCode  = localStorage.getItem(StorageKey);

    if ((savedCode == null) || (savedCode.trim() === '')) {
      return initialCode;
    }

    return savedCode;
  }

/**** preserveCode ****/

  function preserveCode (newCode) {
    if (! BackupIsEnabled()) {
      return;
    }

    if (newCode === lastSavedCode) {
      return;
    }

    const StorageKey = `svelte-repl-${Name}`;
    if (Code === '') {
      localStorage.removeItem(StorageKey);
    } else {
      localStorage.setItem(StorageKey, newCode);
    }
    lastSavedCode = newCode;
  }

/**** track code changes and store them ****/

  $: {
    if (Code != null) {
      preserveCode(Code);
      if (Code === '') {
        Code = initialCode   // changes editor contents because of 2-way binding
      }
    }
  }

/**** switchTab ****/

  function switchTab (Tab) {
    activeTab = Tab;
  }

/**** onMount ****/

  onMount(() => {
    Code = restoredCode();
    lastSavedCode = Code;

    console.log('REPL is ready:', {
      Name,
      BackupMarker, BackupIsEnabled:BackupIsEnabled(),
      CodeLength:Code.length
    });
  });
</script>

<div class="repl-container">
  <div class="tab-bar">
    <button
      class="tab-button"
      class:active={activeTab === 'code'}
      on:click={() => switchTab('code')}
    >
      📝 Code
    </button>
    <button
      class="tab-button"
      class:active={activeTab === 'preview'}
      on:click={() => switchTab('preview')}
    >
      👁️ Preview
    </button>
  </div>

  <div class="content-area">
    <div class="tab-content" class:hidden={activeTab !== 'code'}>
      <MonacoEditor bind:Value={Code} />
    </div>

    <div class="tab-content" class:hidden={activeTab !== 'preview'}>
      <SveltePreview Code={Code} />
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
    background: #252526;
    border-bottom: 1px solid #3e3e42;
    padding: 0;
    height: 42px;
    flex-shrink: 0;
  }

  .tab-button {
    padding: 0 20px;
    background: transparent;
    color: #cccccc;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
    height: 100%;
  }

  .tab-button:hover {
    background: #2d2d30;
    color: #ffffff;
  }

  .tab-button.active {
    color: #ffffff;
    border-bottom-color: #ff3e00;
    background: #1e1e1e;
  }

  .content-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .tab-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .tab-content.hidden {
    display: none;
  }
</style>
