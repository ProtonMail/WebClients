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
import { useYSpreadsheetV2 } from '@rowsncolumns/y-spreadsheet'
import type { DocStateInterface } from '@proton/docs-shared'
import { DocProvider } from '@proton/docs-shared'
import { useSyncedState } from '../../Hooks/useSyncedState'

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

  return {
    // values
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
    // setters
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
}

type LocalState = ReturnType<typeof useLocalState>

// spreadsheet state
// -----------------

type SpreadsheetStateDependencies = {
  localState: LocalState
  locale: UseSpreadsheetProps['locale']
  // TODO: review this dep
  onChangeHistory: UseSpreadsheetProps['onChangeHistory']
  functions: UseSpreadsheetProps['functions']
}

function useSpreadsheetState({ localState, ...deps }: SpreadsheetStateDependencies) {
  return useSpreadsheetStateOriginal({ ...localState, ...deps })
}

type SpreadsheetState = ReturnType<typeof useSpreadsheetState>

// charts state
// ------------

type ChartsStateDependencies = {
  localState: LocalState
  spreadsheetState: SpreadsheetState
  onChangeHistory: UseSpreadsheetProps['onChangeHistory']
}

function useChartsState({ localState, spreadsheetState, ...deps }: ChartsStateDependencies) {
  return useCharts({ ...localState, ...spreadsheetState, ...deps })
}

// search state
// ------------

type SearchStateDependencies = {
  localState: LocalState
  spreadsheetState: SpreadsheetState
}

function useSearchState({ localState, spreadsheetState }: SearchStateDependencies) {
  return useSearch({ ...localState, ...spreadsheetState, sheetId: spreadsheetState.activeSheetId })
}

// Yjs state
// ---------

type YjsStateDependencies = {
  localState: LocalState
  spreadsheetState: SpreadsheetState
  docState: DocStateInterface
}

function useYjsState({ localState, spreadsheetState, docState }: YjsStateDependencies) {
  const { userName } = useSyncedState()
  const provider = useMemo(() => {
    const provider = new DocProvider(docState)
    // useYSpreadsheet checks for either a "synced" event from the provider
    // or for a true `synced` property before it starts listening to changes
    // to the doc
    provider.synced = true
    return provider
  }, [docState])
  const yDoc = useMemo(() => docState.getDoc(), [docState])

  const yjsState = useYSpreadsheetV2({
    ...localState,
    ...spreadsheetState,

    provider,
    doc: yDoc,
    sheetId: spreadsheetState.activeSheetId,
    initialSheets: [],

    userId: userName,
    title: userName,
  })
  return { ...yjsState, userName }
}

// proton sheets state
// -------------------

type OmitDepsKey = 'localState' | 'spreadsheetState' | 'onChangeHistory'
type ProtonSheetsStateDependencies = Omit<SpreadsheetStateDependencies, OmitDepsKey> &
  Omit<ChartsStateDependencies, OmitDepsKey> &
  Omit<SearchStateDependencies, OmitDepsKey> &
  Omit<YjsStateDependencies, OmitDepsKey>

export function useProtonSheetsState(deps: ProtonSheetsStateDependencies) {
  const onChangeHistory: UseSpreadsheetProps['onChangeHistory'] = (patches) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    yjsState.onBroadcastPatch(patches)

  const localState = useLocalState()
  const depsWithLocalState = { localState, onChangeHistory, ...deps }
  const spreadsheetState = useSpreadsheetState(depsWithLocalState)

  const { getEffectiveFormat } = spreadsheetState
  const { activeSheetId, activeCell } = spreadsheetState
  const currentCellFormat = useMemo(
    () => getEffectiveFormat(activeSheetId, activeCell.rowIndex, activeCell.columnIndex),
    [activeCell.columnIndex, activeCell.rowIndex, activeSheetId, getEffectiveFormat],
  )
  const computedValues = { currentCellFormat }

  const depsWithBaseState = { spreadsheetState, ...depsWithLocalState }
  const chartsState = useChartsState(depsWithBaseState)
  const searchState = useSearchState(depsWithBaseState)
  const yjsState = useYjsState(depsWithBaseState)

  const baseState = { ...localState, ...spreadsheetState, ...computedValues }
  return { ...baseState, chartsState, searchState, yjsState }
}
export type ProtonSheetsState = ReturnType<typeof useProtonSheetsState>

export function useLogState(state: ProtonSheetsState, updateLatestStateToLog: (stateToLog: unknown) => void) {
  const getStateToLog = useCallback(
    () => ({
      activeCell: state.activeCell,
      activeSheetId: state.activeSheetId,
      sheets: state.sheets,
      sheetData: state.sheetData,
      conditionalFormats: state.conditionalFormats,
      protectedRanges: state.protectedRanges,
      charts: state.charts,
      embeds: state.embeds,
      tables: state.tables,
      namedRanges: state.namedRanges,
    }),
    [
      state.activeCell,
      state.activeSheetId,
      state.charts,
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
    updateLatestStateToLog(getStateToLog())
  }, [getStateToLog, updateLatestStateToLog])

  return { getStateToLog }
}
