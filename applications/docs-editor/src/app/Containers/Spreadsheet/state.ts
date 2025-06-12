import { useCallback, useEffect, useMemo, useState } from 'react'

import type { SheetData, UseSpreadsheetProps } from '@rowsncolumns/spreadsheet-state'
import { useSearch, useSpreadsheetState as useSpreadsheetStateOriginal } from '@rowsncolumns/spreadsheet-state'
import type {
  CellData,
  Sheet,
  EmbeddedChart,
  EmbeddedObject,
  TableView,
  ConditionalFormatRule,
  ProtectedRange,
  SpreadsheetTheme,
  NamedRange,
  DataValidationRuleRecord,
} from '@rowsncolumns/spreadsheet'
import { defaultSpreadsheetTheme } from '@rowsncolumns/spreadsheet'
import { useCharts } from '@rowsncolumns/charts'

// local state
// -----------

function useLocalState() {
  const [sheets, onChangeSheets] = useState<Sheet[]>([])
  const [sheetData, onChangeSheetData] = useState<SheetData<CellData>>({})
  const [theme, onChangeTheme] = useState<SpreadsheetTheme>(defaultSpreadsheetTheme)
  const [tables, onChangeTables] = useState<TableView[]>([])
  const [namedRanges, onChangeNamedRanges] = useState<NamedRange[]>([])
  const [conditionalFormats, onChangeConditionalFormats] = useState<ConditionalFormatRule[]>([])
  const [embeds, onChangeEmbeds] = useState<EmbeddedObject[]>([])
  const [dataValidations, onChangeDataValidations] = useState<DataValidationRuleRecord[]>([])
  const [charts, onChangeCharts] = useState<EmbeddedChart[]>([])
  const [protectedRanges, onChangeProtectedRanges] = useState<ProtectedRange[]>([])
  const [scale, onChangeScale] = useState(1)

  const values = {
    sheets,
    sheetData,
    theme,
    tables,
    namedRanges,
    conditionalFormats,
    embeds,
    dataValidations,
    charts,
    protectedRanges,
    scale,
  }
  const setters = {
    onChangeSheets,
    onChangeSheetData,
    onChangeTheme,
    onChangeTables,
    onChangeNamedRanges,
    onChangeConditionalFormats,
    onChangeEmbeds,
    onChangeDataValidations,
    onChangeCharts,
    onChangeProtectedRanges,
    onChangeScale,
  }
  const all = { ...values, ...setters }

  return { values, setters, all }
}

type LocalState = ReturnType<typeof useLocalState>

// spreadsheet state
// -----------------

type SpreadsheetStateDependencies = {
  localState: LocalState
  locale: UseSpreadsheetProps['locale']
  onChangeHistory: UseSpreadsheetProps['onChangeHistory']
  functions: UseSpreadsheetProps['functions']
}

