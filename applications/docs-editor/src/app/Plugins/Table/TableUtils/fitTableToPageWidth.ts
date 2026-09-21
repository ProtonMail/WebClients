import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $isTableNode } from '@lexical/table'
import type { LexicalNode } from 'lexical'

export function $fitTableToPageWidth(table: TableNode, rootElement: HTMLElement): void {
  const firstRow = table.getFirstChild<TableRowNode>()
  if (!firstRow) {
    return
  }

  const columnCount = firstRow.getChildrenSize()
  if (columnCount === 0) {
    return
  }

  const computedStyle = getComputedStyle(rootElement)
  const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight)
  const columnWidth = (rootElement.clientWidth - padding) / columnCount

  for (const row of table.getChildren<TableRowNode>()) {
    for (const cell of row.getChildren<TableCellNode>()) {
      cell.setWidth(columnWidth)
    }
  }
}

export function $getPastedTablesWithoutExplicitWidths(nodes: LexicalNode[]): TableNode[] {
  return nodes.filter($isTableNode).filter((table) => {
    const firstRow = table.getFirstChild<TableRowNode>()
    return firstRow?.getChildren<TableCellNode>().some((cell) => cell.getWidth() === undefined) ?? false
  })
}
