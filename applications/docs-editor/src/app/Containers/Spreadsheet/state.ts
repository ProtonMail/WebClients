import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'

import type {
  CellXfs,
  SharedStrings,
  SheetData,
  SpreadsheetPatch,
  UseSpreadsheetProps,
} from '@rowsncolumns/spreadsheet-state'
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
import { DocProvider } from '@proton/docs-shared'
import { useSyncedState } from '../../Hooks/useSyncedState'
import { create, useStore } from 'zustand'
import { useEvent } from './components/utils'
import { useNotifications } from '@proton/components'
import { c } from 'ttag'
import { LoadedFontFamilies, loadFont } from './font-state'
import debounce from 'lodash/debounce'
import { getAccentColorForUsername } from '@proton/atoms/UserAvatar/getAccentColorForUsername'
import type { Doc as YDoc, Transaction } from 'yjs'
import { getCurrencyFromLocale, useAccountLocale, useLocaleAuto } from './locale'
import { CURRENCY_SYMBOL } from './constants'
import { minutes_to_ms, seconds_to_ms } from '@proton/docs-core/lib/Util/time-utils'
import { useEditorState } from '../EditorStateProvider'
import { useApplication } from '../ApplicationProvider'
import { getBufferHash } from '@proton/docs-core/lib/utils/hash'
import { applyPatches as applyPatchesImmer } from 'immer'
import { SheetsPatchesType } from '@proton/docs-core/lib/Database/SheetsDBSchema'
import type { SpreadsheetLocalYjsAuditKey, SpreadsheetLocalYjsUpdateAuditResult } from './yjs-local-update-audit'
import { detectLocalYjsUpdateDrift, recordSpreadsheetLocalStateChange } from './yjs-local-update-audit'
import { formatSpreadsheetYjsDriftLogDetails } from './yjs-drift-log'

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
  sharedStrings: SharedStrings

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
  onChangeSharedStrings: SetState<SharedStrings>
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
type LocalStateStoreSetter = (partial: (state: LocalState) => Partial<LocalState>) => void
function createAuditedLocalStateSetter<Key extends SpreadsheetLocalYjsAuditKey>(
  key: Key,
  set: LocalStateStoreSetter,
): SetState<LocalState[Key]> {
  return (updateAction) => {
    set((state) => {
      const previousValue = state[key]
      const nextValue = getValueFromUpdateAction(updateAction, previousValue)
      recordSpreadsheetLocalStateChange(key, previousValue, nextValue)
      return { [key]: nextValue } as Partial<LocalState>
    })
  }
}
// TODO: this shouldn't be a singleton
const useLocalSpreadsheetState = create<LocalState>()((set) => {
  const auditedSet = set as LocalStateStoreSetter

  return {
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
    sharedStrings: new Map(),

    onChangeSheets: createAuditedLocalStateSetter('sheets', auditedSet),
    onChangeSheetData: createAuditedLocalStateSetter('sheetData', auditedSet),
    onChangeTheme: (theme) => set((state) => ({ theme: getValueFromUpdateAction(theme, state.theme) })),
    onChangeTables: createAuditedLocalStateSetter('tables', auditedSet),
    onChangeNamedRanges: createAuditedLocalStateSetter('namedRanges', auditedSet),
    onChangeConditionalFormats: createAuditedLocalStateSetter('conditionalFormats', auditedSet),
    onChangeEmbeds: createAuditedLocalStateSetter('embeds', auditedSet),
    onChangeDataValidations: createAuditedLocalStateSetter('dataValidations', auditedSet),
    onChangeCharts: createAuditedLocalStateSetter('charts', auditedSet),
    onChangeProtectedRanges: createAuditedLocalStateSetter('protectedRanges', auditedSet),
    onChangeCellXfs: createAuditedLocalStateSetter('cellXfs', auditedSet),
    onChangeScale: (scale) => set((state) => ({ scale: getValueFromUpdateAction(scale, state.scale) })),
    onChangeUserDefinedColors: (userDefinedColors) =>
      set((state) => ({ userDefinedColors: getValueFromUpdateAction(userDefinedColors, state.userDefinedColors) })),
    onChangeSharedStrings: createAuditedLocalStateSetter('sharedStrings', auditedSet),
  }
})

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
  version: number | undefined
  migrationClientId: [number, number] | undefined
}
type KVStateValue = KeyValueState[keyof KeyValueState]

