import {
  ElementNode,
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
} from 'lexical'
import { c, msgid } from 'ttag'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  $unmergeCell,
  getTableObserverFromTableElement,
  HTMLTableElementWithWithTableSelectionState,
  TableCellHeaderStates,
  TableCellNode,
  TableSelection,
} from '@lexical/table'
import { ReactPortal, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import invariant from '../Shared/invariant'
import { DropdownMenu, DropdownMenuButton, Icon, SimpleDropdown } from '@proton/components'
import { Button } from '@proton/atoms'

function computeSelectionCount(selection: TableSelection): {
  columns: number
  rows: number
} {
  const selectionShape = selection.getShape()
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  }
}

// This is important when merging cells as there is no good way to re-merge weird shapes (a result
// of selecting merged cells and non-merged)
function isGridSelectionRectangular(selection: TableSelection): boolean {
  const nodes = selection.getNodes()
  const currentRows: number[] = []
  let currentRow = null
  let expectedColumns = null
  let currentColumns = 0
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if ($isTableCellNode(node)) {
      const row = node.getParentOrThrow()
      invariant($isTableRowNode(row), 'Expected CellNode to have a RowNode parent')
      if (currentRow !== row) {
        if (expectedColumns !== null && currentColumns !== expectedColumns) {
          return false
        }
        if (currentRow !== null) {
          expectedColumns = currentColumns
        }
        currentRow = row
        currentColumns = 0
      }
      const colSpan = node.__colSpan
      for (let j = 0; j < colSpan; j++) {
        if (currentRows[currentColumns + j] === undefined) {
          currentRows[currentColumns + j] = 0
        }
        currentRows[currentColumns + j] += node.__rowSpan
      }
      currentColumns += colSpan
    }
  }
  return (
    (expectedColumns === null || currentColumns === expectedColumns) && currentRows.every((v) => v === currentRows[0])
  )
}

function $canUnmerge(): boolean {
  const selection = $getSelection()
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false
  }
  const [cell] = $getNodeTriplet(selection.anchor)
  return cell.__colSpan > 1 || cell.__rowSpan > 1
}

function $cellContainsEmptyParagraph(cell: TableCellNode): boolean {
  if (cell.getChildrenSize() !== 1) {
    return false
  }
  const firstChild = cell.getFirstChildOrThrow()
  if (!$isParagraphNode(firstChild) || !firstChild.isEmpty()) {
    return false
  }
  return true
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant()
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select()
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd()
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext()
  }
}

type TableCellActionMenuProps = Readonly<{
  tableCellNode: TableCellNode
  cellMerge: boolean
}>

