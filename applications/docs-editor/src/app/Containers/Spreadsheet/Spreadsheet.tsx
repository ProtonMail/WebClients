/* eslint-disable monorepo-cop/no-relative-import-outside-package */

import type { EditorControllerInterface } from '@proton/docs-core'
import type {
  DataTypesThatDocumentCanBeExportedAs,
  DocStateInterface,
  EditorInitializationConfig,
  EditorRequiresClientMethods,
  SheetImportData,
  SheetsUserState,
} from '@proton/docs-shared'
import { EditorSystemMode, SheetImportDestination, SheetImportEvent, TranslatedResult } from '@proton/docs-shared'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { splitExtension } from '@proton/shared/lib/helpers/file'
import { functions } from '@rowsncolumns/functions'
import { createCSVFromSheetData, createExcelFile, createODSFile } from '@rowsncolumns/toolkit'
import type { ForwardedRef } from 'react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { downloadLogsAsJSON } from '../../../../../docs/src/app/utils/downloadLogs'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { useApplication } from '../ApplicationProvider'
import { LOCALE } from './constants'
import { type ProtonSheetsState, useLocalState, useProtonSheetsState } from './state'

import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import { Menubar } from './components/Menubar/Menubar'
import { Toolbar } from './components/Toolbar/Toolbar'
import { BottomBar } from './components/BottomBar/BottomBar'
import { LegacyBottomBar } from './components/legacy/LegacyBottomBar'
import { LegacyDialogs } from './components/legacy/LegacyDialogs'
import { LegacyGrid } from './components/legacy/LegacyGrid'
import { LegacyToolbar } from './components/legacy/LegacyToolbar'
import { ProtonSheetsUIStoreProvider } from './ui-store'
import { useNewUIEnabled } from './new-ui-enabled'
import { Dialogs } from './components/Dialogs/Dialogs'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useFocusSheet } from '@rowsncolumns/spreadsheet'
import { useActiveBreakpoint } from '@proton/components'
import { EditingDisabledDialog } from './components/misc/EditingDisabledDialog'
import type { SpreadsheetConversionType } from '@proton/shared/lib/docs/constants'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { c } from 'ttag'

