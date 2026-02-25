import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { CellXfs, SheetData, UseSpreadsheetProps } from '@rowsncolumns/spreadsheet-state'
import { Align, type CellInterface } from '@rowsncolumns/grid'
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
  Collaborator,
} from '@rowsncolumns/spreadsheet'
import { defaultSpreadsheetTheme, useSpreadsheet } from '@rowsncolumns/spreadsheet'
import { useCharts } from '@rowsncolumns/charts'
import { useYSpreadsheetV2 } from '@rowsncolumns/y-spreadsheet'
import type { DocStateInterface } from '@proton/docs-shared'
import { DocProvider, DocUpdateOrigin } from '@proton/docs-shared'
import { useSyncedState } from '../../Hooks/useSyncedState'
import { create } from 'zustand'
import { useEvent } from './components/utils'
import { useNotifications } from '@proton/components'
import { c } from 'ttag'
import { LoadedFontFamilies, loadFont } from './font-state'
import debounce from 'lodash/debounce'
import { getAccentColorForUsername } from '@proton/atoms/UserAvatar/getAccentColorForUsername'
import type { Transaction } from 'yjs'
import { getCurrencyFromLocale, useAccountLocale, useLocaleAuto } from './locale'
import { CURRENCY_SYMBOL } from './constants'

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
  userDefinedColors: string[]
  sharedStrings: string[]

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
  onChangeUserDefinedColors: SetState<string[]>
  onChangeSharedStrings: SetState<string[]>
}
type LocalStateWithoutActions = Omit<
  LocalState,
  | 'onChangeSheets'
  | 'onChangeSheetData'
  | 'onChangeTheme'
  | 'onChangeTables'
  | 'onChangeNamedRanges'
  | 'onChangeConditionalFormats'
  | 'onChangeEmbeds'
  | 'onChangeDataValidations'
  | 'onChangeCharts'
  | 'onChangeProtectedRanges'
  | 'onChangeCellXfs'
  | 'onChangeScale'
  | 'onChangeUserDefinedColors'
  | 'onChangeSharedStrings'
>
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
  userDefinedColors: [],
  sharedStrings: [],

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
  onChangeUserDefinedColors: (userDefinedColors) =>
    set((state) => ({ userDefinedColors: getValueFromUpdateAction(userDefinedColors, state.userDefinedColors) })),
  onChangeSharedStrings: (sharedStrings) =>
    set((state) => ({ sharedStrings: getValueFromUpdateAction(sharedStrings, state.sharedStrings) })),
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
  return useSpreadsheetStateOriginal({ ...localState, ...deps, enableExcelfileDragDrop: false })
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

// kv state
// ---------

type KeyValueState = {
  defaultCurrency: string | undefined
  locale: string | undefined
}

const useKeyValueState = create<KeyValueState>()((set) => ({
  defaultCurrency: undefined,
  locale: undefined,
}))

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

  const ySheets = useMemo(() => yDoc.getArray<Sheet>('sheets'), [yDoc])
  const updatedActiveSheetIdAfterInitialLoad = useRef(false)
  useEffect(
    function updateActiveSheetIdAfterInitialLoad() {
      if (updatedActiveSheetIdAfterInitialLoad.current) {
        return
      }

      const handler = (_: any, origin: any) => {
        if (origin === DocUpdateOrigin.InitialLoad) {
          // After receiving base commit, change the active sheet to the first sheet.
          // RnC does try to do this, but it doesn't work with our setup as when it tries
          // to do this, it will not have received the initial update yet.
          const sheets = ySheets.toJSON()
          if (sheets.length) {
            spreadsheetState.onChangeActiveSheet(sortSheetsByIndex(sheets)[0].sheetId)
            yDoc.off('update', handler)
            updatedActiveSheetIdAfterInitialLoad.current = true
          }
        }
      }

      yDoc.on('update', handler)

      return () => {
        yDoc.off('update', handler)
      }
    },
    [spreadsheetState, yDoc, ySheets],
  )

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

  const usersWithCorrectColor = useMemo(() => {
    return yjsState.users.map(
      (user): Collaborator => ({
        ...user,
        style: {
          strokeWidth: 2,
          stroke: getAccentColorForUsername(user.title),
        },
      }),
    )
  }, [yjsState.users])

  const kv = useMemo(() => yDoc.getMap<string | boolean | number | undefined>('kv'), [yDoc])
  useEffect(() => {
    function handleKVChange(_: unknown, transaction: Transaction) {
      if (transaction.origin !== 'local') {
        useKeyValueState.setState(kv.toJSON())
      }
    }
    kv.observeDeep(handleKVChange)
    return () => kv.unobserveDeep(handleKVChange)
  }, [kv])
  const kvSet = useEvent((key: keyof KeyValueState, value: string | boolean | number | undefined) => {
    useKeyValueState.setState({ [key]: value })
    yDoc.transact(() => {
      kv.set(key, value)
    }, 'local')
  })

  return { ...yjsState, userName, users: usersWithCorrectColor, kvSet }
}

