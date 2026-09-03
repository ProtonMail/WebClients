import { SpreadsheetProvider } from '@rowsncolumns/spreadsheet'
import type { ForwardedRef } from 'react'
import { forwardRef } from 'react'

import { Spreadsheet, type SpreadsheetProps, type SpreadsheetRef } from './Spreadsheet'

/**
 * Standalone sheets editor entry point.
 * Must be wrapped in a shell adapter (e.g. SheetsAdapter) which provides SheetsDependencies required by the editor.
 */
export const StandaloneSheetsEditor = forwardRef(function StandaloneSheetsEditor(
  {
    docState,
    hidden,
    onEditorLoadResult,
    editorInitializationConfig,
    systemMode,
    editingLocked,
    updateLocalStateToLog,
    isPublicMode,
    shouldUseCustomYjsInitialization,
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  return (
    <SpreadsheetProvider>
      <Spreadsheet
        ref={ref}
        docState={docState}
        hidden={hidden}
        onEditorLoadResult={onEditorLoadResult}
        editorInitializationConfig={editorInitializationConfig}
        systemMode={systemMode}
        editingLocked={editingLocked}
        updateLocalStateToLog={updateLocalStateToLog}
        isPublicMode={isPublicMode}
        shouldUseCustomYjsInitialization={shouldUseCustomYjsInitialization}
      />
    </SpreadsheetProvider>
  )
})
