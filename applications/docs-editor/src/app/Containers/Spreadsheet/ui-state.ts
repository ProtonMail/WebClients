import type { CellFormat, TextFormat } from '@rowsncolumns/spreadsheet'
import { getCurrencySymbol, useFocusSheet } from '@rowsncolumns/spreadsheet'
import { ssfFormat } from '@rowsncolumns/utils'
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
  const focusGrid = useFocusSheet() ?? focusGridWarningFallback
  function withFocusGrid(fn: () => void) {
    return () => {
      fn()
      focusGrid()
    }
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
    },
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
    note: useEvent(() => state.onInsertNote?.(state.activeSheetId, state.activeCell, state.selections)),
  }

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
    onRequestDefineNamedRange: state.onRequestDefineNamedRange,
    sheets: state.sheets,
    onSelectRange: state.onSelectRange,
    onSelectNamedRange: state.onSelectNamedRange,
    onRequestUpdateNamedRange: state.onRequestUpdateNamedRange,
    onDeleteNamedRange: state.onDeleteNamedRange,
    tables: state.tables,
    onSelectTable: state.onSelectTable,
  }

  return { focusGrid, withFocusGrid, history, zoom, search, format, insert, legacy }
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
    useTextFormatEntry,
    useNumberPatternEntry,
    isGeneralPattern,
    isPlainTextPattern,
    getCurrentPattern,
  }
}
