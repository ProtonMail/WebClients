import type {
  BorderLocation,
  BorderStyle,
  CellFormat,
  Color,
  DataValidationRuleRecord,
  HorizontalAlign,
  TextFormat,
  VerticalAlign,
  WrapStrategy,
} from '@rowsncolumns/spreadsheet'
import {
  getCurrencySymbol,
  getProtectedRange,
  isProtectedRange as isProtectedRangeFn,
  getUserSelections,
  useFocusSheet,
} from '@rowsncolumns/spreadsheet'
import { number2Alpha, ssfFormat, uuid } from '@rowsncolumns/utils'
import {
  CURRENCY,
  DATE_PATTERN_EXAMPLE_VALUE,
  LOCALE,
  NUMBER_PATTERN_EXAMPLE_VALUE,
  PATTERN_SPECS,
  PERCENT_PATTERN_EXAMPLE_VALUE,
} from './constants'
import type { ProtonSheetsState } from './state'
import { useEvent } from './components/utils'
import { useMemo, useState } from 'react'
import { isCellWithinBounds, selectionFromActiveCell } from '@rowsncolumns/grid'

type PatternSpec = {
  type: NonNullable<CellFormat['numberFormat']>['type']
  pattern: string
}

function focusGridWarningFallback() {
  console.warn('Attempted to use focusGrid, but no focusSheet function is available.')
}

/**
 * A simplified state object derived from the main state objects, for use in UI components.
 * Contains values, setters, and some helper functions.
 *
 * Setters must be stable (e.g. created via `useEvent`).
 */
