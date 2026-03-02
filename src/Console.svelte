<script lang="ts">
/*******************************************************************************
*                                                                              *
*                             Console.svelte                                  *
*                                                                              *
*******************************************************************************/

  export type ConsoleEntry = {
    Id:     number;
    Level:  'log'|'warn'|'error'|'dir'|'info';
    ArgList:unknown[];
    Time:   string;
  }

  let {
    Entries   = [] as ConsoleEntry[],
    CharLimit = 10_000,
    wrapLines = false,
  }: {
    Entries:   ConsoleEntry[];
    CharLimit: number;
    wrapLines: boolean;
  } = $props()

//----------------------------------------------------------------------------//
//                            Object Inspector                                //
//----------------------------------------------------------------------------//

  let expanded = $state<Map<number, Set<string>>>(new Map())

  let scrollableElement:HTMLElement
  $effect(() => {
    if (Entries.length && (scrollableElement != null)) {
      scrollableElement.scrollTop = scrollableElement.scrollHeight
    }
  })

/**** toggle ****/

  function toggle (EntryId:number, Path:string) {
    const MapCopy = new Map(expanded)
    const SetCopy = new Set(MapCopy.get(EntryId) ?? [])
    if (SetCopy.has(Path)) { SetCopy.delete(Path) } else { SetCopy.add(Path) }
    MapCopy.set(EntryId, SetCopy)
    expanded = MapCopy
  }

/**** isExpanded ****/

  function isExpanded (EntryId:number, Path:string):boolean {
    return expanded.get(EntryId)?.has(Path) ?? false
  }

//----------------------------------------------------------------------------//
//                               Formatting                                   //
//----------------------------------------------------------------------------//

  type Node =
    | { Kind:'primitive'; Value:string }
    | { Kind:'expandable'; label:string; innerNodes:() => [string, Node][] }
    | { Kind:'truncated';  Value:string }

/**** toNode ****/

  function toNode (Value:unknown, Depth = 0):Node {
    if (Value === null)      { return { Kind:'primitive', Value:'null' } }
    if (Value === undefined) { return { Kind:'primitive', Value:'undefined' } }
    if (typeof Value === 'string') {
      const Display = (Depth === 0) ? Value : JSON.stringify(Value)
      if (Display.length > CharLimit) {
        return { Kind:'truncated', Value:Display.slice(0, CharLimit) + '…' }
      }
      return { Kind:'primitive', Value:Display }
    }
    if (
      (typeof Value === 'number') ||
      (typeof Value === 'boolean') ||
      (typeof Value === 'bigint')
    ) { return { Kind:'primitive', Value:String(Value) } }
    if (Value instanceof Error) {
      return { Kind:'primitive', Value:Value.stack ?? Value.message }
    }
    if ((typeof Value === 'object') || (typeof Value === 'function')) {
      const isArray = Array.isArray(Value)
      const Pairs   = isArray
        ? (Value as unknown[]).map((v, i) => [ String(i), v ] as [string, unknown])
        : Object.entries(Value as Record<string, unknown>)
      const Label = isArray
        ? `Array(${(Value as unknown[]).length})`
        : ((Value as object).constructor?.name ?? 'Object')
      return {
        Kind:      'expandable',
        label:     Label,
        innerNodes:() => Pairs.map(([k, v]) => [ k, toNode(v, Depth+1) ] as [string, Node]),
      }
    }
    return { Kind:'primitive', Value:String(Value) }
  }
</script>

