import type { LexicalEditor } from 'lexical'
import { $createParagraphNode, $getRoot } from 'lexical'
import { CLEAR_HISTORY_COMMAND } from '../Plugins/Collaboration/useYjsHistory'

export function fixEmptyRoot(editor: LexicalEditor) {
  let didAddParagraph = false
  editor.update(
    () => {
      const root = $getRoot()
      if (root.isEmpty()) {
        const paragraph = $createParagraphNode()
        root.append(paragraph)
        paragraph.selectEnd()
        didAddParagraph = true
      }
    },
    {
      discrete: true,
    },
  )
  if (didAddParagraph) {
    editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined)
  }
}