// proton sheets state
// -------------------

type OmitDepsKey = 'localState' | 'spreadsheetState' | 'onChangeHistory'
type ProtonSheetsStateDependencies = Omit<SpreadsheetStateDependencies, OmitDepsKey> &
  Omit<ChartsStateDependencies, OmitDepsKey> &
  Omit<SearchStateDependencies, OmitDepsKey> &
  Omit<YjsStateDependencies, OmitDepsKey> & { isReadonly: boolean }

export function useProtonSheetsState(deps: ProtonSheetsStateDependencies) {
  const kv = useKeyValueState()

  const localeAccount = useAccountLocale()
  const localeAuto = useLocaleAuto()
  const localeResolved = kv.locale ?? localeAuto
  const localeCurrency = getCurrencyFromLocale(localeResolved)
  const localeCurrencySymbol = CURRENCY_SYMBOL({ currency: localeCurrency, locale: localeResolved })
  const locale = {
    account: localeAccount,
    auto: localeAuto,
    value: kv.locale ?? 'auto',
    resolved: localeResolved,
    currency: { code: localeCurrency, symbol: localeCurrencySymbol },
  }

  const onChangeHistory: UseSpreadsheetProps['onChangeHistory'] = (patches) => {
    if (deps.isReadonly) {
      console.error('Attempted to modify readonly spreadsheet')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    yjsState.onBroadcastPatch(patches)
  }

  const localState = useLocalSpreadsheetState()

  const onRequestFonts: (fonts: string[]) => Promise<void | undefined> = useEvent(async (fonts) => {
    await Promise.allSettled(fonts.map(loadFont))
  })

  const depsWithLocalState = { localState, onChangeHistory, onRequestFonts, ...deps }
  const spreadsheetState = useSpreadsheetState({ ...depsWithLocalState, locale: localeResolved })
  const canvasGridMethods = useSpreadsheet()

  const { scrollToCell, getCellOffsetFromCoords: _getCellOffsetFromCoords, getGridRef } = canvasGridMethods

  useEffect(() => {
    const xfsValues = localState.cellXfs?.values()
    if (!xfsValues) {
      console.error('No cellXfs values found')
      return
    }
    const fontFamiliesToRequest = new Set<string>()
    for (const xfs of xfsValues) {
      if (xfs?.textFormat?.fontFamily && !LoadedFontFamilies.has(xfs.textFormat.fontFamily)) {
        fontFamiliesToRequest.add(xfs.textFormat.fontFamily)
      }
    }
    if (fontFamiliesToRequest.size > 0) {
      onRequestFonts(Array.from(fontFamiliesToRequest)).catch(console.error)
    }
  }, [localState.cellXfs, onRequestFonts])

  const debouncedHandleFontLoaded = useMemo(
    () =>
      debounce(() => {
        requestAnimationFrame(() => {
          const grid = getGridRef?.()
          if (!grid) {
            return
          }
          grid.clearCache()
          grid.redrawGrid()
        })
      }, 150),
    [getGridRef],
  )
  useEffect(() => {
    const abortController = new AbortController()
    document.addEventListener('fontloaded', debouncedHandleFontLoaded, { signal: abortController.signal })
    return () => {
      abortController.abort()
    }
  }, [debouncedHandleFontLoaded])

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
  /**
   * Requires this wrapper function, otherwise the `ProtonSheetsUIStoreSetters` type
   * complains about `getCellOffsetFromCoords` being undefined
   */
  const getCellOffsetFromCoords = useCallback(
    (cell: CellInterface) => {
      return _getCellOffsetFromCoords?.(cell)
    },
    [_getCellOffsetFromCoords],
  )
  const getGridContainerElement = useCallback(() => {
    return getGridRef?.()?.container || null
  }, [getGridRef])
  const getGridScrollPosition = useCallback(() => {
    return getGridRef?.()?.getScrollPosition()
  }, [getGridRef])
  const getHyperlink = useCallback(
    (sheetId: number, rowIndex: number, columnIndex: number) => {
      return spreadsheetState.getCellData(sheetId, rowIndex, columnIndex)?.hyperlink
    },
    [spreadsheetState],
  )
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

  const { createNotification } = useNotifications()
  const onDeleteRow = useEvent((sheetId: number, rowIndexes: number[]) => {
    if (baseState.rowCount === rowIndexes.length) {
      createNotification({ text: c('sheets_2025:Spreadsheet editor').t`Cannot delete all rows`, type: 'error' })
      return
    }
    baseState.onDeleteRow(sheetId, rowIndexes)
  })
  const onDeleteColumn = useEvent((sheetId: number, columnIndexes: number[]) => {
    if (baseState.columnCount === columnIndexes.length) {
      createNotification({ text: c('sheets_2025:Spreadsheet editor').t`Cannot delete all columns`, type: 'error' })
      return
    }
    baseState.onDeleteColumn(sheetId, columnIndexes)
  })

  const goToCell = useEvent((sheetId: number, rowIndex: number, columnIndex: number) => {
    spreadsheetState.onChangeActiveSheet(sheetId)
    canvasGridMethods.scrollToCell?.({ rowIndex, columnIndex }, Align.center)
    canvasGridMethods.flash?.({
      startRowIndex: rowIndex,
      startColumnIndex: columnIndex,
      endRowIndex: rowIndex,
      endColumnIndex: columnIndex,
      sheetId,
    })
  })

  const onAddUserDefinedColor = useEvent((color: string) => {
    localState.onChangeUserDefinedColors((userDefinedColors) => [...userDefinedColors, color])
  })

  return {
    ...baseState,
    chartsState,
    searchState,
    yjsState,
    grid: canvasGridMethods,
    onSelectRange,
    onSelectNamedRange,
    onSelectTable,
    onCreateNewSheet,
    onDeleteRow,
    onDeleteColumn,
    getCellOffsetFromCoords,
    getGridContainerElement,
    getGridScrollPosition,
    getHyperlink,
    onRequestFonts,
    goToCell,
    onAddUserDefinedColor,
    kv,
    locale,
  }
}
export type ProtonSheetsState = ReturnType<typeof useProtonSheetsState>

// TODO: refactor into a lazy approach to avoid perf issues
export function useLocalState(
  state: ProtonSheetsState,
  updateLocalStateToLog: (stateToLog: LocalStateWithoutActions) => void,
) {
  const getLocalStateWithoutActions = useCallback(
    (): LocalStateWithoutActions => ({
      sheets: state.sheets,
      sheetData: state.sheetData,
      conditionalFormats: state.conditionalFormats,
      protectedRanges: state.protectedRanges,
      charts: state.charts,
      embeds: state.embeds,
      tables: state.tables,
      namedRanges: state.namedRanges,
      theme: state.theme,
      dataValidations: state.dataValidations,
      cellXfs: (state.cellXfs ? Object.fromEntries(state.cellXfs.entries()) : {}) as unknown as CellXfs,
      scale: state.scale,
      userDefinedColors: state.userDefinedColors,
      sharedStrings: state.sharedStrings,
    }),
    [
      state.cellXfs,
      state.charts,
      state.conditionalFormats,
      state.dataValidations,
      state.embeds,
      state.namedRanges,
      state.protectedRanges,
      state.scale,
      state.sheetData,
      state.sheets,
      state.tables,
      state.theme,
      state.userDefinedColors,
      state.sharedStrings,
    ],
  )

  const replaceLocalSpreadsheetState = useCallback(
    async (newState: object, broadcastPatches: boolean = true) => {
      useLocalSpreadsheetState.setState({
        ...(newState as LocalStateWithoutActions),
        cellXfs: 'cellXfs' in newState ? new Map(Object.entries(newState.cellXfs as object)) : undefined,
      })
      if (broadcastPatches) {
        const patches = await state.generateStatePatches()
        state.yjsState.onBroadcastPatch([[patches]])
      }
    },
    [state],
  )

  useEffect(() => {
    updateLocalStateToLog(getLocalStateWithoutActions())
  }, [getLocalStateWithoutActions, updateLocalStateToLog])

  return { getLocalStateWithoutActions, replaceLocalSpreadsheetState }
}

export type BaseSheet = {
  index?: number | null
  title: string
  hidden?: boolean | null
  sheetId: number
} & Record<string, any>

/**
 * Sort sheets by index
 * @param sheets
 * @returns
 */
export function sortSheetsByIndex<S extends BaseSheet>(sheets: S[], includeHidden?: boolean) {
  const seen = new Set<number>()
  const deduplicated: S[] = []

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i]
    if (!sheet) {
      continue
    }
    if (!includeHidden && sheet.hidden) {
      continue
    }
    if (seen.has(sheet.sheetId)) {
      continue
    }
    seen.add(sheet.sheetId)
    deduplicated.push(sheet)
  }

  // Find the maximum index among sheets that have an index defined
  const maxDefinedIndex = deduplicated.reduce((max, sheet) => {
    return sheet.index !== undefined && sheet.index !== null ? Math.max(max, sheet.index) : max
  }, -1)

  // Assign indices to sheets without one, starting after the max defined index
  let nextIndex = maxDefinedIndex + 1

  return deduplicated
    .map((sheet) => {
      return {
        ...sheet,
        index: sheet.index ?? nextIndex++,
      }
    })
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
}
