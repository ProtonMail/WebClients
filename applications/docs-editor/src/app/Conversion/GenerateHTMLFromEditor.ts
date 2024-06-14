import { LexicalEditor } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

export function generateHTMLFromEditor(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    return $generateHtmlFromNodes(editor)
  })
}