const useKeyValueState = create<KeyValueState>()((set) => ({
  defaultCurrency: undefined,
  locale: undefined,
  version: undefined,
  migrationClientId: undefined,
}))

// Yjs state
// ---------

type YjsStateDependencies = {
  localState: LocalState
  spreadsheetState: SpreadsheetState
  docState: DocStateInterface
  // Fires (via the y-spreadsheet onAfterBroadcastPatch hook) inside the broadcast
  // transaction once local patches are applied to the doc; used to detect drift.
  onAfterBroadcastPatch?: (patches: unknown, doc: YDoc) => void
}

function useYjsState({ localState, spreadsheetState, docState, onAfterBroadcastPatch }: YjsStateDependencies) {
  const { userName, receivedEverythingFromRTS } = useSyncedState()
  const provider = useMemo(() => {
    const provider = new DocProvider(docState)
    // useYSpreadsheet checks for either a "synced" event from the provider
    // or for a true `synced` property before it starts listening to changes
    // to the doc
    provider.synced = true
    return provider
  }, [docState])
  const yDoc = useMemo(() => docState.getDoc(), [docState])

  const logger = useApplication().application.logger
  const ySheets = useMemo(() => yDoc.getArray<Sheet>('sheets'), [yDoc])
  const handledInitialLoad = useRef(false)
  const { onChangeActiveSheet, calculateNow } = spreadsheetState
  useEffect(
    function handleInitialLoad() {
      if (!receivedEverythingFromRTS) {
        return
      }
      logger.info('handleInitialLoad: received everything from RTS')
      if (handledInitialLoad.current) {
        return
      }
      // After receiving base commit, change the active sheet to the first sheet.
      // RnC does try to do this, but it doesn't work with our setup as when it tries
      // to do this, it will not have received the initial update yet.
      const sheets = ySheets.toJSON()
      if (sheets.length) {
        const firstSheetId = sortSheetsByIndex(sheets)[0].sheetId
        logger.info(`handleInitialLoad: changing active sheet to ${firstSheetId}`)
        onChangeActiveSheet(firstSheetId)
      }
      requestAnimationFrame(async () => {
        await calculateNow({
          disableEvaluation: true,
          shouldResetCellDependencyGraph: true,
        })
      })
      handledInitialLoad.current = true
    },
    [calculateNow, logger, onChangeActiveSheet, receivedEverythingFromRTS, ySheets],
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

    skipInitialSync: true,
    supportLegacySharedStringsArray: true,
    onAfterBroadcastPatch,
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

  const kv = useMemo(() => yDoc.getMap<KVStateValue>('kv'), [yDoc])
  useEffect(() => {
    function handleKVChange(_: unknown, transaction: Transaction) {
      if (transaction.origin !== 'local') {
        useKeyValueState.setState(kv.toJSON())
      }
    }
    kv.observeDeep(handleKVChange)
    return () => kv.unobserveDeep(handleKVChange)
  }, [kv])
  const kvSet = useEvent(
    <Key extends keyof KeyValueState, Value extends KeyValueState[Key]>(key: Key, value: Value) => {
      useKeyValueState.setState({ [key]: value })
      yDoc.transact(() => {
        kv.set(key, value)
      }, 'local')
    },
  ) satisfies <Key extends keyof KeyValueState, Value extends KeyValueState[Key]>(key: Key, value: Value) => void

  return { ...yjsState, userName, users: usersWithCorrectColor, kvSet, clientID: yDoc.clientID }
}

// proton sheets state
// -------------------

function applyPatchToLocalState(patches: SpreadsheetPatch) {
  useLocalSpreadsheetState.setState((state) => {
    const newState = {
      ...state,
      sheetData: patches.sheetData ? applyPatchesImmer(state.sheetData, patches.sheetData.patches) : state.sheetData,
      sheets: patches.sheets ? applyPatchesImmer(state.sheets, patches.sheets.patches) : state.sheets,
      protectedRanges: patches.protectedRanges
        ? applyPatchesImmer(state.protectedRanges, patches.protectedRanges.patches)
        : state.protectedRanges,
      conditionalFormats: patches.conditionalFormats
        ? applyPatchesImmer(state.conditionalFormats, patches.conditionalFormats.patches)
        : state.conditionalFormats,
      dataValidations: patches.dataValidations
        ? applyPatchesImmer(state.dataValidations, patches.dataValidations.patches)
        : state.dataValidations,
      tables: patches.tables ? applyPatchesImmer(state.tables, patches.tables.patches) : state.tables,
      namedRanges: patches.namedRanges
        ? applyPatchesImmer(state.namedRanges, patches.namedRanges.patches)
        : state.namedRanges,
      charts: patches.charts ? applyPatchesImmer(state.charts, patches.charts.patches) : state.charts,
      embeds: patches.embeds ? applyPatchesImmer(state.embeds, patches.embeds.patches) : state.embeds,
      cellXfs:
        state.cellXfs && patches.cellXfs ? applyPatchesImmer(state.cellXfs, patches.cellXfs.patches) : state.cellXfs,
      sharedStrings: patches.sharedStrings
        ? applyPatchesImmer(state.sharedStrings, patches.sharedStrings.patches)
        : state.sharedStrings,
    }
    if (!(newState.cellXfs instanceof Map)) {
      newState.cellXfs = state.cellXfs
    }
    if (!(newState.sharedStrings instanceof Map)) {
      newState.sharedStrings = state.sharedStrings
    }
    return newState
  })
}

type OmitDepsKey = 'localState' | 'spreadsheetState' | 'onChangeHistory' | 'locale' | 'onHandledInitialLoad'
type ProtonSheetsStateDependencies = Omit<SpreadsheetStateDependencies, OmitDepsKey> &
  Omit<ChartsStateDependencies, OmitDepsKey> &
  Omit<SearchStateDependencies, OmitDepsKey> &
  Omit<YjsStateDependencies, OmitDepsKey> & {
    isReadonly: boolean
    isConversionFlow: boolean
    pushPatches: (patches: unknown, updateHash: string, type?: SheetsPatchesType) => void
    hasBasePatchesStored: () => Promise<boolean>
    // Gates the Yjs drift detection (SheetsDriftDetectionEnabled feature flag). When false,
    // local updates propagate without the dry-run audit/guard (original behavior).
    isDriftDetectionEnabled: boolean
    onYjsDriftDetected?: (result: SpreadsheetLocalYjsUpdateAuditResult) => void
    isPatchesStorageEnabled: boolean
  }

export function useProtonSheetsState(deps: ProtonSheetsStateDependencies) {
  const { application } = useApplication()
  const kv = useKeyValueState()
  const hasBlockedYjsDrift = useRef(false)

  // Drift detection: the y-spreadsheet onAfterBroadcastPatch hook fires inside the broadcast
  // transaction (patches applied to the doc). We compute the local-vs-doc drift there and stash
  // it so onChangeHistory's update guard can block propagation before it reaches RTS.
  const pendingDriftResult = useRef<SpreadsheetLocalYjsUpdateAuditResult | null>(null)
  const auditNextBroadcast = useRef(false)
  const handleAfterBroadcastPatch = useEvent((patches: unknown, doc: YDoc) => {
    if (!auditNextBroadcast.current) {
      return
    }
    try {
      pendingDriftResult.current = detectLocalYjsUpdateDrift({
        doc,
        getLocalState: () => useLocalSpreadsheetState.getState(),
        patches,
      })
    } catch (error) {
      pendingDriftResult.current = null
      console.error('[sheets-yjs-drift] failed to audit outgoing Yjs update', error)
      application.logger.error('[sheets-yjs-drift] failed to audit outgoing Yjs update')
    }
  })

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

  const latestPatches = useRef<Parameters<NonNullable<UseSpreadsheetProps['onChangeHistory']>>[0][]>([])
  const { pushPatches, hasBasePatchesStored } = deps
  const wroteBasePatch = useRef(false)
  const writeBasePatchIfNecessary = useCallback(async () => {
    // Only the first caller that sees no base patch claims the write.
    if (!wroteBasePatch.current) {
      const hasBasePatches = await hasBasePatchesStored()
      // Re-check the ref after the await in case another update claimed it
      // while we were waiting on the IndexedDB round-trip.
      if (!hasBasePatches && !wroteBasePatch.current) {
        wroteBasePatch.current = true // set synchronously before the async write
        const baseState = { ...useLocalSpreadsheetState.getState() }
        for (const key of Object.keys(baseState)) {
          if (typeof baseState[key as keyof LocalState] === 'function') {
            delete baseState[key as keyof LocalState]
          }
          if ((key === 'cellXfs' || key === 'sharedStrings') && baseState[key]) {
            ;(baseState as any)[key] = Object.fromEntries(baseState[key].entries()) as unknown as
              | CellXfs
              | SharedStrings
          }
        }
        pushPatches([[structuredClone(baseState), null]], '', SheetsPatchesType.Base)
      }
    }
  }, [hasBasePatchesStored, pushPatches])
  const pushLatestPatches = useEvent(async (update?: Uint8Array<ArrayBuffer>, type?: SheetsPatchesType) => {
    if (!deps.isPatchesStorageEnabled) {
      return
    }
    const patches = structuredClone(latestPatches.current.shift())
    if (patches) {
      await writeBasePatchIfNecessary()
      let hash = ''
      if (update) {
        hash = await getBufferHash(update)
      }
      pushPatches(patches, hash, type)
    }
  })

  const onChangeHistory: UseSpreadsheetProps['onChangeHistory'] = (patches) => {
    if (deps.isReadonly && !deps.isConversionFlow) {
      console.error('Attempted to modify readonly spreadsheet')
      return
    }
    latestPatches.current.push(patches)

    if (!deps.isDriftDetectionEnabled) {
      // SheetsDriftDetectionEnabled is off: propagate the local Yjs update without the
      // dry-run audit/guard. The audit never begins, so no setter/observer enters audit mode.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      yjsState.onBroadcastPatch(patches)
      return
    }

    if (hasBlockedYjsDrift.current) {
      return
    }

    // The onAfterBroadcastPatch hook (fired inside the broadcast transaction below) computes
    // the drift result into pendingDriftResult; the update guard then reads it to decide
    // whether the resulting Yjs update may propagate to RTS.
    pendingDriftResult.current = null
    auditNextBroadcast.current = true
    let didRunGuardCheck = false

    const shouldPropagateCurrentUpdate = () => {
      didRunGuardCheck = true
      if (hasBlockedYjsDrift.current) {
        return false
      }

      const driftResult = pendingDriftResult.current
      if (!driftResult || driftResult.differences.length === 0) {
        return true
      }

      const driftLogDetails = formatSpreadsheetYjsDriftLogDetails({
        differences: driftResult.differences,
        localChangedKeys: driftResult.localChangedKeys,
        observedYjsKeys: driftResult.observedYjsKeys,
        patches,
      })
      console.error(
        '[sheets-yjs-drift] blocked outgoing Yjs update because local state and the broadcast Yjs doc drifted',
        {
          ...driftLogDetails,
        },
      )
      console.error('[sheets-yjs-drift] local Yjs drift details', JSON.stringify(driftLogDetails, null, 2))
      hasBlockedYjsDrift.current = true
      application.logger.error(
        '[sheets-yjs-drift] blocked outgoing Yjs update because local state and the broadcast Yjs doc drifted',
      )
      deps.onYjsDriftDetected?.(driftResult)
      pushLatestPatches(undefined, SheetsPatchesType.Drifted).catch(console.error)
      return false
    }

    try {
      deps.docState.runWithDocumentUpdateGuard(shouldPropagateCurrentUpdate, () => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        yjsState.onBroadcastPatch(patches)
      })

      // If the broadcast produced no Yjs update the guard never ran; run the check once so
      // omitted-key drift the hook surfaced is still handled.
      if (!didRunGuardCheck) {
        shouldPropagateCurrentUpdate()
      }
    } finally {
      auditNextBroadcast.current = false
    }
  }

  /**
   * NOTE: This only applies patches to the local state. None of the changes
   * are persisted to the Yjs state. Currently only usable for debugging.
   */
  const applyPatches = useEvent((patchesArray: unknown) => {
    if (!patchesArray || !Array.isArray(patchesArray)) {
      console.error('Invalid patches', patchesArray)
      return
    }
    for (const p of patchesArray) {
      if (p.type === 0) {
        // base patch
        const baseState = p.patches[0][0]
        useLocalSpreadsheetState.setState({
          ...(baseState as LocalStateWithoutActions),
          cellXfs: 'cellXfs' in baseState ? new Map(Object.entries(baseState.cellXfs as object)) : new Map(),
          sharedStrings:
            'sharedStrings' in baseState ? new Map(Object.entries(baseState.sharedStrings as object)) : new Map(),
        })
      } else {
        // delta patch
        const patches = p.patches[0][0] as SpreadsheetPatch
        applyPatchToLocalState(patches)
      }
    }
  })

  const localState = useLocalSpreadsheetState()

  const onRequestFonts: (fonts: string[]) => Promise<void | undefined> = useEvent(async (fonts) => {
    await Promise.allSettled(fonts.map(loadFont))
  })

  const depsWithLocalState = { localState, onChangeHistory, onRequestFonts, ...deps }
  const spreadsheetState = useSpreadsheetState({ ...depsWithLocalState, locale: localeResolved })
  const canvasGridMethods = useSpreadsheet()

  useEffect(() => {
    if (!deps.isPatchesStorageEnabled) {
      return
    }
    async function handleUpdatePropagation(update: Uint8Array<ArrayBuffer>) {
      await pushLatestPatches(update)
    }
    deps.docState.addUpdatePropagationListener(handleUpdatePropagation)
    return () => {
      deps.docState.removeUpdatePropagationListener(handleUpdatePropagation)
    }
  }, [
    deps.docState,
    hasBasePatchesStored,
    pushLatestPatches,
    pushPatches,
    writeBasePatchIfNecessary,
    deps.isPatchesStorageEnabled,
  ])

  const previousLocaleResolved = useRef(localeResolved)
  const { receivedEverythingFromRTS } = useSyncedState()
  useLayoutEffect(() => {
    if (receivedEverythingFromRTS && previousLocaleResolved.current !== localeResolved) {
      previousLocaleResolved.current = localeResolved
      spreadsheetState.onChangeLocale(localeResolved)
    }
  }, [localeResolved, receivedEverythingFromRTS, spreadsheetState])

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

  const depsWithBaseState = {
    spreadsheetState,
    ...depsWithLocalState,
    onAfterBroadcastPatch: handleAfterBroadcastPatch,
  }
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
    applyPatches,
    writeBasePatchIfNecessary,
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
      sharedStrings: (state.sharedStrings
        ? Object.fromEntries(state.sharedStrings.entries())
        : {}) as unknown as SharedStrings,
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
        cellXfs: 'cellXfs' in newState ? new Map(Object.entries(newState.cellXfs as object)) : new Map(),
        sharedStrings:
          'sharedStrings' in newState ? new Map(Object.entries(newState.sharedStrings as object)) : new Map(),
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

// versioning
// ----------

const LOCK_START_THRESHOLD = seconds_to_ms(2.5)
const MAX_LOCK_DURATION = minutes_to_ms(5)
const CLIENT_VERSION = 2

const versionToMigrationMap: Record<number, (state: ProtonSheetsState) => void> = {
  2: (state) => {
    // Required because of a change upstream to make certain conditional formatting
    // comparators (e.g. number_eq) be calculated asynchronously instead of blocking,
    // to achieve parity with excel. These only need to be called once as the results
    // are then stored in the yjs state.
    state.evaluateConditionalFormatting(state.conditionalFormats)
    state.evaluateDataValidations(state.dataValidations)
  },
}

export function useVersioning(
  canRunMigration: boolean,
  state: ProtonSheetsState,
  handleIncompatibleClientVersion: () => void,
  reloadClient: () => void,
) {
  const { application } = useApplication()
  const logger = application.logger
  const editorState = useEditorState()
  const setEditingLocked = useStore(editorState, (state) => state.setEditingLocked)
  const setIsMigrating = useStore(editorState, (state) => state.setIsMigrating)
  const { receivedEverythingFromRTS } = useSyncedState()
  const version = useKeyValueState((state) => state.version)
  const { kvSet, clientID } = state.yjsState
  const startThresholdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lockDurationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setInitialVersion = useEvent(() => {
    if (version === undefined) {
      logger.info('versioning: setting initial version', CLIENT_VERSION)
      kvSet('version', CLIENT_VERSION)
    }
  })

  const migrationEvent = useEvent(() => {
    const existingMigrationClientId = useKeyValueState.getState().migrationClientId
    if (existingMigrationClientId) {
      const isStale = Date.now() - existingMigrationClientId[1] > MAX_LOCK_DURATION
      if (!isStale) {
        logger.warn('versioning: migration client id already set', existingMigrationClientId)
        return
      }
    }
    const migrationClientId: [number, number] = [clientID, Date.now()]
    logger.info('versioning: requires migration, setting migration client id', migrationClientId)
    kvSet('migrationClientId', migrationClientId)
  })

  const startThresholdReachedEvent = useEvent(() => {
    const migrationClientId = useKeyValueState.getState().migrationClientId
    if (!migrationClientId) {
      logger.warn('versioning: start threshold reached, but no migration client id set')
      return
    }
    if (migrationClientId[0] !== clientID) {
      logger.warn('versioning: start threshold reached, but migration client id does not match')
      return
    }
    logger.info('versioning: reached migration threshold')
    const currentVersion = useKeyValueState.getState().version ?? 0
    for (let i = currentVersion + 1; i <= CLIENT_VERSION; i++) {
      const migrationFunction = versionToMigrationMap[i]
      if (migrationFunction) {
        migrationFunction(state)
      }
    }
    logger.info('versioning: setting version')
    kvSet('version', CLIENT_VERSION)
    kvSet('migrationClientId', undefined)
  })

  const lockRequestedEvent = useEvent(() => {
    setIsMigrating(true)
    setEditingLocked(true)
    if (startThresholdTimeout.current) {
      clearTimeout(startThresholdTimeout.current)
    }
    if (lockDurationTimeout.current) {
      clearTimeout(lockDurationTimeout.current)
    }

    const migrationClientId = useKeyValueState.getState().migrationClientId
    if (!migrationClientId) {
      logger.warn('versioning: lock requested, but no migration client id set')
      return
    }

    startThresholdTimeout.current = setTimeout(startThresholdReachedEvent, LOCK_START_THRESHOLD)

    const maxTimestamp = migrationClientId[1] + MAX_LOCK_DURATION
    const remainingDuration = Math.max(0, maxTimestamp - Date.now())
    lockDurationTimeout.current = setTimeout(() => {
      logger.info('versioning: reached max lock duration, clearing migration client id')
      kvSet('migrationClientId', undefined)
    }, remainingDuration)
  })

  const lockClearedEvent = useEvent(() => {
    logger.info('versioning: lock cleared, unlocking editor')
    setIsMigrating(false)
    setEditingLocked(false)

    if (lockDurationTimeout.current) {
      clearTimeout(lockDurationTimeout.current)
    }
    if (startThresholdTimeout.current) {
      clearTimeout(startThresholdTimeout.current)
    }
  })

  const incompatibleClientVersionEvent = useEvent(() => {
    const versionTargetToReloadFor = localStorage.getItem('versionTargetToReloadFor')
    if (versionTargetToReloadFor !== null) {
      const versionTargetToReloadForNumber = Number(versionTargetToReloadFor)
      if (version !== versionTargetToReloadForNumber) {
        logger.error('versioning: client version is still incompatible after reload')
        handleIncompatibleClientVersion()
      }
      localStorage.removeItem('versionTargetToReloadFor')
    } else {
      logger.info('versioning: doc version is newer than client version, reloading')
      localStorage.setItem('versionTargetToReloadFor', CLIENT_VERSION.toString())
      void reloadClient()
    }
  })

  useEffect(() => {
    if (!canRunMigration) {
      return
    }
    logger.info('versioning: checking for migration', { receivedEverythingFromRTS, version })
    if (!receivedEverythingFromRTS) {
      return
    }
    const docVersion = version ?? 0
    if (CLIENT_VERSION > docVersion) {
      migrationEvent()
    }
    if (CLIENT_VERSION < docVersion) {
      incompatibleClientVersionEvent()
    }
  }, [canRunMigration, incompatibleClientVersionEvent, logger, migrationEvent, receivedEverythingFromRTS, version])

  const kvChangeHandler = useEvent((current, previous) => {
    if (!canRunMigration) {
      return
    }
    if (previous.migrationClientId && !current.migrationClientId) {
      lockClearedEvent()
      return
    }
    if (current.migrationClientId) {
      logger.info('versioning: lock requested', current.migrationClientId)
      lockRequestedEvent()
      return
    }
  })

  useEffect(() => useKeyValueState.subscribe(kvChangeHandler), [kvChangeHandler])

  return { setInitialVersion }
}
