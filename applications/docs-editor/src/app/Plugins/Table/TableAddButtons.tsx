import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { TableNode } from '@lexical/table'
import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from '@proton/utils/debounce'
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

  const tableElement = useMemo(() => {
    return editor.getEditorState().read(() => {
      const tableElement = editor.getElementByKey(tableNode.getKey())
      return tableElement
    })
  }, [editor, tableNode])

  useEffect(() => {
    const rootElement = editor.getRootElement()

    if (!tableElement || !rootElement) {
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

    rootElement.addEventListener('mousemove', mouseMoveHandler)

    return () => {
      rootElement.removeEventListener('mousemove', mouseMoveHandler)
    }
  }, [editor, tableElement])

  useEffect(() => {
    const rootContainer = editor.getRootElement()?.parentElement
    const rowAddButton = rowAddButtonRef.current
    const columnAddButton = columnAddButtonRef.current

    if (!rootContainer || !tableElement || !rowAddButton || !columnAddButton) {
      return
    }

    const setSizeAndPosition = debounce(() => {
      const rect = tableElement.getBoundingClientRect()

      rowAddButton.style.width = `${rect.width}px`
      columnAddButton.style.height = `${rect.height}px`

      const containerOffset = rootContainer.scrollTop - rootContainer.getBoundingClientRect().top

      rowAddButton.style.transform = `translate(${rect.left}px, ${rect.bottom + containerOffset + 2}px)`
      columnAddButton.style.transform = `translate(${rect.right + 2}px, ${rect.top + containerOffset}px)`
    }, 10)

    setSizeAndPosition()

    return editor.registerUpdateListener(() => {
      setSizeAndPosition()
    })
  }, [editor, tableElement])

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
          setIsHoveringOnLastRow(false)
          setIsHoveringOnLastColumn(false)
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
          setIsHoveringOnLastColumn(false)
          setIsHoveringOnLastRow(false)
        }}
      >
        <Icon name="plus" size={3.5} />
        <div className="sr-only">{c('Action').t`Add new table column`}</div>
      </button>
    </>
  )
}
