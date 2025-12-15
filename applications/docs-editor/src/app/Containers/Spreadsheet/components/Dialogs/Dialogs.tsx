import { SheetSearch } from './SheetSearch'
import { InsertLinkDialog } from './InsertLink'
import { useUI } from '../../ui-store'
import { DeleteSheetDialog } from './DeleteSheet'
import { ResizeDimensionEditor } from '@rowsncolumns/spreadsheet-state'

export function Dialogs() {
  return (
    <>
      <InsertLinkDialog />
      <SheetSearch
        isActive={useUI((ui) => ui.legacy.searchState.isSearchActive)}
        onSubmit={useUI((ui) => ui.legacy.searchState.onSearch)}
        onReset={useUI((ui) => ui.legacy.searchState.onResetSearch)}
        onNext={useUI((ui) => ui.legacy.searchState.onFocusNextResult)}
        onPrevious={useUI((ui) => ui.legacy.searchState.onFocusPreviousResult)}
        disableNext={!useUI((ui) => ui.legacy.searchState.hasNextResult)}
        disablePrevious={!useUI((ui) => ui.legacy.searchState.hasPreviousResult)}
        currentResult={useUI((ui) => ui.legacy.searchState.currentResult)}
        totalResults={useUI((ui) => ui.legacy.searchState.totalResults)}
        searchQuery={useUI((ui) => ui.legacy.searchState.searchQuery)}
      />
      <DeleteSheetDialog />
      {/* TODO: Legacy dialog, should be replaced with new UI */}
      <ResizeDimensionEditor
        onResize={useUI((ui) => ui.legacy.onResize)}
        onAutoResize={useUI((ui) => ui.legacy.onAutoResize)}
      />
    </>
  )
}
