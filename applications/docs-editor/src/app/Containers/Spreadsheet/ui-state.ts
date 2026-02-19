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
  getProtectedRange,
  isProtectedRange as isProtectedRangeFn,
  getUserSelections,
  useFocusSheet,
} from '@rowsncolumns/spreadsheet'
import { number2Alpha, ssfFormat, uuid } from '@rowsncolumns/utils'
import {
  DATE_PATTERN_EXAMPLE_VALUE,
  DURATION_PATTERN_EXAMPLE_VALUE,
  NUMBER_PATTERN_EXAMPLE_VALUE,
  PATTERN_SPECS,
  PERCENT_PATTERN_EXAMPLE_VALUE,
} from './constants'
import { sortSheetsByIndex, type ProtonSheetsState } from './state'
import { useEvent } from './components/utils'
import { useMemo, useState } from 'react'
import type { CellInterface } from '@rowsncolumns/grid'
import { Direction, isCellWithinBounds, isEqualCells, selectionFromActiveCell } from '@rowsncolumns/grid'
import { useApplication } from '../ApplicationProvider'
import type { LoggerInterface } from '@proton/utils/logs'
import * as Ariakit from '@ariakit/react'

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
export function useProtonSheetsUIState(
  state: ProtonSheetsState,
  {
    isReadonly,
    isRevisionMode,
    isViewOnlyMode,
  }: { isReadonly: boolean; isRevisionMode: boolean; isViewOnlyMode: boolean },
) {
  const kv = {
    ...state.kv,
    set: state.yjsState.kvSet,
  }

  const { application } = useApplication()
  const logger = application.logger

  const locale = {
    ...state.locale,
    set: useEvent((newLocale: string | undefined) => {
      logger.info('action: set locale', newLocale)
      kv.set('locale', newLocale)
    }),
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
  function withFocusGridBefore(fn: () => void) {
    return () => {
      focusGrid()
      fn()
    }
  }

  // selection
  const firstSelection = useMemo(
    () => (state.selections.length ? state.selections.at(0) : undefined),
    [state.selections],
  )
  /** The first selection. If none exists, falls back to a selection created from the active cell. */
  const defaultSelection = useMemo(
    () => firstSelection ?? selectionFromActiveCell(state.activeCell)[0],
    [firstSelection, state.activeCell],
  )
  const selectionCount = useMemo(() => state.selections.length, [state.selections])
  const selection = {
    first: firstSelection,
    last: useMemo(() => (state.selections.length ? state.selections.at(-1) : undefined), [state.selections]),
    /** The first selection. If none exists, falls back to a selection created from the active cell. */
    default: useMemo(
      () => firstSelection ?? selectionFromActiveCell(state.activeCell)[0],
      [firstSelection, state.activeCell],
    ),
    isMultiple: selectionCount > 1,
    isSingle: selectionCount === 1,
    isNone: selectionCount === 0,
  }

  // info
  const info = {
    activeColumnIndex: state.activeCell.columnIndex,
    activeColumnName: number2Alpha(state.activeCell.columnIndex - 1),
    activeRowIndex: state.activeCell.rowIndex,
    selectedColumnCount: defaultSelection.range.endColumnIndex - defaultSelection.range.startColumnIndex + 1,
    selectedRowCount: defaultSelection.range.endRowIndex - defaultSelection.range.startRowIndex + 1,
    isReadonly,
    isRevisionMode,
    isViewOnlyMode,
  }

  // operation
  const operation = {
    delete: useEvent(() => {
      logger.info('action: delete', state.activeSheetId, state.activeCell)
      state.onDelete(state.activeSheetId, state.activeCell, state.selections)
    }),
    cut: useEvent(
      withFocusGridBefore(() => {
        logger.info('action: cut')
        state.grid.cut?.()
      }),
    ),
    copy: useEvent(
      withFocusGridBefore(() => {
        logger.info('action: copy')
        state.grid.copy?.()
      }),
    ),
    paste: {
      default: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste')
          state.grid.paste?.()
        }),
      ),
      value: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste value')
          state.grid.paste?.('Value')
        }),
      ),
      formatting: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste formatting')
          state.grid.paste?.('Formatting')
        }),
      ),
      transposed: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste transposed')
          state.grid.paste?.('Transposed')
        }),
      ),
      formula: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste formula')
          state.grid.paste?.('Formula')
        }),
      ),
      link: useEvent(
        withFocusGrid(() => {
          logger.info('action: paste link')
          state.grid.paste?.('Link')
        }),
      ),
    },
  }

  // view
  const [showFormulaBar, setShowFormulaBar] = useState(true)
  const [showGridlines, setShowGridlines] = useState(true)
  const [showInsertLinkDialog, setShowInsertLinkDialog] = useState(false)
  const [insertLinkCell, setInsertLinkCell] = useState<CellInterface>(() => state.activeCell)
  const [deleteSheetId, setDeleteSheetId] = useState<number | undefined>(undefined)
  const spreadsheetSettingsDialogStore = Ariakit.useDialogStore()
  const customCurrencyFormatDialogStore = Ariakit.useDialogStore()
  const customNumberFormatDialogStore = Ariakit.useDialogStore()

  const view = {
    formulaBar: {
      enabled: showFormulaBar,
      toggle: useEvent(() => setShowFormulaBar((value) => !value)),
    },
    gridLines: {
      enabled: showGridlines,
      toggle: useEvent(() => setShowGridlines((value) => !value)),
    },
    freezeRows: useEvent((beforeRowIndex: number) => {
      logger.info('action: freeze rows', state.activeSheetId, beforeRowIndex)
      state.onFreezeRow(state.activeSheetId, beforeRowIndex)
    }),
    unfreezeRows: useEvent(() => {
      logger.info('action: unfreeze rows', state.activeSheetId)
      state.onFreezeRow(state.activeSheetId, 0)
    }),
    freezeColumns: useEvent((beforeColumnIndex: number) => {
      logger.info('action: freeze columns', state.activeSheetId, beforeColumnIndex)
      state.onFreezeColumn(state.activeSheetId, beforeColumnIndex)
    }),
    unfreezeColumns: useEvent(() => {
      logger.info('action: unfreeze columns', state.activeSheetId)
      state.onFreezeColumn(state.activeSheetId, 0)
    }),
    insertLinkDialog: {
      isOpen: showInsertLinkDialog,
      cell: insertLinkCell,
      open: useEvent((cell?: CellInterface) => {
        setShowInsertLinkDialog(true)
        setInsertLinkCell(cell ?? state.activeCell)
      }),
      close: useEvent(() => setShowInsertLinkDialog(false)),
    },
    spreadsheetSettingsDialog: {
      store: spreadsheetSettingsDialogStore,
    },
    customCurrencyFormatDialog: {
      store: customCurrencyFormatDialogStore,
    },
    customNumberFormatDialog: {
      store: customNumberFormatDialogStore,
    },
    deleteSheetConfirmation: {
      sheetId: deleteSheetId,
      open: useEvent((sheetId: number) => setDeleteSheetId(sheetId)),
      close: useEvent(() => setDeleteSheetId(undefined)),
    },
  }

  // sheets
  const sheetList = useMemo(
    () =>
      sortSheetsByIndex(state.sheets).map((sheet) => ({
        id: sheet.sheetId,
        name: sheet.title,
        hidden: sheet.hidden ?? false,
        tabColor: sheet.tabColor ?? undefined,
      })),
    [state.sheets],
  )
  const sheetListIncludingHidden = useMemo(
    () =>
      sortSheetsByIndex(state.sheets, true).map((sheet) => ({
        id: sheet.sheetId,
        name: sheet.title,
        hidden: sheet.hidden ?? false,
        tabColor: sheet.tabColor ?? undefined,
      })),
    [state.sheets],
  )
  const visibleSheets = useMemo(() => sheetList.filter((sheet) => !sheet.hidden), [sheetList])
  const hiddenSheets = useMemo(() => state.sheets.filter((sheet) => sheet.hidden), [state.sheets])
  const sheets = {
    list: sheetList,
    listIncludingHidden: sheetListIncludingHidden,
    visible: visibleSheets,
    hidden: hiddenSheets,
    activeId: state.activeSheetId,
    setActiveId: useEvent((sheetId: number) => state.onChangeActiveSheet(sheetId)),
    delete: useEvent((sheetId: number) => {
      logger.info('action: delete sheet', sheetId)
      state.onDeleteSheet(sheetId)
    }),
    rename: useEvent((sheetId: number, newName: string) => {
      logger.info('action: rename sheet', sheetId, newName)
      state.onRenameSheet(sheetId, newName, sheetList.find((sheet) => sheet.id === sheetId)?.name || '')
    }),
    duplicate: useEvent((sheetId: number) => {
      logger.info('action: duplicate sheet', sheetId)
      state.onDuplicateSheet(sheetId)
    }),
    hide: useEvent((sheetId: number) => {
      logger.info('action: hide sheet', sheetId)
      state.onHideSheet(sheetId)
    }),
    show: useEvent((sheetId: number) => {
      logger.info('action: show sheet', sheetId)
      state.onShowSheet(sheetId)
    }),
    move: useEvent((sheetId: number, currentPosition: number, newPosition: number) => {
      logger.info('action: move sheet', sheetId, currentPosition, newPosition)
      state.onMoveSheet(sheetId, currentPosition, newPosition)
    }),
    moveInDirection: useEvent((sheetId: number, direction: 'left' | 'right') => {
      logger.info('action: move sheet in direction', sheetId, direction)
      const currentPosition = sheetList.findIndex((sheet) => sheet.id === sheetId)
      if (currentPosition === -1) {
        return
      }
      let newPosition = currentPosition
      const delta = direction === 'left' ? -1 : 1
      do {
        newPosition += delta
      } while (newPosition >= 0 && newPosition < sheetList.length && sheetList[newPosition].hidden)
      if (newPosition === currentPosition || newPosition < 0 || newPosition >= sheetList.length) {
        return
      }
      state.onMoveSheet(sheetId, currentPosition, newPosition)
    }),
    changeTabColor: useEvent((sheetId: number, color: Color | undefined) => {
      logger.info('action: change tab color', sheetId, color)
      state.onChangeSheetTabColor(sheetId, color)
    }),
  }

  // history
  const history = {
    undo: useEvent(() => {
      logger.info('action: undo')
      state.onUndo()
    }),
    undoDisabled: !state.canUndo,
    redo: useEvent(() => {
      logger.info('action: redo')
      state.onRedo()
    }),
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
  const patternSpecs = PATTERN_SPECS({ locale: locale.resolved, currency: locale.currency.code })
  const formatUtils = useFormatUtils(state, patternSpecs, logger)
  const canUnmerge = useMemo(
    () =>
      !selection.isMultiple &&
      state.merges?.some((merge) =>
        isEqualCells({ rowIndex: merge.startRowIndex, columnIndex: merge.startColumnIndex }, state.activeCell),
      ),
    [selection.isMultiple, state.activeCell, state.merges],
  )
  const canMergeHorizontally = useMemo(
    () => selection.isSingle && selection.default.range.startColumnIndex !== selection.default.range.endColumnIndex,
    [selection.default.range.endColumnIndex, selection.default.range.startColumnIndex, selection.isSingle],
  )
  const canMergeVertically = useMemo(
    () => selection.isSingle && selection.default.range.startRowIndex !== selection.default.range.endRowIndex,
    [selection.default.range.endRowIndex, selection.default.range.startRowIndex, selection.isSingle],
  )
  const canMerge = useMemo(() => canMergeHorizontally || canMergeVertically, [canMergeHorizontally, canMergeVertically])
  const format = {
    clear: useEvent(() => {
      logger.info('action: clear formatting', state.activeSheetId, state.activeCell)
      state.onClearFormatting(state.activeSheetId, state.activeCell, state.selections)
    }),
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
        set: useEvent((value: string | undefined) => {
          formatUtils.setTextFormat('fontFamily', value)
        }),
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
        set: useEvent((value: Color | undefined) => formatUtils.setTextFormat('color', value)),
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
      set: useEvent((value: Color | undefined) => formatUtils.setBackgroundColor(value)),
    },
    borders: {
      /**
       * The default value is represented by `undefined`.
       */
      value: state.currentCellFormat?.borders ?? undefined,
      set: useEvent((location: BorderLocation, color: Color | undefined, style: BorderStyle | undefined) => {
        logger.info('action: set border', state.activeSheetId, state.activeCell, location, color, style)
        state.onChangeBorder(state.activeSheetId, state.activeCell, state.selections, location, color, style)
      }),
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
      duration: formatUtils.useNumberPatternEntry(patternSpecs.DURATION, DURATION_PATTERN_EXAMPLE_VALUE),
    },
    decreaseDecimalPlaces: useEvent(() => {
      logger.info('action: decrease decimal places', state.activeSheetId, state.activeCell)
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'decrement')
    }),
    increaseDecimalPlaces: useEvent(() => {
      logger.info('action: increase decimal places', state.activeSheetId, state.activeCell)
      state.onChangeDecimals(state.activeSheetId, state.activeCell, state.selections, 'increment')
    }),
    merge: {
      can: {
        all: canMerge,
        horizontally: canMergeHorizontally,
        vertically: canMergeVertically,
        unmerge: canUnmerge,
      },
      all: useEvent(() => {
        logger.info('action: merge all', state.activeSheetId, state.activeCell)
        state.onMergeCells(state.activeSheetId, state.activeCell, state.selections)
      }),
      horizontally: useEvent(() => {
        logger.info('action: merge horizontally', state.activeSheetId, state.activeCell)
        state.onMergeCells(state.activeSheetId, state.activeCell, state.selections, Direction.Right)
      }),
      vertically: useEvent(() => {
        logger.info('action: merge vertically', state.activeSheetId, state.activeCell)
        state.onMergeCells(state.activeSheetId, state.activeCell, state.selections, Direction.Down)
      }),
      unmerge: useEvent(() => {
        logger.info('action: unmerge', state.activeSheetId, state.activeCell)
        state.onUnMergeCells(state.activeSheetId, state.activeCell, state.selections)
      }),
      menu: {
        enabled: useMemo(() => canMerge || canUnmerge, [canMerge, canUnmerge]),
        defaultAction: useMemo(() => (!canMerge && canUnmerge ? 'unmerge' : 'merge'), [canMerge, canUnmerge]),
      },
    },
    paintFormat: {
      active: state.isPaintFormatActive,
      save: useEvent(() => {
        logger.info('action: save paint format', state.activeSheetId, state.activeCell)
        state.onSavePaintFormat(state.activeSheetId, state.activeCell, state.selections)
      }),
    },
  }

  // insert
  const insert = {
    cellsShiftRight: useEvent(() => {
      logger.info('action: insert cells shift right', state.activeSheetId, state.activeCell)
      state.onInsertCellsShiftRight(state.activeSheetId, state.activeCell, state.selections)
    }),
    cellsShiftDown: useEvent(() => {
      logger.info('action: insert cells shift down', state.activeSheetId, state.activeCell)
      state.onInsertCellsShiftDown(state.activeSheetId, state.activeCell, state.selections)
    }),
    rowsAbove: useEvent((amount: number) => {
      logger.info('action: insert rows above', state.activeSheetId, state.activeCell.rowIndex, amount)
      state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex, amount)
    }),
    rowsBelow: useEvent((amount: number) => {
      logger.info('action: insert rows below', state.activeSheetId, state.activeCell.rowIndex + 1, amount)
      state.onInsertRow(state.activeSheetId, state.activeCell.rowIndex + 1, amount)
    }),
    columnsLeft: useEvent((amount: number) => {
      logger.info('action: insert columns left', state.activeSheetId, state.activeCell.columnIndex, amount)
      state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex, amount)
    }),
    columnsRight: useEvent((amount: number) => {
      logger.info('action: insert columns right', state.activeSheetId, state.activeCell.columnIndex + 1, amount)
      state.onInsertColumn(state.activeSheetId, state.activeCell.columnIndex + 1, amount)
    }),
    sheet: useEvent(() => {
      logger.info('action: create new sheet')
      state.onCreateNewSheet()
    }),
    chart: useEvent(() => {
      logger.info('action: create chart', state.activeSheetId, state.activeCell)
      return state.chartsState.onCreateChart(state.activeSheetId, state.activeCell, state.selections)
    }),
    formula: useEvent((formula: string) =>
      state.grid.makeEditable?.(state.activeSheetId, state.activeCell, `=${formula}(`, true),
    ),
    link: useEvent(() => view.insertLinkDialog.open()),
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

  // charts
  const charts = {
    selected: state.chartsState.selectedChart,
    update: useEvent((chart) => {
      logger.info('action: update chart', chart.chartId)
      state.chartsState.onUpdateChart(chart)
    }),
  }

  // data
  const activeBasicFilter = useMemo(
    () =>
      state.basicFilter && isCellWithinBounds(state.activeCell, state.basicFilter.range)
        ? state.basicFilter
        : undefined,
    [state.activeCell, state.basicFilter],
  )
  const isProtectedRange = useMemo(
    () => isProtectedRangeFn(state.activeSheetId, defaultSelection.range, state.protectedRanges),
    [defaultSelection.range, state.activeSheetId, state.protectedRanges],
  )
  const data = {
    sortAscending: useEvent(() => {
      logger.info('action: sort column ascending', state.activeSheetId, state.activeCell.columnIndex)
      state.onSortColumn(state.activeSheetId, state.activeCell.columnIndex, 'ASCENDING')
    }),
    sortDescending: useEvent(() => {
      logger.info('action: sort column descending', state.activeSheetId, state.activeCell.columnIndex)
      state.onSortColumn(state.activeSheetId, state.activeCell.columnIndex, 'DESCENDING')
    }),
    toggleFilter: useEvent(() => {
      logger.info('action: toggle filter', state.activeSheetId, state.activeCell)
      state.onCreateBasicFilter?.(state.activeSheetId, state.activeCell, state.selections)
    }),
    hasFilter: Boolean(activeBasicFilter),
    toggleProtectRange: useEvent(() => {
      const protectedRange = getProtectedRange(state.activeSheetId, defaultSelection.range, state.protectedRanges)
      if (protectedRange?.protectedRangeId) {
        logger.info('action: unprotect range', state.activeSheetId, protectedRange.protectedRangeId)
        state.onUnProtectRange?.(state.activeSheetId, protectedRange.protectedRangeId)
      } else {
        logger.info('action: protect range', state.activeSheetId, state.activeCell)
        state.onProtectRange?.(state.activeSheetId, state.activeCell, state.selections)
      }
    }),
    isProtectedRange,
    validation: {
      open: useEvent(() => {
        logger.info('action: request data validation', state.activeSheetId, state.activeCell)
        state.onRequestDataValidation(state.activeSheetId, state.activeCell, state.selections)
      }),
    },
  }

  return {
    focusGrid,
    withFocusGrid,
    selection,
    info,
    operation,
    view,
    sheets,
    history,
    zoom,
    search,
    format,
    insert,
    charts,
    data,
    kv,
    locale,
    /** @deprecated temporary, to be removed eventually */
    legacy: state,
  }
}

export type ProtonSheetsUIState = ReturnType<typeof useProtonSheetsUIState>

function useFormatUtils(state: ProtonSheetsState, patternSpecs: Record<string, PatternSpec>, logger: LoggerInterface) {
  function setFormat<K extends keyof CellFormat>(key: K, value: CellFormat[K]) {
    logger.info('action: set format', state.activeSheetId, state.activeCell, key)
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
    setTextFormat(format, !isTextFormat(format))
  }
  function useTextFormatEntry(format: BooleanTextFormatKey) {
    return { active: isTextFormat(format), toggle: useEvent(() => toggleTextFormat(format)) }
  }

  function setBackgroundColor(value: Color | undefined) {
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
    return ssfFormat(pattern, value, state.locale.resolved)
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
