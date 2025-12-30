import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TableNode } from '@lexical/table'
import { $isTableCellNode, $isTableRowNode } from '@lexical/table'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownMenuButton,
  Icon,
  SimpleDropdown,
  usePopperAnchor,
} from '@proton/components'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'
import debounce from 'lodash/debounce'
import { isHTMLElement } from '../../Utils/guard'
import type { NodeKey } from 'lexical'
import { $getNearestNodeFromDOMNode, $getNodeByKey } from 'lexical'
import { setBackgroundColorForSelection } from './TableUtils/setBackgroundColorForSelection'
import { setColorForSelection } from './TableUtils/setColorForSelection'
import { $clearCellsInTableSelection } from './TableUtils/clearCellsInTableSelection'
import { selectColumn } from './TableUtils/selectColumn'
import { selectRow } from './TableUtils/selectRow'
import { FontColorMenu } from '../../Components/ColorMenu'
import {
  DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND,
  DELETE_TABLE_ROW_AT_SELECTION_COMMAND,
  DUPLICATE_TABLE_COLUMN_COMMAND,
  DUPLICATE_TABLE_ROW_COMMAND,
  INSERT_TABLE_COLUMN_COMMAND,
  INSERT_TABLE_ROW_COMMAND,
} from './Commands'
import { useCombinedRefs } from '@proton/hooks'
import { useEditorStateValues } from '../../Lib/useEditorStateValues'

