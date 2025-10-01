import { useCallback, useEffect, useMemo } from 'react'

import type { CellXfs, SheetData, UseSpreadsheetProps } from '@rowsncolumns/spreadsheet-state'
import type { CellInterface } from '@rowsncolumns/grid'
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
  SheetRange,
} from '@rowsncolumns/spreadsheet'
import { defaultSpreadsheetTheme, useSpreadsheet } from '@rowsncolumns/spreadsheet'
import { useCharts } from '@rowsncolumns/charts'
import { useYSpreadsheetV2 } from '@rowsncolumns/y-spreadsheet'
import type { DocStateInterface } from '@proton/docs-shared'
import { DocProvider } from '@proton/docs-shared'
import { useSyncedState } from '../../Hooks/useSyncedState'
import { create } from 'zustand'
import { useEvent } from './components/utils'

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
// TODO: this shouldn't be a singleton
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
  Omit<YjsStateDependencies, OmitDepsKey> & { isReadonly: boolean }

export function useProtonSheetsState(deps: ProtonSheetsStateDependencies) {
  const onChangeHistory: UseSpreadsheetProps['onChangeHistory'] = (patches) => {
    if (deps.isReadonly) {
      console.error('Attempted to modify readonly spreadsheet')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    yjsState.onBroadcastPatch(patches)
  }

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

  const { scrollToCell } = useSpreadsheet()
  const onSelectRange = useEvent((range: SheetRange) => {
    const activeCell: CellInterface | null = {
      rowIndex: range.startRowIndex,
      columnIndex: range.startColumnIndex,
    }

    if (baseState.activeSheetId !== range.sheetId) {
      // Update sheet
      baseState.onChangeActiveSheet(range.sheetId)
    }

    // Update active cell
    baseState.onChangeActiveCell(range.sheetId, activeCell)

    // Update selections
    baseState.onChangeSelections(range.sheetId, [{ range }])

    // Scroll to cell
    scrollToCell?.(activeCell)
  })
  const onSelectNamedRange = useEvent(({ range }: NamedRange) => {
    if (range) {
      onSelectRange(range)
    }
  })
  const onSelectTable = useEvent((table: TableView) => {
    const { sheetId, range } = table
    onSelectRange({ ...range, sheetId })
  })

  // Add onMoveSheet function
  const onMoveSheet = useCallback(
    (sheetId: number, currentPosition: number, newPosition: number) => {
      // Validate input parameters
      if (newPosition < 0 || newPosition >= localState.sheets.length) {
        console.error('Invalid new position:', newPosition)
        return
      }

      // Get the current sheets array from localState
      const sheets = [...localState.sheets]

      // Validate that the current position matches the actual sheet position
      if (currentPosition < 0 || currentPosition >= sheets.length || sheets[currentPosition].sheetId !== sheetId) {
        console.error('Position mismatch for sheet:', sheetId, 'expected position:', currentPosition)
        return
      }

      // Remove the sheet from its current position
      const [sheetToMove] = sheets.splice(currentPosition, 1)

      // Insert the sheet at the new position
      // No need to adjust target index since we're working with absolute positions
      sheets.splice(newPosition, 0, sheetToMove)

      // Update the sheets using localState's onChangeSheets
      localState.onChangeSheets(sheets)
    },
    [localState],
  )

  // Wrap onCreateNewSheet to ensure proper naming with space and length limit
  const onCreateNewSheet = useEvent((sheetSpec?: any) => {
    const newSheet = baseState.onCreateNewSheet(sheetSpec)

    if (newSheet) {
      let updatedTitle = newSheet.title

      // Fix the naming to include space if it's the default naming pattern
      if (updatedTitle.match(/^Sheet\d+$/)) {
        const sheetNumber = updatedTitle.replace('Sheet', '')
        updatedTitle = `Sheet ${sheetNumber}`
      }

      // Ensure title doesn't exceed 50 characters
      if (updatedTitle.length > 50) {
        updatedTitle = updatedTitle.substring(0, 50)
      }

      // Only update if the title changed
      if (updatedTitle !== newSheet.title) {
        const updatedSheet = { ...newSheet, title: updatedTitle }

        // Update the sheet in the sheets array
        localState.onChangeSheets((sheets) =>
          sheets.map((sheet) => (sheet.sheetId === newSheet.sheetId ? updatedSheet : sheet)),
        )

        return updatedSheet
      }
    }

    return newSheet
  })

  return {
    ...baseState,
    chartsState,
    searchState,
    yjsState,
    onSelectRange,
    onSelectNamedRange,
    onSelectTable,
    onMoveSheet,
    onCreateNewSheet,
  }
}
export type ProtonSheetsState = ReturnType<typeof useProtonSheetsState>

// TODO: refactor into a lazy approach to avoid perf issues
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
