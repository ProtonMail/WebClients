import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $isTableCellNode } from '@lexical/table'
import { $isTableNode } from '@lexical/table'
import { $insertNodeToNearestRoot, $insertFirst, $findMatchingParent } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-core'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import type { NodeKey } from 'lexical'
import { $getEditor, $getNodeByKey, $isParagraphNode } from 'lexical'
import type { Logger } from '@proton/utils/logs'
import { $insertTableRowAtSelection } from '../Table/TableUtils/insertNewRowAtSelection'
import { $insertTableColumnAtSelection } from '../Table/TableUtils/insertNewColumnAtSelection'
import { $moveSelectionToCell } from '../Table/TableUtils/moveSelectionToCell'
import { $createTableNodeWithDimensions } from '../Table/CreateTableNodeWithDimensions'
import type { InsertTableCommandPayload } from '../Table/Commands'
import { $generateDuplicatedRow } from '../Table/TableUtils/duplicateRow'
import { $generateDuplicatedColumn } from '../Table/TableUtils/duplicateSelectedColumn'

export function $insertNewTableAsSuggestion(
  { rows, columns, includeHeaders, fullWidth }: InsertTableCommandPayload,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const tableNode = $createTableNodeWithDimensions(Number(rows), Number(columns), includeHeaders, fullWidth)
  const insertedTableNode = $insertNodeToNearestRoot(tableNode)
  const nextSibling = insertedTableNode.getNextSibling()

  // `$insertNodeToNearestRoot` inserts an empty paragraph after the
  // inserted node, we remove that.
  if ($isParagraphNode(nextSibling) && nextSibling.isEmpty()) {
    nextSibling.remove()
  }

  const tableRows = tableNode.getChildren<TableRowNode>()
  const tableCells = tableRows.map((row) => row.getChildren<TableCellNode>()).flat()
  if (tableCells.length < 1) {
    throw new Error('No table cells found')
  }

  const firstCell = tableCells[0]
  firstCell.selectStart()

  const suggestionID = GenerateUUID()
  for (const cell of tableCells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'insert-table'))
  }

  onSuggestionCreation(suggestionID)

  return true
}

export function $suggestTableDeletion(
  key: NodeKey,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const table = $getNodeByKey<TableNode>(key)
  if (!table) {
    logger.info(`Could not find table with key ${key}`)
    return true
  }

  const tableRows = table.getChildren<TableRowNode>()
  const tableCells = tableRows.map((row) => row.getChildren<TableCellNode>()).flat()
  if (tableCells.length < 1) {
    throw new Error('No table cells found')
  }

  const firstCellChildren = tableCells[0].getChildren()
  const tableSuggestion = firstCellChildren.find(
    (node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow().endsWith('table'),
  )
  const tableSuggestionType = tableSuggestion?.getSuggestionTypeOrThrow()
  if (tableSuggestionType === 'insert-table') {
    table.remove()
  } else if (tableSuggestionType === 'delete-table') {
    return true
  }

  const suggestionID = GenerateUUID()
  for (const cell of tableCells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'delete-table'))
  }

  onSuggestionCreation(suggestionID)

  return true
}