export function TableRowAndColumnMenus({ tableNode }: { tableNode: TableNode }) {
  const [editor] = useLexicalComposerContext()

  const { isSuggestionMode } = useEditorStateValues()

  const tableRowNodeKey = useRef<NodeKey | null>(null)
  const getCurrentRow = useCallback(() => {
    const key = tableRowNodeKey.current
    if (!key) {
      return null
    }
    const row = editor.read(() => $getNodeByKey(key))
    if ($isTableRowNode(row)) {
      return row
    }
    return null
  }, [editor])

  const tableCellNodeKey = useRef<NodeKey | null>(null)
  const getCurrentCell = useCallback(() => {
    const key = tableCellNodeKey.current
    if (!key) {
      return null
    }
    const cell = editor.read(() => $getNodeByKey(key))
    if ($isTableCellNode(cell)) {
      return cell
    }
    return null
  }, [editor])

  const rowMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [tableRowElement, setTableRowElement] = useState<HTMLTableRowElement | null>(null)
  const {
    anchorRef: rowMenuAnchorRef,
    isOpen: isRowMenuOpen,
    toggle: toggleRowMenu,
    close: closeRowMenu,
  } = usePopperAnchor<HTMLButtonElement>()
  useEffect(
    function selectRowIfMenuIsOpen() {
      if (!isRowMenuOpen) {
        return
      }
      const row = getCurrentRow()
      if (!row) {
        return
      }
      selectRow(editor, row)
    },
    [editor, getCurrentRow, isRowMenuOpen],
  )

  const columnMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [tableCellElement, setTableCellElement] = useState<HTMLTableCellElement | null>(null)
  const {
    anchorRef: columnMenuAnchorRef,
    isOpen: isColumnMenuOpen,
    toggle: toggleColumnMenu,
    close: closeColumnMenu,
  } = usePopperAnchor<HTMLButtonElement>()
  useEffect(
    function selectColumnIfMenuIsOpen() {
      if (!isColumnMenuOpen) {
        return
      }
      const cell = getCurrentCell()
      if (!cell) {
        return
      }
      selectColumn(editor, cell)
    },
    [editor, getCurrentCell, isColumnMenuOpen],
  )

  const { tableElement, tableWrapperElement } = useMemo(() => {
    return editor.getEditorState().read(() => {
      const tableWrapperElement = editor.getElementByKey(tableNode.getKey())
      return {
        tableWrapperElement,
        tableElement:
          tableWrapperElement?.firstElementChild instanceof HTMLTableElement
            ? tableWrapperElement.firstElementChild
            : null,
      }
    })
  }, [editor, tableNode])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    const rootContainer = rootElement?.parentElement
    if (!rootContainer || !tableElement || !tableWrapperElement) {
      return
    }

    const onMouseMove = debounce((event: MouseEvent) => {
      if (isRowMenuOpen || isColumnMenuOpen) {
        return
      }

      if (!isHTMLElement(event.target)) {
        return
      }

      const row = event.target.closest('tr')
      if (!row) {
        setTableRowElement(null)
        return
      }

      const tableWrapperInlineMargin =
        parseFloat(getComputedStyle(tableWrapperElement).getPropertyValue('--margin-from-sides-in-rem')) * 16
      const tableWrapperRect = tableWrapperElement.getBoundingClientRect()
      const tableWrapperRight = tableWrapperRect.right
      const tableWrapperMarginLeft = tableWrapperInlineMargin / 2
      const isTableWrapperOverflowing = tableWrapperElement.scrollWidth > tableWrapperElement.clientWidth

      if (rowMenuButtonRef.current && tableWrapperElement) {
        setTableRowElement(row)

        const rowRect = row.getBoundingClientRect()
        const rootOffset = rootContainer.scrollTop - rootContainer.getBoundingClientRect().top

        const rowMenuButton = rowMenuButtonRef.current
        const rowMenuButtonRect = rowMenuButton.getBoundingClientRect()

        const left = isTableWrapperOverflowing ? tableWrapperMarginLeft : rowRect.left

        rowMenuButton.style.setProperty('--x', `${left - rowMenuButtonRect.width / 2}px`)
        rowMenuButton.style.setProperty(
          '--y',
          `${rowRect.top + rootOffset + rowRect.height / 2 - rowMenuButtonRect.height / 2}px`,
        )
        rowMenuButton.style.visibility = 'visible'

        editor.read(() => {
          const node = $getNearestNodeFromDOMNode(row)
          tableRowNodeKey.current = node ? node.__key : null
        })
      }

      const cell = event.target.closest<HTMLTableCellElement>('th,td')
      if (!cell) {
        setTableCellElement(null)
        return
      }

      if (columnMenuButtonRef.current) {
        setTableCellElement(cell)

        const cellRect = cell.getBoundingClientRect()
        const rootOffset = rootContainer.scrollTop - rootContainer.getBoundingClientRect().top

        const columnMenuButton = columnMenuButtonRef.current
        const columnMenuButtonRect = columnMenuButton.getBoundingClientRect()
        const columnMenuButtonHalfWidth = columnMenuButtonRect.width / 2

        const x = cellRect.left + cellRect.width / 2 - columnMenuButtonHalfWidth

        columnMenuButton.style.setProperty(
          '--x',
          `${x > tableWrapperRight ? tableWrapperRight - columnMenuButtonHalfWidth * 2 : x}px`,
        )
        columnMenuButton.style.setProperty(
          '--y',
          `${tableElement.getBoundingClientRect().top + rootOffset - columnMenuButtonRect.height / 2}px`,
        )

        columnMenuButton.style.visibility = 'visible'

        editor.read(() => {
          const node = $getNearestNodeFromDOMNode(cell)
          tableCellNodeKey.current = node ? node.__key : null
        })
      }
    }, 10)

    const onRootMouseMove = debounce((event: MouseEvent) => {
      if (!isHTMLElement(event.target)) {
        return
      }
      if (!tableElement.contains(event.target)) {
        setTableRowElement(null)
        setTableCellElement(null)
      }
    }, 10)

    tableElement.addEventListener('mousemove', onMouseMove)
    rootElement.addEventListener('mousemove', onRootMouseMove)

    return () => {
      tableElement.removeEventListener('mousemove', onMouseMove)
      rootElement.removeEventListener('mousemove', onRootMouseMove)
    }
  }, [editor, isColumnMenuOpen, isRowMenuOpen, tableElement, tableWrapperElement])

  const menuButtonClassName = 'text-sm flex items-center gap-2'

  return (
    <>
      <DropdownButton
        as="button"
        className="bg-norm border-weak absolute left-0 top-0 flex items-center justify-center rounded border py-0.5 [opacity:0] hover:bg-[--background-weak] hover:opacity-100"
        style={{
          transform: `translate3d(var(--x), var(--y), 0)`,
          opacity: isRowMenuOpen || !!tableRowElement ? 1 : undefined,
          backgroundColor: isRowMenuOpen ? 'var(--background-weak)' : undefined,
        }}
        ref={useCombinedRefs(rowMenuButtonRef, rowMenuAnchorRef)}
        onClick={toggleRowMenu}
        hasCaret={false}
      >
        <Icon name="dots" />
        <div className="sr-only">{c('Action').t`Click to open row menu`}</div>
      </DropdownButton>
      <Dropdown
        anchorRef={rowMenuButtonRef}
        offset={4}
        disableFocusTrap={true}
        autoClose={false}
        onClose={closeRowMenu}
        isOpen={isRowMenuOpen}
      >
        <DropdownMenu>
          {!isSuggestionMode && (
            <SimpleDropdown
              as={DropdownMenuButton}
              className={menuButtonClassName}
              content={
                <>
                  <Icon name="palette" />
                  {c('Action').t`Color`}
                  <Icon name="chevron-right" className="ml-auto" />
                </>
              }
              contentProps={{
                style: {
                  '--max-width': 'none',
                },
                originalPlacement: 'right-start',
                offset: 0,
              }}
              hasCaret={false}
            >
              <FontColorMenu
                currentBackgroundColor={null}
                currentTextColor={null}
                onTextColorChange={(color) => {
                  setColorForSelection(editor, color)
                }}
                onBackgroundColorChange={(color) => {
                  setBackgroundColorForSelection(editor, color)
                }}
              />
            </SimpleDropdown>
          )}
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentRow()) {
                editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { insertAfter: false })
                editor.focus()
              }
              closeRowMenu()
            }}
          >
            <Icon name="arrow-up" />
            {c('Action').t`Insert above`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentRow()) {
                editor.dispatchCommand(INSERT_TABLE_ROW_COMMAND, { insertAfter: true })
                editor.focus()
              }
              closeRowMenu()
            }}
          >
            <Icon name="arrow-down" />
            {c('Action').t`Insert below`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              const row = getCurrentRow()
              if (row) {
                editor.dispatchCommand(DUPLICATE_TABLE_ROW_COMMAND, row)
              }
              closeRowMenu()
            }}
          >
            <Icon name="squares" />
            {c('Action').t`Duplicate`}
          </DropdownMenuButton>
          {!isSuggestionMode && (
            <DropdownMenuButton
              className={menuButtonClassName}
              disabled={isSuggestionMode}
              onClick={() => {
                if (getCurrentRow()) {
                  editor.update(() => $clearCellsInTableSelection(), {
                    onUpdate: () => editor.focus(),
                  })
                }
                closeRowMenu()
              }}
            >
              <Icon name="cross" />
              {c('Action').t`Clear contents`}
            </DropdownMenuButton>
          )}
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentRow()) {
                editor.dispatchCommand(DELETE_TABLE_ROW_AT_SELECTION_COMMAND, undefined)
                editor.focus()
              }
              closeRowMenu()
            }}
          >
            <Icon name="trash" />
            {c('Action').t`Delete row`}
          </DropdownMenuButton>
        </DropdownMenu>
      </Dropdown>
      <DropdownButton
        as="button"
        className="bg-norm border-weak absolute left-0 top-0 flex items-center justify-center rounded border py-0.5 [opacity:0] hover:bg-[--background-weak] hover:opacity-100"
        style={{
          transform: `translate3d(var(--x), var(--y), 0) rotate(90deg)`,
          opacity: isColumnMenuOpen || !!tableCellElement ? 1 : undefined,
          backgroundColor: isColumnMenuOpen ? 'var(--background-weak)' : undefined,
        }}
        ref={useCombinedRefs(columnMenuButtonRef, columnMenuAnchorRef)}
        onClick={() => {
          toggleColumnMenu()
        }}
        hasCaret={false}
      >
        <Icon name="dots" />
        <div className="sr-only">{c('Action').t`Click to open column menu`}</div>
      </DropdownButton>
      <Dropdown
        anchorRef={columnMenuButtonRef}
        offset={4}
        disableFocusTrap={true}
        autoClose={false}
        onClose={closeColumnMenu}
        isOpen={isColumnMenuOpen}
      >
        <DropdownMenu>
          {!isSuggestionMode && (
            <SimpleDropdown
              as={DropdownMenuButton}
              className={menuButtonClassName}
              disabled={isSuggestionMode}
              contentProps={{
                style: {
                  '--max-width': 'none',
                },
                originalPlacement: 'right-start',
                offset: 0,
              }}
              content={
                <>
                  <Icon name="palette" />
                  {c('Action').t`Color`}
                  <Icon name="chevron-right" className="ml-auto" />
                </>
              }
              hasCaret={false}
            >
              <FontColorMenu
                currentTextColor={null}
                currentBackgroundColor={null}
                onTextColorChange={(color) => {
                  setColorForSelection(editor, color)
                }}
                onBackgroundColorChange={(color) => {
                  setBackgroundColorForSelection(editor, color)
                }}
              />
            </SimpleDropdown>
          )}
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentCell()) {
                editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { insertAfter: false })
                editor.focus()
              }
              closeColumnMenu()
            }}
          >
            <Icon name="arrow-left" />
            {c('Action').t`Insert left`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentCell()) {
                editor.dispatchCommand(INSERT_TABLE_COLUMN_COMMAND, { insertAfter: true })
                editor.focus()
              }
              closeColumnMenu()
            }}
          >
            <Icon name="arrow-right" />
            {c('Action').t`Insert right`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              const cell = getCurrentCell()
              if (cell) {
                editor.dispatchCommand(DUPLICATE_TABLE_COLUMN_COMMAND, cell)
                editor.focus()
              }
              closeColumnMenu()
            }}
          >
            <Icon name="squares" />
            {c('Action').t`Duplicate`}
          </DropdownMenuButton>
          {!isSuggestionMode && (
            <DropdownMenuButton
              className={menuButtonClassName}
              disabled={isSuggestionMode}
              onClick={() => {
                if (getCurrentCell()) {
                  editor.update(() => $clearCellsInTableSelection(), {
                    onUpdate: () => editor.focus(),
                  })
                }
                closeColumnMenu()
              }}
            >
              <Icon name="cross" size={4.5} />
              {c('Action').t`Clear contents`}
            </DropdownMenuButton>
          )}
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (getCurrentCell()) {
                editor.dispatchCommand(DELETE_TABLE_COLUMN_AT_SELECTION_COMMAND, undefined)
                editor.focus()
              }
              closeColumnMenu()
            }}
          >
            <Icon name="trash" />
            {c('Action').t`Delete column`}
          </DropdownMenuButton>
        </DropdownMenu>
      </Dropdown>
    </>
  )
}
