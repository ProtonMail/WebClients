import * as Y from 'yjs'
import { createHeadlessEditor } from '@lexical/headless'
import { AllNodes } from '../AllNodes'
import { sendErrorMessage } from '../Utils/errorMessage'
import { createBinding, syncYjsChangesToLexical } from '@lexical/yjs'
import { SerializedEditorState } from 'lexical'

export function generateEditorStatefromYDoc(doc: Y.Doc): SerializedEditorState {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'ydoc-to-json',
    nodes: AllNodes,
    onError: (error) => {
      sendErrorMessage(error)
    },
  })

  const dummyId = 'dummy-id'
  const dummyProvider: any = {
    awareness: {
      getLocalState: () => null,
      getStates: () => [],
    },
  }
  const copyTarget = new Y.Doc()
  const copyBinding = createBinding(editor, dummyProvider, dummyId, copyTarget, new Map([[dummyId, copyTarget]]))

  const onYjsTreeChanges = (events: Y.YEvent<any>[], _transaction: Y.Transaction) => {
    syncYjsChangesToLexical(copyBinding, dummyProvider as any, events, false)
  }
  copyBinding.root.getSharedType().observeDeep(onYjsTreeChanges)

  const update = Y.encodeStateAsUpdate(doc)
  Y.applyUpdate(copyTarget, update)

  // Empty update is required for the document to be converted to Lexical state
  editor.update(() => {}, { discrete: true })

  copyTarget.destroy()

  return editor.getEditorState().toJSON()
}
