import { c } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createTablesMessages(): Pick<
  SheetsMessages,
  'namedRangeEditorDialog' | 'sidebarDialog' | 'tableEditorDialog'
> {
  return {
    namedRangeEditorDialog: {
      'Delete named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Delete named range`,
      'Named Ranges': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Named Ranges`,
      Name: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Name`,
      'Name should not contain spaces': c('sheets_2025:Spreadsheet sidebar named ranges dialog')
        .t`Name should not contain spaces`,
      Type: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Type`,
      Range: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Range`,
      'Text or formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Text or formula`,
      'Apply to range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Apply to range`,
      'Enter a formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Enter a formula`,
      'Enter text or formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Enter text or formula`,
      'Add another named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Add another named range`,
      'Add named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Add named range`,
      Cancel: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Cancel`,
      Save: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Save`,
    },
    sidebarDialog: {
      Close: c('sheets_2025:Spreadsheet sidebar dialog').t`Close`,
    },
    tableEditorDialog: {
      'Edit table': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Edit table`,
      'Table title': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Table title`,
      'Table data range': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Table data range`,
      'Select a range': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Select a range`,
      'More settings': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`More settings`,
      'Banded rows': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Banded rows`,
      'Banded columns': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Banded columns`,
      'Show filter button': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Show filter button`,
      Cancel: c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Cancel`,
      Save: c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Save`,
    },
  }
}
