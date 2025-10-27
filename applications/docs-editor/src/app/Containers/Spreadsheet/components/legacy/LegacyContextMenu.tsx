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
  MdBrush,
  MdOutlineFactCheck,
  PaintBrush,
  PlusIcon,
  ReaderIcon,
  ScissorsIcon,
  SizeIcon,
  SortDownIcon,
  SortUpIcon,
  SpaceBetweenHorizontallyIcon,
  TableIcon,
  TrashIcon,
  ViewGridIcon,
  WandIcon,
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
          Copy <DropdownRightSlot>⌘C</DropdownRightSlot>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPaste?.()} disabled={readonly}>
          <DropdownLeftSlot>
            <ClipboardIcon />
          </DropdownLeftSlot>
          Paste <DropdownRightSlot>⌘V</DropdownRightSlot>
        </DropdownMenuItem>

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
        </DropdownMenuSub>

        {enableMagicFill ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAddQuickEdit({ ...selection.range, sheetId })} disabled={readonly}>
              <DropdownLeftSlot>
                <WandIcon />
              </DropdownLeftSlot>
              AI Quick Edit
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={readonly}>
            <DropdownLeftSlot>
              <Cross1Icon />
            </DropdownLeftSlot>
            Clear
            <DropdownRightSlot>
              <ChevronRightIcon />
            </DropdownRightSlot>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
            <DropdownMenuItem onClick={() => onClearFormatting?.(sheetId, activeCell, selections)} disabled={readonly}>
              Clear formats
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClearContents?.(sheetId, activeCell, selections)} disabled={readonly}>
              Clear contents
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
              Insert {selectedColumnHeadersIds.length} column left
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
              Insert {selectedColumnHeadersIds.length} column right
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onDeleteColumn?.(sheetId, selectedColumnHeadersIds)} disabled={readonly}>
              <DropdownLeftSlot>
                <TrashIcon />
              </DropdownLeftSlot>
              Delete column {multiColumnTitle}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!onHideColumn}
              onClick={() => onHideColumn?.(sheetId, selectedColumnHeadersIds)}
            >
              <DropdownLeftSlot>
                <EyeNoneIcon />
              </DropdownLeftSlot>
              Hide column {multiColumnTitle}
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!onRequestResize}
              onClick={() => onRequestResize?.(sheetId, selectedColumnHeadersIds, 'y')}
            >
              <DropdownLeftSlot>
                <SizeIcon />
              </DropdownLeftSlot>
              Resize column {multiColumnTitle}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onFreezeColumn?.(sheetId, activeCell.columnIndex)}>
              <DropdownLeftSlot>
                <ViewGridIcon />
              </DropdownLeftSlot>
              Freeze up to Column {number2Alpha(activeCell.columnIndex - 1)}
            </DropdownMenuItem>

            {frozenColumns > 1 ? (
              <DropdownMenuItem onClick={() => onFreezeColumn?.(sheetId, 0)}>
                <DropdownLeftSlot>
                  <ViewGridIcon />
                </DropdownLeftSlot>
                Unfreeze columns
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
              Sort sheet A to Z
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'DESCENDING')}
              disabled={readonly}
            >
              <DropdownLeftSlot className="text-base leading-4">
                <SortUpIcon />
              </DropdownLeftSlot>
              Sort sheet Z to A
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
              Insert {selectedRowHeadersIds.length} row above
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
              Insert {selectedRowHeadersIds.length} row below
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowHeadersIds)} disabled={readonly}>
              <DropdownLeftSlot>
                <TrashIcon />
              </DropdownLeftSlot>
              Delete row {multiRowTitle}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!onHideRow} onClick={() => onHideRow?.(sheetId, selectedRowHeadersIds)}>
              <DropdownLeftSlot>
                <EyeNoneIcon />
              </DropdownLeftSlot>
              Hide row {multiRowTitle}
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!onRequestResize}
              onClick={() => onRequestResize?.(sheetId, selectedRowHeadersIds, 'x')}
            >
              <DropdownLeftSlot>
                <SizeIcon />
              </DropdownLeftSlot>
              Resize row {multiRowTitle}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onFreezeRow?.(sheetId, activeCell.rowIndex)}>
              <DropdownLeftSlot>
                <ViewGridIcon />
              </DropdownLeftSlot>
              Freeze up to Row {activeCell.rowIndex}
            </DropdownMenuItem>

            {frozenRows > 1 ? (
              <DropdownMenuItem onClick={() => onFreezeRow?.(sheetId, 0)}>
                <DropdownLeftSlot>
                  <ViewGridIcon />
                </DropdownLeftSlot>
                Unfreeze rows
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        {isHeader ? (
          <>
            <DropdownMenuItem
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
            </DropdownMenuItem>

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
              Conditional format
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
                Insert
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
                        Insert table row
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
                      Insert table column to the left
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
                      Insert table column to the right
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
                      Insert {selectedRowIndexes.length} row above
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onInsertColumn?.(sheetId, activeCell.columnIndex, selectedColumnIndexes.length)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      Insert {selectedColumnIndexes.length} column left
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onInsertCellsShiftRight?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      Insert cells and shift cells right
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onInsertCellsShiftDown?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <PlusIcon />
                      </DropdownLeftSlot>
                      Insert cells and shift cells down
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
                Delete
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
                        Delete table row
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
                      Delete table column
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowIndexes)} disabled={readonly}>
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      Delete row {generateMultiDimTitle(selectedRowIndexes, 'x')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDeleteColumn?.(sheetId, selectedColumnIndexes)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      Delete column {generateMultiDimTitle(selectedColumnIndexes, 'y')}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onDeleteCellsShiftLeft?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      Delete cells and shift cells left
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteCellsShiftUp?.(sheetId, activeCell, selections)}
                      disabled={readonly}
                    >
                      <DropdownLeftSlot>
                        <TrashIcon />
                      </DropdownLeftSlot>
                      Delete cells and shift cells up
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
                Filter
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
                  Cell value &quot;
                  {getFormattedValue(sheetId, activeCell.rowIndex, activeCell.columnIndex) ?? BLANK_LABEL}
                  &quot;
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={readonly}>
                <DropdownLeftSlot>
                  <SortDownIcon />
                </DropdownLeftSlot>
                Sort
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
                  Sort range A &rarr; Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSortTableOrFilterView('DESCENDING')} disabled={readonly}>
                  <DropdownLeftSlot>
                    <SortUpIcon />
                  </DropdownLeftSlot>
                  Sort range Z &rarr; A
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {activeTable ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={readonly}>
                  <DropdownLeftSlot>
                    <TableIcon />
                  </DropdownLeftSlot>
                  Table
                  <DropdownRightSlot>
                    <ChevronRightIcon />
                  </DropdownRightSlot>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                  <DropdownMenuItem onClick={() => onRemoveTable?.(activeTable)} disabled={readonly}>
                    Convert to range
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRequestEditTable?.(activeTable)} disabled={readonly}>
                    Edit table
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}

            <DropdownMenuSeparator />
            {activeTable ? null : (
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
                  Convert to table
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
                  {activeBasicFilter ? 'Remove filter' : 'Create a filter'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
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
            </DropdownMenuItem>

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
              Conditional format
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
                Data validation
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
              Insert note
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
              Define named range
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

        <DropdownMenuSeparator />

        <DropdownMenuSub>
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
        </DropdownMenuSub>

        {selections.length && !isRowHeader ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={readonly}>
              <DropdownLeftSlot>
                <DotsVerticalIcon />
              </DropdownLeftSlot>
              More cell actions
              <DropdownRightSlot>
                <ChevronRightIcon />
              </DropdownRightSlot>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
              {selections.length && !isRowHeader ? (
                <>
                  <DropdownMenuItem onClick={() => onSortRange?.(sheetId, selections, 'ASCENDING')} disabled={readonly}>
                    Sort range A &rarr; Z
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortRange?.(sheetId, selections, 'DESCENDING')}
                    disabled={readonly}
                  >
                    Sort range Z &rarr; A
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
