import type { HTMLTableElementWithWithTableSelectionState, TableObserver } from '@lexical/table'
import type { NodeKey } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $computeTableMap,
  $computeTableMapSkipCellCheck,
  $createTableCellNode,
  $getNodeTriplet,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  applyTableHandlers,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import { $insertFirst, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getNodeByKey,
  $isElementNode,
  $isTextNode,
  $nodesOfType,
  COMMAND_PRIORITY_EDITOR,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useEffect, useState } from 'react'
import invariant from '../../Shared/invariant'
import { $createTableNodeWithDimensions } from './CreateTableNodeWithDimensions'
import type { InsertTableCommandPayload } from './InsertTableCommand'
import { INSERT_TABLE_COMMAND } from './InsertTableCommand'
import { TableMenu } from './TableMenu'
import Portal from '../../Components/Portal'
import { TableAddButtons } from './TableAddButtons'
import debounce from '@proton/utils/debounce'
import { TableRowAndColumnMenus } from './TableRowAndColumnMenus'
import { useApplication } from '../../ApplicationProvider'

export function TablePlugin({
  hasCellMerge = false,
  hasCellBackgroundColor = true,
  hasTabHandler = true,
}: {
  hasCellMerge?: boolean
  hasCellBackgroundColor?: boolean
  hasTabHandler?: boolean
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  const isEditable = editor.isEditable()

  const { isSuggestionMode } = useApplication()

  const [tables, setTables] = useState<TableNode[]>([])

  useEffect(() => {
    const container = editor.getRootElement()?.parentElement
    if (!container) {
      return
    }

    const getTableNodes = debounce(() => {
      editor.getEditorState().read(() => {
        const tables = $nodesOfType(TableNode)
        setTables(tables)
      })
    }, 10)

    getTableNodes()

    return mergeRegister(
      editor.registerUpdateListener(() => {
        getTableNodes()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          getTableNodes()
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableCellNode, TableRowNode])) {
      invariant(false, 'TablePlugin: TableNode, TableCellNode or TableRowNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertTableCommandPayload>(
        INSERT_TABLE_COMMAND,
        ({ columns, rows, includeHeaders }) => {
          const tableNode = $createTableNodeWithDimensions(Number(rows), Number(columns), includeHeaders)
          $insertNodeToNearestRoot(tableNode)

          const firstDescendant = tableNode.getFirstDescendant()
          if ($isTextNode(firstDescendant)) {
            firstDescendant.select()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerNodeTransform(TableNode, (node) => {
        const children = node.getChildren()
        if (children.some((child) => !$isTableRowNode(child))) {
          for (const child of children) {
            if (!$isTableRowNode(child)) {
              // We remove any nodes that are not TableRowNodes
              child.remove()
              // If the child is an ElementNode, we re-insert it above
              // the TableNode so that the data is still preserved
              if ($isElementNode(child)) {
                node.insertBefore(child)
              }
            }
          }
        }
        const nextSibling = node.getNextSibling()
        const hasPreviousSibling = !!node.getPreviousSibling()
        if ($isTableNode(nextSibling)) {
          node.insertAfter($createParagraphNode())
        } else if (!nextSibling) {
          node.insertAfter($createParagraphNode())
        }
        if (!hasPreviousSibling) {
          node.insertBefore($createParagraphNode())
        }
        const [gridMap] = $computeTableMapSkipCellCheck(node, null, null)
        const maxRowLength = gridMap.reduce((curLength, row) => {
          return Math.max(curLength, row.length)
        }, 0)
        for (let i = 0; i < gridMap.length; ++i) {
          const rowLength = gridMap[i].length
          if (rowLength === maxRowLength) {
            continue
          }
          const lastCellMap = gridMap[i][rowLength - 1]
          const lastRowCell = lastCellMap.cell
          for (let j = rowLength; j < maxRowLength; ++j) {
            const newCell = $createTableCellNode(0)
            newCell.append($createParagraphNode())
            if (lastRowCell !== null) {
              lastRowCell.insertAfter(newCell)
            } else {
              $insertFirst(lastRowCell, newCell)
            }
          }
        }
      }),
    )
  }, [editor])

  useEffect(() => {
    const tableSelections = new Map<NodeKey, TableObserver>()

    const initializeTableNode = (tableNode: TableNode) => {
      const nodeKey = tableNode.getKey()
      const tableElement = editor.getElementByKey(nodeKey) as HTMLTableElementWithWithTableSelectionState
      if (tableElement && !tableSelections.has(nodeKey)) {
        const tableSelection = applyTableHandlers(tableNode, tableElement, editor, hasTabHandler)
        tableSelections.set(nodeKey, tableSelection)
      }
    }

    editor.getEditorState().read(() => {
      const tableNodes = $nodesOfType(TableNode)
      for (const tableNode of tableNodes) {
        if ($isTableNode(tableNode)) {
          initializeTableNode(tableNode)
        }
      }
    })

    const unregisterMutationListener = editor.registerMutationListener(TableNode, (nodeMutations) => {
      for (const [nodeKey, mutation] of nodeMutations) {
        if (mutation === 'created') {
          editor.getEditorState().read(() => {
            const tableNode = $getNodeByKey<TableNode>(nodeKey)
            if ($isTableNode(tableNode)) {
              initializeTableNode(tableNode)
            }
          })
        } else if (mutation === 'destroyed') {
          const tableSelection = tableSelections.get(nodeKey)

          if (tableSelection !== undefined) {
            tableSelection.removeListeners()
            tableSelections.delete(nodeKey)
          }
        }
      }
    })

    return () => {
      unregisterMutationListener()
      // Hook might be called multiple times so cleaning up tables listeners as well,
      // as it'll be reinitialized during recurring call
      for (const [, tableSelection] of tableSelections) {
        tableSelection.removeListeners()
      }
    }
  }, [editor, hasTabHandler])

  // Unmerge cells when the feature isn't enabled
  useEffect(() => {
    if (hasCellMerge) {
      return
    }
    return editor.registerNodeTransform(TableCellNode, (node) => {
      if (node.getColSpan() > 1 || node.getRowSpan() > 1) {
        // When we have rowSpan we have to map the entire Table to understand where the new Cells
        // fit best; let's analyze all Cells at once to save us from further transform iterations
        const [, , gridNode] = $getNodeTriplet(node)
        const [gridMap] = $computeTableMap(gridNode, node, node)
        const rowsCount = gridMap.length
        const columnsCount = gridMap[0].length
        let row = gridNode.getFirstChild()
        if (!$isTableRowNode(row)) {
          return
        }
        const unmerged = []
        for (let i = 0; i < rowsCount; i++) {
          if (i !== 0) {
            row = row.getNextSibling()
            if (!$isTableRowNode(row)) {
              return
            }
          }
          let lastRowCell: null | TableCellNode = null
          for (let j = 0; j < columnsCount; j++) {
            const cellMap = gridMap[i][j]
            const cell = cellMap.cell
            if (cellMap.startRow === i && cellMap.startColumn === j) {
              lastRowCell = cell
              unmerged.push(cell)
            } else if (cell.getColSpan() > 1 || cell.getRowSpan() > 1) {
              if (!$isTableCellNode(cell)) {
                return
              }
              const newCell = $createTableCellNode(cell.__headerState)
              if (lastRowCell !== null) {
                lastRowCell.insertAfter(newCell)
              } else {
                $insertFirst(row, newCell)
              }
            }
          }
        }
        for (const cell of unmerged) {
          cell.setColSpan(1)
          cell.setRowSpan(1)
        }
      }
    })
  }, [editor, hasCellMerge])

  // Remove cell background color when feature is disabled
  useEffect(() => {
    if (hasCellBackgroundColor) {
      return
    }
    return editor.registerNodeTransform(TableCellNode, (node) => {
      if (node.getBackgroundColor() !== null) {
        node.setBackgroundColor(null)
      }
    })
  }, [editor, hasCellBackgroundColor, hasCellMerge])

  const editorContainer = editor.getRootElement()?.parentElement

  if (!isEditable || isSuggestionMode) {
    return null
  }

  return (
    <Portal container={editorContainer} disabled={!editorContainer}>
      <TableMenu />
      {tables.map((table) => (
        <div
          key={table.getKey()}
          data-table-actions
          style={{
            display: 'contents',
          }}
        >
          <TableAddButtons tableNode={table} />
          <TableRowAndColumnMenus tableNode={table} />
        </div>
      ))}
    </Portal>
  )
}
