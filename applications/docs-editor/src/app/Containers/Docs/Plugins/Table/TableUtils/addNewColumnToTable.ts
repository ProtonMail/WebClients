import type { TableNode, TableRowNode, TableCellNode } from '@lexical/table'
import type { LexicalEditor } from 'lexical'
import { $selectColumn } from './selectColumn'
import { INSERT_TABLE_COLUMN_COMMAND } from '../Commands'

export function $addNewColumnAtEndOfTable(editor: LexicalEditor, tableNode: TableNode) {
  const table = tableNode.getLatest()
  const lastCellOfFirstRow = table.getFirstChildOrThrow<TableRowNode>().getLastChildOrThrow<TableCellNode>()
  if (!lastCellOfFirstRow) {
    return
  }
  $selectColumn(lastCellOfFirstRow)
  editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { insertAfter: true })
}
