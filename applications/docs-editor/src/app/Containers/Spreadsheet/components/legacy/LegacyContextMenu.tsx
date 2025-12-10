import type { CellInterface, GridRange, SelectionArea } from '@rowsncolumns/grid'
import { Direction, isCellWithinBounds, selectionFromActiveCell } from '@rowsncolumns/grid'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  Cross1Icon,
  DotsVerticalIcon,
  EyeNoneIcon,
  FunnelIcon,
  Link1Icon,
  MdOutlineFactCheck,
  PaintBrush,
  PlusIcon,
  ReaderIcon,
  ScissorsIcon,
  SizeIcon,
  SortDownIcon,
  SortUpIcon,
  //   SpaceBetweenHorizontallyIcon,
  TableIcon,
  TrashIcon,
  ViewGridIcon,
  //   WandIcon,
} from '@rowsncolumns/icons'
import {
  DropdownLeftSlot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownRightSlot,
} from '@rowsncolumns/ui'
import { number2Alpha } from '@rowsncolumns/utils'
import React, { useCallback, useMemo, useRef } from 'react'
import type { SheetRange } from '@rowsncolumns/spreadsheet'
import {
  BLANK_LABEL,
  type CanvasGridProps,
  createArrayRange,
  generateMultiDimTitle,
  type PasteSpecialType,
  type SelectionAttributes,
  type SortOrder,
  useGetContentfulRangeAroundCell,
} from '@rowsncolumns/spreadsheet'
import { useUI } from '../../ui-store'
import { createStringifier } from '../../stringifier'
import { c, msgid } from 'ttag'

const { s } = createStringifier(strings)

export type LegacyContextMenuProps = {
  activeCell: CellInterface
  selections: SelectionArea<SelectionAttributes>[]
  isRowHeader: boolean
  isColumnHeader: boolean
  selectedRowHeadersIds: number[]
  selectedColumnHeadersIds: number[]
  sheetId: number
  frozenRows: number
  frozenColumns: number
  basicFilter?: CanvasGridProps['basicFilter']
  tables: CanvasGridProps['tables']
  protectedRanges: CanvasGridProps['protectedRanges']
  onClearContents: CanvasGridProps['onClearContents']
  onHideColumn: CanvasGridProps['onHideColumn']
  onHideRow: CanvasGridProps['onHideRow']
  onDeleteColumn: CanvasGridProps['onDeleteColumn']
  onDeleteRow: CanvasGridProps['onDeleteRow']
  onInsertRow: CanvasGridProps['onInsertRow']
  onInsertColumn: CanvasGridProps['onInsertColumn']
  onInsertCellsShiftDown: CanvasGridProps['onInsertCellsShiftDown']
  onInsertCellsShiftRight: CanvasGridProps['onInsertCellsShiftRight']
  onDeleteCellsShiftLeft: CanvasGridProps['onDeleteCellsShiftLeft']
  onDeleteCellsShiftUp: CanvasGridProps['onDeleteCellsShiftUp']
  onRequestResize: CanvasGridProps['onRequestResize']
  onFreezeColumn: CanvasGridProps['onFreezeColumn']
  onFreezeRow: CanvasGridProps['onFreezeRow']
  onProtectRange: CanvasGridProps['onProtectRange']
  onUnProtectRange: CanvasGridProps['onUnProtectRange']
  onSortRange: CanvasGridProps['onSortRange']
  onRequestDefineNamedRange: CanvasGridProps['onRequestDefineNamedRange']
  onRequestConditionalFormat: CanvasGridProps['onRequestConditionalFormat']
  onRequestDataValidation: CanvasGridProps['onRequestDataValidation']
  onRequestFormatCells: CanvasGridProps['onRequestFormatCells']
  onInsertNote: (sheetId: number, cell: CellInterface) => void
  onSortColumn: CanvasGridProps['onSortColumn']
  onRequestEditTable: CanvasGridProps['onRequestEditTable']
  onRemoveTable: CanvasGridProps['onRemoveTable']
  onClearFormatting: CanvasGridProps['onClearFormatting']
  onCreateBasicFilter: CanvasGridProps['onCreateBasicFilter']
  onCreateTable: CanvasGridProps['onCreateTable']
  onInsertTableColumn: CanvasGridProps['onInsertTableColumn']
  onInsertTableRow: CanvasGridProps['onInsertTableRow']
  onDeleteTableColumn: CanvasGridProps['onDeleteTableColumn']
  onDeleteTableRow: CanvasGridProps['onDeleteTableRow']
  onFilterTable: CanvasGridProps['onFilterTable']
  onSortTable: CanvasGridProps['onSortTable']
  onSplitTextToColumns: CanvasGridProps['onSplitTextToColumns']
  getFormattedValue: (sheetId: number, rowIndex: number, columnIndex: number) => string | undefined
  getFormattedValuesFromRange(sheetId: number, selections: SelectionArea<SelectionAttributes>[]): string[]
  isSheetFocused(): boolean
  isTableHeader(rowIndex: number, columnIndex: number): boolean
  focusSheet(): void
  onCopy?(): void
  onPaste?(pasteSpecialType?: PasteSpecialType): void
  onCut?(): void
  readonly?: boolean
  onAddQuickEdit(range: SheetRange): void
  enableMagicFill?: boolean
}