export type SpreadsheetRef = {
  exportData: (format: DataTypesThatDocumentCanBeExportedAs) => Promise<Uint8Array<ArrayBuffer>>
  replaceLocalSpreadsheetState: (state: object, broadcastPatches: boolean) => void
  focusSheet: (() => void) | undefined
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
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  const { application } = useApplication()
  const { viewportWidth } = useActiveBreakpoint()

  const didConvertFromFile = useRef(false)
  const [importType, setImportType] = useState<'excel' | 'ods'>()

  // TODO: Consider refactoring these into a single derived mode "state"
  const isRevisionMode = systemMode === EditorSystemMode.Revision
  const isViewOnlyMode = !application.getRole().canEdit() || viewportWidth['<=small']
  const isReadonly = editingLocked || isRevisionMode || isViewOnlyMode

  const state = useProtonSheetsState({ docState, locale: LOCALE, functions, isReadonly })
  const { getLocalStateWithoutActions, replaceLocalSpreadsheetState } = useLocalState(state, updateLocalStateToLog)
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
        application.logger.warn('Spreadsheet: object for sheet ID', sheetID, 'not found in sheets list')
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
      return stringToUint8Array(csv)
    }
    if (format === 'tsv') {
      const tsv = createCSVFromSheetData(state.sheetData[state.activeSheetId], state.sharedStrings, {
        delimiter: '\t',
      })
      return stringToUint8Array(tsv)
    }
    throw new Error(`Spreadsheet cannot be exported to format ${format}`)
  }
  useImperativeHandle(ref, (): SpreadsheetRef => ({ exportData, replaceLocalSpreadsheetState, focusSheet }))

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  const { onInsertFile, importExcelFile, importCSVFile, generateStatePatches, calculateNow } = state
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
      calculateNow({
        disableEvaluation: requiresRecalc,
        shouldResetCellDependencyGraph: true,
      })
    },
    [calculateNow, docState, generateStatePatches, importExcelFile, state.yjsState],
  )
  useEffect(() => {
    const canConvertFile =
      editorInitializationConfig &&
      editorInitializationConfig.mode === 'conversion' &&
      ['xlsx', 'csv', 'tsv', 'ods'].includes(editorInitializationConfig.type.dataType)
    if (canConvertFile && !didConvertFromFile.current) {
      didConvertFromFile.current = true
      const file = new File([editorInitializationConfig.data], `import.${editorInitializationConfig.type.dataType}`, {
        type: SupportedProtonDocsMimeTypes[editorInitializationConfig.type.dataType as SpreadsheetConversionType],
      })
      const isExcelFile = editorInitializationConfig.type.dataType === 'xlsx'
      const isODSFile = editorInitializationConfig.type.dataType === 'ods'
      if (isExcelFile || isODSFile) {
        void handleExcelFileImport(file, isExcelFile ? 'excel' : 'ods')
      } else {
        void importCSVFile(file)
      }
    }
  }, [editorInitializationConfig, handleExcelFileImport, importCSVFile])

  // TODO: document this effect
  const { onCreateNewSheet, onRenameSheet } = state
  useEffect(
    () =>
      application.eventBus.addEventCallback((data: SheetImportData) => {
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
        })
          .then(() => {
            calculateNow({
              shouldResetCellDependencyGraph: true,
            })
          })
          .catch(console.error)
      }, SheetImportEvent),
    [
      application.eventBus,
      calculateNow,
      handleExcelFileImport,
      importExcelFile,
      onCreateNewSheet,
      onInsertFile,
      onRenameSheet,
    ],
  )

  useEffect(() => {
    return application.syncedState.subscribeToEvent('ScrollToUserCursorData', (data) => {
      const userState = data.state as unknown as SheetsUserState
      state.goToCell(userState.sheetId, userState.activeCell.rowIndex, userState.activeCell.columnIndex)
    })
  }, [application.syncedState, state])

  const downloadLogs = () => {
    const editorAdapter = {
      async getYDocAsJSON() {
        return docState.getDoc().toJSON()
      },
      async getLocalSpreadsheetStateJSON() {
        return getLocalStateWithoutActions()
      },
    } as Pick<EditorControllerInterface, 'getYDocAsJSON' | 'getLocalSpreadsheetStateJSON'>

    downloadLogsAsJSON(editorAdapter as EditorControllerInterface, 'sheet').catch(console.error)
  }

  const isNewUIEnabled = useNewUIEnabled()

  if (importType) {
    return (
      <div className="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center gap-4">
        <CircleLoader size="large" />
        {importType === 'excel' && <p className="text-sm">{c('Info').t`Importing Excel file...`}</p>}
        {importType === 'ods' && <p className="text-sm">{c('Info').t`Importing ODS file...`}</p>}
      </div>
    )
  }

  if (isNewUIEnabled) {
    return (
      <ProtonSheetsUIStoreProvider
        state={state}
        isReadonly={isReadonly}
        isRevisionMode={isRevisionMode}
        isViewOnlyMode={isViewOnlyMode}
      >
        <UI hidden={hidden} isRevisionMode={isRevisionMode} clientInvoker={clientInvoker} isPublicMode={isPublicMode} />
      </ProtonSheetsUIStoreProvider>
    )
  }

  return (
    <ProtonSheetsUIStoreProvider
      state={state}
      isReadonly={isReadonly}
      isRevisionMode={isRevisionMode}
      isViewOnlyMode={isViewOnlyMode}
    >
      <LegacyUI
        hidden={hidden}
        state={state}
        isReadonly={isReadonly}
        isRevisionMode={isRevisionMode}
        downloadLogs={downloadLogs}
      />
    </ProtonSheetsUIStoreProvider>
  )
})

type UIProps = {
  hidden: boolean
  isRevisionMode: boolean
  clientInvoker: EditorRequiresClientMethods
  isPublicMode: boolean
}

function UI({ hidden, isRevisionMode, clientInvoker, isPublicMode }: UIProps) {
  return (
    <>
      {hidden && (
        <div
          className="absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F9FBFC]"
          data-testid="editor-curtain"
        />
      )}
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-[#F9FBFC] [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && (
          <Menubar
            className="mx-[1.125rem] shrink-0 max-sm:hidden"
            clientInvoker={clientInvoker}
            isPublicMode={isPublicMode}
          />
        )}

        <div className="flex min-h-0 min-w-0 grow">
          <div className="isolate z-10 flex h-full min-h-0 grow flex-col">
            {!isRevisionMode && <Toolbar className="m-2 max-sm:m-0" clientInvoker={clientInvoker} />}
            <LegacyGrid />
            <BottomBar />
            <Dialogs />
            <EditingDisabledDialog clientInvoker={clientInvoker} />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  )
}

type LegacyUIProps = {
  hidden: boolean
  state: ProtonSheetsState
  isReadonly: boolean
  isRevisionMode: boolean
  downloadLogs: () => void
}

function LegacyUI({ hidden, state, isReadonly, isRevisionMode, downloadLogs }: LegacyUIProps) {
  return (
    <>
      {hidden && (
        <div
          className="absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F9FBFC]"
          data-testid="editor-curtain"
        />
      )}
      <div className="flex h-full w-full flex-1 flex-col bg-[#F9FBFC] [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && <LegacyToolbar state={state} downloadLogs={downloadLogs} isReadonly={isReadonly} />}
        <LegacyGrid />
        <LegacyBottomBar state={state} isReadonly={isReadonly} isRevisionMode={isRevisionMode} />
        <LegacyDialogs state={state} />
      </div>
    </>
  )
}
