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

import { useSheetsMessages, useSheetsDependencies } from '../SheetsDependenciesProvider'

import { useCallback, useLayoutEffect, useMemo } from 'react'

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
  const messages = useSheetsMessages()

  const { columns: columnsString, rows: rowsString } = messages
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
  const { featureFlags } = useSheetsDependencies()

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
      <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.squares} />} onClick={copy}>
        {messages.contextMenu.Copy}
      </UI.MenuItem>

      <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.clipboard} />} onClick={() => onPaste?.()} disabled={readonly}>
        {messages.contextMenu.Paste}
      </UI.MenuItem>

      <Ariakit.MenuProvider>
        <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.clipboard} />} disabled={readonly}>
          {messages.contextMenu['Paste special']}
        </UI.SubMenuButton>
        <UI.SubMenu unmountOnHide>
          <UI.MenuItem onClick={() => onPaste?.('Value')} disabled={readonly}>
            {messages.contextMenu['Values only']}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Formatting')} disabled={readonly}>
            {messages.contextMenu['Formatting only']}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Formula')} disabled={readonly}>
            {messages.contextMenu['Formula only']}
          </UI.MenuItem>
          <UI.MenuItem onClick={() => onPaste?.('Link')} disabled={readonly}>
            {messages.contextMenu['Link only']}
          </UI.MenuItem>
          <UI.MenuSeparator />
          <UI.MenuItem onClick={() => onPaste?.('Transposed')} disabled={readonly}>
            {messages.contextMenu.Transposed}
          </UI.MenuItem>
        </UI.SubMenu>
      </Ariakit.MenuProvider>

      <Ariakit.MenuProvider>
        <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.crossBig} />} disabled={readonly}>
          {messages.contextMenu.Clear}
        </UI.SubMenuButton>
        <UI.SubMenu unmountOnHide>
          <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.eraser} />} onClick={clearFormat} disabled={readonly}>
            {messages.contextMenu['Clear formatting']}
          </UI.MenuItem>
          <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.crossBig} />} onClick={clearContent} disabled={readonly}>
            {messages.contextMenu['Clear content']}
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
            {messages.contextMenu.Insert} <b>{columnsString(selectedColumnHeadersIds.length)}</b>{' '}
            {messages.contextMenu.left}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} />}
            onClick={() => insertColumnsRight(selectedColumnCount)}
            disabled={readonly}
          >
            {messages.contextMenu.Insert} <b>{columnsString(selectedColumnHeadersIds.length)}</b>{' '}
            {messages.contextMenu.right}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.trash} />}
            onClick={() => onDeleteColumn?.(sheetId, selectedColumnHeadersIds)}
            disabled={readonly}
          >
            {messages.contextMenu['Delete column']} {multiColumnTitle}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.eyeSlash} />}
            onClick={() => onHideColumn?.(sheetId, selectedColumnHeadersIds)}
            disabled={readonly}
          >
            {messages.contextMenu['Hide column']} {multiColumnTitle}
          </UI.MenuItem>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.resize} />} disabled={readonly || !onRequestResize}>
              {messages.contextMenu['Resize column']} {multiColumnTitle}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.bolt} />}
                onClick={() => {
                  onAutoResize?.(sheetId, selectedColumnHeadersIds, 'y')
                }}
                disabled={readonly || !onRequestResize}
              >
                {messages.contextMenu['Auto fit to data']}
              </UI.MenuItem>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.resize} />}
                onClick={() => onRequestResize?.(sheetId, selectedColumnHeadersIds, 'y')}
                disabled={readonly || !onRequestResize}
              >
                {messages.contextMenu.Custom}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
            onClick={() => onFreezeColumn?.(sheetId, activeCell.columnIndex)}
            disabled={readonly}
          >
            {messages.contextMenu['Freeze up to column']} {number2Alpha(activeCell.columnIndex - 1)}
          </UI.MenuItem>

          {frozenColumns > 1 ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
              onClick={() => onFreezeColumn?.(sheetId, 0)}
              disabled={readonly}
            >
              {messages.contextMenu['Unfreeze columns']}
            </UI.MenuItem>
          ) : null}

          <UI.MenuSeparator />

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.sortAlphabetically} />}
            onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'ASCENDING')}
            disabled={readonly}
          >
            {messages.contextMenu['Sort sheet A to Z']}
          </UI.MenuItem>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.sortAlphabetically} />}
            onClick={() => onSortColumn?.(sheetId, activeCell.columnIndex, 'DESCENDING')}
            disabled={readonly}
          >
            {messages.contextMenu['Sort sheet Z to A']}
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
            {messages.contextMenu.Insert} <b>{rowsString(selectedRowHeadersIds.length)}</b> {messages.contextMenu.above}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'rotate(90deg)' }} />}
            onClick={() =>
              onInsertRow?.(sheetId, activeCell.rowIndex + selectedRowHeadersIds.length, selectedRowHeadersIds.length)
            }
            disabled={readonly}
          >
            {messages.contextMenu.Insert} <b>{rowsString(selectedRowHeadersIds.length)}</b> {messages.contextMenu.below}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.trash} />}
            onClick={() => onDeleteRow?.(sheetId, selectedRowHeadersIds)}
            disabled={readonly}
          >
            {messages.contextMenu['Delete row']} {multiRowTitle}
          </UI.MenuItem>
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.eyeSlash} />}
            onClick={() => onHideRow?.(sheetId, selectedRowHeadersIds)}
            disabled={readonly}
          >
            {messages.contextMenu['Hide row']} {multiRowTitle}
          </UI.MenuItem>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.resize} />} disabled={readonly || !onRequestResize}>
              {messages.contextMenu['Resize row']} {multiRowTitle}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.bolt} />}
                onClick={() => {
                  onAutoResize?.(sheetId, selectedRowHeadersIds, 'x')
                }}
                disabled={readonly || !onRequestResize}
              >
                {messages.contextMenu['Auto fit to data']}
              </UI.MenuItem>
              <UI.MenuItem
                leadingIconSlot={<UI.Icon data={Icons.resize} />}
                onClick={() => onRequestResize?.(sheetId, selectedRowHeadersIds, 'x')}
                disabled={readonly || !onRequestResize}
              >
                {messages.contextMenu.Custom}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
            onClick={() => onFreezeRow?.(sheetId, activeCell.rowIndex)}
            disabled={readonly}
          >
            {messages.contextMenu['Freeze up to row']} {activeCell.rowIndex}
          </UI.MenuItem>

          {frozenRows > 1 ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.freezeTable} />}
              onClick={() => onFreezeRow?.(sheetId, 0)}
              disabled={readonly}
            >
              {messages.contextMenu['Unfreeze rows']}
            </UI.MenuItem>
          ) : null}
        </>
      ) : null}

      {isHeader ? (
        <>
          <UI.MenuSeparator />
          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.broom} />}
            onClick={openConditionalFormat}
            disabled={readonly}
          >
            {messages.contextMenu['Conditional format']}
          </UI.MenuItem>

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
            onClick={openDataValidation}
            disabled={readonly}
          >
            {messages.contextMenu['Data validation']}
          </UI.MenuItem>

          {onRequestDefineNamedRange ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.tableRange} />}
              onClick={() => {
                onRequestDefineNamedRange(sheetId, activeCell, selections)
              }}
              disabled={readonly}
            >
              {messages.contextMenu['Define named range']}
            </UI.MenuItem>
          ) : null}
        </>
      ) : null}

      {!isHeader ? (
        <>
          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.plus} />} disabled={readonly}>
              {messages.contextMenu.Insert}
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
                      {messages.contextMenu['Insert table row']}
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
                    {messages.contextMenu['Insert table column to the left']}
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
                    {messages.contextMenu['Insert table column to the right']}
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
                    {messages.contextMenu.Insert} <b>{rowsString(selectedRowIndexes.length)}</b>{' '}
                    {messages.contextMenu.above}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.addColumn} style={{ transform: 'scaleX(-1)' }} />}
                    onClick={() => onInsertColumn?.(sheetId, activeCell.columnIndex, selectedColumnIndexes.length)}
                    disabled={readonly}
                  >
                    {messages.contextMenu.Insert} <b>{columnsString(selectedColumnIndexes.length)}</b>{' '}
                    {messages.contextMenu.left}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.plus} />}
                    onClick={() => onInsertCellsShiftRight?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {messages.contextMenu['Insert cells and shift cells right']}
                  </UI.MenuItem>

                  <UI.MenuItem
                    leadingIconSlot={<UI.Icon data={Icons.plus} />}
                    onClick={() => onInsertCellsShiftDown?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {messages.contextMenu['Insert cells and shift cells down']}
                  </UI.MenuItem>
                </>
              )}
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.trash} />} disabled={readonly}>
              {messages.contextMenu.Delete}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              {activeTable ? (
                <>
                  {isActiveCellTableHeader ? null : (
                    <UI.MenuItem
                      onClick={() => onDeleteTableRow?.(activeTable, selectedRowIndexes)}
                      disabled={readonly}
                    >
                      {messages.contextMenu['Delete table row']}
                    </UI.MenuItem>
                  )}
                  <UI.MenuItem
                    onClick={() =>
                      onDeleteTableColumn?.(activeTable, activeCell.columnIndex - activeTable.range.startColumnIndex)
                    }
                    disabled={readonly}
                  >
                    {messages.contextMenu['Delete table column']}
                  </UI.MenuItem>
                </>
              ) : (
                <>
                  <UI.MenuItem onClick={() => onDeleteRow?.(sheetId, selectedRowIndexes)} disabled={readonly}>
                    {messages.contextMenu['Delete row']} {generateMultiDimTitle(selectedRowIndexes, 'x')}
                  </UI.MenuItem>

                  <UI.MenuItem onClick={() => onDeleteColumn?.(sheetId, selectedColumnIndexes)} disabled={readonly}>
                    {messages.contextMenu['Delete column']} {generateMultiDimTitle(selectedColumnIndexes, 'y')}
                  </UI.MenuItem>

                  <UI.MenuItem
                    onClick={() => onDeleteCellsShiftLeft?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {messages.contextMenu['Delete cells and shift cells left']}
                  </UI.MenuItem>

                  <UI.MenuItem
                    onClick={() => onDeleteCellsShiftUp?.(sheetId, activeCell, selections)}
                    disabled={readonly}
                  >
                    {messages.contextMenu['Delete cells and shift cells up']}
                  </UI.MenuItem>
                </>
              )}
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <UI.MenuSeparator />

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.filter} />} disabled={readonly}>
              {messages.contextMenu.Filter}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem
                onClick={() => {
                  onFilterTableOrFilterView(sheetId, activeCell.rowIndex, activeCell.columnIndex)
                }}
                disabled={readonly}
              >
                {messages.contextMenu['Cell value']} "
                {getFormattedValue(sheetId, activeCell.rowIndex, activeCell.columnIndex) ??
                  messages.contextMenu['(Blanks)']}
                "
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.sortAlphabetically} />} disabled={readonly}>
              {messages.contextMenu.Sort}
            </UI.SubMenuButton>
            <UI.SubMenu unmountOnHide>
              <UI.MenuItem onClick={() => onSortTableOrFilterView('ASCENDING')} disabled={readonly}>
                {messages.contextMenu['Sort range A → Z']}
              </UI.MenuItem>

              <UI.MenuItem onClick={() => onSortTableOrFilterView('DESCENDING')} disabled={readonly}>
                {messages.contextMenu['Sort range Z → A']}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>

          {activeTable ? (
            <Ariakit.MenuProvider>
              <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.table} />} disabled={readonly}>
                {messages.contextMenu.Table}
              </UI.SubMenuButton>
              <UI.SubMenu unmountOnHide>
                <UI.MenuItem onClick={() => onRemoveTable?.(activeTable)} disabled={readonly}>
                  {messages.contextMenu['Convert to range']}
                </UI.MenuItem>

                <UI.MenuItem onClick={() => onRequestEditTable?.(activeTable)} disabled={readonly}>
                  {messages.contextMenu['Edit table']}
                </UI.MenuItem>
              </UI.SubMenu>
            </Ariakit.MenuProvider>
          ) : null}

          <UI.MenuSeparator />

          {featureFlags.SheetsTablesEnabled && !activeTable ? (
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
              {messages.contextMenu['Convert to table']}
            </UI.MenuItem>
          ) : null}

          {/* {activeTable ? null : (
            <UI.MenuItem
                leadingIconSlot={<UI.Icon data={filter} />}
                onClick={() => {
                  onCreateBasicFilter?.(sheetId, activeCell, selections)
                }}
                disabled={readonly}
              >
                {activeBasicFilter ? s('Remove filter') : s('Create a filter')}
            </UI.MenuItem>
          )} */}

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.broom} />}
            onClick={openConditionalFormat}
            disabled={readonly}
          >
            {messages.contextMenu['Conditional format']}
          </UI.MenuItem>

          {onRequestDataValidation ? (
            <UI.MenuItem
              leadingIconSlot={<UI.Icon data={Icons.tableCheck} />}
              onClick={openDataValidation}
              disabled={readonly}
            >
              {messages.contextMenu['Data validation']}
            </UI.MenuItem>
          ) : null}

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.tableRange} />}
            onClick={() => {
              onRequestDefineNamedRange?.(sheetId, activeCell, selections)
            }}
            disabled={readonly}
          >
            {messages.contextMenu['Define named range']}
          </UI.MenuItem>

          <UI.MenuSeparator />

          <UI.MenuItem
            leadingIconSlot={<UI.Icon data={Icons.note} />}
            onClick={() => {
              onInsertNote?.(sheetId, activeCell)
            }}
            disabled={readonly}
          >
            {messages.contextMenu['Insert note']}
          </UI.MenuItem>

          <UI.MenuItem leadingIconSlot={<UI.Icon data={Icons.link} />} onClick={insertLink} disabled={readonly}>
            {messages.contextMenu['Insert link']}
          </UI.MenuItem>
        </>
      ) : null}

      {selections.length && !isRowHeader ? (
        <>
          <UI.MenuSeparator />
          <Ariakit.MenuProvider>
            <UI.SubMenuButton leadingIconSlot={<UI.Icon data={Icons.threeDotsVertical} />} disabled={readonly}>
              {messages.contextMenu['More cell actions']}
            </UI.SubMenuButton>

            <UI.SubMenu unmountOnHide>
              <UI.MenuItem onClick={() => onSortRange?.(sheetId, selections, 'ASCENDING')} disabled={readonly}>
                {messages.contextMenu['Sort range A → Z']}
              </UI.MenuItem>
              <UI.MenuItem onClick={() => onSortRange?.(sheetId, selections, 'DESCENDING')} disabled={readonly}>
                {messages.contextMenu['Sort range Z → A']}
              </UI.MenuItem>
            </UI.SubMenu>
          </Ariakit.MenuProvider>
        </>
      ) : null}
    </Ariakit.MenuProvider>
  )
}

