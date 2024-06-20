import { $isTableCellNode, $isTableSelection } from '@lexical/table'
import { $getSelection, LexicalEditor } from 'lexical'

export function setBackgroundColorForSelection(editor: LexicalEditor, color: string | null) {
  editor.update(
    () => {
      const selection = $getSelection()
      if (!$isTableSelection(selection)) {
        return
      }
      const cells = selection.getNodes().filter($isTableCellNode)
      cells.forEach((cell) => {
        cell.setBackgroundColor(color)
      })
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
