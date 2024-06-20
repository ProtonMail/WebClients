import { $insertTableRow__EXPERIMENTAL, TableRowNode } from '@lexical/table'
import { LexicalEditor } from 'lexical'

export function insertNewRowAtSelection(editor: LexicalEditor, rowNode: TableRowNode, insertAfter: boolean) {
  editor.update(
    () => {
      $insertTableRow__EXPERIMENTAL(insertAfter)
      if (insertAfter) {
        rowNode.getNextSibling<TableRowNode>()?.getFirstChild()?.selectStart()
      } else {
        rowNode.getPreviousSibling<TableRowNode>()?.getFirstChild()?.selectStart()
      }
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
