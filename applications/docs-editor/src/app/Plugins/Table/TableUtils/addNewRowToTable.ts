import { $getElementForTableNode, $insertTableRow, TableNode } from '@lexical/table'
import { LexicalEditor } from 'lexical'

export function addNewRowToTable(editor: LexicalEditor, tableNode: TableNode) {
  editor.update(() => {
    const table = tableNode.getLatest()
    const rowCount = table.getChildrenSize()
    $insertTableRow(table, rowCount - 1, true, 1, $getElementForTableNode(editor, table))
  })
}
