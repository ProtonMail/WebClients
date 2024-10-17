import type { TableCellNode } from '@lexical/table'

export function $moveSelectionToCell(cell: TableCellNode): void {
  const firstDescendant = cell.getFirstDescendant()
  if (firstDescendant == null) {
    cell.selectStart()
  } else {
    firstDescendant.getParentOrThrow().selectStart()
  }
}
