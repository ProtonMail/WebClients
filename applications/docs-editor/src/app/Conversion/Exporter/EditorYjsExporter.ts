import { EditorExporter } from './EditorExporter'
import type { Provider } from '@lexical/yjs'
import { createBinding, syncLexicalUpdateToYjs } from '@lexical/yjs'
import type { YDocMap } from '@proton/docs-shared'
import { Doc, encodeStateAsUpdate } from 'yjs'

/**
 * Converts Lexical JSON state to YJS delta-based state while removing comment marks from the resulting YJS state.
 */
export class EditorYjsExporter extends EditorExporter {
  async export(): Promise<Uint8Array> {
    const provider: Provider = {
      awareness: {
        getLocalState: () => null,
        getStates: () => new Map(),
        off: () => {},
        on: () => {},
        setLocalState: () => {},
      },
      off: () => {},
      on: () => {},
      connect: () => {},
      disconnect: () => {},
    }

    const id = 'yjs-export'
    const doc = new Doc()
    const docMap: YDocMap = new Map([[id, doc]])
    const binding = createBinding(this.editor, provider, id, doc, docMap)

    const removeListener = this.editor.registerUpdateListener(
      ({ prevEditorState, editorState, dirtyLeaves, dirtyElements, normalizedNodes, tags }) => {
        if (tags.has('skip-collab') === false) {
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
        }
      },
    )

    this.editor.setEditorState(this.editor.parseEditorState(this.editorState))
    this.removeCommentThreadMarks()
    removeListener()

    const editorYjsState = encodeStateAsUpdate(doc)
    return editorYjsState
  }
}
