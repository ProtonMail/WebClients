import type { TableCellNode } from '@lexical/table'
import { $insertTableColumn__EXPERIMENTAL } from '@lexical/table'
import type { LexicalEditor } from 'lexical'

export function insertNewColumnAtSelection(editor: LexicalEditor, cellNode: TableCellNode, insertAfter: boolean) {
  editor.update(
    () => {
      $insertTableColumn__EXPERIMENTAL(insertAfter)
      cellNode.selectStart()
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
