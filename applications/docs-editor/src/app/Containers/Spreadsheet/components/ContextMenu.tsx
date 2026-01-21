import {
  BLANK_LABEL,
  createArrayRange,
  generateMultiDimTitle,
  type SortOrder,
  useGetContentfulRangeAroundCell,
  type ContextMenuProps,
} from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import * as UI from './ui'
import { useUI } from '../ui-store'
import { c, msgid } from 'ttag'
import { createStringifier } from '../stringifier'
import { useCallback, useLayoutEffect, useMemo } from 'react'
const { s } = createStringifier(strings)
import { number2Alpha } from '@rowsncolumns/utils'
import { Direction, type GridRange, isCellWithinBounds, selectionFromActiveCell } from '@rowsncolumns/grid'
import * as Icons from './icons'

type ContextMenuWrapperProps = {
  isOpen?: boolean
  left: number
  top: number
  onOpenChange(isOpen: boolean): void
  children?: React.ReactNode
}

export function ContextMenuWrapper({ isOpen, left, top, onOpenChange, children }: ContextMenuWrapperProps) {
  const menu = Ariakit.useMenuStore({
    open: isOpen,
    setOpen: onOpenChange,
  })

  useLayoutEffect(() => {
    menu.render()
  }, [left, top, menu])

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transform: `translate3d(${left}px, ${top}px, 0)`,
      }}
    >
      <Ariakit.MenuProvider store={menu}>
        <Ariakit.MenuButton className="bg-transparent absolute left-0 top-0 m-0 h-0 w-0 overflow-hidden border-none p-0 shadow-none" />
        <UI.Menu gutter={8} className="z-10" portal unmountOnHide>
          {children}
        </UI.Menu>
      </Ariakit.MenuProvider>
    </div>
  )
}

