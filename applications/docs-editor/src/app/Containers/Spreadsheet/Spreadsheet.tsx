/* eslint-disable monorepo-cop/no-relative-import-outside-package */

import type { ForwardedRef } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { functions } from '@rowsncolumns/functions'
import { createCSVFromSheetData, createExcelFile } from '@rowsncolumns/toolkit'
import type {
  EditorInitializationConfig,
  DocStateInterface,
  SheetImportData,
  DataTypesThatDocumentCanBeExportedAs,
} from '@proton/docs-shared'
import { EditorSystemMode, SheetImportDestination, SheetImportEvent, TranslatedResult } from '@proton/docs-shared'
import type { EditorLoadResult } from '../../Lib/EditorLoadResult'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'
import { useApplication } from '../ApplicationProvider'
import { downloadLogsAsJSON } from '../../../../../docs/src/app/utils/downloadLogs'
import type { EditorControllerInterface } from '@proton/docs-core'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { splitExtension } from '@proton/shared/lib/helpers/file'
import { useLogState, useProtonSheetsState } from './state'
import { Toolbar } from './components/Toolbar'
import { LOCALE } from './constants'

import '@rowsncolumns/spreadsheet/dist/spreadsheet.min.css'
import { Grid } from './components/Grid'
import { Dialogs } from './components/Dialogs'
import { BottomBar } from './components/BottomBar'

export type SpreadsheetRef = {
  exportData: (format: DataTypesThatDocumentCanBeExportedAs) => Promise<Uint8Array>
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
  const { getStateToLog } = useLogState(state, updateLatestStateToLog)

  const exportData = async (format: DataTypesThatDocumentCanBeExportedAs) => {
    if (format === 'yjs') {
      return docState.getDocState()
    } else if (format === 'xlsx') {
      const buffer = await createExcelFile(state)
      return new Uint8Array(buffer)
    } else if (format === 'csv') {
      const csv = createCSVFromSheetData(state.sheetData[state.activeSheetId])
      return stringToUint8Array(csv)
    } else if (format === 'tsv') {
      const tsv = createCSVFromSheetData(state.sheetData[state.activeSheetId], {
        delimiter: '\t',
      })
      return stringToUint8Array(tsv)
    }
    throw new Error(`Spreadsheet cannot be export to format ${format}`)
  }
  useImperativeHandle(ref, () => ({ exportData }))

  useEffect(() => {
    onEditorLoadResult(TranslatedResult.ok())
  }, [onEditorLoadResult])

  const { onInsertFile } = state
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
      onInsertFile(file, undefined, undefined, {
        minRowCount: 1000,
        minColumnCount: 100,
      }).catch(console.error)
    }
  }, [editorInitializationConfig, onInsertFile])

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

  // TODO: doesn't seem to be used anywhere
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

  return (
    <>
      {hidden && (
        <div
          className="bg-norm absolute z-[100] flex h-full w-full flex-col items-center justify-center gap-4"
          data-testid="editor-curtain"
        ></div>
      )}
      <div className="flex h-full w-full flex-1 flex-col [grid-column:1/3] [grid-row:1/3]">
        {!isRevisionMode && <Toolbar state={state} downloadLogs={downloadLogs} isReadonly={isReadonly} />}
        <Grid state={state} isReadonly={isReadonly} users={state.yjsState.users} userName={state.yjsState.userName} />
        <BottomBar state={state} isReadonly={isReadonly} isRevisionMode={isRevisionMode} />
        <Dialogs state={state} />
      </div>
    </>
  )
})
