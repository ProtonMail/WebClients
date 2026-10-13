import { c } from 'ttag'
import type { SheetsMessages } from '../../../Spreadsheet/public'

export function createToolbarMessages(): Pick<
  SheetsMessages,
  'fontSelect' | 'fontSizeControls' | 'formulaBar' | 'toolbar' | 'zoomCombobox'
> {
  return {
    fontSelect: {
      'Default (${defaultFont})': (defaultFont: string) =>
        c('sheets_2025:Spreadsheet editor toolbar').t`Default (${defaultFont})`,
    },
    fontSizeControls: {
      'Decrease font size': c('sheets_2025:Spreadsheet editor toolbar').t`Decrease font size`,
      'Font size': c('sheets_2025:Spreadsheet editor toolbar').t`Font size`,
      'Increase font size': c('sheets_2025:Spreadsheet editor toolbar').t`Increase font size`,
    },
    formulaBar: {
      'Add new': c('sheets_2025:Range selector menu').t`Add new`,
      'Formula bar': c('sheets_2025:Formula bar').t`Formula bar`,
      'Named ranges': c('sheets_2025:Range selector menu').t`Named ranges`,
      'Range selector': c('sheets_2025:Range selector').t`Range selector`,
      Tables: c('sheets_2025:Range selector menu').t`Tables`,
      Sheets: c('sheets_2025:Range selector menu').t`Sheets`,

      View: c('sheets_2025:Spreadsheet formulaBar').t`View`,
      Edit: c('sheets_2025:Spreadsheet formulaBar').t`Edit`,
      Remove: c('sheets_2025:Spreadsheet formulaBar').t`Remove`,
    },
    toolbar: {
      Undo: c('sheets_2025:Spreadsheet editor toolbar').t`Undo`,
      Redo: c('sheets_2025:Spreadsheet editor toolbar').t`Redo`,
      Find: c('sheets_2025:Spreadsheet editor toolbar').t`Find`,
      'Clear formatting': c('sheets_2025:Spreadsheet editor toolbar').t`Clear formatting`,
      'Paint format': c('sheets_2025:Spreadsheet editor toolbar').t`Paint format`,
      Bold: c('sheets_2025:Spreadsheet editor toolbar').t`Bold`,
      Italic: c('sheets_2025:Spreadsheet editor toolbar').t`Italic`,
      Underline: c('sheets_2025:Spreadsheet editor toolbar').t`Underline`,
      Strikethrough: c('sheets_2025:Spreadsheet editor toolbar').t`Strikethrough`,
      'Format as currency': c('sheets_2025:Spreadsheet editor toolbar').t`Format as currency`,
      'Format as percent': c('sheets_2025:Spreadsheet editor toolbar').t`Format as percent`,
      'Decrease decimal places': c('sheets_2025:Spreadsheet editor toolbar').t`Decrease decimal places`,
      'Increase decimal places': c('sheets_2025:Spreadsheet editor toolbar').t`Increase decimal places`,
      'More formats': c('sheets_2025:Spreadsheet editor toolbar').t`More formats`,
      Font: c('sheets_2025:Spreadsheet editor toolbar').t`Font`,
      'Text color': c('sheets_2025:Spreadsheet editor toolbar').t`Text color`,
      'Fill color': c('sheets_2025:Spreadsheet editor toolbar').t`Fill color`,
      Border: c('sheets_2025:Spreadsheet editor toolbar').t`Border`,
      'Merge cells': c('sheets_2025:Spreadsheet editor toolbar').t`Merge cells`,
      'Unmerge cells': c('sheets_2025:Spreadsheet editor toolbar').t`Unmerge cells`,
      'Select merge type': c('sheets_2025:Spreadsheet editor toolbar').t`Select merge type`,
      'Horizontal align': c('sheets_2025:Spreadsheet editor toolbar').t`Horizontal align`,
      'Vertical align': c('sheets_2025:Spreadsheet editor toolbar').t`Vertical align`,
      'Text wrapping': c('sheets_2025:Spreadsheet editor toolbar').t`Text wrapping`,
      'Insert link': c('sheets_2025:Spreadsheet editor toolbar').t`Insert link`,
      'Insert function': c('sheets_2025:Spreadsheet editor toolbar').t`Insert function`,
      'Create a filter': c('sheets_2025:Spreadsheet editor toolbar').t`Create a filter`,
      'Remove filter': c('sheets_2025:Spreadsheet editor toolbar').t`Remove filter`,
      'Insert note': c('sheets_2025:Spreadsheet editor toolbar').t`Insert note`,
      'Insert chart': c('sheets_2025:Spreadsheet editor toolbar').t`Insert chart`,
      'Apply text color': c('sheets_2025:Spreadsheet editor toolbar').t`Apply text color`,
      'Choose text color': c('sheets_2025:Spreadsheet editor toolbar').t`Choose text color`,
      'Apply fill color': c('sheets_2025:Spreadsheet editor toolbar').t`Apply fill color`,
      'Choose fill color': c('sheets_2025:Spreadsheet editor toolbar').t`Choose fill color`,
      'Apply border': c('sheets_2025:Spreadsheet editor toolbar').t`Apply border`,
      'Choose border': c('sheets_2025:Spreadsheet editor toolbar').t`Choose border`,
      More: c('sheets_2025:Spreadsheet editor toolbar').t`More`,
    },
    zoomCombobox: {
      Zoom: c('sheets_2025:Spreadsheet editor toolbar').t`Zoom`,
    },
  }
}
