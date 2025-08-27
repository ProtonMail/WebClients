/* eslint-disable monorepo-cop/no-relative-import-outside-package */

import type { EditorControllerInterface } from '@proton/docs-core'
import type {
  DataTypesThatDocumentCanBeExportedAs,
  DocStateInterface,
  EditorInitializationConfig,
  SheetImportData,
} from '@proton/docs-shared'
import { EditorSystemMode, SheetImportDestination, SheetImportEvent, TranslatedResult } from '@proton/docs-shared'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { splitExtension } from '@proton/shared/lib/helpers/file'
import { functions } from '@rowsncolumns/functions'
import { createCSVFromSheetData, createExcelFile } from '@rowsncolumns/toolkit'
import type { ForwardedRef } from 'react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { downloadLogsAsJSON } from '../../../../../docs/src/app/utils/downloadLogs'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { useApplication } from '../ApplicationProvider'
import { LOCALE } from './constants'
import { useLogState, useProtonSheetsState } from './state'

import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import { Menubar } from './components/Menubar/Menubar'
import { Toolbar } from './components/Toolbar/Toolbar'
import { WithFallback, useSetupWithFallback } from './components/WithFallback'
import { LegacyBottomBar } from './components/legacy/LegacyBottomBar'
import { LegacyDialogs } from './components/legacy/LegacyDialogs'
import { LegacyGrid } from './components/legacy/LegacyGrid'
import { LegacyToolbar } from './components/legacy/LegacyToolbar'
import { useProtonSheetsUIState } from './ui-state'

export type SpreadsheetRef = {
  exportData: (format: DataTypesThatDocumentCanBeExportedAs) => Promise<Uint8Array<ArrayBuffer>>
}

export type SpreadsheetProps = {
  docState: DocStateInterface
  hidden: boolean
  onEditorLoadResult: EditorLoadResult
  editorInitializationConfig: EditorInitializationConfig | undefined
  systemMode: EditorSystemMode
  editingLocked: boolean
  updateLatestStateToLog: (state: unknown) => void
}

export const Spreadsheet = forwardRef(function Spreadsheet(
  {
    docState,
    hidden,
    onEditorLoadResult,
    editorInitializationConfig,
    systemMode,
    editingLocked,
    updateLatestStateToLog,
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  const { application } = useApplication()

  const didImportFromExcelFile = useRef(false)

  const isRevisionMode = systemMode === EditorSystemMode.Revision
  const isReadonly = editingLocked || isRevisionMode

  const state = useProtonSheetsState({ docState, locale: LOCALE, functions })
  const uiState = useProtonSheetsUIState(state)
  const { getStateToLog } = useLogState(state, updateLatestStateToLog)

  const exportData = async (format: DataTypesThatDocumentCanBeExportedAs) => {
    if (format === 'yjs') {
      return docState.getDocState()
    }
    if (format === 'xlsx') {
      const buffer = await createExcelFile(state)
      return new Uint8Array(buffer)
    }
    if (format === 'csv') {
      const csv = createCSVFromSheetData(state.sheetData[state.activeSheetId])
      return stringToUint8Array(csv)
    }
    if (format === 'tsv') {
      const tsv = createCSVFromSheetData(state.sheetData[state.activeSheetId], {
        delimiter: '\t',
      })
      return stringToUint8Array(tsv)
    }
    throw new Error(`Spreadsheet cannot be exported to format ${format}`)
  }
  useImperativeHandle(ref, () => ({ exportData }))

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  const { onInsertFile, importExcelFile, generateStatePatches } = state
  const handleExcelFileImport = useCallback(
    async (file: File) => {
      await importExcelFile(file, 1000, 100)
      const patches = await generateStatePatches()
      state.yjsState.onBroadcastPatch([[patches]])
    },
    [generateStatePatches, importExcelFile, state.yjsState],
  )
  useEffect(() => {
    const canConvertFile =
      editorInitializationConfig &&
      editorInitializationConfig.mode === 'conversion' &&
      editorInitializationConfig.type.dataType === 'xlsx'
    if (canConvertFile && !didImportFromExcelFile.current) {
      didImportFromExcelFile.current = true
      const file = new File([editorInitializationConfig.data], 'import.xlsx', {
        type: SupportedProtonDocsMimeTypes.xlsx,
      })
      void handleExcelFileImport(file)
    }
  }, [editorInitializationConfig, handleExcelFileImport])

  // TODO: document this effect
  const { onCreateNewSheet, onRenameSheet, calculateNow } = state
  useEffect(
    () =>
      application.eventBus.addEventCallback((data: SheetImportData) => {
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
        onInsertFile(data.file, sheetId, cellCoords, {
          preserveFormatting: data.shouldConvertCellContents,
          replaceSheetData: data.destination === SheetImportDestination.ReplaceCurrentSheet,
        })
          .then(() => {
            calculateNow({
              shouldResetCellDependencyGraph: true,
            })
          })
          .catch(console.error)
      }, SheetImportEvent),
    [application.eventBus, calculateNow, onCreateNewSheet, onInsertFile, onRenameSheet],
  )

  // TODO: is there a better way to handle this?
  const createdInitialSheetRef = useRef(false)
  useEffect(() => {
    if (
      editorInitializationConfig &&
      editorInitializationConfig.mode === 'creation' &&
      !createdInitialSheetRef.current
    ) {
      onCreateNewSheet()
      createdInitialSheetRef.current = true
    }
  }, [editorInitializationConfig, onCreateNewSheet])

  const downloadLogs = () => {
    const editorAdapter = {
      async getYDocAsJSON() {
        return docState.getDoc().toJSON()
      },
      async getLatestSpreadsheetStateToLogJSON() {
        return getStateToLog()
      },
    } as Pick<EditorControllerInterface, 'getYDocAsJSON' | 'getLatestSpreadsheetStateToLogJSON'>

    downloadLogsAsJSON(editorAdapter as EditorControllerInterface, 'sheet').catch(console.error)
  }

  useSetupWithFallback()

  return (
    <>
      {hidden && (
        <div
          className="absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F9FBFC]"
          data-testid="editor-curtain"
        />
      )}
      <div className="flex h-full w-full flex-1 flex-col bg-[#F9FBFC] [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && (
          <WithFallback fallback={<LegacyToolbar state={state} downloadLogs={downloadLogs} isReadonly={isReadonly} />}>
            <Menubar ui={uiState} className="mb-2" />
            <Toolbar ui={uiState} />
          </WithFallback>
        )}
        <WithFallback
          fallback={
            <LegacyGrid
              state={state}
              isReadonly={isReadonly}
              users={state.yjsState.users}
              userName={state.yjsState.userName}
            />
          }
        >
          {/* TODO: replace with new UI */}
          <LegacyGrid
            state={state}
            isReadonly={isReadonly}
            users={state.yjsState.users}
            userName={state.yjsState.userName}
          />
        </WithFallback>

        <WithFallback
          fallback={<LegacyBottomBar state={state} isReadonly={isReadonly} isRevisionMode={isRevisionMode} />}
        >
          {/* TODO: replace with new UI */}
          <LegacyBottomBar state={state} isReadonly={isReadonly} isRevisionMode={isRevisionMode} />
        </WithFallback>
        <WithFallback fallback={<LegacyDialogs state={state} />}>
          {/* TODO: replace with new UI */}
          <LegacyDialogs state={state} />
        </WithFallback>
      </div>
    </>
  )
})
