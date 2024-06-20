import { TableRowNode } from '@lexical/table'
import { $createRangeSelection, $setSelection, LexicalEditor } from 'lexical'

export function selectRow(editor: LexicalEditor, rowNode: TableRowNode) {
  editor.update(() => {
    const table = rowNode.getParent()
    const firstCell = rowNode.getFirstChild()
    const lastCell = rowNode.getLastChild()
    if (!table || !firstCell || !lastCell) {
      return
    }
    const selection = $createRangeSelection()
    selection.anchor.set(firstCell.getKey(), 0, 'element')
    selection.focus.set(lastCell.getKey(), 0, 'element')
    $setSelection(selection)
  })
}
