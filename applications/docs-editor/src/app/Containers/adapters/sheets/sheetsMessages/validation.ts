import { c } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createValidationMessages(): Pick<SheetsMessages, 'conditionalFormatDialog' | 'dataValidationDialog'> {
  return {
    conditionalFormatDialog: {
      Close: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Close`,
      'Delete range': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Delete range`,
      'Delete rule': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Delete rule`,
      'Conditional formatting': c('sheets_2025:Spreadsheet sidebar conditional format dialog')
        .t`Conditional formatting`,
      'Single color': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Single color`,
      'Color scale': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Color scale`,
      'Apply to range': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Apply to range`,
      'Select a range': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Select a range`,
      'Add another range': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Add another range`,
      'Format rules': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Format rules`,
      None: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`None`,
      'Enter a formula': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Enter a formula`,
      'Enter value': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Enter value`,
      'Format style': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Format style`,
      Preview: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Preview`,
      'Add another rule': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Add another rule`,
      'Add rule': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Add rule`,
      Cancel: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Cancel`,
      Save: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Save`,
      'Min point': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Min point`,
      'Min value': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Min value`,
      Number: c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Number`,
      'Mid point': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Mid point`,
      'Max point': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Max point`,
      'Max value': c('sheets_2025:Spreadsheet sidebar conditional format dialog').t`Max value`,
    },
    dataValidationDialog: {
      'Delete data validation rule': c('sheets_2025:Spreadsheet sidebar data validation dialog')
        .t`Delete data validation rule`,
      'Data validation': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Data validation`,
      'Add another named range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add another named range`,
      'Add named range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add named range`,
      'Apply to range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Apply to range`,
      'Select a range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Select a range`,
      'Add another range': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Add another range`,
      'Validation rules': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Validation rules`,
      'Enter a formula': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Enter a formula`,
      'Enter value': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Enter value`,
      'Allow blanks': c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Allow blanks`,
      Formula: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Formula`,
      Cancel: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Cancel`,
      Save: c('sheets_2025:Spreadsheet sidebar data validation dialog').t`Save`,
    },
  }
}
