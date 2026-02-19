import { SheetSearch } from './SheetSearch'
import { InsertLinkDialog } from './InsertLink'
import { useUI } from '../../ui-store'
import { DeleteSheetDialog } from './DeleteSheet'
import { ResizeDimensionEditorDialog } from './ResizeDimensionEditorDialog'
import { SpreadsheetSettingsDialog } from './SpreadsheetSettingsDialog'
import { CustomCurrencyFormatDialog } from './CustomCurrencyFormatDialog'

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
      <ResizeDimensionEditorDialog />
      <SpreadsheetSettingsDialog />
      <CustomCurrencyFormatDialog />
    </>
  )
}