export function LegacyContextMenu({
  isRowHeader,
  isColumnHeader,
  activeCell,
  selections,
  basicFilter,
  isTableHeader,
  onClearContents,
  onHideColumn,
  onHideRow,
  onDeleteRow,
  onDeleteColumn,
  onInsertColumn,
  onInsertRow,
  onInsertCellsShiftDown,
  onInsertCellsShiftRight,
  onDeleteCellsShiftLeft,
  onDeleteCellsShiftUp,
  onFreezeRow,
  onFreezeColumn,
  onCopy,
  onCut,
  onPaste,
  onInsertNote,
  onProtectRange,
  onUnProtectRange,
  onSortRange,
  onSortColumn,
  onRequestDefineNamedRange,
  onRequestResize,
  onRequestEditTable,
  onRequestFormatCells,
  onRequestConditionalFormat,
  onRequestDataValidation,
  onRemoveTable,
  onClearFormatting,
  onCreateTable,
  onCreateBasicFilter,
  onFilterTable,
  onSortTable,
  getFormattedValuesFromRange,
  focusSheet,
  isSheetFocused,
  getFormattedValue,
  onInsertTableColumn,
  onDeleteTableColumn,
  onInsertTableRow,
  onDeleteTableRow,
  onSplitTextToColumns,
  tables,
  protectedRanges,
  sheetId,
  frozenRows,
  frozenColumns,
  selectedRowHeadersIds,
  selectedColumnHeadersIds,
  readonly = false,
  onAddQuickEdit,
  enableMagicFill,
}: LegacyContextMenuProps) {
  const insertLink = useUI.$.insert.link
  const isHeader = isColumnHeader || isRowHeader
  const shouldFocusSheetRef = useRef(true)
  const multiColumnTitle = generateMultiDimTitle(selectedColumnHeadersIds, 'y')
  const selection = selections.length ? selections[0] : selectionFromActiveCell(activeCell)[0]
  const multiRowTitle = generateMultiDimTitle(selectedRowHeadersIds, 'x')
  const selectedRowIndexes = createArrayRange(selection.range.startRowIndex, selection.range.endRowIndex)
  const selectedColumnIndexes = createArrayRange(selection.range.startColumnIndex, selection.range.endColumnIndex)
  // Check for active table
  const activeTable = useMemo(
    () => tables?.find(({ range }) => isCellWithinBounds(activeCell, range)),
    [tables, activeCell],
  )

  // Check if the active cell is table header
  const isActiveCellTableHeader = isTableHeader(activeCell.rowIndex, activeCell.columnIndex)

  // Basic filter
  const activeBasicFilter = basicFilter && isCellWithinBounds(activeCell, basicFilter.range) ? basicFilter : undefined

  // Get contentful range
  const getContentfulRangeAroundCell = useGetContentfulRangeAroundCell()

  // Sort table or filter
  const onSortTableOrFilterView = useCallback(
    (direction: SortOrder) => {
      // Found a table
      if (activeTable) {
        onSortTable?.(sheetId, activeTable, activeCell.columnIndex - activeTable.range.startColumnIndex, direction)
      } else if (activeBasicFilter) {
        // Inside a basic filter
        onSortTable?.(
          sheetId,
          activeBasicFilter,
          activeCell.columnIndex - activeBasicFilter.range.startColumnIndex,
          direction,
        )
      } else {
        // User has made some selections
        if (selections.length) {
          // Sort range
          onSortRange?.(sheetId, selections, direction)
        } else {
          // Find contentful cell around
          const range = getContentfulRangeAroundCell?.(sheetId, activeCell)
          if (range) {
            onSortRange?.(sheetId, [{ range }], direction)
          }
        }
      }
    },
    [
      activeTable,
      activeBasicFilter,
      sheetId,
      activeCell,
      selections,
      onSortTable,
      onSortRange,
      getContentfulRangeAroundCell,
    ],
  )

  // Filter table or filter view
  const onFilterTableOrFilterView = useCallback(
    (sheetId: number, rowIndex: number, columnIndex: number) => {
      // Check if there a active basic filter
      const cellValue = getFormattedValue(sheetId, rowIndex, columnIndex) ?? BLANK_LABEL

      // Get hidden values
      const getVisibleValuesFromFilterView = (filterRange: GridRange, cellValue: string) => {
        const range = {
          ...filterRange,
          startRowIndex: filterRange.startRowIndex + 1,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex,
        }
        return getFormattedValuesFromRange(sheetId, [{ range }]).filter((value) => value === cellValue)
      }

      // We need to set all other values as hiddenValues
      if (activeTable) {
        onFilterTable?.(
          sheetId,
          activeTable,
          columnIndex - activeTable.range.startColumnIndex,
          undefined,
          undefined,
          getVisibleValuesFromFilterView(activeTable.range, cellValue),
        )
      } else if (activeBasicFilter) {
        onFilterTable?.(
          sheetId,
          activeBasicFilter,
          columnIndex - activeBasicFilter.range.startColumnIndex,
          undefined,
          undefined,
          getVisibleValuesFromFilterView(activeBasicFilter.range, cellValue),
        )
      } else {
        // Create a basic filter
        const range = getContentfulRangeAroundCell?.(sheetId, activeCell)
        if (range) {
          onCreateBasicFilter?.(sheetId, activeCell, selections, {
            filterSpecs: [
              {
                columnIndex,
                filterCriteria: {
                  condition: {},
                  visibleValues: getVisibleValuesFromFilterView(range, cellValue),
                },
              },
            ],
          })
        }
      }
    },
    [
      activeCell,
      selections,
      activeTable,
      activeBasicFilter,
      getFormattedValue,
      onFilterTable,
      onCreateBasicFilter,
      getContentfulRangeAroundCell,
      getFormattedValuesFromRange,
    ],
  )

  // Use DropdownMenuPortal, otherwise menu is not mounted in body
  return (
    <DropdownMenuPortal>
      <DropdownMenuContent
        align="start"
        sideOffset={0}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          if (shouldFocusSheetRef.current && !isSheetFocused()) {
            focusSheet()
          }
        }}
        onInteractOutside={() => {
          shouldFocusSheetRef.current = false
        }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onClick={onCut} disabled={readonly}>
          <DropdownLeftSlot>
            <ScissorsIcon />
          </DropdownLeftSlot>
          Cut <DropdownRightSlot>⌘X</DropdownRightSlot>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopy}>
          <DropdownLeftSlot>
            <CopyIcon />
          </DropdownLeftSlot>
          {s('Copy')} <DropdownRightSlot>⌘C</DropdownRightSlot>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPaste?.()} disabled={readonly}>
          <DropdownLeftSlot>
            <ClipboardIcon />
          </DropdownLeftSlot>
          Paste <DropdownRightSlot>⌘V</DropdownRightSlot>
        </DropdownMenuItem>
        {/* 
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={readonly}>
            <DropdownLeftSlot>
              <ClipboardIcon />
            </DropdownLeftSlot>
            Paste special
            <DropdownRightSlot>
              <ChevronRightIcon />
            </DropdownRightSlot>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
            <DropdownMenuItem onClick={() => onPaste?.('Value')}>Values only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPaste?.('Formatting')}>Formatting only</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPaste?.('Transposed')}>Transposed</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}

        {/* {enableMagicFill ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAddQuickEdit({ ...selection.range, sheetId })} disabled={readonly}>
              <DropdownLeftSlot>
                <WandIcon />
              </DropdownLeftSlot>
              AI Quick Edit
            </DropdownMenuItem>
          </>
        ) : null} */}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={readonly}>
            <DropdownLeftSlot>
              <Cross1Icon />
            </DropdownLeftSlot>
            {s('Clear')}
            <DropdownRightSlot>
              <ChevronRightIcon />
            </DropdownRightSlot>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
            <DropdownMenuItem onClick={() => onClearFormatting?.(sheetId, activeCell, selections)} disabled={readonly}>
              {s('Clear formats')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClearContents?.(sheetId, activeCell, selections)} disabled={readonly}>
              {s('Clear contents')}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {isColumnHeader ? (
          <>
            <DropdownMenuItem
              onClick={() => onInsertColumn?.(sheetId, activeCell.columnIndex, selectedColumnHeadersIds.length)}
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <PlusIcon />
              </DropdownLeftSlot>
              <span>
                {s('Insert')} <b>{columnsString(selectedColumnHeadersIds.length)}</b> {s('left')}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onInsertColumn?.(
                  sheetId,
                  activeCell.columnIndex + selectedColumnHeadersIds.length,
                  selectedColumnHeadersIds.length,
                )
              }
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <PlusIcon />
              </DropdownLeftSlot>
              <span>
                {s('Insert')} <b>{columnsString(selectedColumnHeadersIds.length)}</b> {s('right')}
              </span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onDeleteColumn?.(sheetId, selectedColumnHeadersIds)} disabled={readonly}>
              <DropdownLeftSlot>
                <TrashIcon />
              </DropdownLeftSlot>
              {s('Delete column')} {multiColumnTitle}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onHideColumn}
              onClick={() => onHideColumn?.(sheetId, selectedColumnHeadersIds)}
            >
              <DropdownLeftSlot>
                <EyeNoneIcon />
              </DropdownLeftSlot>
              {s('Hide column')} {multiColumnTitle}
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!onRequestResize}
              onClick={() => onRequestResize?.(sheetId, selectedColumnHeadersIds, 'y')}
            >
              <DropdownLeftSlot>
                <SizeIcon />
              </DropdownLeftSlot>
              {s('Resize column')} {multiColumnTitle}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onFreezeColumn?.(sheetId, activeCell.columnIndex)}>
              <DropdownLeftSlot>
                <ViewGridIcon />
              </DropdownLeftSlot>
              {s('Freeze up to column')} {number2Alpha(activeCell.columnIndex - 1)}
            </DropdownMenuItem>

            {frozenColumns > 1 ? (
              <DropdownMenuItem onClick={() => onFreezeColumn?.(sheetId, 0)}>
                <DropdownLeftSlot>
                  <ViewGridIcon />
                </DropdownLeftSlot>
                {s('Unfreeze columns')}
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'ASCENDING')}
              disabled={readonly}
            >
              <DropdownLeftSlot className="text-base leading-4">
                <SortDownIcon />
              </DropdownLeftSlot>
              {s('Sort sheet A to Z')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'DESCENDING')}
              disabled={readonly}
            >
              <DropdownLeftSlot className="text-base leading-4">
                <SortUpIcon />
              </DropdownLeftSlot>
              {s('Sort sheet Z to A')}
            </DropdownMenuItem>
          </>
        ) : null}

        {isRowHeader ? (
          <>
            <DropdownMenuItem
              onClick={() => onInsertRow?.(sheetId, activeCell.rowIndex, selectedRowHeadersIds.length)}
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <PlusIcon />
              </DropdownLeftSlot>
              <span>
                {s('Insert')} <b>{rowsString(selectedRowHeadersIds.length)}</b> {s('above')}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                onInsertRow?.(sheetId, activeCell.rowIndex + selectedRowHeadersIds.length, selectedRowHeadersIds.length)
              }
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <PlusIcon />
              </DropdownLeftSlot>
              <span>
                {s('Insert')} <b>{rowsString(selectedRowHeadersIds.length)}</b> {s('below')}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowHeadersIds)} disabled={readonly}>
              <DropdownLeftSlot>
                <TrashIcon />
              </DropdownLeftSlot>
              {s('Delete row')} {multiRowTitle}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onHideRow} onClick={() => onHideRow?.(sheetId, selectedRowHeadersIds)}>
              <DropdownLeftSlot>
                <EyeNoneIcon />
              </DropdownLeftSlot>
              {s('Hide row')} {multiRowTitle}
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!onRequestResize}
              onClick={() => onRequestResize?.(sheetId, selectedRowHeadersIds, 'x')}
            >
              <DropdownLeftSlot>
                <SizeIcon />
              </DropdownLeftSlot>
              {s('Resize row')} {multiRowTitle}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onFreezeRow?.(sheetId, activeCell.rowIndex)}>
              <DropdownLeftSlot>
                <ViewGridIcon />
              </DropdownLeftSlot>
              {s('Freeze up to row')} {activeCell.rowIndex}
            </DropdownMenuItem>

            {frozenRows > 1 ? (
              <DropdownMenuItem onClick={() => onFreezeRow?.(sheetId, 0)}>
                <DropdownLeftSlot>
                  <ViewGridIcon />
                </DropdownLeftSlot>
                {s('Unfreeze rows')}
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {isHeader ? (
          <>
            {/* <DropdownMenuItem
              onClick={() => {
                // We have to shift the focus to note editor
                shouldFocusSheetRef.current = false
                onRequestFormatCells?.(sheetId, activeCell, selections)
              }}
            >
              <DropdownLeftSlot>
                <MdBrush />
              </DropdownLeftSlot>
              Format cells
            </DropdownMenuItem> */}

            <DropdownMenuItem
              onClick={() => {
                // We have to shift the focus to note editor
                shouldFocusSheetRef.current = false
                onRequestConditionalFormat?.(sheetId, activeCell, selections)
              }}
            >
              <DropdownLeftSlot>
                <PaintBrush />
              </DropdownLeftSlot>
              {s('Conditional format')}
            </DropdownMenuItem>

            {onRequestDataValidation ? (
              <DropdownMenuItem
                onClick={() => {
                  // We have to shift the focus to note editor
                  shouldFocusSheetRef.current = false
                  onRequestDataValidation?.(sheetId, activeCell, selections)
                }}
              >
                <DropdownLeftSlot>
                  <MdOutlineFactCheck />
                </DropdownLeftSlot>
                Data validation
              </DropdownMenuItem>
            ) : null}
          </>
        ) : (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={readonly}>
                <DropdownLeftSlot>
                  <PlusIcon />
                </DropdownLeftSlot>
                {s('Insert')}
                <DropdownRightSlot>
                  <ChevronRightIcon />
                </DropdownRightSlot>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                {activeTable ? (
                  <>
                    {isActiveCellTableHeader ? null : (
                      <DropdownMenuItem
                        onClick={() => {
                          onInsertTableRow?.(activeTable, activeCell.rowIndex - activeTable.range.startRowIndex)
                        }}
                        disabled={readonly}
                      >
                        <DropdownLeftSlot>
                          <PlusIcon />
                        </DropdownLeftSlot>
                        {s('Insert table row')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        onInsertTableColumn?.(
                          activeTable,
                          activeCell.columnIndex - activeTable.range.startColumnIndex,
                          Direction.Left,
                        )
                      }}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <ArrowLeftIcon />
                      </DropdownLeftSlot>
                      {s('Insert table column to the left')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onInsertTableColumn?.(
                          activeTable,
                          activeCell.columnIndex - activeTable.range.startColumnIndex,
                          Direction.Right,
                        )
                      }}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <ArrowRightIcon />
                      </DropdownLeftSlot>
                      {s('Insert table column to the right')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => onInsertRow?.(sheetId, activeCell.rowIndex, selectedRowIndexes.length)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      <span>
                        {s('Insert')} <b>{rowsString(selectedRowIndexes.length)}</b> {s('above')}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onInsertColumn?.(sheetId, activeCell.columnIndex, selectedColumnIndexes.length)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      <span>
                        {s('Insert')} <b>{columnsString(selectedColumnIndexes.length)}</b> {s('left')}
                      </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onInsertCellsShiftRight?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      {s('Insert cells and shift cells right')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onInsertCellsShiftDown?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      {s('Insert cells and shift cells down')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={readonly}>
                <DropdownLeftSlot>
                  <TrashIcon />
                </DropdownLeftSlot>
                {s('Delete')}
                <DropdownRightSlot>
                  <ChevronRightIcon />
                </DropdownRightSlot>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                {activeTable ? (
                  <>
                    {isActiveCellTableHeader ? null : (
                      <DropdownMenuItem
                        onClick={() => onDeleteTableRow?.(activeTable, selectedRowIndexes)}
                        disabled={readonly}
                      >
                        <DropdownLeftSlot>
                          <TrashIcon />
                        </DropdownLeftSlot>
                        {s('Delete table row')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        onDeleteTableColumn?.(activeTable, activeCell.columnIndex - activeTable.range.startColumnIndex)
                      }
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      {s('Delete table column')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowIndexes)} disabled={readonly}>
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      {s('Delete row')} {generateMultiDimTitle(selectedRowIndexes, 'x')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDeleteColumn?.(sheetId, selectedColumnIndexes)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      {s('Delete column')} {generateMultiDimTitle(selectedColumnIndexes, 'y')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDeleteCellsShiftLeft?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      {s('Delete cells and shift cells left')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteCellsShiftUp?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      {s('Delete cells and shift cells up')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={readonly}>
                <DropdownLeftSlot>
                  <FunnelIcon />
                </DropdownLeftSlot>
                {s('Filter')}
                <DropdownRightSlot>
                  <ChevronRightIcon />
                </DropdownRightSlot>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    onFilterTableOrFilterView(sheetId, activeCell.rowIndex, activeCell.columnIndex)
                  }}
                  disabled={readonly}
                >
                  {s('Cell value')} "
                  {getFormattedValue(sheetId, activeCell.rowIndex, activeCell.columnIndex) ?? BLANK_LABEL}"
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={readonly}>
                <DropdownLeftSlot>
                  <SortDownIcon />
                </DropdownLeftSlot>
                {s('Sort')}
                <DropdownRightSlot>
                  <ChevronRightIcon />
                </DropdownRightSlot>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() => {
                    onSortTableOrFilterView('ASCENDING')
                  }}
                  disabled={readonly}
                >
                  <DropdownLeftSlot>
                    <SortDownIcon />
                  </DropdownLeftSlot>
                  {s('Sort range A → Z')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortTableOrFilterView('DESCENDING')} disabled={readonly}>
                  <DropdownLeftSlot>
                    <SortUpIcon />
                  </DropdownLeftSlot>
                  {s('Sort range Z → A')}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {activeTable ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={readonly}>
                  <DropdownLeftSlot>
                    <TableIcon />
                  </DropdownLeftSlot>
                  {s('Table')}
                  <DropdownRightSlot>
                    <ChevronRightIcon />
                  </DropdownRightSlot>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                  <DropdownMenuItem onClick={() => onRemoveTable?.(activeTable)} disabled={readonly}>
                    {s('Convert to range')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestEditTable?.(activeTable)} disabled={readonly}>
                    {s('Edit table')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}

            <DropdownMenuSeparator />
            {/* {activeTable ? null : (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    // We have to shift the focus to note editor
                    shouldFocusSheetRef.current = false
                    onCreateTable?.(sheetId, activeCell, selections, undefined, 'TableStyleLight1', {
                      rowProperties: {
                        firstBandColor: {
                          theme: 1,
                          tint: 0.8,
                        },
                        secondBandColor: {
                          theme: 0,
                        },
                        headerBorder: {
                          top: {
                            width: 1,
                            style: 'solid',
                            color: {
                              theme: 1,
                            },
                          },
                          bottom: {
                            width: 1,
                            style: 'solid',
                            color: {
                              theme: 1,
                            },
                          },
                        },
                        footerBorder: {
                          bottom: {
                            width: 1,
                            style: 'solid',
                            color: {
                              theme: 1,
                            },
                          },
                        },
                      },
                    })
                  }}
                  disabled={readonly}
                >
                  <DropdownLeftSlot>
                    <TableIcon />
                  </DropdownLeftSlot>
                  {s('Convert to table')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // We have to shift the focus to note editor
                    shouldFocusSheetRef.current = false
                    onCreateBasicFilter?.(sheetId, activeCell, selections)
                  }}
                  disabled={readonly}
                >
                  <DropdownLeftSlot>
                    <FunnelIcon />
                  </DropdownLeftSlot>
                  {activeBasicFilter ? s('Remove filter') : s('Create a filter')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )} */}

            {/* <DropdownMenuItem
              disabled={readonly}
              onClick={() => {
                // We have to shift the focus to note editor
                shouldFocusSheetRef.current = false
                onRequestFormatCells?.(sheetId, activeCell, selections)
              }}
            >
              <DropdownLeftSlot>
                <MdBrush />
              </DropdownLeftSlot>
              Format cells
            </DropdownMenuItem> */}

            <DropdownMenuItem
              disabled={readonly}
              onClick={() => {
                // We have to shift the focus to note editor
                shouldFocusSheetRef.current = false
                onRequestConditionalFormat?.(sheetId, activeCell, selections)
              }}
            >
              <DropdownLeftSlot>
                <PaintBrush />
              </DropdownLeftSlot>
              {s('Conditional format')}
            </DropdownMenuItem>

            {onRequestDataValidation ? (
              <DropdownMenuItem
                onClick={() => {
                  // We have to shift the focus to note editor
                  shouldFocusSheetRef.current = false
                  onRequestDataValidation?.(sheetId, activeCell, selections)
                }}
                disabled={readonly}
              >
                <DropdownLeftSlot>
                  <MdOutlineFactCheck />
                </DropdownLeftSlot>
                {s('Data validation')}
              </DropdownMenuItem>
            ) : null}

            <DropdownMenuItem
              onClick={() => {
                // We have to shift the focus to note editor
                shouldFocusSheetRef.current = false
                onInsertNote?.(sheetId, activeCell)
              }}
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <ReaderIcon />
              </DropdownLeftSlot>
              {s('Insert note')}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={insertLink} disabled={readonly}>
              <DropdownLeftSlot>
                <Link1Icon />
              </DropdownLeftSlot>
              {s('Insert link')}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => {
                shouldFocusSheetRef.current = false
                onRequestDefineNamedRange?.(sheetId, activeCell, selections)
              }}
              disabled={readonly}
            >
              <DropdownLeftSlot>
                <PlusIcon />
              </DropdownLeftSlot>
              {s('Define named range')}
            </DropdownMenuItem>
          </>
        )}
        {/* <DropdownMenuSeparator />

              <DropdownMenuItem>
                <DropdownLeftSlot>
                  <IdCardIcon />
                </DropdownLeftSlot>
                Conditional formatting
              </DropdownMenuItem>

              <DropdownMenuItem>
                <DropdownLeftSlot>
                  <MagicWandIcon />
                </DropdownLeftSlot>
                Data validation
              </DropdownMenuItem> */}

        {selections.length && !isRowHeader ? <DropdownMenuSeparator /> : null}

        {/* <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={readonly}>
            <DropdownLeftSlot>
              <SpaceBetweenHorizontallyIcon />
            </DropdownLeftSlot>
            Split text to columns
            <DropdownRightSlot>
              <ChevronRightIcon />
            </DropdownRightSlot>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
            <DropdownMenuItem onClick={() => onSplitTextToColumns?.(sheetId, activeCell, selections, ',')}>
              Comma
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSplitTextToColumns?.(sheetId, activeCell, selections, ';')}>
              Semicolon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSplitTextToColumns?.(sheetId, activeCell, selections, '.')}>
              Period
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSplitTextToColumns?.(sheetId, activeCell, selections, '')}>
              Space
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSplitTextToColumns?.(sheetId, activeCell, selections, '|')}>
              Pipe
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub> */}

        {selections.length && !isRowHeader ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={readonly}>
              <DropdownLeftSlot>
                <DotsVerticalIcon />
              </DropdownLeftSlot>
              {s('More cell actions')}
              <DropdownRightSlot>
                <ChevronRightIcon />
              </DropdownRightSlot>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
              {selections.length && !isRowHeader ? (
                <>
                  <DropdownMenuItem onClick={() => onSortRange?.(sheetId, selections, 'ASCENDING')} disabled={readonly}>
                    {s('Sort range A → Z')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortRange?.(sheetId, selections, 'DESCENDING')}
                    disabled={readonly}
                  >
                    {s('Sort range Z → A')}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenuPortal>
  )
}

function strings() {
  return {
    Copy: c('sheets_2025:Spreadsheet context menu').t`Copy`,
    Clear: c('sheets_2025:Spreadsheet context menu').t`Clear`,
    'Clear formats': c('sheets_2025:Spreadsheet context menu').t`Clear formats`,
    'Clear contents': c('sheets_2025:Spreadsheet context menu').t`Clear contents`,

    'Insert table row': c('sheets_2025:Spreadsheet context menu').t`Insert table row`,
    'Insert table column to the left': c('sheets_2025:Spreadsheet context menu').t`Insert table column to the left`,
    'Insert table column to the right': c('sheets_2025:Spreadsheet context menu').t`Insert table column to the right`,
    'Insert link': c('sheets_2025:Spreadsheet context menu').t`Insert link`,
    'Insert cells and shift cells right': c('sheets_2025:Spreadsheet context menu')
      .t`Insert cells and shift cells right`,
    'Insert cells and shift cells down': c('sheets_2025:Spreadsheet context menu').t`Insert cells and shift cells down`,

    Delete: c('sheets_2025:Spreadsheet context menu').t`Delete`,
    'Delete column': c('sheets_2025:Spreadsheet context menu').t`Delete column`,
    'Delete row': c('sheets_2025:Spreadsheet context menu').t`Delete row`,
    'Delete table row': c('sheets_2025:Spreadsheet context menu').t`Delete table row`,
    'Delete table column': c('sheets_2025:Spreadsheet context menu').t`Delete table column`,
    'Delete cells and shift cells left': c('sheets_2025:Spreadsheet context menu').t`Delete cells and shift cells left`,
    'Delete cells and shift cells up': c('sheets_2025:Spreadsheet context menu').t`Delete cells and shift cells up`,

    'Hide column': c('sheets_2025:Spreadsheet context menu').t`Hide column`,
    'Hide row': c('sheets_2025:Spreadsheet context menu').t`Hide row`,
    'Resize column': c('sheets_2025:Spreadsheet context menu').t`Resize column`,
    'Resize row': c('sheets_2025:Spreadsheet context menu').t`Resize row`,

    'Freeze up to column': c('sheets_2025:Spreadsheet context menu').t`Freeze up to column`,
    'Unfreeze columns': c('sheets_2025:Spreadsheet context menu').t`Unfreeze columns`,
    'Freeze up to row': c('sheets_2025:Spreadsheet context menu').t`Freeze up to row`,
    'Unfreeze rows': c('sheets_2025:Spreadsheet context menu').t`Unfreeze rows`,

    'Sort sheet A to Z': c('sheets_2025:Spreadsheet context menu').t`Sort sheet A to Z`,
    'Sort sheet Z to A': c('sheets_2025:Spreadsheet context menu').t`Sort sheet Z to A`,
    Sort: c('sheets_2025:Spreadsheet context menu').t`Sort`,
    'Sort range A → Z': c('sheets_2025:Spreadsheet context menu').t`Sort range A → Z`,
    'Sort range Z → A': c('sheets_2025:Spreadsheet context menu').t`Sort range Z → A`,

    Filter: c('sheets_2025:Spreadsheet context menu').t`Filter`,
    'Cell value': c('sheets_2025:Spreadsheet context menu').t`Cell value`,

    Insert: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`Insert`,
    above: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`above`,
    below: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`below`,
    left: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`left`,
    right: c('sheets_2025:Spreadsheet context menu (columns/rows)').t`right`,

    Table: c('sheets_2025:Spreadsheet context menu').t`Table`,
    'Convert to range': c('sheets_2025:Spreadsheet context menu').t`Convert to range`,
    'Edit table': c('sheets_2025:Spreadsheet context menu').t`Edit table`,
    'Convert to table': c('sheets_2025:Spreadsheet context menu').t`Convert to table`,

    'Create a filter': c('sheets_2025:Spreadsheet context menu').t`Create a filter`,
    'Remove filter': c('sheets_2025:Spreadsheet context menu').t`Remove filter`,

    'Conditional format': c('sheets_2025:Spreadsheet context menu').t`Conditional format`,
    'Data validation': c('sheets_2025:Spreadsheet context menu').t`Data validation`,

    'Insert note': c('sheets_2025:Spreadsheet context menu').t`Insert note`,
    'Define named range': c('sheets_2025:Spreadsheet context menu').t`Define named range`,
    'More cell actions': c('sheets_2025:Spreadsheet context menu').t`More cell actions`,
    'AI Quick Edit': c('sheets_2025:Spreadsheet context menu').t`AI Quick Edit`,
    'Paste special': c('sheets_2025:Spreadsheet context menu').t`Paste special`,
    'Values only': c('sheets_2025:Spreadsheet context menu').t`Values only`,
    'Formatting only': c('sheets_2025:Spreadsheet context menu').t`Formatting only`,
    Transposed: c('sheets_2025:Spreadsheet context menu').t`Transposed`,
    Comma: c('sheets_2025:Spreadsheet context menu').t`Comma`,
    Semicolon: c('sheets_2025:Spreadsheet context menu').t`Semicolon`,
    Period: c('sheets_2025:Spreadsheet context menu').t`Period`,
    Space: c('sheets_2025:Spreadsheet context menu').t`Space`,
    Pipe: c('sheets_2025:Spreadsheet context menu').t`Pipe`,
  }
}

function columnsString(numberOfColumns: number) {
  // translator: this is used in the context of three strings put together - "Insert | N columns | left/right" (the | symbol is used to show the separation between the three strings), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet context menu (columns/rows)').ngettext(
    msgid`${numberOfColumns} column`,
    `${numberOfColumns} columns`,
    numberOfColumns,
  )
}

function rowsString(numberOfRows: number) {
  // translator: this is used in the context of three strings put together - "Insert | N rows | above/below" (the | symbol is used to show the separation between the three strings), and it's separate because "X columns/rows" needs to be bold, the order of these three strings cannot be changed and they will be separated by spaces
  return c('sheets_2025:Spreadsheet context menu (columns/rows)').ngettext(
    msgid`${numberOfRows} row`,
    `${numberOfRows} rows`,
    numberOfRows,
  )
}