export function ContextMenu({
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
}: ContextMenuProps) {
  const store = Ariakit.useMenuContext()
  const selectedColumnCount = useUI((ui) => ui.info.selectedColumnCount)
  const insertColumnsLeft = useUI.$.insert.columnsLeft
  const insertColumnsRight = useUI.$.insert.columnsRight
  const insertLink = useUI.$.insert.link
  const copy = useUI.$.operation.copy
  const clearFormat = useUI.$.withFocusGrid(useUI.$.format.clear)
  const clearContent = useUI.$.withFocusGrid(useUI.$.operation.delete)
  const openConditionalFormat = useUI.$.format.conditional.open
  const openDataValidation = useUI.$.data.validation.open
  const onAutoResize = useUI((ui) => ui.legacy.onAutoResize)

  const multiColumnTitle = generateMultiDimTitle(selectedColumnHeadersIds, 'y')
  const multiRowTitle = generateMultiDimTitle(selectedRowHeadersIds, 'x')
  const selection = selections.length ? selections[0] : selectionFromActiveCell(activeCell)[0]
  const selectedRowIndexes = createArrayRange(selection.range.startRowIndex, selection.range.endRowIndex)
  const selectedColumnIndexes = createArrayRange(selection.range.startColumnIndex, selection.range.endColumnIndex)

  const isHeader = isColumnHeader || isRowHeader
  const isActiveCellTableHeader = isTableHeader(activeCell.rowIndex, activeCell.columnIndex)
  const activeTable = useMemo(
    () => tables?.find(({ range }) => isCellWithinBounds(activeCell, range)),
    [tables, activeCell],
  )
  const activeBasicFilter = basicFilter && isCellWithinBounds(activeCell, basicFilter.range) ? basicFilter : undefined
  const getContentfulRangeAroundCell = useGetContentfulRangeAroundCell()

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

  return (
    <Ariakit.MenuProvider store={store}>
      <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="squares" />} onClick={copy}>
        {s('Copy')}
      </UI.MenuItem>

      <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.clipboard} />} onClick={() => onPaste?.()} disabled={readonly}>
        {s('Paste')}
      </UI.MenuItem>

      <Ariakit.MenuProvider>
        <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.clipboard} />} disabled={readonly}>
          {s('Paste special')}
        </UI.SubMenuButton>
        <UI.SubMenu unmountOnHide>
          <UI.MenuItem onClick={() => onPaste?.('Value')} disabled={readonly}>
            {s('Values only')}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Formatting')} disabled={readonly}>
            {s('Formatting only')}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Formula')} disabled={readonly}>
            {s('Formula only')}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Link')} disabled={readonly}>
            {s('Link only')}
          </UI.MenuItem>
          <UI.MenuSeparator />
          <UI.MenuItem onClick={() => onPaste?.('Transposed')} disabled={readonly}>
            {s('Transposed')}
          </UI.MenuItem>
        </UI.SubMenu>
      </Ariakit.MenuProvider>

      <Ariakit.MenuProvider>
        <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="cross-big" />} disabled={readonly}>
          {s('Clear')}
        </UI.SubMenuButton>
        <UI.SubMenu unmountOnHide>
          <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="eraser" />} onClick={clearFormat} disabled={readonly}>
            {s('Clear formatting')}
          </UI.MenuItem>
          <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="cross-big" />} onClick={clearContent} disabled={readonly}>
            {s('Clear content')}
          </UI.MenuItem>
        </UI.SubMenu>
      </Ariakit.MenuProvider>

      <UI.MenuSeparator />

      {isColumnHeader ? (
        <>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'scaleX(-1)' }} />}
            onClick={() => insertColumnsLeft(selectedColumnCount)}
            disabled={readonly}
          >
            {s('Insert')} <b>{columnsString(selectedColumnHeadersIds.length)}</b> {s('left')}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} />}
            onClick={() => insertColumnsRight(selectedColumnCount)}
            disabled={readonly}
          >
            {s('Insert')} <b>{columnsString(selectedColumnHeadersIds.length)}</b> {s('right')}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="trash" />}
            onClick={() => onDeleteColumn?.(sheetId, selectedColumnHeadersIds)}
            disabled={readonly}
          >
            {s('Delete column')} {multiColumnTitle}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="eye-slash" />}
            onClick={() => onHideColumn?.(sheetId, selectedColumnHeadersIds)}
            disabled={readonly}
          >
            {s('Hide column')} {multiColumnTitle}
          </UI.MenuItem>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.resize} />} disabled={readonly || !onRequestResize}>
              {s('Resize column')} {multiColumnTitle}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon legacyName="bolt" />}
                onClick={() => {
                  onAutoResize?.(sheetId, selectedColumnHeadersIds, 'y')
                }}
                disabled={readonly || !onRequestResize}
              >
                {s('Auto fit to data')}
              </UI.MenuItem>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.resize} />}
                onClick={() => onRequestResize?.(sheetId, selectedColumnHeadersIds, 'y')}
                disabled={readonly || !onRequestResize}
              >
                {s('Custom')}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
            onClick={() => onFreezeColumn?.(sheetId, activeCell.columnIndex)}
            disabled={readonly}
          >
            {s('Freeze up to column')} {number2Alpha(activeCell.columnIndex - 1)}
          </UI.MenuItem>

          {frozenColumns > 1 ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
              onClick={() => onFreezeColumn?.(sheetId, 0)}
              disabled={readonly}
            >
              {s('Unfreeze columns')}
            </UI.MenuItem>
          ) : null}

          <UI.MenuSeparator />

          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="sort-alphabetically" />}
            onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'ASCENDING')}
            disabled={readonly}
          >
            {s('Sort sheet A to Z')}
          </UI.MenuItem>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="sort-alphabetically" />}
            onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'DESCENDING')}
            disabled={readonly}
          >
            {s('Sort sheet Z to A')}
          </UI.MenuItem>
        </>
      ) : null}

      {isRowHeader ? (
        <>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />}
            onClick={() => onInsertRow?.(sheetId, activeCell.rowIndex, selectedRowHeadersIds.length)}
            disabled={readonly}
          >
            {s('Insert')} <b>{rowsString(selectedRowHeadersIds.length)}</b> {s('above')}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'rotate(90deg)' }} />}
            onClick={() =>
              onInsertRow?.(sheetId, activeCell.rowIndex + selectedRowHeadersIds.length, selectedRowHeadersIds.length)
            }
            disabled={readonly}
          >
            {s('Insert')} <b>{rowsString(selectedRowHeadersIds.length)}</b> {s('below')}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="trash" />}
            onClick={() => onDeleteRow?.(sheetId, selectedRowHeadersIds)}
            disabled={readonly}
          >
            {s('Delete row')} {multiRowTitle}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="eye-slash" />}
            onClick={() => onHideRow?.(sheetId, selectedRowHeadersIds)}
            disabled={readonly}
          >
            {s('Hide row')} {multiRowTitle}
          </UI.MenuItem>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.resize} />} disabled={readonly || !onRequestResize}>
              {s('Resize row')} {multiRowTitle}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon legacyName="bolt" />}
                onClick={() => {
                  onAutoResize?.(sheetId, selectedRowHeadersIds, 'x')
                }}
                disabled={readonly || !onRequestResize}
              >
                {s('Auto fit to data')}
              </UI.MenuItem>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.resize} />}
                onClick={() => onRequestResize?.(sheetId, selectedRowHeadersIds, 'x')}
                disabled={readonly || !onRequestResize}
              >
                {s('Custom')}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
            onClick={() => onFreezeRow?.(sheetId, activeCell.rowIndex)}
            disabled={readonly}
          >
            {s('Freeze up to row')} {activeCell.rowIndex}
          </UI.MenuItem>

          {frozenRows > 1 ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
              onClick={() => onFreezeRow?.(sheetId, 0)}
              disabled={readonly}
            >
              {s('Unfreeze rows')}
            </UI.MenuItem>
          ) : null}
        </>
      ) : null}

      {isHeader ? (
        <>
          <UI.MenuSeparator />
          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="broom" />}
            onClick={openConditionalFormat}
            disabled={readonly}
          >
            {s('Conditional format')}
          </UI.MenuItem>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
            onClick={openDataValidation}
            disabled={readonly}
          >
            {s('Data validation')}
          </UI.MenuItem>

          {onRequestDefineNamedRange ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.tableRange} />}
              onClick={() => {
                onRequestDefineNamedRange(sheetId, activeCell, selections)
              }}
              disabled={readonly}
            >
              {s('Define named range')}
            </UI.MenuItem>
          ) : null}
        </>
      ) : null}

      {!isHeader ? (
        <>
          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="plus" />} disabled={readonly}>
              {s('Insert')}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              {activeTable ? (
                <>
                  {isActiveCellTableHeader ? (
                    <UI.MenuItem
                      leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'rotate(90deg)' }} />}
                      onClick={() => {
                        onInsertTableRow?.(activeTable, activeCell.rowIndex - activeTable.range.startRowIndex)
                      }}
                      disabled={readonly}
                    >
                      {s('Insert table row')}
                    </UI.MenuItem>
                  ) : null}
                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'scaleX(-1)' }} />}
                    onClick={() => {
                      onInsertTableColumn?.(
                        activeTable,
                        activeCell.columnIndex - activeTable.range.startColumnIndex,
                        Direction.Left,
                      )
                    }}
                    disabled={readonly}
                  >
                    {s('Insert table column to the left')}
                  </UI.MenuItem>
                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.addColumn} />}
                    onClick={() => {
                      onInsertTableColumn?.(
                        activeTable,
                        activeCell.columnIndex - activeTable.range.startColumnIndex,
                        Direction.Right,
                      )
                    }}
                    disabled={readonly}
                  >
                    {s('Insert table column to the right')}
                  </UI.MenuItem>
                </>
              ) : (
                <>
                  <UI.MenuItem
                    leadingIconSlot={
                      <UI.Icon data={Icons.addColumn} style={{ transform: 'rotate(-90deg) scaleY(-1)' }} />
                    }
                    onClick={() => onInsertRow?.(sheetId, activeCell.rowIndex, selectedRowIndexes.length)}
                    disabled={readonly}
                  >
                    {s('Insert')} <b>{rowsString(selectedRowIndexes.length)}</b> {s('above')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'scaleX(-1)' }} />}
                    onClick={() => onInsertColumn?.(sheetId, activeCell.columnIndex, selectedColumnIndexes.length)}
                    disabled={readonly}
                  >
                    {s('Insert')} <b>{columnsString(selectedColumnIndexes.length)}</b> {s('left')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon legacyName="plus" />}
                    onClick={() => onInsertCellsShiftRight?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {s('Insert cells and shift cells right')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon legacyName="plus" />}
                    onClick={() => onInsertCellsShiftDown?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {s('Insert cells and shift cells down')}
                  </UI.MenuItem>
                </>
              )}
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="trash" />} disabled={readonly}>
              {s('Delete')}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              {activeTable ? (
                <>
                  {isActiveCellTableHeader ? null : (
                    <UI.MenuItem
                      onClick={() => onDeleteTableRow?.(activeTable, selectedRowIndexes)}
                      disabled={readonly}
                    >
                      {s('Delete table row')}
                    </UI.MenuItem>
                  )}
                  <UI.MenuItem
                    onClick={() =>
                      onDeleteTableColumn?.(activeTable, activeCell.columnIndex - activeTable.range.startColumnIndex)
                    }
                    disabled={readonly}
                  >
                    {s('Delete table column')}
                  </UI.MenuItem>
                </>
              ) : (
                <>
                  <UI.MenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowIndexes)} disabled={readonly}>
                    {s('Delete row')} {generateMultiDimTitle(selectedRowIndexes, 'x')}
                  </UI.MenuItem>

                  <UI.MenuItem onClick={() => onDeleteColumn?.(sheetId, selectedColumnIndexes)} disabled={readonly}>
                    {s('Delete column')} {generateMultiDimTitle(selectedColumnIndexes, 'y')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    onClick={() => onDeleteCellsShiftLeft?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {s('Delete cells and shift cells left')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    onClick={() => onDeleteCellsShiftUp?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {s('Delete cells and shift cells up')}
                  </UI.MenuItem>
                </>
              )}
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuSeparator />

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="filter" />} disabled={readonly}>
              {s('Filter')}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                onClick={() => {
                  onFilterTableOrFilterView(sheetId, activeCell.rowIndex, activeCell.columnIndex)
                }}
                disabled={readonly}
              >
                {s('Cell value')} "
                {getFormattedValue(sheetId, activeCell.rowIndex, activeCell.columnIndex) ?? BLANK_LABEL}"
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="sort-alphabetically" />} disabled={readonly}>
              {s('Sort')}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem onClick={() => onSortTableOrFilterView('ASCENDING')} disabled={readonly}>
                {s('Sort range A → Z')}
              </UI.MenuItem>

              <UI.MenuItem onClick={() => onSortTableOrFilterView('DESCENDING')} disabled={readonly}>
                {s('Sort range Z → A')}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          {activeTable ? (
            <Ariakit.MenuProvider>
              <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.table} />} disabled={readonly}>
                {s('Table')}
              </UI.SubMenuButton>
              <UI.SubMenu unmountOnHide>
                <UI.MenuItem onClick={() => onRemoveTable?.(activeTable)} disabled={readonly}>
                  {s('Convert to range')}
                </UI.MenuItem>

                <UI.MenuItem onClick={() => onRequestEditTable?.(activeTable)} disabled={readonly}>
                  {s('Edit table')}
                </UI.MenuItem>
              </UI.SubMenu>
            </Ariakit.MenuProvider>
          ) : null}

          <UI.MenuSeparator />

          {/* {activeTable ? null : (
            <>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
                onClick={() => {
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
                {s('Convert to table')}
              </UI.MenuItem>

              <UI.MenuItem
                leadingIconSlot={<UI.Icon legacyName="filter" />}
                onClick={() => {
                  onCreateBasicFilter?.(sheetId, activeCell, selections)
                }}
                disabled={readonly}
              >
                {activeBasicFilter ? s('Remove filter') : s('Create a filter')}
              </UI.MenuItem>
            </>
          )} */}

          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="broom" />}
            onClick={openConditionalFormat}
            disabled={readonly}
          >
            {s('Conditional format')}
          </UI.MenuItem>

          {onRequestDataValidation ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
              onClick={openDataValidation}
              disabled={readonly}
            >
              {s('Data validation')}
            </UI.MenuItem>
          ) : null}

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.tableRange} />}
            onClick={() => {
              onRequestDefineNamedRange?.(sheetId, activeCell, selections)
            }}
            disabled={readonly}
          >
            {s('Define named range')}
          </UI.MenuItem>

          <UI.MenuSeparator />

          <UI.MenuItem
            leadingIconSlot={<UI.Icon legacyName="note" />}
            onClick={() => {
              onInsertNote?.(sheetId, activeCell)
            }}
            disabled={readonly}
          >
            {s('Insert note')}
          </UI.MenuItem>

          <UI.MenuItem leadingIconSlot={<UI.Icon legacyName="link" />} onClick={insertLink} disabled={readonly}>
            {s('Insert link')}
          </UI.MenuItem>
        </>
      ) : null}

      {selections.length && !isRowHeader ? (
        <>
          <UI.MenuSeparator />
          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon legacyName="three-dots-vertical" />} disabled={readonly}>
              {s('More cell actions')}
            </UI.SubMenuButton>

            <UI.SubMenu unmountOnHide>
              <UI.MenuItem onClick={() => onSortRange?.(sheetId, selections, 'ASCENDING')} disabled={readonly}>
                {s('Sort range A → Z')}
              </UI.MenuItem>
              <UI.MenuItem onClick={() => onSortRange?.(sheetId, selections, 'DESCENDING')} disabled={readonly}>
                {s('Sort range Z → A')}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>
        </>
      ) : null}
    </Ariakit.MenuProvider>
  )
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

