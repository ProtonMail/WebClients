import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TableNode } from '@lexical/table'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'
import clsx from '@proton/utils/clsx'
import { Icon } from '@proton/components'
import { c } from 'ttag'
import { $addNewColumnAtEndOfTable } from './TableUtils/addNewColumnToTable'
import { $addNewRowAtEndOfTable } from './TableUtils/addNewRowToTable'
import { isHTMLElement } from '../../Utils/guard'

export function TableAddButtons({ tableNode }: { tableNode: TableNode }) {
  const [editor] = useLexicalComposerContext()

  const rowAddButtonRef = useRef<HTMLButtonElement>(null)
  const [isHoveringOnLastRow, setIsHoveringOnLastRow] = useState(false)

  const columnAddButtonRef = useRef<HTMLButtonElement>(null)
  const [isHoveringOnLastColumn, setIsHoveringOnLastColumn] = useState(false)

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

  const resetHoverState = useCallback(() => {
    setIsHoveringOnLastColumn(false)
    setIsHoveringOnLastRow(false)
  }, [])

  useEffect(() => {
    const rootElement = editor.getRootElement()

    if (!tableElement || !tableWrapperElement || !rootElement) {
      return
    }

    const mouseMoveHandler = (event: MouseEvent) => {
      const isMousePressed = event.buttons !== 0
      if (isMousePressed) {
        return
      }

      const lastRow = tableElement.lastElementChild
      const rowAddButton = rowAddButtonRef.current
      if (lastRow && rowAddButton) {
        const lastRowRect = lastRow.getBoundingClientRect()
        const rowAddButtonRect = rowAddButton.getBoundingClientRect()
        const isHoveringOnLastRow =
          event.clientY >= lastRowRect.top && event.clientY <= lastRowRect.bottom + rowAddButtonRect.height
        setIsHoveringOnLastRow(isHoveringOnLastRow)
      } else {
        setIsHoveringOnLastRow(false)
      }

      if (!isHTMLElement(event.target)) {
        setIsHoveringOnLastColumn(false)
        return
      }

      const columnAddButton = columnAddButtonRef.current
      if (!columnAddButton) {
        setIsHoveringOnLastColumn(false)
        return
      }

      const tableRect = tableElement.getBoundingClientRect()
      const tableRight = tableRect.right
      const columnAddButtonRect = columnAddButton.getBoundingClientRect()
      const isBetweenHorizontalThreshold =
        event.clientX >= tableRight && event.clientX <= tableRight + columnAddButtonRect.width
      const isBetweenVerticalThreshold = event.clientY >= tableRect.top && event.clientY <= tableRect.bottom
      if (isBetweenHorizontalThreshold && isBetweenVerticalThreshold) {
        setIsHoveringOnLastColumn(true)
        return
      }

      const currentColumn = event.target.closest('th,td')
      const isPartOfTable = tableElement.contains(currentColumn)
      if (!isPartOfTable) {
        setIsHoveringOnLastColumn(false)
        return
      }

      const isLastColumn = currentColumn?.nextElementSibling === null
      if (currentColumn && isLastColumn) {
        const columnRect = currentColumn.getBoundingClientRect()
        const isHoveringOnLastColumn =
          event.clientX >= columnRect.left && event.clientX <= columnRect.right + columnAddButtonRect.width
        setIsHoveringOnLastColumn(isHoveringOnLastColumn)
      } else {
        setIsHoveringOnLastColumn(false)
      }
    }

    const mouseLeaveHandler = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget
      if (isHTMLElement(relatedTarget) && relatedTarget.getAttribute('data-table-cell-resizer')) {
        return
      }
      resetHoverState()
    }

    tableWrapperElement.addEventListener('mousemove', mouseMoveHandler)
    tableWrapperElement.addEventListener('mouseleave', mouseLeaveHandler)

    return () => {
      tableWrapperElement.removeEventListener('mousemove', mouseMoveHandler)
      tableWrapperElement.removeEventListener('mouseleave', mouseLeaveHandler)
    }
  }, [editor, resetHoverState, tableElement, tableWrapperElement])

  useEffect(() => {
    const root = editor.getRootElement()
    const rootParent = root?.parentElement
    const rowAddButton = rowAddButtonRef.current
    const columnAddButton = columnAddButtonRef.current

    if (!rootParent || !tableElement || !tableWrapperElement || !rowAddButton || !columnAddButton) {
      return
    }

    const setSizeAndPosition = debounce(() => {
      const containerRect = rootParent.getBoundingClientRect()
      const containerPaddingLeft = parseInt(getComputedStyle(root).paddingLeft)
      const containerPadding = containerPaddingLeft * 2
      const tableRect = tableElement.getBoundingClientRect()
      const tableWrapperRect = tableWrapperElement.getBoundingClientRect()
      const columnAddButtonRect = columnAddButton.getBoundingClientRect()

      rowAddButton.style.width = `${Math.min(containerRect.width - containerPadding, tableRect.width)}px`
      columnAddButton.style.height = `${tableRect.height}px`

      const containerOffset = rootParent.scrollTop - containerRect.top

      rowAddButton.style.transform = `translate(${Math.max(containerPaddingLeft, tableRect.left)}px, ${tableWrapperRect.bottom + containerOffset}px)`
      columnAddButton.style.transform = `translate(${tableRect.width > containerRect.width ? tableWrapperRect.right - columnAddButtonRect.width / 2 : tableRect.right + 1}px, ${tableRect.top + containerOffset}px)`
    }, 10)

    setSizeAndPosition()

    return editor.registerUpdateListener(() => {
      setSizeAndPosition()
    })
  }, [editor, tableElement, tableWrapperElement])

  return (
    <>
      <button
        ref={rowAddButtonRef}
        className={clsx(
          'bg-weak absolute left-0 top-0 flex select-none items-center justify-center px-2.5 py-1 opacity-0 hover:pointer-events-auto hover:opacity-100',
          isHoveringOnLastRow && 'pointer-events-auto opacity-100',
        )}
        onClick={() => {
          editor.update(
            () => {
              $addNewRowAtEndOfTable(editor, tableNode)
            },
            {
              onUpdate: () => editor.focus(),
            },
          )
        }}
        onMouseLeave={(event) => {
          const relatedTarget = event.relatedTarget
          if (isHTMLElement(relatedTarget) && relatedTarget.getAttribute('data-table-cell-resizer')) {
            return
          }
          resetHoverState()
        }}
      >
        <Icon name="plus" size={3.5} />
        <div className="sr-only">{c('Action').t`Add new table row`}</div>
      </button>
      <button
        ref={columnAddButtonRef}
        className={clsx(
          'bg-weak absolute left-0 top-0 flex select-none items-center justify-center p-1 opacity-0 hover:pointer-events-auto hover:opacity-100',
          isHoveringOnLastColumn && 'pointer-events-auto opacity-100',
        )}
        onClick={() => {
          editor.update(
            () => {
              $addNewColumnAtEndOfTable(editor, tableNode)
            },
            {
              onUpdate: () => editor.focus(),
            },
          )
        }}
        onMouseLeave={(event) => {
          const relatedTarget = event.relatedTarget
          if (isHTMLElement(relatedTarget) && relatedTarget.getAttribute('data-table-cell-resizer')) {
            return
          }
          resetHoverState()
        }}
      >
        <Icon name="plus" size={3.5} />
        <div className="sr-only">{c('Action').t`Add new table column`}</div>
      </button>
    </>
  )
}
