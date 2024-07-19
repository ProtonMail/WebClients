import type { LexicalEditor } from 'lexical'
import { $getRoot } from 'lexical'

export function generatePlaintextFromEditor(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    const root = $getRoot()
    return root.getTextContent()
  })
}