function strings() {
  return {
    Copy: c('sheets_2025:Spreadsheet context menu').t`Copy`,
    Paste: c('sheets_2025:Spreadsheet context menu').t`Paste`,
    Clear: c('sheets_2025:Spreadsheet context menu').t`Clear`,
    'Clear formatting': c('sheets_2025:Spreadsheet context menu').t`Clear formatting`,
    'Clear content': c('sheets_2025:Spreadsheet context menu').t`Clear content`,

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
    'Auto fit to data': c('sheets_2025:Spreadsheet context menu').t`Auto fit to data`,
    Custom: c('sheets_2025:Spreadsheet context menu').t`Custom`,

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
    'Formula only': c('sheets_2025:Spreadsheet context menu').t`Formula only`,
    'Link only': c('sheets_2025:Spreadsheet context menu').t`Link only`,
    Transposed: c('sheets_2025:Spreadsheet context menu').t`Transposed`,
    Comma: c('sheets_2025:Spreadsheet context menu').t`Comma`,
    Semicolon: c('sheets_2025:Spreadsheet context menu').t`Semicolon`,
    Period: c('sheets_2025:Spreadsheet context menu').t`Period`,
    Space: c('sheets_2025:Spreadsheet context menu').t`Space`,
    Pipe: c('sheets_2025:Spreadsheet context menu').t`Pipe`,
  }
}
