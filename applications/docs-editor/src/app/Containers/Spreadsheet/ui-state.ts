import type { CellFormat, TextFormat } from '@rowsncolumns/spreadsheet'
import type { ProtonSheetsState } from './state'
import { pattern_currency_decimal, pattern_percent_decimal } from '@rowsncolumns/spreadsheet-state'

export function useProtonSheetsUIState(state: ProtonSheetsState) {
  // history
  const history = {
    undo: state.onUndo,
    undoDisabled: !state.canUndo,
    redo: state.onRedo,
    redoDisabled: !state.canRedo,
  }

  // search
  const search = { open: state.searchState.onRequestSearch }

  // format
  type BooleanFormatKey = {
    [K in NonNullable<keyof TextFormat>]: boolean extends TextFormat[K] ? K : never
  }[keyof TextFormat]
  function setFormat<K extends keyof CellFormat>(key: K, value: CellFormat[K]) {
    state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, key, value)
  }
  function isTextFormat(format: BooleanFormatKey) {
    return Boolean(state.currentCellFormat?.textFormat?.[format])
  }
  function setTextFormat<K extends keyof TextFormat>(key: K, value: TextFormat[K]) {
    setFormat('textFormat', { [key]: value })
  }
  function toggleFormat(key: BooleanFormatKey) {
    setTextFormat(key, !isTextFormat(key) ? true : undefined)
  }
  const format = {
    clear: () => state.onClearFormatting(state.activeSheetId, state.activeCell, state.selections),
    toggleBold: () => toggleFormat('bold'),
    isBold: isTextFormat('bold'),
    toggleItalic: () => toggleFormat('italic'),
    isItalic: isTextFormat('italic'),
    toggleUnderline: () => toggleFormat('underline'),
    isUnderline: isTextFormat('underline'),
    toggleStrikethrough: () => toggleFormat('strikethrough'),
    isStrikethrough: isTextFormat('strikethrough'),
    /**
     * The "default" value is represented by `undefined`.
     */
    font: state.currentCellFormat?.textFormat?.fontFamily ?? undefined,
    /**
     * Pass `undefined` to set the font to the default value.
     */
    setFont: (value: string | undefined) => setTextFormat('fontFamily', value),
    asCurrency: () => setFormat('numberFormat', { type: 'CURRENCY', pattern: pattern_currency_decimal }),
    asPercent: () => setFormat('numberFormat', { type: 'PERCENT', pattern: pattern_percent_decimal }),
    decreaseDecimalPlaces: () =>
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'decrement'),
    increaseDecimalPlaces: () =>
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'increment'),
  }

  // insert
  const insert = {
    cellsShiftRight: () => state.onInsertCellsShiftRight(state.activeSheetId, state.activeCell, state.selections),
    cellsShiftDown: () => state.onInsertCellsShiftDown(state.activeSheetId, state.activeCell, state.selections),
    rowAbove: () => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex, 1),
    rowBelow: () => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex + 1, 1),
    columnLeft: () => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex, 1),
    columnRight: () => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex + 1, 1),
    sheet: state.onCreateNewSheet,
    chart: () => state.chartsState.onCreateChart(state.activeSheetId, state.activeCell, state.selections),
    note: () => state.onInsertNote?.(state.activeSheetId, state.activeCell, state.selections),
  }

  return { history, search, format, insert }
}

export type ProtonSheetsUIState = ReturnType<typeof useProtonSheetsUIState>
