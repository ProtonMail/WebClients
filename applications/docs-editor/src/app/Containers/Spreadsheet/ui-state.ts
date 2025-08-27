import { type CellFormat, type TextFormat, getCurrencySymbol, useFocusSheet } from '@rowsncolumns/spreadsheet'
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

type PatternSpec = {
  type: NonNullable<CellFormat['numberFormat']>['type']
  pattern: string
}

function focusGridWarningFallback() {
  console.warn('Attempted to use focusGrid, but no focusSheet function is available.')
}

export function useProtonSheetsUIState(state: ProtonSheetsState) {
  const currencySymbol = getCurrencySymbol(LOCALE, CURRENCY)
  if (!currencySymbol) {
    // TODO: handle this more gracefully, default to "$"?
    throw new Error('Currency symbol not found.')
  }

  // focus grid utilities
  const focusGrid = useFocusSheet() ?? focusGridWarningFallback
  function withFocusGrid(fn: () => void) {
    return () => {
      fn()
      focusGrid()
    }
  }

  // history
  const history = {
    undo: state.onUndo,
    undoDisabled: !state.canUndo,
    redo: state.onRedo,
    redoDisabled: !state.canRedo,
  }

  // zoom
  const zoom = {
    value: state.scale,
    set: (scale: number) => state.onChangeScale(scale),
  }

  // search
  const search = { open: state.searchState.onRequestSearch }

  // format
  const patternSpecs = PATTERN_SPECS({ locale: LOCALE, currency: CURRENCY })
  const formatUtils = createFormatUtils(state, patternSpecs)
  const format = {
    clear: () => state.onClearFormatting(state.activeSheetId, state.activeCell, state.selections),
    text: {
      bold: formatUtils.createTextFormatEntry('bold'),
      italic: formatUtils.createTextFormatEntry('italic'),
      underline: formatUtils.createTextFormatEntry('underline'),
      strikethrough: formatUtils.createTextFormatEntry('strikethrough'),
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
        set: (value: string | undefined) => formatUtils.setTextFormat('fontFamily', value),
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
        set: (value: number | undefined) => formatUtils.setTextFormat('fontSize', value),
      },
    },
    pattern: {
      current: formatUtils.getCurrentPattern(),
      general: formatUtils.createNumberPatternEntry(patternSpecs.GENERAL),
      plainText: formatUtils.createNumberPatternEntry(patternSpecs.PLAIN_TEXT),
      number: formatUtils.createNumberPatternEntry(patternSpecs.NUMBER, NUMBER_PATTERN_EXAMPLE_VALUE),
      percent: formatUtils.createNumberPatternEntry(patternSpecs.PERCENT, PERCENT_PATTERN_EXAMPLE_VALUE),
      scientific: formatUtils.createNumberPatternEntry(patternSpecs.SCIENTIFIC, NUMBER_PATTERN_EXAMPLE_VALUE),
      accounting: formatUtils.createNumberPatternEntry(patternSpecs.ACCOUNTING, -NUMBER_PATTERN_EXAMPLE_VALUE),
      financial: formatUtils.createNumberPatternEntry(patternSpecs.FINANCIAL, -NUMBER_PATTERN_EXAMPLE_VALUE),
      currency: {
        default: formatUtils.createNumberPatternEntry(patternSpecs.CURRENCY, NUMBER_PATTERN_EXAMPLE_VALUE),
        defaultRounded: formatUtils.createNumberPatternEntry(
          patternSpecs.CURRENCY_ROUNDED,
          NUMBER_PATTERN_EXAMPLE_VALUE,
        ),
        usd: formatUtils.createNumberPatternEntry(patternSpecs.USD),
        eur: formatUtils.createNumberPatternEntry(patternSpecs.EUR),
        gbp: formatUtils.createNumberPatternEntry(patternSpecs.GBP),
        jpy: formatUtils.createNumberPatternEntry(patternSpecs.JPY),
        cny: formatUtils.createNumberPatternEntry(patternSpecs.CNY),
        inr: formatUtils.createNumberPatternEntry(patternSpecs.INR),
      },
      date: formatUtils.createNumberPatternEntry(patternSpecs.DATE, DATE_PATTERN_EXAMPLE_VALUE),
      longDate: formatUtils.createNumberPatternEntry(patternSpecs.LONG_DATE, DATE_PATTERN_EXAMPLE_VALUE),
      time: formatUtils.createNumberPatternEntry(patternSpecs.TIME, DATE_PATTERN_EXAMPLE_VALUE),
      dateTime: formatUtils.createNumberPatternEntry(patternSpecs.DATE_TIME, DATE_PATTERN_EXAMPLE_VALUE),
      duration: formatUtils.createNumberPatternEntry(patternSpecs.DURATION, DATE_PATTERN_EXAMPLE_VALUE),
    },
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

  return { focusGrid, withFocusGrid, history, zoom, search, format, insert }
}

export type ProtonSheetsUIState = ReturnType<typeof useProtonSheetsUIState>

function createFormatUtils(state: ProtonSheetsState, patternSpecs: Record<string, PatternSpec>) {
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
  function createTextFormatEntry(format: BooleanTextFormatKey) {
    return { active: isTextFormat(format), toggle: () => toggleTextFormat(format) }
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
  function createNumberPatternEntry(spec: PatternSpec, exampleValue?: number | Date) {
    return {
      set: () => setNumberPattern(spec),
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
    createTextFormatEntry,
    createNumberPatternEntry,
    isGeneralPattern,
    isPlainTextPattern,
    getCurrentPattern,
  }
}
