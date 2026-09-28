import { SpreadsheetProvider } from '@rowsncolumns/spreadsheet'
import type { ForwardedRef } from 'react'
import { forwardRef } from 'react'

import { SheetsStyleScope } from './SheetsStyleScope'
import { Spreadsheet, type SpreadsheetProps, type SpreadsheetRef } from './Spreadsheet'

/**
 * Standalone sheets editor entry point.
 * Must be wrapped in a shell adapter (e.g. SheetsAdapter) which provides SheetsDependencies required by the editor.
 */
export const StandaloneSheetsEditor = forwardRef(function StandaloneSheetsEditor(
  {
    docState,
    hidden,
    onEditorReadyToReceiveUpdates,
    initialization,
    isVersionHistoryView,
    editingLocked,
    setMigrationEditingLocked,
    updateLocalStateToLog,
    isPublicMode,
    shouldUseCustomYjsInitialization,
  }: SpreadsheetProps,
  ref: ForwardedRef<SpreadsheetRef>,
) {
  return (
    <SpreadsheetProvider>
      <SheetsStyleScope>
        <Spreadsheet
          ref={ref}
          docState={docState}
          hidden={hidden}
          onEditorReadyToReceiveUpdates={onEditorReadyToReceiveUpdates}
          initialization={initialization}
          isVersionHistoryView={isVersionHistoryView}
          editingLocked={editingLocked}
          setMigrationEditingLocked={setMigrationEditingLocked}
          updateLocalStateToLog={updateLocalStateToLog}
          isPublicMode={isPublicMode}
          shouldUseCustomYjsInitialization={shouldUseCustomYjsInitialization}
        />
      </SheetsStyleScope>
    </SpreadsheetProvider>
  )
})