export function useProtonSheetsUIState(state: ProtonSheetsState) {
  const currencySymbol = getCurrencySymbol(LOCALE, CURRENCY)
  if (!currencySymbol) {
    // TODO: handle this more gracefully, default to "$"?
    throw new Error('Currency symbol not found.')
  }

  // focus grid utilities
  // note: useFocusSheet seems to be stable, which in turn makes withFocusGrid safe to use
  // non-statefully without the need for useEvent (and, in fact, useEvent would break it as
  // this function is called during render in some places)
  // TODO: consider making withFocusGrid a global thing for DX (no need for useUI.$. everywhere)
  // TODO: this might actually be broken, probably need to find a better way to do this that ensures the latest focusGrid is used (or any alternative method that guarantees grid focus after the event)
  const focusGrid = useFocusSheet() ?? focusGridWarningFallback
  function withFocusGrid(fn: () => void) {
    return () => {
      fn()
      focusGrid()
    }
  }

  // info
  const info = {
    activeColumnIndex: state.activeCell.columnIndex,
    activeColumnName: number2Alpha(state.activeCell.columnIndex - 1),
    activeRowIndex: state.activeCell.rowIndex,
  }

  // operation
  // TODO: add cut, copy and paste (including paste special) operations
  const operation = {
    delete: useEvent(() => state.onDelete(state.activeSheetId, state.activeCell, state.selections)),
  }

  // view
  const [showFormulaBar, setShowFormulaBar] = useState(true)
  const [showGridlines, setShowGridlines] = useState(true)
  const view = {
    formulaBar: {
      enabled: showFormulaBar,
      toggle: useEvent(() => setShowFormulaBar((value) => !value)),
    },
    gridLines: {
      enabled: showGridlines,
      toggle: useEvent(() => setShowGridlines((value) => !value)),
    },
    freezeRows: useEvent((beforeRowIndex: number) => state.onFreezeRow(state.activeSheetId, beforeRowIndex)),
    unfreezeRows: useEvent(() => state.onFreezeRow(state.activeSheetId, 0)),
    freezeColumns: useEvent((beforeColumnIndex: number) =>
      state.onFreezeColumn(state.activeSheetId, beforeColumnIndex),
    ),
    unfreezeColumns: useEvent(() => state.onFreezeColumn(state.activeSheetId, 0)),
  }

  // history
  const history = {
    undo: useEvent(state.onUndo),
    undoDisabled: !state.canUndo,
    redo: useEvent(state.onRedo),
    redoDisabled: !state.canRedo,
  }

  // zoom
  const zoom = {
    value: state.scale,
    set: useEvent((scale: number) => state.onChangeScale(scale)),
  }

  // search
  const search = { open: useEvent(state.searchState.onRequestSearch) }

  // format
  const patternSpecs = PATTERN_SPECS({ locale: LOCALE, currency: CURRENCY })
  const formatUtils = useFormatUtils(state, patternSpecs)
  const format = {
    clear: useEvent(() => state.onClearFormatting(state.activeSheetId, state.activeCell, state.selections)),
    text: {
      bold: formatUtils.useTextFormatEntry('bold'),
      italic: formatUtils.useTextFormatEntry('italic'),
      underline: formatUtils.useTextFormatEntry('underline'),
      strikethrough: formatUtils.useTextFormatEntry('strikethrough'),
      /**
       * The "default" value is represented by `undefined`.
       */
      fontFamily: {
        /**
         * The "default" value is represented by `undefined`.
         */
        value: state.currentCellFormat?.textFormat?.fontFamily ?? undefined,
        /**
         * Pass `undefined` to set the font family to the default value.
         */
        set: useEvent((value: string | undefined) => formatUtils.setTextFormat('fontFamily', value)),
      },
      /**
       * The default value is represented by `undefined`.
       */
      fontSize: {
        /**
         * The default value is represented by `undefined`.
         */
        value: state.currentCellFormat?.textFormat?.fontSize ?? undefined,
        /**
         * Pass `undefined` to set the font size to the default value.
         */
        set: useEvent((value: number | undefined) => formatUtils.setTextFormat('fontSize', value)),
      },
      color: {
        /**
         * The default value is represented by `undefined`.
         */
        value: state.currentCellFormat?.textFormat?.color ?? undefined,
        /**
         * Pass `undefined` to set the text color to the default value.
         */
        set: useEvent((value: string | undefined) => formatUtils.setTextFormat('color', value)),
      },
    },
    backgroundColor: {
      /**
       * The default value is represented by `undefined`.
       */
      value: state.currentCellFormat?.backgroundColor ?? undefined,
      /**
       * Pass `undefined` to set the background color to the default value.
       */
      set: useEvent((value: string | undefined) => formatUtils.setBackgroundColor(value)),
    },
    borders: {
      /**
       * The default value is represented by `undefined`.
       */
      value: state.currentCellFormat?.borders ?? undefined,
      set: useEvent((location: BorderLocation, color: Color | undefined, style: BorderStyle | undefined) =>
        state.onChangeBorder(state.activeSheetId, state.activeCell, state.selections, location, color, style),
      ),
    },
    alignment: {
      horizontal: {
        /**
         * The default value is represented by `undefined`.
         */
        value: state.currentCellFormat?.horizontalAlignment ?? undefined,
        /**
         * Pass `undefined` to set the horizontal alignment to the default value.
         */
        set: useEvent((value: HorizontalAlign | undefined) => formatUtils.setHorizontalAlignment(value)),
      },
      vertical: {
        /**
         * The default value is represented by `undefined`.
         */
        value: state.currentCellFormat?.verticalAlignment ?? undefined,
        /**
         * Pass `undefined` to set the vertical alignment to the default value.
         */
        set: useEvent((value: VerticalAlign | undefined) => formatUtils.setVerticalAlignment(value)),
      },
    },
    wrapping: {
      /**
       * The default value is represented by `undefined`.
       */
      value: state.currentCellFormat?.wrapStrategy ?? undefined,
      /**
       * Pass `undefined` to set the wrapping to the default value.
       */
      set: useEvent((value: WrapStrategy | undefined) => formatUtils.setWrapping(value)),
    },
    conditional: { open: useEvent(() => state.onRequestConditionalFormat()) },
    pattern: {
      current: formatUtils.getCurrentPattern(),
      general: formatUtils.useNumberPatternEntry(patternSpecs.GENERAL),
      plainText: formatUtils.useNumberPatternEntry(patternSpecs.PLAIN_TEXT),
      number: formatUtils.useNumberPatternEntry(patternSpecs.NUMBER, NUMBER_PATTERN_EXAMPLE_VALUE),
      percent: formatUtils.useNumberPatternEntry(patternSpecs.PERCENT, PERCENT_PATTERN_EXAMPLE_VALUE),
      scientific: formatUtils.useNumberPatternEntry(patternSpecs.SCIENTIFIC, NUMBER_PATTERN_EXAMPLE_VALUE),
      accounting: formatUtils.useNumberPatternEntry(patternSpecs.ACCOUNTING, -NUMBER_PATTERN_EXAMPLE_VALUE),
      financial: formatUtils.useNumberPatternEntry(patternSpecs.FINANCIAL, -NUMBER_PATTERN_EXAMPLE_VALUE),
      currency: {
        default: formatUtils.useNumberPatternEntry(patternSpecs.CURRENCY, NUMBER_PATTERN_EXAMPLE_VALUE),
        defaultRounded: formatUtils.useNumberPatternEntry(patternSpecs.CURRENCY_ROUNDED, NUMBER_PATTERN_EXAMPLE_VALUE),
        usd: formatUtils.useNumberPatternEntry(patternSpecs.USD),
        eur: formatUtils.useNumberPatternEntry(patternSpecs.EUR),
        gbp: formatUtils.useNumberPatternEntry(patternSpecs.GBP),
        jpy: formatUtils.useNumberPatternEntry(patternSpecs.JPY),
        cny: formatUtils.useNumberPatternEntry(patternSpecs.CNY),
        inr: formatUtils.useNumberPatternEntry(patternSpecs.INR),
      },
      date: formatUtils.useNumberPatternEntry(patternSpecs.DATE, DATE_PATTERN_EXAMPLE_VALUE),
      longDate: formatUtils.useNumberPatternEntry(patternSpecs.LONG_DATE, DATE_PATTERN_EXAMPLE_VALUE),
      time: formatUtils.useNumberPatternEntry(patternSpecs.TIME, DATE_PATTERN_EXAMPLE_VALUE),
      dateTime: formatUtils.useNumberPatternEntry(patternSpecs.DATE_TIME, DATE_PATTERN_EXAMPLE_VALUE),
      duration: formatUtils.useNumberPatternEntry(patternSpecs.DURATION, DATE_PATTERN_EXAMPLE_VALUE),
    },
    decreaseDecimalPlaces: useEvent(() =>
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'decrement'),
    ),
    increaseDecimalPlaces: useEvent(() =>
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'increment'),
    ),
  }

  // insert
  const insert = {
    cellsShiftRight: useEvent(() =>
      state.onInsertCellsShiftRight(state.activeSheetId, state.activeCell, state.selections),
    ),
    cellsShiftDown: useEvent(() =>
      state.onInsertCellsShiftDown(state.activeSheetId, state.activeCell, state.selections),
    ),
    rowAbove: useEvent(() => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex, 1)),
    rowBelow: useEvent(() => state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex + 1, 1)),
    columnLeft: useEvent(() => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex, 1)),
    columnRight: useEvent(() => state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex + 1, 1)),
    sheet: useEvent(() => state.onCreateNewSheet()),
    chart: useEvent(() => state.chartsState.onCreateChart(state.activeSheetId, state.activeCell, state.selections)),
    link: useEvent(() => state.onRequestInsertLink(state.activeSheetId, state.activeCell, state.selections)),
    // TODO: probably want to customize (or, at least, localize) the default options
    dropdown: useEvent(() => {
      const finalSelections = getUserSelections(state.activeCell, state.selections)
      const dropdownValidationRule: DataValidationRuleRecord = {
        id: uuid(),
        ranges: finalSelections.map((sel) => ({ ...sel.range, sheetId: state.activeSheetId })),
        condition: { type: 'ONE_OF_LIST', values: [{ userEnteredValue: 'Option 1, Option 2' }] },
      }
      state.onRequestDataValidation(state.activeSheetId, state.activeCell, state.selections, dropdownValidationRule)
    }),
    checkbox: useEvent(() => {
      const finalSelections = getUserSelections(state.activeCell, state.selections)
      const dropdownValidationRule: DataValidationRuleRecord = {
        id: uuid(),
        ranges: finalSelections.map((sel) => ({ ...sel.range, sheetId: state.activeSheetId })),
        condition: { type: 'BOOLEAN' },
      }
      state.onRequestDataValidation(
        state.activeSheetId,
        state.activeCell,
        state.selections,
        dropdownValidationRule,
        false,
      )
    }),
    note: useEvent(() => state.onInsertNote(state.activeSheetId, state.activeCell, state.selections)),
  }

  // data

  const activeBasicFilter = useMemo(
    () =>
      state.basicFilter && isCellWithinBounds(state.activeCell, state.basicFilter.range)
        ? state.basicFilter
        : undefined,
    [state.activeCell, state.basicFilter],
  )
  const selection = useMemo(
    () => (state.selections.length ? state.selections[0] : selectionFromActiveCell(state.activeCell)[0]),
    [state.activeCell, state.selections],
  )
  const isProtectedRange = useMemo(
    () => isProtectedRangeFn(state.activeSheetId, selection.range, state.protectedRanges),
    [selection.range, state.activeSheetId, state.protectedRanges],
  )
  const data = {
    sortAscending: useEvent(() => state.onSortColumn(state.activeSheetId, state.activeCell.columnIndex, 'ASCENDING')),
    sortDescending: useEvent(() => state.onSortColumn(state.activeSheetId, state.activeCell.columnIndex, 'DESCENDING')),
    toggleFilter: useEvent(() => state.onCreateBasicFilter?.(state.activeSheetId, state.activeCell, state.selections)),
    hasFilter: Boolean(activeBasicFilter),
    toggleProtectRange: useEvent(() => {
      const protectedRange = getProtectedRange(state.activeSheetId, selection.range, state.protectedRanges)
      if (protectedRange?.protectedRangeId) {
        state.onUnProtectRange?.(state.activeSheetId, protectedRange.protectedRangeId)
      } else {
        state.onProtectRange?.(state.activeSheetId, state.activeCell, state.selections)
      }
    }),
    isProtectedRange,
    validation: {
      open: useEvent(() => state.onRequestDataValidation(state.activeSheetId, state.activeCell, state.selections)),
    },
  }

  // legacy (temporary, to be removed eventually)
  const legacy = {
    activeSheetId: state.activeSheetId,
    onChangeActiveSheet: state.onChangeActiveSheet,
    activeCell: state.activeCell,
    onChangeActiveCell: state.onChangeActiveCell,
    selections: state.selections,
    onChangeSelections: state.onChangeSelections,
    namedRanges: state.namedRanges,
    rowCount: state.rowCount,
    columnCount: state.columnCount,
    merges: state.merges,
    onMergeCells: state.onMergeCells,
    onUnMergeCells: state.onUnMergeCells,
    onRequestDefineNamedRange: state.onRequestDefineNamedRange,
    sheets: state.sheets,
    onSelectRange: state.onSelectRange,
    onSelectNamedRange: state.onSelectNamedRange,
    onRequestUpdateNamedRange: state.onRequestUpdateNamedRange,
    onDeleteNamedRange: state.onDeleteNamedRange,
    tables: state.tables,
    onSelectTable: state.onSelectTable,
    theme: state.theme,
  }

  return { focusGrid, withFocusGrid, info, operation, view, history, zoom, search, format, insert, data, legacy }
}

