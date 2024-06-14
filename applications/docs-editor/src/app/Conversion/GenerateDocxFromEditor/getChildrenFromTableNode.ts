import { $isElementNode } from 'lexical'
import { Table, TableCell, TableRow } from 'docx'
import { $isTableCellNode, $isTableRowNode, TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { TopLevelChildren, getTopLevelChildrenFromElementNode } from './getTopLevelChildrenFromElementNode'

function getChildrenFromCellNode(node: TableCellNode): TopLevelChildren[] {
  const children: TopLevelChildren[] = []

  for (const child of node.getChildren()) {
    if ($isElementNode(child)) {
      children.push(getTopLevelChildrenFromElementNode(child))
    }
  }

  return children
}

function getCellsFromTableRow(node: TableRowNode): TableCell[] {
  const cells: TableCell[] = []

  for (const child of node.getChildren()) {
    if (!$isTableCellNode(child)) {
      continue
    }
    const children = getChildrenFromCellNode(child)
    cells.push(
      new TableCell({
        children: children.flat(),
      }),
    )
  }

  return cells
}

export function getChildrenFromTableNode(node: TableNode): Table {
  const rows: TableRow[] = []

  for (const child of node.getChildren()) {
    if (!$isTableRowNode(child)) {
      continue
    }
    const cells = getCellsFromTableRow(child)
    rows.push(
      new TableRow({
        children: cells,
      }),
    )
  }

  return new Table({
    rows,
    width: {
      size: `100%`,
      type: 'pct',
    },
  })
}
