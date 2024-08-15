import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components'
import { useEffect, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'
import debounce from '@proton/utils/debounce'
import { isHTMLElement } from '../../Utils/guard'
import { $getNearestNodeFromDOMNode } from 'lexical'
import { setBackgroundColorForSelection } from './TableUtils/setBackgroundColorForSelection'
import { setColorForSelection } from './TableUtils/setColorForSelection'
import { duplicateSelectedColumn } from './TableUtils/duplicateSelectedColumn'
import { duplicateRow } from './TableUtils/duplicateRow'
import { $clearCellsInTableSelection } from './TableUtils/clearCellsInTableSelection'
import { deleteColumnAtSelection } from './TableUtils/deleteColumnAtSelection'
import { deleteRowAtSelection } from './TableUtils/deleteRowAtSelection'
import { insertNewColumnAtSelection } from './TableUtils/insertNewColumnAtSelection'
import { insertNewRowAtSelection } from './TableUtils/insertNewRowAtSelection'
import { selectColumn } from './TableUtils/selectColumn'
import { selectRow } from './TableUtils/selectRow'
import { FontColorMenu } from '../../Components/ColorMenu'
import { TextColors, BackgroundColors } from '../../Shared/Color'

export function TableRowAndColumnMenus({ tableNode }: { tableNode: TableNode }) {
  const [editor] = useLexicalComposerContext()

  const tableRowNode = useRef<TableRowNode | null>(null)
  const rowMenuRef = useRef<HTMLDivElement>(null)
  const [tableRowElement, setTableRowElement] = useState<HTMLTableRowElement | null>(null)
  const [isRowMenuOpen, setIsRowMenuOpen] = useState(false)

  const tableCellNode = useRef<TableCellNode | null>(null)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const [tableCellElement, setTableCellElement] = useState<HTMLTableCellElement | null>(null)
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)

  const tableElement = useMemo(() => {
    return editor.getEditorState().read(() => {
      const tableElement = editor.getElementByKey(tableNode.getKey())
      return tableElement
    })
  }, [editor, tableNode])

  useEffect(() => {
    const rootElement = editor.getRootElement()
    const rootContainer = rootElement?.parentElement
    if (!rootContainer || !tableElement) {
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

      if (rowMenuRef.current) {
        setTableRowElement(row)

        const rowRect = row.getBoundingClientRect()
        const rootOffset = rootContainer.scrollTop - rootContainer.getBoundingClientRect().top

        const rowMenuButton = rowMenuRef.current
        const rowMenuButtonRect = rowMenuButton.getBoundingClientRect()

        rowMenuButton.style.setProperty('--x', `${rowRect.left - rowMenuButtonRect.width / 2}px`)
        rowMenuButton.style.setProperty(
          '--y',
          `${rowRect.top + rootOffset + rowRect.height / 2 - rowMenuButtonRect.height / 2}px`,
        )
        rowMenuButton.style.visibility = 'visible'

        editor.read(() => {
          tableRowNode.current = $getNearestNodeFromDOMNode(row) as TableRowNode
        })
      }

      const cell = event.target.closest<HTMLTableCellElement>('th,td')
      if (!cell) {
        setTableCellElement(null)
        return
      }

      if (columnMenuRef.current) {
        setTableCellElement(cell)

        const cellRect = cell.getBoundingClientRect()
        const rootOffset = rootContainer.scrollTop - rootContainer.getBoundingClientRect().top

        const columnMenuButton = columnMenuRef.current
        const columnMenuButtonRect = columnMenuButton.getBoundingClientRect()

        columnMenuButton.style.setProperty(
          '--x',
          `${cellRect.left + cellRect.width / 2 - columnMenuButtonRect.width / 2}px`,
        )
        columnMenuButton.style.setProperty(
          '--y',
          `${tableElement.getBoundingClientRect().top + rootOffset - columnMenuButtonRect.height / 2}px`,
        )

        columnMenuButton.style.visibility = 'visible'

        editor.read(() => {
          tableCellNode.current = $getNearestNodeFromDOMNode(cell) as TableCellNode
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
  }, [editor, isColumnMenuOpen, isRowMenuOpen, tableElement])

  const menuButtonClassName = 'text-sm flex items-center gap-2'

  return (
    <>
      <SimpleDropdown
        as="button"
        ref={rowMenuRef}
        hasCaret={false}
        className="bg-norm border-weak absolute left-0 top-0 flex items-center justify-center rounded border py-0.5 [opacity:0] hover:bg-[--background-weak] hover:opacity-100"
        style={{
          transform: `translate3d(var(--x), var(--y), 0)`,
          opacity: isRowMenuOpen || !!tableRowElement ? 1 : undefined,
          backgroundColor: isRowMenuOpen ? 'var(--background-weak)' : undefined,
        }}
        content={
          <>
            <Icon name="dots" />
            <div className="sr-only">{c('Action').t`Click to open row menu`}</div>
          </>
        }
        contentProps={{
          offset: 4,
          disableFocusTrap: true,
          autoClose: false,
        }}
        onToggle={setIsRowMenuOpen}
        onClick={() => {
          const row = tableRowNode.current
          if (!row) {
            return
          }
          selectRow(editor, row)
        }}
      >
        <DropdownMenu>
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
              originalPlacement: 'right-start',
              offset: 0,
            }}
            hasCaret={false}
          >
            <FontColorMenu
              textColors={TextColors}
              onTextColorChange={(color) => {
                setColorForSelection(editor, color)
              }}
              backgroundColors={BackgroundColors}
              onBackgroundColorChange={(color) => {
                setBackgroundColorForSelection(editor, color)
              }}
            />
          </SimpleDropdown>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableRowNode.current) {
                return
              }
              insertNewRowAtSelection(editor, tableRowNode.current, false)
            }}
          >
            <Icon name="arrow-up" />
            {c('Action').t`Insert above`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableRowNode.current) {
                return
              }
              insertNewRowAtSelection(editor, tableRowNode.current, true)
            }}
          >
            <Icon name="arrow-down" />
            {c('Action').t`Insert below`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableRowNode.current) {
                return
              }
              duplicateRow(editor, tableRowNode.current)
            }}
          >
            <Icon name="squares" />
            {c('Action').t`Duplicate`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              editor.update(() => $clearCellsInTableSelection(), {
                onUpdate: () => editor.focus(),
              })
            }}
          >
            <Icon name="cross" />
            {c('Action').t`Clear contents`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              deleteRowAtSelection(editor)
            }}
          >
            <Icon name="trash" />
            {c('Action').t`Delete row`}
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
      <SimpleDropdown
        as="button"
        ref={columnMenuRef}
        hasCaret={false}
        className="bg-norm border-weak absolute left-0 top-0 flex items-center justify-center rounded border py-0.5 [opacity:0] hover:bg-[--background-weak] hover:opacity-100"
        style={{
          transform: `translate3d(var(--x), var(--y), 0) rotate(90deg)`,
          opacity: isColumnMenuOpen || !!tableCellElement ? 1 : undefined,
          backgroundColor: isColumnMenuOpen ? 'var(--background-weak)' : undefined,
        }}
        content={
          <>
            <Icon name="dots" />
            <div className="sr-only">{c('Action').t`Click to open column menu`}</div>
          </>
        }
        contentProps={{
          offset: 4,
          disableFocusTrap: true,
          autoClose: false,
        }}
        onToggle={setIsColumnMenuOpen}
        onClick={() => {
          const cell = tableCellNode.current
          if (!cell) {
            return
          }
          selectColumn(editor, cell)
        }}
      >
        <DropdownMenu>
          <SimpleDropdown
            as={DropdownMenuButton}
            className={menuButtonClassName}
            contentProps={{
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
              textColors={TextColors}
              onTextColorChange={(color) => {
                setColorForSelection(editor, color)
              }}
              backgroundColors={BackgroundColors}
              onBackgroundColorChange={(color) => {
                setBackgroundColorForSelection(editor, color)
              }}
            />
          </SimpleDropdown>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableCellNode.current) {
                return
              }
              insertNewColumnAtSelection(editor, tableCellNode.current, false)
            }}
          >
            <Icon name="arrow-left" />
            {c('Action').t`Insert left`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableCellNode.current) {
                return
              }
              insertNewColumnAtSelection(editor, tableCellNode.current, true)
            }}
          >
            <Icon name="arrow-right" />
            {c('Action').t`Insert right`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              if (!tableCellNode.current) {
                return
              }
              duplicateSelectedColumn(editor, tableCellNode.current)
            }}
          >
            <Icon name="squares" />
            {c('Action').t`Duplicate`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              editor.update(() => $clearCellsInTableSelection(), {
                onUpdate: () => editor.focus(),
              })
            }}
          >
            <Icon name="cross" size={4.5} />
            {c('Action').t`Clear contents`}
          </DropdownMenuButton>
          <DropdownMenuButton
            className={menuButtonClassName}
            onClick={() => {
              deleteColumnAtSelection(editor)
            }}
          >
            <Icon name="trash" />
            {c('Action').t`Delete column`}
          </DropdownMenuButton>
        </DropdownMenu>
      </SimpleDropdown>
    </>
  )
}
