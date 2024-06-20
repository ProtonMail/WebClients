import { $insertTableColumn__EXPERIMENTAL, TableCellNode } from '@lexical/table'
import { LexicalEditor } from 'lexical'

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
