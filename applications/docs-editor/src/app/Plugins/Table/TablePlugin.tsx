import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableSelection,
  registerTableCellUnmergeTransform,
  registerTablePlugin,
  registerTableSelectionObserver,
  setScrollableTablesActive,
  TableNode,
} from '@lexical/table'
import { $findMatchingParent, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $nodesOfType,
  COMMAND_PRIORITY_EDITOR,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { useEffect, useState } from 'react'
import { $createTableNodeWithDimensions } from './CreateTableNodeWithDimensions'
import type { InsertTableCommandPayload } from './Commands'
import {
  DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND,
  DELETE_TABLE_COLUMN_COMMAND,
  DELETE_TABLE_COMMAND,
  DELETE_TABLE_ROW_AT_SELECTION_COMMAND,
  DELETE_TABLE_ROW_COMMAND,
  DUPLICATE_TABLE_COLUMN_COMMAND,
  DUPLICATE_TABLE_ROW_COMMAND,
  INSERT_TABLE_COLUMN_COMMAND,
  INSERT_TABLE_COMMAND,
  INSERT_TABLE_ROW_COMMAND,
} from './Commands'
import { TableMenu } from './TableMenu'
import Portal from '../../Components/Portal'
import { TableAddButtons } from './TableAddButtons'
import debounce from 'lodash/debounce'
import { TableRowAndColumnMenus } from './TableRowAndColumnMenus'
import { $insertTableRowAtSelection } from './TableUtils/insertNewRowAtSelection'
import { $insertTableColumnAtSelection } from './TableUtils/insertNewColumnAtSelection'
import { $moveSelectionToCell } from './TableUtils/moveSelectionToCell'
import { duplicateRow } from './TableUtils/duplicateRow'
import { duplicateSelectedColumn } from './TableUtils/duplicateSelectedColumn'
import { $handleDeleteTableRowCommand } from './TableUtils/handleDeleteTableRowCommand'
import { $handleDeleteTableColumnCommand } from './TableUtils/handleDeleteTableColumnCommand'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'

export function TablePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  const isEditable = useLexicalEditable()

  const [tables, setTables] = useState<TableNode[]>([])

  useEffect(() => {
    setScrollableTablesActive(editor, true)
  }, [editor])

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

  useEffect(() => registerTablePlugin(editor), [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<InsertTableCommandPayload>(
        INSERT_TABLE_COMMAND,
        function $handleInsertTableCommand({ columns, rows, includeHeaders }) {
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
      editor.registerCommand(
        INSERT_TABLE_ROW_COMMAND,
        function $handleInsertTableRowCommand({ insertAfter }) {
          const insertedRow = $insertTableRowAtSelection(insertAfter)
          if (insertedRow) {
            insertedRow.getFirstChild()?.selectStart()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_TABLE_COLUMN_COMMAND,
        function $handleInsertTableColumnCommand({ insertAfter }) {
          const firstInsertedCell = $insertTableColumnAtSelection(insertAfter)
          if (firstInsertedCell) {
            $moveSelectionToCell(firstInsertedCell)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        DELETE_TABLE_COMMAND,
        function $handleDeleteTableCommand(key) {
          const table = $getNodeByKey(key)
          if (!table) {
            return false
          }
          table.selectStart()
          table.remove()
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(DELETE_TABLE_ROW_COMMAND, $handleDeleteTableRowCommand, COMMAND_PRIORITY_EDITOR),
      editor.registerCommand(DELETE_TABLE_COLUMN_COMMAND, $handleDeleteTableColumnCommand, COMMAND_PRIORITY_EDITOR),
      editor.registerCommand(
        DELETE_TABLE_ROW_AT_SELECTION_COMMAND,
        function $deleteTableRowAtSelection() {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
            return false
          }
          const focus = selection.focus.getNode()
          const row = $findMatchingParent(focus, $isTableRowNode)
          if (!row) {
            return false
          }
          return editor.dispatchCommand(DELETE_TABLE_ROW_COMMAND, row)
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND,
        function $deleteTableColumnAtSelection() {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) && !$isTableSelection(selection)) {
            return false
          }
          const focus = selection.focus.getNode()
          const cell = $findMatchingParent(focus, $isTableCellNode)
          if (!cell) {
            return false
          }
          return editor.dispatchCommand(DELETE_TABLE_COLUMN_COMMAND, cell)
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        DUPLICATE_TABLE_ROW_COMMAND,
        function $handleDuplicateTableRowCommand(row) {
          duplicateRow(editor, row)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        DUPLICATE_TABLE_COLUMN_COMMAND,
        function $handleDuplicateTableColumnCommand(cell) {
          duplicateSelectedColumn(editor, cell)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerNodeTransform(TableNode, function $addParagraphSiblings(node) {
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
      }),
    )
  }, [editor])

  useEffect(() => registerTableSelectionObserver(editor, true), [editor])

  useEffect(() => registerTableCellUnmergeTransform(editor), [editor])

  const editorContainer = editor.getRootElement()?.parentElement

  if (!isEditable) {
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