function TableActionMenu({ tableCellNode: _tableCellNode, cellMerge }: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext()
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode)
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  })
  const [canMergeCells, setCanMergeCells] = useState(false)
  const [canUnmergeCell, setCanUnmergeCell] = useState(false)

  useEffect(() => {
    return editor.registerMutationListener(TableCellNode, (nodeMutations) => {
      const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated'

      if (nodeUpdated) {
        editor.getEditorState().read(() => {
          updateTableCellNode(tableCellNode.getLatest())
        })
      }
    })
  }, [editor, tableCellNode])

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection)
        updateSelectionCounts(computeSelectionCount(selection))
        setCanMergeCells(
          isGridSelectionRectangular(selection) &&
            (currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1),
        )
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge())
    })
  }, [editor])

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableElement = editor.getElementByKey(tableNode.getKey()) as HTMLTableElementWithWithTableSelectionState

        if (!tableElement) {
          throw new Error('Expected to find tableElement in DOM')
        }

        const tableSelection = getTableObserverFromTableElement(tableElement)
        if (tableSelection !== null) {
          tableSelection.clearHighlight()
        }

        tableNode.markDirty()
        updateTableCellNode(tableCellNode.getLatest())
      }

      const rootNode = $getRoot()
      rootNode.selectStart()
    })
  }, [editor, tableCellNode])

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isTableSelection(selection)) {
        const { columns, rows } = computeSelectionCount(selection)
        const nodes = selection.getNodes()
        let firstCell: null | TableCellNode = null
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i]
          if ($isTableCellNode(node)) {
            if (firstCell === null) {
              node.setColSpan(columns).setRowSpan(rows)
              firstCell = node
              const isEmpty = $cellContainsEmptyParagraph(node)
              let firstChild
              if (isEmpty && $isParagraphNode((firstChild = node.getFirstChild()))) {
                firstChild.remove()
              }
            } else if ($isTableCellNode(firstCell)) {
              const isEmpty = $cellContainsEmptyParagraph(node)
              if (!isEmpty) {
                firstCell.append(...node.getChildren())
              }
              node.remove()
            }
          }
        }
        if (firstCell !== null) {
          if (firstCell.getChildrenSize() === 0) {
            firstCell.append($createParagraphNode())
          }
          $selectLastDescendant(firstCell)
        }
      }
    })
  }

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell()
    })
  }

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        $insertTableRow__EXPERIMENTAL(shouldInsertAfter)
      })
    },
    [editor],
  )

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumn__EXPERIMENTAL(shouldInsertAfter)
        }
      })
    },
    [editor, selectionCounts.columns],
  )

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL()
    })
  }, [editor])

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
      tableNode.remove()

      clearTableSelection()
    })
  }, [editor, tableCellNode, clearTableSelection])

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL()
    })
  }, [editor])

  const toggleTableRowIsHeader = useCallback(
    (headerState?: number) => {
      editor.update(() => {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

        const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode)

        const tableRows = tableNode.getChildren()

        if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
          throw new Error('Expected table cell to be inside of table row.')
        }

        const tableRow = tableRows[tableRowIndex]

        if (!$isTableRowNode(tableRow)) {
          throw new Error('Expected table row')
        }

        tableRow.getChildren().forEach((tableCell) => {
          if (!$isTableCellNode(tableCell)) {
            throw new Error('Expected table cell')
          }

          if (headerState === undefined) {
            tableCell.toggleHeaderStyle(TableCellHeaderStates.ROW)
            return
          }

          tableCell.setHeaderStyles(headerState)
        })

        clearTableSelection()
      })
    },
    [editor, tableCellNode, clearTableSelection],
  )

  const toggleTableColumnIsHeader = useCallback(
    (headerState?: number) => {
      editor.update(() => {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)

        const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode)

        const tableRows = tableNode.getChildren()

        for (let r = 0; r < tableRows.length; r++) {
          const tableRow = tableRows[r]

          if (!$isTableRowNode(tableRow)) {
            throw new Error('Expected table row')
          }

          const tableCells = tableRow.getChildren()

          if (tableColumnIndex >= tableCells.length || tableColumnIndex < 0) {
            throw new Error('Expected table cell to be inside of table row.')
          }

          const tableCell = tableCells[tableColumnIndex]

          if (!$isTableCellNode(tableCell)) {
            throw new Error('Expected table cell')
          }

          if (headerState === undefined) {
            tableCell.toggleHeaderStyle(TableCellHeaderStates.COLUMN)
            continue
          }

          tableCell.setHeaderStyles(headerState)
        }

        clearTableSelection()
      })
    },
    [editor, tableCellNode, clearTableSelection],
  )

  let mergeCellButton: null | JSX.Element = null
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = (
        <DropdownMenuButton onClick={mergeTableCellsAtSelection}>{c('Action').t`Merge cells`}</DropdownMenuButton>
      )
    } else if (canUnmergeCell) {
      mergeCellButton = (
        <DropdownMenuButton onClick={unmergeTableCellsAtSelection}>{c('Action').t`Unmerge cells`}</DropdownMenuButton>
      )
    }
  }

  const isCurrentCellRowHeader = (tableCellNode.__headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW
  const isCurrentCellColumnHeader =
    (tableCellNode.__headerState & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN

  return (
    <DropdownMenu className="[&>li>hr]:min-h-px">
      {mergeCellButton}
      {!!mergeCellButton && <hr />}
      <DropdownMenuButton onClick={() => insertTableRowAtSelection(false)}>
        {c('Action').ngettext(msgid`Insert row above`, `Insert rows above`, selectionCounts.rows)}
      </DropdownMenuButton>
      <DropdownMenuButton onClick={() => insertTableRowAtSelection(true)}>
        {c('Action').ngettext(msgid`Insert row below`, `Insert rows below`, selectionCounts.rows)}
      </DropdownMenuButton>
      <hr />
      <DropdownMenuButton onClick={() => insertTableColumnAtSelection(false)}>
        {c('Action').ngettext(msgid`Insert column left`, `Insert columns left`, selectionCounts.columns)}
      </DropdownMenuButton>
      <DropdownMenuButton onClick={() => insertTableColumnAtSelection(true)}>
        {c('Action').ngettext(msgid`Insert column right`, `Insert columns right`, selectionCounts.columns)}
      </DropdownMenuButton>
      <hr />
      <DropdownMenuButton onClick={deleteTableColumnAtSelection}>{c('Action').t`Delete column`}</DropdownMenuButton>
      <DropdownMenuButton onClick={deleteTableRowAtSelection}>{c('Action').t`Delete row`}</DropdownMenuButton>
      <DropdownMenuButton onClick={deleteTableAtSelection}>{c('Action').t`Delete table`}</DropdownMenuButton>
      <hr />
      <DropdownMenuButton
        onClick={() => {
          toggleTableRowIsHeader(isCurrentCellRowHeader ? TableCellHeaderStates.NO_STATUS : TableCellHeaderStates.ROW)
        }}
      >
        {isCurrentCellRowHeader ? c('Action').t`Remove row header` : c('Action').t`Add row header`}
      </DropdownMenuButton>
      <DropdownMenuButton
        onClick={() => {
          toggleTableColumnIsHeader(
            isCurrentCellColumnHeader ? TableCellHeaderStates.NO_STATUS : TableCellHeaderStates.COLUMN,
          )
        }}
      >
        {isCurrentCellColumnHeader ? c('Action').t`Remove column header` : c('Action').t`Add column header`}
      </DropdownMenuButton>
    </DropdownMenu>
  )
}

function TableCellActionMenuContainer({
  anchorElem,
  cellMerge,
}: {
  anchorElem: HTMLElement
  cellMerge: boolean
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const menuButtonRef = useRef(null)

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(null)

  const moveMenu = useCallback(() => {
    const menu = menuButtonRef.current
    const selection = $getSelection()
    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement

    if (selection == null || menu == null) {
      setTableMenuCellNode(null)
      return
    }

    const rootElement = editor.getRootElement()

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(selection.anchor.getNode())

      if (tableCellNodeFromSelection == null) {
        setTableMenuCellNode(null)
        return
      }

      const tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey())

      if (tableCellParentNodeDOM == null) {
        setTableMenuCellNode(null)
        return
      }

      setTableMenuCellNode(tableCellNodeFromSelection)
    } else if (!activeElement) {
      setTableMenuCellNode(null)
    }
  }, [editor])

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        moveMenu()
      })
    })
  })

  const setMenuButtonPosition = useCallback(() => {
    const menuButtonDOM = menuButtonRef.current as HTMLButtonElement | null

    if (menuButtonDOM != null && tableCellNode != null) {
      const tableCellNodeDOM = editor.getElementByKey(tableCellNode.getKey())
      const rootElement = editor.getRootElement()

      if (tableCellNodeDOM != null) {
        const tableCellRect = tableCellNodeDOM.getBoundingClientRect()
        const menuButtonRect = menuButtonDOM.getBoundingClientRect()
        const rootRect = rootElement!.getBoundingClientRect()
        const anchorRect = anchorElem.getBoundingClientRect()

        const top = tableCellRect.top - rootRect.top + tableCellRect.height / 2 - menuButtonRect.height / 2
        const left = tableCellRect.right - menuButtonRect.width - 8 - anchorRect.left

        menuButtonDOM.style.opacity = '1'
        menuButtonDOM.style.transform = `translate(${left}px, ${top}px)`
      } else {
        menuButtonDOM.style.opacity = '0'
        menuButtonDOM.style.transform = 'translate(-10000px, -10000px)'
      }
    }
  }, [menuButtonRef, tableCellNode, editor, anchorElem])

  useEffect(() => {
    setMenuButtonPosition()
  }, [setMenuButtonPosition])

  useEffect(() => {
    const scrollerElem = editor.getRootElement()

    const update = () => {
      editor.getEditorState().read(() => {
        setMenuButtonPosition()
      })
    }

    window.addEventListener('resize', update)
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [editor, anchorElem, setMenuButtonPosition])

  return (
    <div className="absolute left-0 top-0 will-change-transform" ref={menuButtonRef}>
      {tableCellNode != null && (
        <>
          <SimpleDropdown
            as={Button}
            icon
            pill
            shape="outline"
            content={<Icon name="chevron-down" size={3} />}
            hasCaret={false}
            size="small"
          >
            <TableActionMenu tableCellNode={tableCellNode} cellMerge={cellMerge} />
          </SimpleDropdown>
        </>
      )}
    </div>
  )
}

export default function TableActionMenuPlugin({ cellMerge = true }: { cellMerge?: boolean }): null | ReactPortal {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const containerElement = editor.getRootElement()?.parentElement
  const anchorElem = containerElement || document.body
  return createPortal(
    isEditable ? <TableCellActionMenuContainer anchorElem={anchorElem} cellMerge={cellMerge} /> : null,
    anchorElem,
  )
}