export type ProtonSheetsUIState = ReturnType<typeof useProtonSheetsUIState>

function useFormatUtils(state: ProtonSheetsState, patternSpecs: Record<string, PatternSpec>) {
  function setFormat<K extends keyof CellFormat>(key: K, value: CellFormat[K]) {
    state.onChangeFormatting(state.activeSheetId, state.activeCell, state.selections, key, value)
  }

  // text format
  type BooleanTextFormatKey = {
    [K in NonNullable<keyof TextFormat>]: boolean extends TextFormat[K] ? K : never
  }[keyof TextFormat]
  function setTextFormat<K extends keyof TextFormat>(key: K, value: TextFormat[K]) {
    setFormat('textFormat', { [key]: value })
  }
  function isTextFormat(format: BooleanTextFormatKey) {
    return Boolean(state.currentCellFormat?.textFormat?.[format])
  }
  function toggleTextFormat(format: BooleanTextFormatKey) {
    setTextFormat(format, !isTextFormat(format) ? true : undefined)
  }
  function useTextFormatEntry(format: BooleanTextFormatKey) {
    return { active: isTextFormat(format), toggle: useEvent(() => toggleTextFormat(format)) }
  }

  function setBackgroundColor(value: string | undefined) {
    setFormat('backgroundColor', value)
  }

  // alignment format
  function setHorizontalAlignment(value: CellFormat['horizontalAlignment']) {
    setFormat('horizontalAlignment', value)
  }
  function setVerticalAlignment(value: CellFormat['verticalAlignment']) {
    setFormat('verticalAlignment', value)
  }

  // wrapping format
  function setWrapping(value: CellFormat['wrapStrategy']) {
    setFormat('wrapStrategy', value)
  }

  // number format
  function setNumberFormat(value: CellFormat['numberFormat']) {
    setFormat('numberFormat', value)
  }

  // number patterns
  function setNumberPattern(spec: PatternSpec) {
    setNumberFormat(spec)
  }
  function isNumberPattern(spec: PatternSpec) {
    return (
      state.currentCellFormat?.numberFormat?.type === spec.type &&
      state.currentCellFormat.numberFormat.pattern === spec.pattern
    )
  }
  function createNumberPatternExample(pattern: string, value: number | Date) {
    return ssfFormat(pattern, value)
  }
  function useNumberPatternEntry(spec: PatternSpec, exampleValue?: number | Date) {
    return {
      set: useEvent(() => setNumberPattern(spec)),
      example: exampleValue ? createNumberPatternExample(spec.pattern, exampleValue) : '',
    }
  }
  function isGeneralPattern() {
    // "General" is the "fallthrough"/default pattern.
    return !state.currentCellFormat?.numberFormat?.type || state.currentCellFormat.numberFormat.type === 'NUMBER'
  }
  function isPlainTextPattern() {
    // "Plain text" just means any number format of type "TEXT".
    return state.currentCellFormat?.numberFormat?.type === 'TEXT'
  }
  function getCurrentPattern() {
    for (const [name, spec] of Object.entries(patternSpecs)) {
      if (isNumberPattern(spec)) {
        return name
      }
    }
    if (isPlainTextPattern()) {
      return 'PLAIN_TEXT'
    }
    if (isGeneralPattern()) {
      return 'GENERAL'
    }
  }

  return {
    setTextFormat,
    setBackgroundColor,
    setHorizontalAlignment,
    setVerticalAlignment,
    setWrapping,
    useTextFormatEntry,
    useNumberPatternEntry,
    isGeneralPattern,
    isPlainTextPattern,
    getCurrentPattern,
  }
}
