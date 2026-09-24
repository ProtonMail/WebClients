import type { TableCellNode } from '@lexical/table'
import { $insertFirst } from '@lexical/utils'
import type { ProtonNode } from '../../Suggestions/ProtonNode'
import { $isSuggestionNode, $createSuggestionNode } from '../../Suggestions/ProtonNode'

/**
 * When inserting or duplicating a column, this will copy over any
 * existing suggestions that affect the whole table or the whole row of the cell.
 */
export function $copySuggestionsOnColumnOperation(cell: TableCellNode, sibling: TableCellNode) {
  const siblingChildren = sibling.getChildren()
  const wholeTableSuggestion = siblingChildren.find(
    (node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow().endsWith('table'),
  )
  if (wholeTableSuggestion) {
    const copy = $createSuggestionNode(
      wholeTableSuggestion.getSuggestionIdOrThrow(),
      wholeTableSuggestion.getSuggestionTypeOrThrow(),
    )
    $insertFirst(cell, copy)
  }
  const rowSuggestion = siblingChildren.find(
    (node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow().endsWith('table-row'),
  )
  if (rowSuggestion) {
    const copy = $createSuggestionNode(rowSuggestion.getSuggestionIdOrThrow(), rowSuggestion.getSuggestionTypeOrThrow())
    $insertFirst(cell, copy)
  }
}
