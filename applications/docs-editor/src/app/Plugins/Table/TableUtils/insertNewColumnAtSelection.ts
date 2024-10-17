import type { TableRowNode } from '@lexical/table'
import type { TableCellNode } from '@lexical/table'
import {
  $computeTableMap,
  $createTableCellNode,
  $getNodeTriplet,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  TableCellHeaderStates,
} from '@lexical/table'
import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical'
import type { TableCellHeaderState } from './getHeaderState'
import { getHeaderState } from './getHeaderState'
import { $moveSelectionToCell } from './moveSelectionToCell'
import { $copySuggestionsOnColumnOperation } from './copySuggestionsOnColumnOperation'

// Adapted from https://github.com/facebook/lexical/blob/main/packages/lexical-table/src/LexicalTableUtils.ts#L376
// to allow returning the inserted table row
// PR https://github.com/facebook/lexical/pull/6741 has been created to bring these changes to upstream
function $insertTableColumn__EXPERIMENTAL(insertAfter = true): TableCellNode | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
    throw new Error('Expected a RangeSelection or TableSelection')
  }
  const anchor = selection.anchor.getNode()
  const focus = selection.focus.getNode()
  const [anchorCell] = $getNodeTriplet(anchor)
  const [focusCell, , grid] = $getNodeTriplet(focus)
  const [gridMap, focusCellMap, anchorCellMap] = $computeTableMap(grid, focusCell, anchorCell)
  const rowCount = gridMap.length
  const startColumn = insertAfter
    ? Math.max(focusCellMap.startColumn, anchorCellMap.startColumn)
    : Math.min(focusCellMap.startColumn, anchorCellMap.startColumn)
  const insertAfterColumn = insertAfter ? startColumn + focusCell.__colSpan - 1 : startColumn - 1
  const gridFirstChild = grid.getFirstChild()
  if (!$isTableRowNode(gridFirstChild)) {
    throw new Error('Expected firstTable child to be a row')
  }
  let firstInsertedCell: null | TableCellNode = null
  function $createTableCellNodeForInsertTableColumn(
    headerState: TableCellHeaderState = TableCellHeaderStates.NO_STATUS,
  ) {
    const cell = $createTableCellNode(headerState).append($createParagraphNode())
    if (firstInsertedCell === null) {
      firstInsertedCell = cell
    }
    return cell
  }
  let loopRow: TableRowNode = gridFirstChild
  rowLoop: for (let i = 0; i < rowCount; i++) {
    if (i !== 0) {
      const currentRow = loopRow.getNextSibling()
      if (!$isTableRowNode(currentRow)) {
        throw new Error('Expected row nextSibling to be a row')
      }
      loopRow = currentRow
    }
    const rowMap = gridMap[i]

    const currentCellHeaderState = (rowMap[insertAfterColumn < 0 ? 0 : insertAfterColumn].cell as TableCellNode)
      .__headerState

    const headerState = getHeaderState(currentCellHeaderState, TableCellHeaderStates.ROW)

    if (insertAfterColumn < 0) {
      $insertFirst(loopRow, $createTableCellNodeForInsertTableColumn(headerState))
      continue
    }
    const { cell: currentCell, startColumn: currentStartColumn, startRow: currentStartRow } = rowMap[insertAfterColumn]
    if (currentStartColumn + currentCell.__colSpan - 1 <= insertAfterColumn) {
      let insertAfterCell: TableCellNode = currentCell
      let insertAfterCellRowStart = currentStartRow
      let prevCellIndex = insertAfterColumn
      while (insertAfterCellRowStart !== i && insertAfterCell.__rowSpan > 1) {
        prevCellIndex -= currentCell.__colSpan
        if (prevCellIndex >= 0) {
          const { cell: cell_, startRow: startRow_ } = rowMap[prevCellIndex]
          insertAfterCell = cell_
          insertAfterCellRowStart = startRow_
        } else {
          loopRow.append($createTableCellNodeForInsertTableColumn(headerState))
          continue rowLoop
        }
      }
      insertAfterCell.insertAfter($createTableCellNodeForInsertTableColumn(headerState))
    } else {
      currentCell.setColSpan(currentCell.__colSpan + 1)
    }
  }
  if (firstInsertedCell !== null) {
    $moveSelectionToCell(firstInsertedCell)
  }
  return firstInsertedCell
}

/**
 * Inserts a new table column at current selection, and also
 * copies over any existing suggestion that should exist in the
 * new cells.
 * @returns first inserted table cell, if successful
 */
export function $insertTableColumnAtSelection(insertAfter: boolean): TableCellNode | null {
  const firstInsertedCell = $insertTableColumn__EXPERIMENTAL(insertAfter)
  if (firstInsertedCell) {
    const table = $findMatchingParent(firstInsertedCell, $isTableNode)
    if (table) {
      const cellIndex = firstInsertedCell.getIndexWithinParent()
      for (const row of table.getChildren<TableRowNode>()) {
        const cellAtIndex = row.getChildAtIndex<TableCellNode>(cellIndex)
        if (!cellAtIndex) {
          continue
        }
        const sibling = cellAtIndex.getPreviousSibling<TableCellNode>() || cellAtIndex.getNextSibling<TableCellNode>()
        if (!sibling) {
          continue
        }
        $copySuggestionsOnColumnOperation(cellAtIndex, sibling)
      }
    }
  }
  return firstInsertedCell
}
