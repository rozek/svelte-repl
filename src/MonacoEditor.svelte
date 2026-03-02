<script lang="ts">
/*******************************************************************************
*                                                                              *
*                           MonacoEditor.svelte                               *
*                                                                              *
*******************************************************************************/

  import { onMount, onDestroy } from 'svelte'
  import loader                 from '@monaco-editor/loader'
  import type * as Monaco       from 'monaco-editor'

  let { Value = $bindable(''), WordWrap = 'on' }: {
    Value:string; WordWrap?:'on'|'off'
  } = $props()

  let EditorContainer:HTMLDivElement
  let Editor:Monaco.editor.IStandaloneCodeEditor|undefined
  let MonacoInstance:typeof Monaco|undefined
  let ignoreChange = false  // guard against feedback loop

/**** onMount ****/

  onMount(async () => {
    try {
      if (EditorContainer == null) { return }
      MonacoInstance = await loader.init()

      Editor = MonacoInstance.editor.create(EditorContainer, {
        value:Value,
        language:'html',
        theme:'vs-dark',
        automaticLayout:true,
        minimap:{ enabled:false },
        fontSize:14,
        lineNumbers:'on',
        roundedSelection:false,
        scrollBeyondLastLine:false,
        readOnly:false,
        wordWrap:WordWrap,
        folding:true,
        lineDecorationsWidth:5,
        lineNumbersMinChars:3,
        renderLineHighlight:'all',
        scrollbar:{ verticalScrollbarSize:10, horizontalScrollbarSize:10 },
      })

      Editor.onDidChangeModelContent(() => {
        if (! ignoreChange) { Value = Editor!.getValue() }
      })

      // Swallow Ctrl+S / Cmd+S — saving happens reactively via the store
      Editor.addCommand(
        MonacoInstance.KeyMod.CtrlCmd | MonacoInstance.KeyCode.KeyS,
        () => undefined)
    } catch (Signal) {
      console.error('Error loading Monaco Editor:', Signal)
    }
  })

/**** onDestroy ****/

  onDestroy(() => { Editor?.dispose() })

/**** sync external Value changes into the editor ****/

  $effect(() => {
    const incoming = Value
    if ((Editor != null) && (incoming !== Editor.getValue())) {
      const Position = Editor.getPosition()
      ignoreChange = true
      Editor.setValue(incoming)
      ignoreChange = false
      if (Position != null) { Editor.setPosition(Position) }
    }
  })

/**** sync WordWrap changes ****/

  $effect(() => {
    const Wrap = WordWrap
    if (Editor != null) { Editor.updateOptions({ wordWrap:Wrap }) }
  })
</script>

<div class="editor-wrapper">
  <div bind:this={EditorContainer} class="editor-container"></div>
</div>

<style>
  .editor-wrapper   { width: 100%; height: 100%; position: relative; }
  .editor-container { width: 100%; height: 100%; }
</style>
