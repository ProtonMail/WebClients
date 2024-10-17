import type { TableCellNode } from '@lexical/table'
import type { TableRowNode } from '@lexical/table'
import {
  $computeTableMap,
  $createTableCellNode,
  $createTableRowNode,
  $getNodeTriplet,
  $isTableRowNode,
  $isTableSelection,
  TableCellHeaderStates,
} from '@lexical/table'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import invariant from '../../../Shared/invariant'
import { getHeaderState } from './getHeaderState'
import { $copySuggestionsOnRowOperation } from './copySuggestionsOnRowOperation'

// Adapted from https://github.com/facebook/lexical/blob/main/packages/lexical-table/src/LexicalTableUtils.ts#L248
// to allow returning the inserted table row
// PR https://github.com/facebook/lexical/pull/6741 has been created to bring these changes to upstream
function $insertTableRow__EXPERIMENTAL(insertAfter = true): TableRowNode | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
    throw new Error('Expected a RangeSelection or TableSelection')
  }
  const focus = selection.focus.getNode()
  const [focusCell, , grid] = $getNodeTriplet(focus)
  const [gridMap, focusCellMap] = $computeTableMap(grid, focusCell, focusCell)
  const columnCount = gridMap[0].length
  const { startRow: focusStartRow } = focusCellMap
  let insertedRow: TableRowNode | null = null
  if (insertAfter) {
    const focusEndRow = focusStartRow + focusCell.__rowSpan - 1
    const focusEndRowMap = gridMap[focusEndRow]
    const newRow = $createTableRowNode()
    for (let i = 0; i < columnCount; i++) {
      const { cell, startRow } = focusEndRowMap[i]
      if (startRow + cell.__rowSpan - 1 <= focusEndRow) {
        const currentCell = focusEndRowMap[i].cell as TableCellNode
        const currentCellHeaderState = currentCell.__headerState

        const headerState = getHeaderState(currentCellHeaderState, TableCellHeaderStates.COLUMN)

        newRow.append($createTableCellNode(headerState).append($createParagraphNode()))
      } else {
        cell.setRowSpan(cell.__rowSpan + 1)
      }
    }
    const focusEndRowNode = grid.getChildAtIndex(focusEndRow)
    invariant($isTableRowNode(focusEndRowNode), 'focusEndRow is not a TableRowNode')
    focusEndRowNode.insertAfter(newRow)
    insertedRow = newRow
  } else {
    const focusStartRowMap = gridMap[focusStartRow]
    const newRow = $createTableRowNode()
    for (let i = 0; i < columnCount; i++) {
      const { cell, startRow } = focusStartRowMap[i]
      if (startRow === focusStartRow) {
        const currentCell = focusStartRowMap[i].cell as TableCellNode
        const currentCellHeaderState = currentCell.__headerState

        const headerState = getHeaderState(currentCellHeaderState, TableCellHeaderStates.COLUMN)

        newRow.append($createTableCellNode(headerState).append($createParagraphNode()))
      } else {
        cell.setRowSpan(cell.__rowSpan + 1)
      }
    }
    const focusStartRowNode = grid.getChildAtIndex(focusStartRow)
    invariant($isTableRowNode(focusStartRowNode), 'focusEndRow is not a TableRowNode')
    focusStartRowNode.insertBefore(newRow)
    insertedRow = newRow
  }
  return insertedRow
}

/**
 * Inserts a new table row at current selection, and also
 * copies over any existing suggestion that should exist in the
 * new cells.
 * @returns inserted table row, if successful
 */
export function $insertTableRowAtSelection(insertAfter: boolean): TableRowNode | null {
  const insertedRow = $insertTableRow__EXPERIMENTAL(insertAfter)
  if (insertedRow) {
    const cells = insertedRow.getChildren<TableCellNode>()
    const sibling = insertAfter
      ? insertedRow.getPreviousSibling<TableRowNode>()
      : insertedRow.getNextSibling<TableRowNode>()
    if (sibling) {
      for (const cell of cells) {
        const cellIndex = cell.getIndexWithinParent()
        const siblingCell = sibling.getChildAtIndex<TableCellNode>(cellIndex)
        if (!siblingCell) {
          continue
        }
        $copySuggestionsOnRowOperation(cell, siblingCell)
      }
    }
  }
  return insertedRow
}
