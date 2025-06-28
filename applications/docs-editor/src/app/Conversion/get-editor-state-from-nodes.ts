import { $generateNodesFromSerializedNodes, $insertGeneratedNodes } from '@lexical/clipboard'
import { createHeadlessEditor } from '@lexical/headless'
import type { SerializedLexicalNode } from 'lexical'
import { $getRoot } from 'lexical'
import { AllNodes } from '../AllNodes'
import { reportErrorToSentry } from '../Utils/errorMessage'

export function getEditorStateFromSerializedNodes(nodes: SerializedLexicalNode[]) {
  const editor = createHeadlessEditor({
    editable: false,
    editorState: undefined,
    namespace: 'export-editor',
    nodes: AllNodes,
    onError: (error) => {
      reportErrorToSentry(error)
    },
  })
  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const selection = root.selectEnd()
      const generatedNodes = $generateNodesFromSerializedNodes(nodes)
      $insertGeneratedNodes(editor, generatedNodes, selection)
    },
    {
      discrete: true,
    },
  )
  return editor.read(() => {
    return editor.getEditorState().toJSON()
  })
}
