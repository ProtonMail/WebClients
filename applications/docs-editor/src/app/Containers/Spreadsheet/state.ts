import { useCallback, useEffect, useMemo } from 'react'

import type { CellXfs, SheetData, UseSpreadsheetProps } from '@rowsncolumns/spreadsheet-state'
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
import { create } from 'zustand'

// local state
// -----------

type UpdateAction<T> = T | ((state: T) => T)
type SetState<T> = (state: UpdateAction<T>) => void
type LocalState = {
  sheets: Sheet[]
  sheetData: SheetData<CellData>
  theme: SpreadsheetTheme
  tables: TableView[]
  namedRanges: NamedRange[]
  conditionalFormats: ConditionalFormatRule[]
  embeds: EmbeddedObject[]
  dataValidations: DataValidationRuleRecord[]
  charts: EmbeddedChart[]
  protectedRanges: ProtectedRange[]
  cellXfs: CellXfs | null | undefined
  scale: number

  onChangeSheets: SetState<Sheet[]>
  onChangeSheetData: SetState<SheetData<CellData>>
  onChangeTheme: SetState<SpreadsheetTheme>
  onChangeTables: SetState<TableView[]>
  onChangeNamedRanges: SetState<NamedRange[]>
  onChangeConditionalFormats: SetState<ConditionalFormatRule[]>
  onChangeEmbeds: SetState<EmbeddedObject[]>
  onChangeDataValidations: SetState<DataValidationRuleRecord[]>
  onChangeCharts: SetState<EmbeddedChart[]>
  onChangeProtectedRanges: SetState<ProtectedRange[]>
  onChangeCellXfs: SetState<CellXfs | null | undefined>
  onChangeScale: SetState<number>
}
function getValueFromUpdateAction<T>(updateAction: UpdateAction<T>, prevValue: T): T {
  return typeof updateAction === 'function' ? (updateAction as (state: T) => T)(prevValue) : updateAction
}
const useLocalSpreadsheetState = create<LocalState>()((set) => ({
  sheets: [],
  sheetData: {},
  theme: defaultSpreadsheetTheme,
  tables: [],
  namedRanges: [],
  conditionalFormats: [],
  embeds: [],
  dataValidations: [],
  charts: [],
  protectedRanges: [],
  cellXfs: new Map(),
  scale: 1,

  onChangeSheets: (sheets) => set((state) => ({ sheets: getValueFromUpdateAction(sheets, state.sheets) })),
  onChangeSheetData: (sheetData) =>
    set((state) => ({ sheetData: getValueFromUpdateAction(sheetData, state.sheetData) })),
  onChangeTheme: (theme) => set((state) => ({ theme: getValueFromUpdateAction(theme, state.theme) })),
  onChangeTables: (tables) => set((state) => ({ tables: getValueFromUpdateAction(tables, state.tables) })),
  onChangeNamedRanges: (namedRanges) =>
    set((state) => ({ namedRanges: getValueFromUpdateAction(namedRanges, state.namedRanges) })),
  onChangeConditionalFormats: (conditionalFormats) =>
    set((state) => ({
      conditionalFormats: getValueFromUpdateAction(conditionalFormats, state.conditionalFormats),
    })),
  onChangeEmbeds: (embeds) => set((state) => ({ embeds: getValueFromUpdateAction(embeds, state.embeds) })),
  onChangeDataValidations: (dataValidations) =>
    set((state) => ({
      dataValidations: getValueFromUpdateAction(dataValidations, state.dataValidations),
    })),
  onChangeCharts: (charts) => set((state) => ({ charts: getValueFromUpdateAction(charts, state.charts) })),
  onChangeProtectedRanges: (protectedRanges) =>
    set((state) => ({
      protectedRanges: getValueFromUpdateAction(protectedRanges, state.protectedRanges),
    })),
  onChangeCellXfs: (cellXfs) => set((state) => ({ cellXfs: getValueFromUpdateAction(cellXfs, state.cellXfs) })),
  onChangeScale: (scale) => set((state) => ({ scale: getValueFromUpdateAction(scale, state.scale) })),
}))

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

    enqueueCalculation: spreadsheetState.enqueueGraphOperation,

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

  const localState = useLocalSpreadsheetState()
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