export const contextMenuMessages = {
  contextMenu: {
    '(Blanks)': '(Blanks)',
    Copy: `Copy`,
    Paste: `Paste`,
    Clear: `Clear`,
    'Clear formatting': `Clear formatting`,
    'Clear content': `Clear content`,
    'Insert table row': `Insert table row`,
    'Insert table column to the left': `Insert table column to the left`,
    'Insert table column to the right': `Insert table column to the right`,
    'Insert link': `Insert link`,
    'Insert cells and shift cells right': `Insert cells and shift cells right`,
    'Insert cells and shift cells down': `Insert cells and shift cells down`,
    Delete: `Delete`,
    'Delete column': `Delete column`,
    'Delete row': `Delete row`,
    'Delete table row': `Delete table row`,
    'Delete table column': `Delete table column`,
    'Delete cells and shift cells left': `Delete cells and shift cells left`,
    'Delete cells and shift cells up': `Delete cells and shift cells up`,
    'Hide column': `Hide column`,
    'Hide row': `Hide row`,
    'Resize column': `Resize column`,
    'Resize row': `Resize row`,
    'Auto fit to data': `Auto fit to data`,
    Custom: `Custom`,
    'Freeze up to column': `Freeze up to column`,
    'Unfreeze columns': `Unfreeze columns`,
    'Freeze up to row': `Freeze up to row`,
    'Unfreeze rows': `Unfreeze rows`,
    'Sort sheet A to Z': `Sort sheet A to Z`,
    'Sort sheet Z to A': `Sort sheet Z to A`,
    Sort: `Sort`,
    'Sort range A → Z': `Sort range A → Z`,
    'Sort range Z → A': `Sort range Z → A`,
    Filter: `Filter`,
    'Cell value': `Cell value`,
    Insert: `Insert`,
    above: `above`,
    below: `below`,
    left: `left`,
    right: `right`,
    Table: `Table`,
    'Convert to range': `Convert to range`,
    'Edit table': `Edit table`,
    'Convert to table': `Convert to table`,
    'Create a filter': `Create a filter`,
    'Remove filter': `Remove filter`,
    'Conditional format': `Conditional format`,
    'Data validation': `Data validation`,
    'Insert note': `Insert note`,
    'Define named range': `Define named range`,
    'More cell actions': `More cell actions`,
    'AI Quick Edit': `AI Quick Edit`,
    'Paste special': `Paste special`,
    'Values only': `Values only`,
    'Formatting only': `Formatting only`,
    'Formula only': `Formula only`,
    'Link only': `Link only`,
    Transposed: `Transposed`,
    Comma: `Comma`,
    Semicolon: `Semicolon`,
    Period: `Period`,
    Space: `Space`,
    Pipe: `Pipe`,
  },
}