<div class="console-wrap" class:wrap-lines={wrapLines} bind:this={scrollableElement}>
  {#if Entries.length === 0}
    <div class="console-empty">No console output yet.</div>
  {:else}
    {#each Entries as Entry (Entry.Id)}
      {@const EntryId = Entry.Id}
      <div class="console-line console-{Entry.Level}">
        <span class="console-time">{Entry.Time}</span>
        <span class="console-body">
          {#each Entry.ArgList as Argument, Index}
            {#if Index > 0}<span class="console-sep"> </span>{/if}
            {@const Node = toNode(Argument)}
            {#if Node.Kind === 'primitive'}
              <span class="val-primitive">{Node.Value}</span>
            {:else if Node.Kind === 'truncated'}
              <span class="val-truncated">{Node.Value}</span>
            {:else}
              {@const RootPath = `${EntryId}:${Index}`}
              <span
                class="val-expandable"
                class:open={isExpanded(EntryId, RootPath)}
                role="button"
                tabindex="0"
                onclick={() => toggle(EntryId, RootPath)}
                onkeydown={(Event) => (Event.key === 'Enter') && toggle(EntryId, RootPath)}
              >
                <span class="expand-arrow">{isExpanded(EntryId, RootPath) ? '▾' : '▸'}</span>
                <span class="val-label">{Node.label}</span>
              </span>
              {#if isExpanded(EntryId, RootPath)}
                <div class="val-children">
                  {#each Node.innerNodes() as [Key, innerNode]}
                    {@const innerNodePath = `${RootPath}.${Key}`}
                    <div class="val-child-row">
                      <span class="val-key">{Key}: </span>
                      {#if innerNode.Kind === 'primitive'}
                        <span class="val-primitive">{innerNode.Value}</span>
                      {:else if innerNode.Kind === 'truncated'}
                        <span class="val-truncated">{innerNode.Value}</span>
                      {:else}
                        <span
                          class="val-expandable"
                          class:open={isExpanded(EntryId, innerNodePath)}
                          role="button"
                          tabindex="0"
                          onclick={() => toggle(EntryId, innerNodePath)}
                          onkeydown={(Event) => (Event.key === 'Enter') && toggle(EntryId, innerNodePath)}
                        >
                          <span class="expand-arrow">{isExpanded(EntryId, innerNodePath) ? '▾' : '▸'}</span>
                          <span class="val-label">{innerNode.label}</span>
                        </span>
                        {#if isExpanded(EntryId, innerNodePath)}
                          <div class="val-children">
                            {#each innerNode.innerNodes() as [k2, c2]}
                              <div class="val-child-row">
                                <span class="val-key">{k2}: </span>
                                {#if c2.Kind === 'primitive'}
                                  <span class="val-primitive">{c2.Value}</span>
                                {:else if c2.Kind === 'truncated'}
                                  <span class="val-truncated">{c2.Value}</span>
                                {:else}
                                  <span class="val-expandable val-leaf">
                                    <span class="expand-arrow">▸</span>
                                    <span class="val-label">{c2.label}</span>
                                  </span>
                                {/if}
                              </div>
                            {/each}
                          </div>
                        {/if}
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          {/each}
        </span>
        <span class="console-level-badge console-badge-{Entry.Level}">{Entry.Level}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  .console-wrap {
    width: 100%; height: 100%;
    overflow-y: auto; overflow-x: auto;
    font-family: 'Consolas', 'Menlo', 'Monaco', monospace;
    font-size: 12.5px;
    background: #1e1e1e;
    color: #d4d4d4;
    box-sizing: border-box;
    padding: 2px 0;
  }
  .console-empty {
    padding: 20px 12px;
    color: #555;
    font-style: italic;
    font-size: 12px;
  }

  .console-line {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 3px 8px 3px 6px;
    border-bottom: 1px solid #2a2a2a;
    min-height: 22px;
    white-space: pre;
  }
  .wrap-lines .console-line  { white-space: pre-wrap; word-break: break-all; }
  .console-line:hover        { background: #262626; }
  .console-log   { color: #d4d4d4; }
  .console-info  { color: #9cdcfe; background: #1a2430; }
  .console-warn  { color: #ddb44b; background: #221e00; border-bottom-color: #3a3000; }
  .console-error { color: #f48771; background: #220000; border-bottom-color: #3a0000; }
  .console-dir   { color: #b5cea8; }

  .console-time {
    flex-shrink: 0;
    color: #4e4e4e;
    font-size: 11px;
    width: 60px;
    padding-top: 2px;
    user-select: none;
  }
  .console-body { flex: 1; min-width: 0; }
  .console-sep  { display: inline; }

  .console-level-badge {
    flex-shrink: 0;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    opacity: 0.6;
    align-self: flex-start;
    margin-top: 3px;
    user-select: none;
  }
  .console-badge-log   { background: #333; color: #aaa; }
  .console-badge-info  { background: #1a4060; color: #9cdcfe; }
  .console-badge-warn  { background: #3a2f00; color: #ddb44b; }
  .console-badge-error { background: #3a0000; color: #f48771; }
  .console-badge-dir   { background: #1a3320; color: #b5cea8; }

  .val-primitive { color: inherit; }
  .val-truncated { color: #aaa; font-style: italic; }

  .val-expandable {
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    cursor: pointer;
    border-radius: 2px;
    padding: 0 2px;
  }
  .val-expandable:hover    { background: #2d2d2d; }
  .val-expandable.val-leaf { cursor: default; opacity: 0.5; }

  .expand-arrow {
    font-size: 9px;
    color: #888;
    user-select: none;
    width: 10px;
    display: inline-block;
  }
  .val-label { color: #ce9178; }
  .val-key   { color: #9cdcfe; }

  .val-children {
    display: block;
    margin-left: 18px;
    border-left: 1px solid #333;
    padding-left: 8px;
  }
  .val-child-row {
    display: flex;
    align-items: flex-start;
    gap: 2px;
    padding: 1px 0;
    white-space: pre;
  }
  .wrap-lines .val-child-row { white-space: pre-wrap; }
</style>
