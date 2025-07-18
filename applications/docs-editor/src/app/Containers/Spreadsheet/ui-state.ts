import { getCurrencySymbol, type CellFormat, type TextFormat } from '@rowsncolumns/spreadsheet'
import { ssfFormat } from '@rowsncolumns/utils'
import type { ProtonSheetsState } from './state'
import { CURRENCY, EXAMPLE_DATE, EXAMPLE_NUMBER, EXAMPLE_PERCENT, LOCALE, PATTERN_SPECS } from './constants'

type PatternSpec = {
  type: NonNullable<CellFormat['numberFormat']>['type']
  pattern: string
}

export function useProtonSheetsUIState(state: ProtonSheetsState) {
  const currencySymbol = getCurrencySymbol(LOCALE, CURRENCY)
  if (!currencySymbol) {
    // TODO: handle this more gracefully, default to "$"?
    throw new Error('Currency symbol not found.')
  }

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
      number: formatUtils.createNumberPatternEntry(patternSpecs.NUMBER, EXAMPLE_NUMBER),
      percent: formatUtils.createNumberPatternEntry(patternSpecs.PERCENT, EXAMPLE_PERCENT),
      scientific: formatUtils.createNumberPatternEntry(patternSpecs.SCIENTIFIC, EXAMPLE_NUMBER),
      accounting: formatUtils.createNumberPatternEntry(patternSpecs.ACCOUNTING, -EXAMPLE_NUMBER),
      financial: formatUtils.createNumberPatternEntry(patternSpecs.FINANCIAL, -EXAMPLE_NUMBER),
      currency: {
        default: formatUtils.createNumberPatternEntry(patternSpecs.CURRENCY, EXAMPLE_NUMBER),
        defaultRounded: formatUtils.createNumberPatternEntry(patternSpecs.CURRENCY_ROUNDED, EXAMPLE_NUMBER),
        usd: formatUtils.createNumberPatternEntry(patternSpecs.USD),
        eur: formatUtils.createNumberPatternEntry(patternSpecs.EUR),
        gbp: formatUtils.createNumberPatternEntry(patternSpecs.GBP),
        jpy: formatUtils.createNumberPatternEntry(patternSpecs.JPY),
        cny: formatUtils.createNumberPatternEntry(patternSpecs.CNY),
        inr: formatUtils.createNumberPatternEntry(patternSpecs.INR),
      },
      date: formatUtils.createNumberPatternEntry(patternSpecs.DATE, EXAMPLE_DATE),
      longDate: formatUtils.createNumberPatternEntry(patternSpecs.LONG_DATE, EXAMPLE_DATE),
      time: formatUtils.createNumberPatternEntry(patternSpecs.TIME, EXAMPLE_DATE),
      dateTime: formatUtils.createNumberPatternEntry(patternSpecs.DATE_TIME, EXAMPLE_DATE),
      duration: formatUtils.createNumberPatternEntry(patternSpecs.DURATION, EXAMPLE_DATE),
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

  return { history, search, format, insert }
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
