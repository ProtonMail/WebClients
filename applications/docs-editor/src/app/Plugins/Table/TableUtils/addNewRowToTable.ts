import type { TableRowNode } from '@lexical/table'
import { type TableNode } from '@lexical/table'
import { $selectRow } from './selectRow'
import type { LexicalEditor } from 'lexical'
import { INSERT_TABLE_ROW_COMMAND } from '../Commands'

export function $addNewRowAtEndOfTable(editor: LexicalEditor, tableNode: TableNode) {
  const table = tableNode.getLatest()
  const lastRow = table.getLastChildOrThrow<TableRowNode>()
  if (!lastRow) {
    return
  }
  $selectRow(lastRow)
  editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { insertAfter: true })
}
