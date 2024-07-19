import { $isElementNode } from 'lexical'
import { Table, TableCell, TableRow } from 'docx'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $isTableCellNode, $isTableRowNode } from '@lexical/table'
import type { TopLevelChildren } from './getTopLevelChildrenFromElementNode'
import { getTopLevelChildrenFromElementNode } from './getTopLevelChildrenFromElementNode'
import type { DocxExportContext } from './Context'

async function getChildrenFromCellNode(node: TableCellNode, context: DocxExportContext): Promise<TopLevelChildren[]> {
  const children: TopLevelChildren[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if ($isElementNode(child)) {
      children.push(await getTopLevelChildrenFromElementNode(child, context))
    }
  }

  return children
}

async function getCellsFromTableRow(node: TableRowNode, context: DocxExportContext): Promise<TableCell[]> {
  const cells: TableCell[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if (!$isTableCellNode(child)) {
      continue
    }
    const children = await getChildrenFromCellNode(child, context)
    cells.push(
      new TableCell({
        children: children.flat(),
      }),
    )
  }

  return cells
}

export async function getChildrenFromTableNode(node: TableNode, context: DocxExportContext): Promise<Table> {
  const rows: TableRow[] = []

  const nodeChildren = context.state.read(() => node.getChildren())
  for (const child of nodeChildren) {
    if (!$isTableRowNode(child)) {
      continue
    }
    const cells = await getCellsFromTableRow(child, context)
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