function useSpreadsheetState({ localState, ...deps }: SpreadsheetStateDependencies) {
  const output = useSpreadsheetStateOriginal({ ...localState.all, ...deps })

  // values
  const {
    activeCell,
    activeSheetId,
    selections,
    rowCount,
    columnCount,
    frozenColumnCount,
    frozenRowCount,
    rowMetadata,
    columnMetadata,
    merges,
    bandedRanges,
    spreadsheetColors,
    canRedo,
    canUndo,
  } = output
  const values = {
    activeCell,
    activeSheetId,
    selections,
    rowCount,
    columnCount,
    frozenColumnCount,
    frozenRowCount,
    rowMetadata,
    columnMetadata,
    merges,
    bandedRanges,
    spreadsheetColors,
    canRedo,
    canUndo,
  }

  // setters
  const {
    onUndo,
    onRedo,
    onRequestCalculate,
    onChangeActiveCell,
    onChangeActiveSheet,
    onSelectNextSheet,
    onSelectPreviousSheet,
    onChangeSelections,
    onChange,
    onChangeBatch,
    onDelete,
    onChangeFormatting,
    onRepeatFormatting,
    onClearFormatting,
    onUnMergeCells,
    onMergeCells,
    onResize,
    onChangeBorder,
    onChangeDecimals,
    onChangeSheetTabColor,
    onRenameSheet,
    onRequestDeleteSheet,
    onDeleteSheet,
    onShowSheet,
    onHideSheet,
    onProtectSheet,
    onUnProtectSheet,
    onMoveSheet,
    onCreateNewSheet,
    onDuplicateSheet,
    onHideColumn,
    onShowColumn,
    onHideRow,
    onShowRow,
    onFill,
    onFillRange,
    onMoveEmbed,
    onResizeEmbed,
    onDeleteEmbed,
    onDeleteRow,
    onDeleteColumn,
    onDeleteCellsShiftUp,
    onDeleteCellsShiftLeft,
    onInsertCellsShiftRight,
    onInsertCellsShiftDown,
    onInsertRow,
    onInsertColumn,
    onMoveColumns,
    onMoveRows,
    onMoveSelection,
    onSortColumn,
    onSortTable,
    onFilterTable,
    onResizeTable,
    onCopy,
    onPaste,
    onCreateTable,
    onRequestEditTable,
    onUpdateTable,
    onDragOver,
    onDrop,
    onInsertFile,
    onFreezeColumn,
    onFreezeRow,
    onChangeSpreadsheetTheme,
    onUpdateNote,
    onSortRange,
    onProtectRange,
    onUnProtectRange,
    onRequestDefineNamedRange,
    onRequestUpdateNamedRange,
    onCreateNamedRange,
    onUpdateNamedRange,
    onDeleteNamedRange,
    onRequestConditionalFormat,
    onCreateConditionalFormattingRule,
    onUpdateConditionalFormattingRule,
    onDeleteConditionalFormattingRule,
    onPreviewConditionalFormattingRule,
    onRequestFormatCells,
    onRequestDataValidation,
    onCreateDataValidationRule,
    onUpdateDataValidationRule,
    onDeleteDataValidationRule,
    onDeleteDataValidationRules,
  } = output
  const setters = {
    onUndo,
    onRedo,
    onRequestCalculate,
    onChangeActiveCell,
    onChangeActiveSheet,
    onSelectNextSheet,
    onSelectPreviousSheet,
    onChangeSelections,
    onChange,
    onChangeBatch,
    onDelete,
    onChangeFormatting,
    onRepeatFormatting,
    onClearFormatting,
    onUnMergeCells,
    onMergeCells,
    onResize,
    onChangeBorder,
    onChangeDecimals,
    onChangeSheetTabColor,
    onRenameSheet,
    onRequestDeleteSheet,
    onDeleteSheet,
    onShowSheet,
    onHideSheet,
    onProtectSheet,
    onUnProtectSheet,
    onMoveSheet,
    onCreateNewSheet,
    onDuplicateSheet,
    onHideColumn,
    onShowColumn,
    onHideRow,
    onShowRow,
    onFill,
    onFillRange,
    onMoveEmbed,
    onResizeEmbed,
    onDeleteEmbed,
    onDeleteRow,
    onDeleteColumn,
    onDeleteCellsShiftUp,
    onDeleteCellsShiftLeft,
    onInsertCellsShiftRight,
    onInsertCellsShiftDown,
    onInsertRow,
    onInsertColumn,
    onMoveColumns,
    onMoveRows,
    onMoveSelection,
    onSortColumn,
    onSortTable,
    onFilterTable,
    onResizeTable,
    onCopy,
    onPaste,
    onCreateTable,
    onRequestEditTable,
    onUpdateTable,
    onDragOver,
    onDrop,
    onInsertFile,
    onFreezeColumn,
    onFreezeRow,
    onChangeSpreadsheetTheme,
    onUpdateNote,
    onSortRange,
    onProtectRange,
    onUnProtectRange,
    onRequestDefineNamedRange,
    onRequestUpdateNamedRange,
    onCreateNamedRange,
    onUpdateNamedRange,
    onDeleteNamedRange,
    onRequestConditionalFormat,
    onCreateConditionalFormattingRule,
    onUpdateConditionalFormattingRule,
    onDeleteConditionalFormattingRule,
    onPreviewConditionalFormattingRule,
    onRequestFormatCells,
    onRequestDataValidation,
    onCreateDataValidationRule,
    onUpdateDataValidationRule,
    onDeleteDataValidationRule,
    onDeleteDataValidationRules,
  }

  // getters
  const {
    getDataRowCount,
    getCellData,
    getSheetName,
    getSheetId,
    getEffectiveFormat,
    getEffectiveValue,
    getNonEmptyColumnCount,
    getNonEmptyRowCount,
    getSeriesValuesFromRange,
    getDomainValuesFromRange,
  } = output
  const getters = {
    getDataRowCount,
    getCellData,
    getSheetName,
    getSheetId,
    getEffectiveFormat,
    getEffectiveValue,
    getNonEmptyColumnCount,
    getNonEmptyRowCount,
    getSeriesValuesFromRange,
    getDomainValuesFromRange,
  }

  // actions
  const { createHistory, enqueueCalculation, calculateNow } = output
  const actions = {
    createHistory,
    enqueueCalculation,
    calculateNow,
  }

  // all
  const all = { ...values, ...setters, ...getters, ...actions }

  return { values, setters, getters, actions, all }
}

