import { DropdownMenu, DropdownMenuButton, DropdownMenuCheckboxButton, SimpleDropdown } from '../../Components/Dropdown'
import { $generateJSONFromSelectedNodes, $generateNodesFromSerializedNodes } from '@lexical/clipboard'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { $createTableSelection, $isTableNode, $isTableSelection } from '@lexical/table'
import { $findMatchingParent, $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils'
import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import { Button } from '../../Components/ui'
import { Icon } from '../../Components/Icon'
import * as Icons from '../../Components/icons'
import type { EditorState } from 'lexical'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, SELECTION_CHANGE_COMMAND } from 'lexical'
import debounce from 'lodash/debounce'
import { useEffect, useRef, useState } from 'react'
import { useDocsUserMode } from '../../DocsPresentationProvider'
import { useDocsMessages } from '../../DocsDependenciesProvider'
import { EditorUserMode } from '../../contract/EditorUserMode'
import { getNodeLatestSafe } from '../../Utils/getNodeLatestSafe'
import { DELETE_TABLE_COMMAND } from './Commands'
import { isCellHeaderColumn } from './TableUtils/isCellHeaderColumn'
import { isCellHeaderRow } from './TableUtils/isCellHeaderRow'
import { $toggleTableHeaderColumn } from './TableUtils/toggleTableHeaderColumn'
import { $toggleTableHeaderRow } from './TableUtils/toggleTableHeaderRow'
import { $fitTableToPageWidth } from './TableUtils/fitTableToPageWidth'

type MenuPosition = {
  x: number
  y: number
}

const toolbarItemClassName =
  'rounded-[--border-radius-sm] bg-[--background-norm] hover:bg-[--interaction-weak-minor-2] active:bg-[--interaction-weak-minor-1]'
const toolbarIconItemClassName = clsx(toolbarItemClassName, 'p-[calc(6em/14)]')

function TableMenuSeparator() {
  return (
    <Ariakit.ToolbarSeparator
      render={<div />}
      className="mx-[calc(3em/14)] my-[calc(2em/14)] w-px shrink-0 self-stretch bg-[--interaction-weak-major-1]"
    />
  )
}

export function TableMenu() {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const menuRef = useRef<HTMLDivElement>(null)
  const messages = useDocsMessages().table

  const userMode = useDocsUserMode()
  const isSuggestionMode = userMode === EditorUserMode.Suggest

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
          const tableLeft = tableElementRect.left + editorContainer.scrollLeft - editorContainerRect.left

          const x = Math.round(tableLeft + tableElementRect.width - menuElementRect.width)
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

    const syncHeaderState = (editorState: EditorState) => {
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
    }

    // The menu opens without an editor update behind it, so read the state the items announce right away.
    syncHeaderState(editor.getEditorState())

    return editor.registerUpdateListener(({ editorState }) => syncHeaderState(editorState))
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
      $fitTableToPageWidth(table, rootElement)
    })
  }

  const toggleTableHeader = ($toggleHeader: (table: TableNode) => void) => {
    editor.update(() => {
      if (!tableNode) {
        return
      }
      $toggleHeader(tableNode)
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
    <Ariakit.Toolbar
      ref={menuRef}
      aria-label={messages.menuLabel}
      className="absolute left-0 top-0 inline-flex items-stretch rounded-[--border-radius-md] bg-[--background-norm] p-[calc(3em/14)] shadow-[var(--shadow-norm)] [border:1px_solid_var(--interaction-weak-major-1)]"
      style={{
        visibility: !tableNode ? 'hidden' : 'visible',
        opacity: !tableNode ? 0 : 1,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      data-testid="table-button-group"
    >
      {!isSuggestionMode && (
        <>
          <Ariakit.ToolbarItem
            render={
              <Button
                icon
                className={toolbarIconItemClassName}
                aria-label={messages.fitToPageWidth}
                onClick={fitTableToPageWidth}
              />
            }
          >
            <Icon data={Icons.arrowsFromCenterHorizontal} />
          </Ariakit.ToolbarItem>
          <TableMenuSeparator />
          <SimpleDropdown
            render={<Ariakit.ToolbarItem />}
            className={clsx(toolbarItemClassName, 'px-[calc(8em/14)] py-[calc(3em/14)] text-sm')}
            content={messages.headerOptions}
          >
            <DropdownMenu>
              <DropdownMenuCheckboxButton
                name="header-row"
                className="gap-2.5 text-sm"
                checked={tableHasHeaderRow}
                onClick={() => toggleTableHeader($toggleTableHeaderRow)}
              >
                <Icon data={Icons.palette} />
                <span className="mr-1">{messages.headerRow}</span>
              </DropdownMenuCheckboxButton>
              <DropdownMenuCheckboxButton
                name="header-column"
                className="gap-2.5 text-sm"
                checked={tableHasHeaderColumn}
                onClick={() => toggleTableHeader($toggleTableHeaderColumn)}
              >
                <Icon data={Icons.palette} />
                <span className="mr-1">{messages.headerColumn}</span>
              </DropdownMenuCheckboxButton>
            </DropdownMenu>
          </SimpleDropdown>
          <TableMenuSeparator />
        </>
      )}
      <SimpleDropdown
        render={<Ariakit.ToolbarItem />}
        icon
        className={toolbarIconItemClassName}
        aria-label={messages.tableOptions}
        content={<Icon data={Icons.threeDotsHorizontal} />}
        hasCaret={false}
      >
        <DropdownMenu>
          {!isSuggestionMode && (
            <DropdownMenuButton className="flex items-center gap-2 text-sm" onClick={duplicateTable}>
              <Icon data={Icons.squares} />
              {messages.duplicate}
            </DropdownMenuButton>
          )}
          <DropdownMenuButton className="flex items-center gap-2 text-sm" onClick={deleteTable}>
            <Icon data={Icons.trash} />
            {messages.deleteTable}
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
    </Ariakit.Toolbar>
  )
}
