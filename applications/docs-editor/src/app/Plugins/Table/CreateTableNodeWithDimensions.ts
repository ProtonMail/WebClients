import type { TableNode } from '@lexical/table'
import { $createTableNode, $createTableRowNode, TableCellHeaderStates, $createTableCellNode } from '@lexical/table'
import { $createParagraphNode, $createTextNode, $getEditor } from 'lexical'
import type { InsertTableCommandPayload } from './Commands'

export function $createTableNodeWithDimensions(
  rowCount: number,
  columnCount: number,
  includeHeaders: InsertTableCommandPayload['includeHeaders'] = {
    rows: true,
    columns: false,
  },
  fullWidth = true,
): TableNode {
  const editor = $getEditor()
  const rootElement = editor.getRootElement()

  const tableNode = $createTableNode()

  let columnWidth: number | undefined
  if (fullWidth && rootElement) {
    const rootElementWidth = rootElement.clientWidth
    const computedStyle = getComputedStyle(rootElement)
    const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight)
    const width = rootElementWidth - padding
    columnWidth = width / columnCount
  }

  for (let iRow = 0; iRow < rowCount; iRow++) {
    const tableRowNode = $createTableRowNode()

    for (let iColumn = 0; iColumn < columnCount; iColumn++) {
      let headerState = TableCellHeaderStates.NO_STATUS

      if (typeof includeHeaders === 'object') {
        if (iRow === 0 && includeHeaders.rows) {
          headerState |= TableCellHeaderStates.ROW
        }
        if (iColumn === 0 && includeHeaders.columns) {
          headerState |= TableCellHeaderStates.COLUMN
        }
      } else if (includeHeaders) {
        if (iRow === 0) {
          headerState |= TableCellHeaderStates.ROW
        }
        if (iColumn === 0) {
          headerState |= TableCellHeaderStates.COLUMN
        }
      }

      const tableCellNode = $createTableCellNode(headerState, undefined, columnWidth)
      const paragraphNode = $createParagraphNode()
      paragraphNode.append($createTextNode())
      tableCellNode.append(paragraphNode)
      tableRowNode.append(tableCellNode)
    }

    tableNode.append(tableRowNode)
  }

  return tableNode
}
