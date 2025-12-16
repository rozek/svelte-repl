<script>
  import { onMount, onDestroy } from 'svelte';
  import loader from '@monaco-editor/loader';
  
  export let Value = '';
  
  let EditorContainer;
  let Editor;
  let Monaco;
        
/**** onMount ****/

  onMount(async () => {
    try {
      Monaco = await loader.init();
      
      Editor = Monaco.editor.create(EditorContainer, {
        value: Value,
        language: 'html',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        wordWrap: 'on',
        folding: true,
        lineDecorationsWidth: 5,
        lineNumbersMinChars: 3,
        renderLineHighlight: 'all',
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        }
      });
      
      Editor.onDidChangeModelContent(() => {
        Value = Editor.getValue();
      });
      
    /**** shortcut for code saving (Ctrl+S / Cmd+S) ****/

      Editor.addCommand(Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS, () => undefined);
    } catch (Signal) {
      console.error('Error loading Monaco Editor:', Signal);
    }
  });
        
/**** onDestroy ****/

  onDestroy(() => {
    if (Editor != null) {
      Editor.dispose();
    }
  });
  
  $: if ((Editor != null) && (Value !== Editor.getValue())) {
    const Position = Editor.getPosition();
    Editor.setValue(Value);
    if (Position != null) {
      Editor.setPosition(Position);
    }
  }
</script>

<div class="editor-wrapper">
  <div bind:this={EditorContainer} class="editor-container"></div>
</div>

<style>
  .editor-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .editor-container {
    width: 100%;
    height: 100%;
  }
</style>