export function $insertNewTableRowAsSuggestion(
  insertAfter: boolean,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const insertedRow = $insertTableRowAtSelection(insertAfter)
  if (!insertedRow) {
    return true
  }

  const children = insertedRow.getChildren<TableCellNode>()
  if (children.length === 0) {
    throw new Error('Expected table row to have children')
  }

  const suggestionID = GenerateUUID()

  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    if (!child) {
      continue
    }

    const isFirstChild = index === 0
    if (isFirstChild) {
      child.selectStart()
    }

    const existingInsertTableSuggestion = child
      .getChildren()
      .find((node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'insert-table')
    if (existingInsertTableSuggestion) {
      return true
    }

    $insertFirst(child, $createSuggestionNode(suggestionID, 'insert-table-row'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $insertNewTableColumnAsSuggestion(
  insertAfter: boolean,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const firstInsertedCell = $insertTableColumnAtSelection(insertAfter)
  if (!firstInsertedCell) {
    return true
  }

  $moveSelectionToCell(firstInsertedCell)

  const existingInsertTableSuggestion = firstInsertedCell
    .getChildren()
    .find((node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'insert-table')
  if (existingInsertTableSuggestion) {
    return true
  }

  const table = $findMatchingParent(firstInsertedCell, $isTableNode)
  if (!table) {
    throw new Error('Expected cell to have a parent table')
  }

  const suggestionID = GenerateUUID()

  const cellIndex = firstInsertedCell.getIndexWithinParent()
  for (const row of table.getChildren<TableRowNode>()) {
    const cellAtIndex = row.getChildAtIndex<TableCellNode>(cellIndex)
    if (!cellAtIndex) {
      continue
    }

    const suggestion = $createSuggestionNode(suggestionID, 'insert-table-column')
    $insertFirst(cellAtIndex, suggestion)
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $suggestTableRowDeletion(row: TableRowNode, onSuggestionCreation: (id: string) => void): boolean {
  const suggestionID = GenerateUUID()

  const cells = row.getChildren<TableCellNode>()
  if (cells.length === 0) {
    throw new Error('Expected row to have at least 1 cell')
  }

  const firstCellChildren = cells[0].getChildren()
  const existingInsertSuggestion = firstCellChildren.find((node): node is ProtonNode => {
    if (!$isSuggestionNode(node)) {
      return false
    }
    const type = node.getSuggestionTypeOrThrow()
    return type === 'insert-table' || type === 'insert-table-row'
  })
  if (existingInsertSuggestion) {
    row.remove()
    return true
  }

  for (const cell of cells) {
    $insertFirst(cell, $createSuggestionNode(suggestionID, 'delete-table-row'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $suggestTableColumnDeletion(cell: TableCellNode, onSuggestionCreation: (id: string) => void): boolean {
  const table = $findMatchingParent(cell, $isTableNode)
  if (!table) {
    throw new Error('Expected cell to have table parent')
  }

  const suggestionID = GenerateUUID()

  const cellIndex = cell.getIndexWithinParent()
  for (const row of table.getChildren<TableRowNode>()) {
    const currentCell = row.getChildAtIndex<TableCellNode>(cellIndex)
    if (!currentCell) {
      throw new Error('Could not find cell at index')
    }

    const cellChildren = currentCell.getChildren()
    const existingInsertSuggestion = cellChildren.find((node): node is ProtonNode => {
      if (!$isSuggestionNode(node)) {
        return false
      }
      const type = node.getSuggestionTypeOrThrow()
      return type === 'insert-table' || type === 'insert-table-column'
    })
    if (existingInsertSuggestion) {
      currentCell.remove()
      continue
    }

    $insertFirst(currentCell, $createSuggestionNode(suggestionID, 'delete-table-column'))
  }

  onSuggestionCreation(suggestionID)
  return true
}

export function $duplicateTableRowAsSuggestion(row: TableRowNode, onSuggestionCreation: (id: string) => void): boolean {
  const editor = $getEditor()
  const duplicatedRow = $generateDuplicatedRow(editor, row)
  if (!duplicatedRow) {
    return true
  }

  const suggestionID = GenerateUUID()

  const children = duplicatedRow.getChildren<TableCellNode>()
  for (let index = 0; index < children.length; index++) {
    const cell = children[index]

    const originalCell = row.getChildAtIndex<TableCellNode>(index)
    if (!originalCell) {
      continue
    }
    const originalCellChildren = originalCell.getChildren()

    const existingInsertTableSuggestion = originalCellChildren.find((node): node is ProtonNode => {
      if (!$isSuggestionNode(node)) {
        return false
      }
      const type = node.getSuggestionTypeOrThrow()
      return type === 'insert-table'
    })
    if (existingInsertTableSuggestion) {
      continue
    }

    $insertFirst(cell, $createSuggestionNode(suggestionID, 'duplicate-table-row'))
  }
  row.insertAfter(duplicatedRow)
  duplicatedRow.getFirstChild()?.selectStart()

  onSuggestionCreation(suggestionID)
  return true
}

export function $duplicateTableColumnAsSuggestion(
  cell: TableCellNode,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const editor = $getEditor()

  const originalTable = $findMatchingParent(cell, $isTableNode)
  if (!originalTable) {
    throw new Error('Expected cell to have table parent')
  }

  const { index: cellIndex, cells: duplicatedCells } = $generateDuplicatedColumn(editor, cell)
  if (!duplicatedCells.length) {
    return true
  }

  const suggestionID = GenerateUUID()

  const rows = originalTable.getChildren<TableRowNode>()

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    const cell = row.getChildAtIndex(cellIndex)
    if (!$isTableCellNode(cell)) {
      throw new Error('Could not find cell at index')
    }

    const duplicatedCell = duplicatedCells[rowIndex]
    if (!duplicatedCell) {
      continue
    }

    const originalCellChildren = cell.getChildren()
    const existingInsertTableSuggestion = originalCellChildren.find((node): node is ProtonNode => {
      if (!$isSuggestionNode(node)) {
        return false
      }
      const type = node.getSuggestionTypeOrThrow()
      return type === 'insert-table'
    })
    if (!existingInsertTableSuggestion) {
      $insertFirst(duplicatedCell, $createSuggestionNode(suggestionID, 'duplicate-table-column'))
    }

    cell.insertAfter(duplicatedCell)
  }

  onSuggestionCreation(suggestionID)
  return true
}
