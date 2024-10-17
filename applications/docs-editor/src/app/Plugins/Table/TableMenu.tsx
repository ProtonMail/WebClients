import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableSelection, $isTableNode, $isTableSelection } from '@lexical/table'
import { $findMatchingParent, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import { Button } from '@proton/atoms'
import { ButtonGroup, DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown, Toggle } from '@proton/components'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, SELECTION_CHANGE_COMMAND } from 'lexical'
import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import { useEffect, useRef, useState } from 'react'
import { c } from 'ttag'
import { $toggleTableHeaderColumn } from './TableUtils/toggleTableHeaderColumn'
import { $toggleTableHeaderRow } from './TableUtils/toggleTableHeaderRow'
import { isCellHeaderColumn } from './TableUtils/isCellHeaderColumn'
import { isCellHeaderRow } from './TableUtils/isCellHeaderRow'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import debounce from '@proton/utils/debounce'
import { getNodeLatestSafe } from '../../Utils/getNodeLatestSafe'
import { DELETE_TABLE_COMMAND } from './Commands'
import { useApplication } from '../../ApplicationProvider'

type MenuPosition = {
  x: number
  y: number
}

export function TableMenu() {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const menuRef = useRef<HTMLDivElement>(null)

  const { isSuggestionMode } = useApplication()

  const [tableNode, setTableNode] = useState<TableNode | null>(null)

  const [tableHasHeaderRow, setTableHasHeaderRow] = useState(false)
  const [tableHasHeaderColumn, setTableHasHeaderColumn] = useState(false)

  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 })

  useEffect(() => {
    const getTableNodeAndSetMenuPosition = debounce(() => {
      let tableNode: TableNode | null = null
      let position: MenuPosition | null = null
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        const rootElement = editor.getRootElement()
        const nativeSelection = window.getSelection()

        const isValidSelection = $isRangeSelection(selection) || $isTableSelection(selection)

        if (!isValidSelection) {
          return
        }

        if (rootElement !== null && nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
          const tableNodeFromSelection = $findMatchingParent(selection.focus.getNode(), (n) => $isTableNode(n))

          if (!tableNodeFromSelection) {
            return
          }

          tableNode = tableNodeFromSelection as TableNode

          const editorContainer = rootElement.parentElement
          const tableElement = editor.getElementByKey(tableNode.getKey())
          const menuElement = menuRef.current
          if (!tableElement || !menuElement || !editorContainer) {
            return
          }

          const tableElementRect = tableElement.getBoundingClientRect()
          const menuElementRect = menuElement.getBoundingClientRect()
          const editorContainerRect = editorContainer.getBoundingClientRect()

          const tableTop = tableElementRect.top + editorContainer.scrollTop - editorContainerRect.top

          const x = Math.round(tableElementRect.left + tableElementRect.width - menuElementRect.width)
          const y = Math.round(tableTop - menuElementRect.height - 8)
          position = { x, y }
        }
      })
      setTableNode(tableNode)
      setPosition((pos) => {
        if (position) {
          return position
        }
        return pos
      })
    }, 10)

    getTableNodeAndSetMenuPosition()

    return mergeRegister(
      editor.registerUpdateListener(() => {
        getTableNodeAndSetMenuPosition()
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          getTableNodeAndSetMenuPosition()
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  useEffect(() => {
    if (!tableNode) {
      return
    }

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const table = getNodeLatestSafe(tableNode)
        if (!table) {
          setTableNode(null)
          return
        }
        const rows = table.getChildren<TableRowNode>()
        let tableHasHeaderRow = false
        let tableHasHeaderColumn = false
        for (const row of rows) {
          const isFirstRow = row === table.getFirstChild<TableRowNode>()
          if (isFirstRow) {
            tableHasHeaderRow = row.getChildren<TableCellNode>().every(isCellHeaderRow)
          }
          const firstCell = row.getFirstChild<TableCellNode>()
          if (firstCell) {
            tableHasHeaderColumn = isCellHeaderColumn(firstCell)
          }
        }
        setTableHasHeaderRow(tableHasHeaderRow)
        setTableHasHeaderColumn(tableHasHeaderColumn)
      })
    })
  }, [editor, tableNode])

  const fitTableToPageWidth = () => {
    editor.update(() => {
      const rootElement = editor.getRootElement()
      if (!rootElement) {
        return
      }
      const table = tableNode?.getLatest()
      if (!table) {
        return
      }
      const rows = table.getChildren<TableRowNode>()
      const firstRow = table.getFirstChild<TableRowNode>()
      if (!firstRow) {
        return
      }
      const columnCount = firstRow.getChildrenSize()
      const rootElementWidth = rootElement.clientWidth
      const computedStyle = getComputedStyle(rootElement)
      const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight)
      const width = rootElementWidth - padding
      const columnWidth = width / columnCount
      for (const row of rows) {
        const cells = row.getChildren<TableCellNode>()
        for (const cell of cells) {
          cell.setWidth(columnWidth)
        }
      }
    })
  }

  const duplicateTable = () => {
    editor.update(() => {
      const table = tableNode?.getLatest()
      if (!table) {
        return
      }
      const tableSelection = $createTableSelection()
      const firstColumn = table.getFirstChild<TableRowNode>()?.getFirstChild<TableCellNode>()
      const lastColumn = table.getLastChild<TableRowNode>()?.getLastChild<TableCellNode>()
      if (!firstColumn || !lastColumn) {
        return
      }
      tableSelection.set(table.getKey(), firstColumn.getKey(), lastColumn.getKey())
      const tableJSON = $generateJSONFromSelectedNodes(editor, tableSelection)
      const duplicatedTable = $generateNodesFromSerializedNodes(tableJSON.nodes)[0]
      if (!duplicatedTable) {
        return
      }
      table.selectNext()
      $insertNodeToNearestRoot(duplicatedTable)
    })
  }

  const deleteTable = () => {
    if (!tableNode) {
      return
    }
    editor.update(
      () => {
        editor.dispatchCommand(DELETE_TABLE_COMMAND, tableNode.__key)
      },
      {
        onUpdate: () => editor.focus(),
      },
    )
  }

  if (!isEditable) {
    return null
  }

  return (
    <ButtonGroup
      ref={menuRef}
      className="shadow-norm"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        visibility: !tableNode ? 'hidden' : 'visible',
        opacity: !tableNode ? 0 : 1,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      data-testid="table-button-group"
    >
      {!isSuggestionMode && (
        <Button icon shape="ghost" size="small" onClick={fitTableToPageWidth} disabled={isSuggestionMode}>
          <span className="sr-only">{c('Action').t`Fit table to page width`}</span>
          <Icon name="arrows-from-center-horizontal" />
        </Button>
      )}
      {!isSuggestionMode && (
        <SimpleDropdown
          as={Button}
          shape="ghost"
          size="small"
          className="px-2 text-sm"
          // translator: Table header options
          content={c('Action').t`Options`}
          disabled={isSuggestionMode}
        >
          <DropdownMenu>
            <DropdownMenuButton
              className="flex items-center gap-2.5 text-sm"
              onClick={() => {
                editor.update(() => {
                  if (!tableNode) {
                    return
                  }
                  $toggleTableHeaderRow(tableNode)
                })
              }}
            >
              <Icon name="palette" />
              <span className="mr-1">Header row</span>
              <Toggle className="pointer-events-none ml-auto" checked={tableHasHeaderRow} />
            </DropdownMenuButton>
            <DropdownMenuButton
              className="flex items-center gap-2.5 text-sm"
              onClick={() => {
                editor.update(() => {
                  if (!tableNode) {
                    return
                  }
                  $toggleTableHeaderColumn(tableNode)
                })
              }}
            >
              <Icon name="palette" />
              <span className="mr-1">Header column</span>
              <Toggle className="pointer-events-none ml-auto" checked={tableHasHeaderColumn} />
            </DropdownMenuButton>
          </DropdownMenu>
        </SimpleDropdown>
      )}
      <SimpleDropdown
        as={Button}
        icon
        shape="ghost"
        size="small"
        content={
          <>
            <span className="sr-only">{c('Action').t`Table options`}</span>
            <Icon name="three-dots-horizontal" />
          </>
        }
        hasCaret={false}
      >
        <DropdownMenu>
          {!isSuggestionMode && (
            <DropdownMenuButton className="flex items-center gap-2 text-sm" onClick={duplicateTable}>
              <Icon name="squares" />
              {c('Action').t`Duplicate`}
            </DropdownMenuButton>
          )}
          <DropdownMenuButton className="flex items-center gap-2 text-sm" onClick={deleteTable}>
            <Icon name="trash" />
            {c('Action').t`Delete`}
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
    </ButtonGroup>
  )
}