type SpreadsheetState = ReturnType<typeof useSpreadsheetState>

// charts state
// ------------

type ChartsStateDependencies = {
  spreadsheetState: SpreadsheetState
  onChangeHistory: UseSpreadsheetProps['onChangeHistory']
}

function useChartsState({ spreadsheetState, ...deps }: ChartsStateDependencies) {
  const chartsState = useCharts({ ...spreadsheetState.all, ...deps })

  // values
  const { selectedChart } = chartsState
  const values = { selectedChart }

  // setters
  const { onRequestEditChart, onDeleteChart, onMoveChart, onResizeChart, onUpdateChart, onCreateChart } = chartsState
  const setters = { onRequestEditChart, onDeleteChart, onMoveChart, onResizeChart, onUpdateChart, onCreateChart }

  // all
  const all = { ...values, ...setters }

  return { values, setters, all }
}

// search state
// ------------

type SearchStateDependencies = {
  localState: LocalState
  spreadsheetState: SpreadsheetState
}

function useSearchState({ localState, spreadsheetState }: SearchStateDependencies) {
  const searchState = useSearch({
    ...localState.all,
    ...spreadsheetState.all,
    sheetId: spreadsheetState.values.activeSheetId,
  })

  // values
  const { borderStyles, currentResult, totalResults, searchQuery, hasNextResult, hasPreviousResult, isSearchActive } =
    searchState
  const values = {
    borderStyles,
    currentResult,
    totalResults,
    searchQuery,
    hasNextResult,
    hasPreviousResult,
    isSearchActive,
  }

  // setters
  const { onSearch, onResetSearch, onFocusNextResult, onFocusPreviousResult, onRequestSearch } = searchState
  const setters = { onSearch, onResetSearch, onFocusNextResult, onFocusPreviousResult, onRequestSearch }

  // all
  const all = { ...values, ...setters }

  return { values, setters, all }
}

// proton sheets state
// -------------------

type ProtonSheetsStateDependencies = Omit<SpreadsheetStateDependencies, 'localState'>

export function useProtonSheetsState(deps: ProtonSheetsStateDependencies) {
  const localState = useLocalState()
  const spreadsheetState = useSpreadsheetState({ localState, ...deps })
  const chartsState = useChartsState({ spreadsheetState, ...deps })
  const searchState = useSearchState({ localState, spreadsheetState })

  // computed values
  const { getEffectiveFormat } = spreadsheetState.getters
  const { activeSheetId, activeCell } = spreadsheetState.values
  const currentCellFormat = useMemo(
    () => getEffectiveFormat(activeSheetId, activeCell.rowIndex, activeCell.columnIndex),
    [activeCell.columnIndex, activeCell.rowIndex, activeSheetId, getEffectiveFormat],
  )
  const computedValues = { currentCellFormat }

  const values = { ...localState.values, ...spreadsheetState.values, ...computedValues }
  const setters = { ...localState.setters, ...spreadsheetState.setters }
  const getters = spreadsheetState.getters
  const actions = spreadsheetState.actions
  return { ...values, ...setters, ...getters, ...actions, chartsState: chartsState.all, searchState: searchState.all }
}
export type ProtonSheetsState = ReturnType<typeof useProtonSheetsState>

export function useLogState(state: ProtonSheetsState, logState: (stateToLog: unknown) => void) {
  const getStateToLog = useCallback(
    () => ({
      activeCell: state.activeCell,
      activeSheetId: state.activeSheetId,
      sheets: state.sheets,
      sheetData: state.sheetData,
      conditionalFormats: state.conditionalFormats,
      protectedRanges: state.protectedRanges,
      charts: state.chartsState,
      embeds: state.embeds,
      tables: state.tables,
      namedRanges: state.namedRanges,
    }),
    [
      state.activeCell,
      state.activeSheetId,
      state.chartsState,
      state.conditionalFormats,
      state.embeds,
      state.namedRanges,
      state.protectedRanges,
      state.sheetData,
      state.sheets,
      state.tables,
    ],
  )
  useEffect(() => {
    logState(getStateToLog())
  }, [getStateToLog, logState])

  return { getStateToLog }
}
