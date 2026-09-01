import type {
  DataTypesThatDocumentCanBeExportedAs,
  DocStateInterface,
  EditorInitializationConfig,
  EditorRequiresClientMethods,
  SheetImportData,
} from '@proton/docs-shared'
import { EditorSystemMode, SheetImportDestination, TranslatedResult } from '@proton/docs-shared'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { functions } from '@rowsncolumns/functions'
import { createCSVFromSheetData, createExcelFile, createODSFile } from '@rowsncolumns/toolkit'
import type { ForwardedRef } from 'react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { useLocalState, useProtonSheetsState, useVersioning } from './state'

import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import { Menubar } from './components/Menubar/Menubar'
import { Toolbar } from './components/Toolbar/Toolbar'
import { BottomBar } from './components/BottomBar/BottomBar'
import { Grid } from './components/Grid/Grid'
import { ProtonSheetsUIStoreProvider } from './ui-store'
import { Dialogs } from './components/Dialogs/Dialogs'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useFocusSheet } from '@rowsncolumns/spreadsheet'
import { EditingDisabledDialog } from './components/misc/EditingDisabledDialog'
import type { SpreadsheetConversionType } from '@proton/shared/lib/docs/constants'
import { CircleLoader } from './components/CircleLoader/CircleLoader'
import { c } from 'ttag'
import { useActiveBreakpoint } from './useActiveBreakpoint'

import type { SpreadsheetLocalYjsUpdateAuditResult } from './yjs-local-update-audit'
import { reportErrorToSentry } from '../../Utils/errorMessage'
import { useFeatureFlag } from './feature-flags'
import { useSheetsDependencies } from './SheetsDependenciesProvider'

export type SpreadsheetRef = {
  exportData: (format: DataTypesThatDocumentCanBeExportedAs) => Promise<Uint8Array<ArrayBuffer>>
  replaceLocalSpreadsheetState: (state: object, broadcastPatches: boolean) => void
  focusSheet: (() => void) | undefined
  generatePatches: () => Promise<unknown>
  applyPatches: (patches: unknown) => void
}

const splitExtension = (filename = '') => {
  const endIdx = filename.lastIndexOf('.')
  if (endIdx === -1) {
    return [filename, '']
  }
  return [filename.slice(0, endIdx), filename.slice(endIdx + 1)]
}

export type SpreadsheetProps = {
  docState: DocStateInterface
  hidden: boolean
  onEditorLoadResult: EditorLoadResult
  editorInitializationConfig: EditorInitializationConfig | undefined
  systemMode: EditorSystemMode
  editingLocked: boolean
  updateLocalStateToLog: (state: unknown) => void
  clientInvoker: EditorRequiresClientMethods
  isPublicMode: boolean
  shouldUseCustomYjsInitialization: boolean
}

