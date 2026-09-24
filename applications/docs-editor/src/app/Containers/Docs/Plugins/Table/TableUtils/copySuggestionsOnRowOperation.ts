import type { TableCellNode } from '@lexical/table'
import { $insertFirst } from '@lexical/utils'
import type { ProtonNode } from '../../Suggestions/ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from '../../Suggestions/ProtonNode'

/**
 * When inserting or duplicating a row, this will copy over any existing
 * suggestions that affect the whole table or the whole column of the cell.
 */
export function $copySuggestionsOnRowOperation(cell: TableCellNode, sibling: TableCellNode) {
  const originalCellChildren = sibling.getChildren()
  const wholeTableSuggestion = originalCellChildren.find(
    (node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow().endsWith('table'),
  )
  if (wholeTableSuggestion) {
    const copy = $createSuggestionNode(
      wholeTableSuggestion.getSuggestionIdOrThrow(),
      wholeTableSuggestion.getSuggestionTypeOrThrow(),
    )
    $insertFirst(cell, copy)
  }
  const columnSuggestion = originalCellChildren.find(
    (node): node is ProtonNode =>
      $isSuggestionNode(node) &&
      node.getSuggestionTypeOrThrow() &&
      node.getSuggestionTypeOrThrow().endsWith('table-column'),
  )
  if (columnSuggestion) {
    const copy = $createSuggestionNode(
      columnSuggestion.getSuggestionIdOrThrow(),
      columnSuggestion.getSuggestionTypeOrThrow(),
    )
    $insertFirst(cell, copy)
  }
}
