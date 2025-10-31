import { DeleteSheetConfirmation, TableEditor } from '@rowsncolumns/spreadsheet-state'
import type { ProtonSheetsState } from '../../state'
import { ChartEditor, ChartEditorDialog } from '@rowsncolumns/charts'
import { SheetSearch } from './SheetSearch'
import { InsertLinkDialog } from './InsertLink'

export type DialogsProps = {
  state: ProtonSheetsState
}

export function Dialogs({ state }: DialogsProps) {
  return (
    <>
      {/* All dialogs below are legacy and will be incrementally replaced */}
      <ChartEditorDialog>
        <ChartEditor
          sheetId={state.activeSheetId}
          chart={state.chartsState.selectedChart}
          onSubmit={state.chartsState.onUpdateChart}
        />
      </ChartEditorDialog>
      <TableEditor sheetId={state.activeSheetId} onSubmit={state.onUpdateTable} theme={state.theme} />
      <DeleteSheetConfirmation onDeleteSheet={state.onDeleteSheet} />
      <SheetSearch
        isActive={state.searchState.isSearchActive}
        onSubmit={state.searchState.onSearch}
        onReset={state.searchState.onResetSearch}
        onNext={state.searchState.onFocusNextResult}
        onPrevious={state.searchState.onFocusPreviousResult}
        disableNext={!state.searchState.hasNextResult}
        disablePrevious={!state.searchState.hasPreviousResult}
        currentResult={state.searchState.currentResult}
        totalResults={state.searchState.totalResults}
        searchQuery={state.searchState.searchQuery}
      />
      <InsertLinkDialog />
    </>
  )
}
