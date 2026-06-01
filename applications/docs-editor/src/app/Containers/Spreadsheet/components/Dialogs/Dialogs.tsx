import { SheetSearch } from './SheetSearch'
import { InsertLinkDialog } from './InsertLink'
import { DeleteSheetDialog } from './DeleteSheet'
import { ResizeDimensionEditorDialog } from './ResizeDimensionEditorDialog'
import { SpreadsheetSettingsDialog } from './SpreadsheetSettingsDialog'
import { CustomCurrencyFormatDialog } from './CustomCurrencyFormatDialog'
import { CustomNumberFormatDialog } from './CustomNumberFormatDialog/CustomNumberFormatDialog'

export function Dialogs() {
  return (
    <>
      <InsertLinkDialog />
      <SheetSearch />
      <DeleteSheetDialog />
      <ResizeDimensionEditorDialog />
      <SpreadsheetSettingsDialog />
      <CustomCurrencyFormatDialog />
      <CustomNumberFormatDialog />
    </>
  )
}
