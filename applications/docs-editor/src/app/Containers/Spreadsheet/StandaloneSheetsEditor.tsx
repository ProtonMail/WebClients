import { SpreadsheetProvider } from '@rowsncolumns/spreadsheet'
import type { ForwardedRef } from 'react'
import { forwardRef } from 'react'
import { Spreadsheet, type SpreadsheetProps, type SpreadsheetRef } from './Spreadsheet'
import { SheetsStyleScope } from './SheetsStyleScope'

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