export const Spreadsheet = forwardRef(function Spreadsheet(
  {
    docState,
    hidden,
    onEditorLoadResult,
    editorInitializationConfig,
    systemMode,
    editingLocked,
    updateLocalStateToLog,
    clientInvoker,
    isPublicMode,
    shouldUseCustomYjsInitialization,
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  const { canEdit, logger, storeSpreadsheetAction, subscribeToSheetImport, subscribeToCollaboratorCursorNavigation } =
    useSheetsDependencies()
  const { viewportWidth } = useActiveBreakpoint()

  const didConvertFromFile = useRef(false)
  const [importType, setImportType] = useState<'excel' | 'ods'>()

  // TODO: Consider refactoring these into a single derived mode "state"
  const isRevisionMode = systemMode === EditorSystemMode.Revision
  const isViewOnlyMode = !canEdit || viewportWidth['<=small']
  const isReadonly = editingLocked || isRevisionMode || isViewOnlyMode

  const isCreationOrConversion = !!editorInitializationConfig
  const canRunMigration = !isRevisionMode && canEdit && !isCreationOrConversion

  const handleYjsDriftDetected = useCallback(
    (result: SpreadsheetLocalYjsUpdateAuditResult, driftLogDetails: Record<string, unknown>) => {
      for (const difference of result.differences) {
        void clientInvoker.reportSheetsYjsDriftDetected(difference.reason)
      }
      const error = new Error(
        c('Error')
          .t`This spreadsheet detected a local syncing inconsistency. Editing has been disabled to prevent data loss. Please file a report and if you are okay with sharing the contents, download and include the debug information from below.`,
      )
      reportErrorToSentry(error, undefined, {
        driftResult: {
          localChangedKeys: result.localChangedKeys,
          observedYjsKeys: result.observedYjsKeys,
        },
      })
      void clientInvoker.showYjsDriftDetectedErrorModal(driftLogDetails)
    },
    [clientInvoker],
  )

  const pushPatches = useMemo(() => clientInvoker.storeSpreadsheetPatches.bind(clientInvoker), [clientInvoker])
  const hasBasePatchesStored = useMemo(() => clientInvoker.hasBasePatchesStored.bind(clientInvoker), [clientInvoker])
  const isPatchesStorageEnabled = useFeatureFlag('SheetsPatchesStorageEnabled')
  const isActionsStorageEnabled = useFeatureFlag('SheetsActionsStorageEnabled')
  const isDriftDetectionEnabled = useFeatureFlag('SheetsDriftDetectionEnabled')
  const storeAction = useMemo(
    () => (isActionsStorageEnabled ? storeSpreadsheetAction : () => {}),
    [isActionsStorageEnabled, storeSpreadsheetAction],
  )

  const state = useProtonSheetsState({
    docState,
    functions,
    isReadonly,
    isConversionFlow: editorInitializationConfig?.mode === 'conversion',
    pushPatches,
    hasBasePatchesStored,
    isPatchesStorageEnabled,
    isDriftDetectionEnabled,
    onYjsDriftDetected: handleYjsDriftDetected,
    storeAction,
    shouldUseCustomYjsInitialization,
  })
  const didSetInitialVersion = useRef(false)
  const { setInitialVersion } = useVersioning(
    canRunMigration,
    state,
    () => {
      void clientInvoker.reportUserInterfaceError(
        new Error(
          c('Error')
            .t`This spreadsheet is incompatible with the current client version. Please try reloading the client. If the error persists, please contact support.`,
        ),
        { irrecoverable: false, lockEditor: true },
      )
    },
    () => clientInvoker.reloadClient(),
  )
  const { replaceLocalSpreadsheetState } = useLocalState(state, updateLocalStateToLog)
  const focusSheet = useFocusSheet()

  const exportData = async (format: DataTypesThatDocumentCanBeExportedAs) => {
    if (format === 'yjs') {
      return docState.getDocState()
    }
    // Do a pass to check if all sheet data objects are present in the sheets list.
    // If not, we log a warning and add a missing sheet to the sheets list.
    const sheetIDs = state.sheets.map((sheet) => sheet.sheetId.toString())
    for (const sheetID of Object.keys(state.sheetData)) {
      if (!sheetIDs.includes(sheetID)) {
        logger.warn('Spreadsheet: object for sheet ID', sheetID, 'not found in sheets list')
        state.sheets.push({
          sheetId: parseInt(sheetID),
          title: `Sheet ${sheetID}`,
          hidden: false,
        })
      }
    }
    if (format === 'xlsx') {
      const buffer = await createExcelFile({
        ...state,
        cellXfs: state.cellXfs ?? undefined,
        locale: state.locale.resolved,
      })
      return new Uint8Array(buffer)
    }
    if (format === 'ods') {
      const buffer = await createODSFile({
        ...state,
        cellXfs: state.cellXfs ?? undefined,
      })
      return new Uint8Array(buffer)
    }
    if (format === 'csv') {
      const csv = createCSVFromSheetData(state.sheetData[state.activeSheetId], state.sharedStrings)
      return new TextEncoder().encode(csv)
    }
    if (format === 'tsv') {
      const tsv = createCSVFromSheetData(state.sheetData[state.activeSheetId], state.sharedStrings, {
        delimiter: '\t',
      })
      return new TextEncoder().encode(tsv)
    }
    throw new Error(`Spreadsheet cannot be exported to format ${format}`)
  }

  const { generateStatePatches } = state
  const getInitialSpreadsheetPatches = useCallback(async () => {
    const patches = await generateStatePatches()
    return patches
  }, [generateStatePatches])

  useImperativeHandle(ref, (): SpreadsheetRef => ({
    exportData,
    replaceLocalSpreadsheetState,
    focusSheet,
    generatePatches: getInitialSpreadsheetPatches,
    applyPatches: state.applyPatches,
  }))

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  const { onInsertFile, importExcelFile, importCSVFile, calculateNow, writeBasePatchIfNecessary } = state
  const handleExcelFileImport = useCallback(
    async (file: File, type: 'excel' | 'ods') => {
      setImportType(type)
      docState.startSheetsExcelImport()
      const { requiresRecalc } = await importExcelFile(file, {
        minRowCount: 1000,
        minColumnCount: 100,
        enableCellXfsRegistry: true,
        enabledSharedStrings: true,
      })
      const patches = await generateStatePatches()
      state.yjsState.onBroadcastPatch([[patches]])
      docState.endSheetsExcelImport()
      await docState.waitForImportSuccess()
      setImportType(undefined)
      await calculateNow({
        disableEvaluation: !requiresRecalc,
        shouldResetCellDependencyGraph: true,
      })
      void writeBasePatchIfNecessary().catch(console.error)
    },
    [calculateNow, docState, generateStatePatches, importExcelFile, state.yjsState, writeBasePatchIfNecessary],
  )
  useEffect(() => {
    if (!editorInitializationConfig) {
      return
    }
    const canConvertFile =
      editorInitializationConfig.mode === 'conversion' &&
      ['xlsx', 'csv', 'tsv', 'ods'].includes(editorInitializationConfig.type.dataType)
    const setInitialVersionIfNotSet = () => {
      if (!didSetInitialVersion.current) {
        didSetInitialVersion.current = true
        setInitialVersion()
      }
    }
    if (canConvertFile && !didConvertFromFile.current) {
      didConvertFromFile.current = true
      const file = new File([editorInitializationConfig.data], `import.${editorInitializationConfig.type.dataType}`, {
        type: SupportedProtonDocsMimeTypes[editorInitializationConfig.type.dataType as SpreadsheetConversionType],
      })
      const isExcelFile = editorInitializationConfig.type.dataType === 'xlsx'
      const isODSFile = editorInitializationConfig.type.dataType === 'ods'
      if (isExcelFile || isODSFile) {
        void handleExcelFileImport(file, isExcelFile ? 'excel' : 'ods').then(setInitialVersionIfNotSet)
      } else {
        docState.consumeIsInConversionFromOtherFormat()
        void importCSVFile(
          file,
          1,
          { rowIndex: 1, columnIndex: 1 },
          {
            preserveFormatting: true,
            replaceSheetData: true,
            enabledSharedStrings: true,
            enableCellXfsRegistry: true,
          },
        ).then(setInitialVersionIfNotSet)
      }
    } else {
      setInitialVersionIfNotSet()
    }
  }, [docState, editorInitializationConfig, handleExcelFileImport, importCSVFile, setInitialVersion])

  // TODO: document this effect
  const { onCreateNewSheet, onRenameSheet } = state
  useEffect(() => {
    return subscribeToSheetImport((data: SheetImportData) => {
      const isExcelFile = data.file.type === SupportedProtonDocsMimeTypes.xlsx
      const isODSFile = data.file.type === SupportedProtonDocsMimeTypes.ods
      if (isExcelFile || isODSFile) {
        void handleExcelFileImport(data.file, isExcelFile ? 'excel' : 'ods')
        return
      }
      let sheetId = undefined
      let cellCoords = undefined
      if (data.destination === SheetImportDestination.InsertAsNewSheet) {
        const newSheet = onCreateNewSheet()
        if (!newSheet) {
          return
        }
        const [name] = splitExtension(data.file.name)
        onRenameSheet(newSheet.sheetId, name, newSheet.title)
        sheetId = newSheet.sheetId
        cellCoords = { rowIndex: 1, columnIndex: 1 }
      }
      if (data.destination === SheetImportDestination.ReplaceCurrentSheet) {
        cellCoords = { rowIndex: 1, columnIndex: 1 }
      }
      onInsertFile(data.file, sheetId, cellCoords, {
        preserveFormatting: data.shouldConvertCellContents,
        replaceSheetData: data.destination === SheetImportDestination.ReplaceCurrentSheet,
        enabledSharedStrings: true,
        enableCellXfsRegistry: true,
      })
        .then(() => {
          calculateNow({
            shouldResetCellDependencyGraph: true,
          }).catch(console.error)
        })
        .catch(console.error)
    })
  }, [calculateNow, handleExcelFileImport, onCreateNewSheet, onInsertFile, onRenameSheet, subscribeToSheetImport])

  useEffect(() => {
    return subscribeToCollaboratorCursorNavigation((userState) => {
      state.goToCell(userState.sheetId, userState.activeCell.rowIndex, userState.activeCell.columnIndex)
    })
  }, [state, subscribeToCollaboratorCursorNavigation])

  if (importType) {
    return (
      <div className="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center gap-4">
        <CircleLoader size="large" />
        {importType === 'excel' && <p className="text-sm">{c('Info').t`Importing Excel file...`}</p>}
        {importType === 'ods' && <p className="text-sm">{c('Info').t`Importing ODS file...`}</p>}
      </div>
    )
  }

  return (
    <ProtonSheetsUIStoreProvider
      state={state}
      isReadonly={isReadonly}
      isRevisionMode={isRevisionMode}
      isViewOnlyMode={isViewOnlyMode}
      storeAction={storeAction}
    >
      <UI hidden={hidden} isRevisionMode={isRevisionMode} isPublicMode={isPublicMode} />
    </ProtonSheetsUIStoreProvider>
  )
})

type UIProps = {
  hidden: boolean
  isRevisionMode: boolean
  isPublicMode: boolean
}

function UI({ hidden, isRevisionMode, isPublicMode }: UIProps) {
  return (
    <>
      {hidden && (
        <div
          className="absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F9FBFC]"
          data-testid="editor-curtain"
        />
      )}
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#F9FBFC] [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && <Menubar className="mx-[1.125rem] shrink-0 max-sm:hidden" isPublicMode={isPublicMode} />}

        <div className="flex min-h-0 min-w-0 grow">
          <div className="isolate z-10 flex h-full min-h-0 grow flex-col">
            {!isRevisionMode && <Toolbar className="m-2 max-sm:m-0" />}
            <Grid />
            <BottomBar />
            <Dialogs />
            <EditingDisabledDialog />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  )
}
