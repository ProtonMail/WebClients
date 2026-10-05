import { createHeadlessEditor } from '@lexical/headless'
import {
  $generateJSONFromSelectedNodes,
  $getClipboardDataFromSelection,
  $insertDataTransferForRichText,
  setLexicalClipboardDataTransfer,
} from '@lexical/clipboard'
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $nodesOfType,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND,
  type LexicalEditor,
} from 'lexical'
import { $createCommentThreadMarkNode, CommentThreadMarkNode } from './CommentThreadMarkNode'
import { registerCommentCutMove } from './registerCommentCutMove'

function clipboard() {
  const values = new Map<string, string>()
  return {
    getData: (type: string) => values.get(type) ?? '',
    setData: (type: string, value: string) => values.set(type, value),
  } as unknown as DataTransfer
}
function event(data: DataTransfer) {
  return { clipboardData: data, preventDefault: jest.fn() } as unknown as ClipboardEvent
}
const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))
function makeEditor(documentId = 'doc-1', threadIDs = new Set(['thread-1', 'thread-2'])) {
  const editor = createHeadlessEditor({
    namespace: 'editor',
    nodes: [CommentThreadMarkNode],
    onError: (error) => {
      throw error
    },
  })
  cleanups.push(registerCommentCutMove(editor, documentId, () => threadIDs))
  // These fallbacks use the same clipboard and deletion routines as rich-text.
  // Headless editors have no native DOM selection for rich-text's copy handler.
  cleanups.push(
    editor.registerCommand(
      CUT_COMMAND,
      (e) => {
        const selection = $getSelection()
        if (e && 'clipboardData' in e && e.clipboardData && $isRangeSelection(selection)) {
          setLexicalClipboardDataTransfer(e.clipboardData, $getClipboardDataFromSelection(selection))
          selection.removeText()
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  )
  cleanups.push(
    editor.registerCommand(
      COPY_COMMAND,
      (e) => {
        if (e && 'clipboardData' in e && e.clipboardData) {
          setLexicalClipboardDataTransfer(e.clipboardData, $getClipboardDataFromSelection())
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  )
  cleanups.push(
    editor.registerCommand(
      PASTE_COMMAND,
      (e) => {
        const selection = $getSelection()
        if (e && 'clipboardData' in e && e.clipboardData && selection) {
          $insertDataTransferForRichText(e.clipboardData, selection, editor)
          return true
        }
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  )
  return editor
}
function update(editor: LexicalEditor, fn: () => void) {
  editor.update(fn, { discrete: true })
}
function prepare(editor: LexicalEditor, range: 'exact' | 'partial' | 'surrounding' | 'backward' = 'exact') {
  update(editor, () => {
    const before = $createTextNode('before '),
      text = $createTextNode('commented'),
      after = $createTextNode(' after')
    $getRoot().append(
      $createParagraphNode().append(before, $createCommentThreadMarkNode(['thread-1']).append(text), after),
      $createParagraphNode().append($createTextNode('destination ')),
    )
    const s = $createRangeSelection()
    if (range === 'surrounding') {
      s.anchor.set(before.getKey(), 0, 'text')
      s.focus.set(after.getKey(), 6, 'text')
    } else if (range === 'backward') {
      s.anchor.set(text.getKey(), 9, 'text')
      s.focus.set(text.getKey(), 0, 'text')
    } else {
      s.anchor.set(text.getKey(), range === 'partial' ? 2 : 0, 'text')
      s.focus.set(text.getKey(), range === 'partial' ? 6 : 9, 'text')
    }
    $setSelection(s)
  })
}
function marks(editor: LexicalEditor) {
  return editor
    .getEditorState()
    .read(() => $nodesOfType(CommentThreadMarkNode).map((n) => ({ ids: n.getIDs(), text: n.getTextContent() })))
}
function cut(editor: LexicalEditor) {
  const data = clipboard()
  update(editor, () => editor.dispatchCommand(CUT_COMMAND, event(data)))
  return data
}
function paste(editor: LexicalEditor, data: DataTransfer) {
  update(editor, () => {
    $getRoot().getLastChild()!.selectEnd()
    editor.dispatchCommand(PASTE_COMMAND, event(data))
  })
}

it.each(['exact', 'surrounding', 'backward'] as const)(
  'moves a fully cut anchor (%s), keeping IDs off public clipboard formats',
  (range) => {
    const editor = makeEditor()
    prepare(editor, range)
    const data = cut(editor)
    expect(marks(editor)).toEqual([])
    expect(data.getData('application/x-lexical-editor')).not.toContain('comment-thread-mark')
    expect(data.getData('text/html')).not.toContain('<mark')
    expect(data.getData('application/x-lexical-editor')).toContain('protonCommentMoveToken')
    paste(editor, data)
    expect(marks(editor)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
  },
)
it('keeps a partial cut comment on the remaining text', () => {
  const editor = makeEditor()
  prepare(editor, 'partial')
  const data = cut(editor)
  paste(editor, data)
  expect(marks(editor)).toEqual([{ ids: ['thread-1'], text: 'coted' }])
  expect(data.getData('application/x-lexical-editor')).not.toContain('protonCommentMoveToken')
})
it('does not duplicate comments on copy', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = clipboard()
  update(editor, () => editor.dispatchCommand(COPY_COMMAND, event(data)))
  paste(editor, data)
  expect(marks(editor)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
})
it('consumes the move before repeat paste and does not resurrect it after deletion', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  paste(editor, data)
  paste(editor, data)
  expect(marks(editor)).toHaveLength(1)
  update(editor, () => $nodesOfType(CommentThreadMarkNode).forEach((n) => n.remove()))
  paste(editor, data)
  expect(marks(editor)).toEqual([])
})
it('strips anchors across documents sharing a namespace, and consumes the attempted move', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  const other = makeEditor('doc-2')
  update(other, () => $getRoot().append($createParagraphNode()))
  paste(other, data)
  expect(marks(other)).toEqual([])
  paste(editor, data)
  expect(marks(editor)).toEqual([])
})
it('does not accept a different editor session even with the same document ID', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  const other = makeEditor()
  update(other, () => $getRoot().append($createParagraphNode()))
  paste(other, data)
  expect(marks(other)).toEqual([])
})
it('does not duplicate an anchor restored by undo before paste', () => {
  const editor = makeEditor()
  prepare(editor)
  const beforeCut = editor.getEditorState()
  const data = cut(editor)
  editor.setEditorState(beforeCut)
  paste(editor, data)
  expect(marks(editor)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
})
it('does not resurrect a remotely deleted thread', () => {
  const ids = new Set(['thread-1'])
  const editor = makeEditor('doc-1', ids)
  prepare(editor)
  const data = cut(editor)
  ids.clear()
  paste(editor, data)
  expect(marks(editor)).toEqual([])
})
it('rejects altered clipboard contents', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  data.setData('application/x-lexical-editor', JSON.stringify({ namespace: 'editor', nodes: [] }))
  paste(editor, data)
  expect(marks(editor)).toEqual([])
})
it('invalidates a pending move on a subsequent copy', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  update(editor, () => {
    $getRoot().getLastChild()!.selectEnd()
    editor.dispatchCommand(COPY_COMMAND, event(clipboard()))
  })
  paste(editor, data)
  expect(marks(editor)).toEqual([])
})
it('moves formatted multi-node anchors and overlapping IDs', () => {
  const editor = makeEditor()
  update(editor, () => {
    const first = $createTextNode('bold').toggleFormat('bold'),
      second = $createTextNode('plain')
    $getRoot().append(
      $createParagraphNode().append($createCommentThreadMarkNode(['thread-1', 'thread-2']).append(first, second)),
      $createParagraphNode(),
    )
    const s = $createRangeSelection()
    s.anchor.set(first.getKey(), 0, 'text')
    s.focus.set(second.getKey(), 5, 'text')
    $setSelection(s)
  })
  const data = cut(editor)
  paste(editor, data)
  expect(marks(editor)).toEqual([{ ids: ['thread-1', 'thread-2'], text: 'boldplain' }])
  editor
    .getEditorState()
    .read(() => expect($nodesOfType(CommentThreadMarkNode)[0].getFirstChild()!.getTextContent()).toBe('bold'))
})
it('leaves partially selected multi-anchor thread IDs behind while moving a fully selected overlapping thread', () => {
  const editor = makeEditor()
  update(editor, () => {
    const first = $createTextNode('first'),
      second = $createTextNode('second')
    $getRoot().append(
      $createParagraphNode().append($createCommentThreadMarkNode(['thread-1', 'thread-2']).append(first)),
      $createParagraphNode().append($createCommentThreadMarkNode(['thread-1']).append(second)),
      $createParagraphNode(),
    )
    first.select(0, 5)
  })
  const data = cut(editor)
  paste(editor, data)
  expect(marks(editor)).toEqual([
    { ids: ['thread-1'], text: 'second' },
    { ids: ['thread-2'], text: 'first' },
  ])
})
it('keeps ordinary serialization unchanged after a private cut snapshot', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  paste(editor, data)
  update(editor, () => {
    const text = $nodesOfType(CommentThreadMarkNode)[0].getFirstChild()!
    if ($isTextNode(text)) {
      text.select(0, 9)
    }
    expect(JSON.stringify($generateJSONFromSelectedNodes(editor, $getSelection()))).not.toContain('comment-thread-mark')
  })
})

// Real Lexical/Yjs bindings and UndoManagers, without network or DOM cursors.
import {
  createBinding,
  createUndoManager,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  type Provider,
} from '@lexical/yjs'
import { Doc, applyUpdate, UndoManager } from 'yjs'

function collaborate(editor: LexicalEditor, doc: Doc) {
  const provider = {
    awareness: {
      getLocalState: () => null,
      getStates: () => new Map(),
      setLocalState: () => {},
      setLocalStateField: () => {},
      on: () => {},
      off: () => {},
    },
  } as unknown as Provider
  const binding = createBinding(editor, provider, 'doc-1', doc, new Map([['doc-1', doc]]))
  const root = binding.root.getSharedType()
  const observe: Parameters<typeof root.observeDeep>[0] = (events, transaction) => {
    if (transaction.origin !== binding) {
      syncYjsChangesToLexical(binding, provider, events, transaction.origin instanceof UndoManager, () => {})
    }
  }
  root.observeDeep(observe)
  cleanups.push(() => root.unobserveDeep(observe))
  cleanups.push(
    editor.registerUpdateListener(
      ({ prevEditorState, editorState, dirtyElements, dirtyLeaves, normalizedNodes, tags }) => {
        syncLexicalUpdateToYjs(
          binding,
          provider,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags,
        )
      },
    ),
  )
  const undo = createUndoManager(binding, root)
  cleanups.push(() => undo.destroy())
  return undo
}
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

it('synchronizes the moved anchors to a Yjs peer and preserves real undo/redo of cut and paste', async () => {
  const source = makeEditor(),
    peer = makeEditor()
  const sourceDoc = new Doc(),
    peerDoc = new Doc()
  const sourceUndo = collaborate(source, sourceDoc)
  collaborate(peer, peerDoc)
  sourceDoc.on('update', (bytes, origin) => {
    if (origin !== peerDoc) {
      applyUpdate(peerDoc, bytes, sourceDoc)
    }
  })
  peerDoc.on('update', (bytes, origin) => {
    if (origin !== sourceDoc) {
      applyUpdate(sourceDoc, bytes, peerDoc)
    }
  })
  prepare(source)
  await flush()
  expect(marks(peer)).toEqual(marks(source))
  sourceUndo.clear()
  const data = cut(source)
  await flush()
  expect(marks(peer)).toEqual([])
  sourceUndo.stopCapturing()
  paste(source, data)
  await flush()
  expect(marks(peer)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
  expect(marks(peer)).toEqual(marks(source))
  sourceUndo.undo() // paste
  await flush()
  expect(marks(source)).toEqual([])
  expect(marks(peer)).toEqual([])
  sourceUndo.undo() // cut
  await flush()
  expect(marks(source)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
  expect(marks(peer)).toEqual(marks(source))
  sourceUndo.redo() // cut
  await flush()
  expect(marks(source)).toEqual([])
  sourceUndo.redo() // paste
  await flush()
  expect(marks(peer)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
  expect(marks(peer)).toEqual(marks(source))
})

it('does not duplicate attachment on immediate repeat paste at the resulting cursor', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  paste(editor, data)
  update(editor, () => editor.dispatchCommand(PASTE_COMMAND, event(data)))
  expect(marks(editor)).toEqual([{ ids: ['thread-1'], text: 'commented' }])
})

it('moves every anchor of a thread spanning paragraphs', () => {
  const editor = makeEditor()
  update(editor, () => {
    const first = $createTextNode('first'),
      second = $createTextNode('second')
    $getRoot().append(
      $createParagraphNode().append($createCommentThreadMarkNode(['thread-1']).append(first)),
      $createParagraphNode().append($createCommentThreadMarkNode(['thread-1']).append(second)),
      $createParagraphNode(),
    )
    const selection = $createRangeSelection()
    selection.anchor.set(first.getKey(), 0, 'text')
    selection.focus.set(second.getKey(), 6, 'text')
    $setSelection(selection)
  })
  const data = cut(editor)
  expect(marks(editor)).toEqual([])
  paste(editor, data)
  expect(marks(editor)).toEqual([
    { ids: ['thread-1'], text: 'first' },
    { ids: ['thread-1'], text: 'second' },
  ])
})

it('invalidates a cut on editor teardown', () => {
  const editor = makeEditor()
  prepare(editor)
  const data = cut(editor)
  cleanups.splice(0).forEach((cleanup) => cleanup())
  cleanups.push(registerCommentCutMove(editor, 'doc-1', () => new Set(['thread-1'])))
  update(editor, () => {
    $getRoot().getLastChild()!.selectEnd()
    expect(editor.dispatchCommand(PASTE_COMMAND, event(data))).toBe(false)
  })
  expect(marks(editor)).toEqual([])
})
