import { c, msgid } from 'ttag'
import type { SheetsMessages } from '@proton-docs/sheets-editor'

export function createWorkbookMessages(): Pick<
  SheetsMessages,
  | 'columns'
  | 'rows'
  | 'cannotDeleteAllRows'
  | 'cannotDeleteAllColumns'
  | 'spreadsheet'
  | 'bottomBar'
  | 'sheetStatus'
  | 'circleLoader'
  | 'deleteSheet'
  | 'insertLink'
  | 'resizeDimensionEditorDialog'
  | 'sheetSearch'
  | 'spreadsheetSettingsDialog'
  | 'state'
  | 'gridFooter'
  | 'cellTooltip'
  | 'editingDisabledButton'
  | 'editingDisabledDialog'
  | 'imageSources'
> {
  return {
    columns: (numberOfColumns) =>
      c('sheets_2025:Spreadsheet context menu (columns/rows)').ngettext(
        msgid`${numberOfColumns} column`,
        `${numberOfColumns} columns`,
        numberOfColumns,
      ),
    rows: (numberOfRows) =>
      c('sheets_2025:Spreadsheet context menu (columns/rows)').ngettext(
        msgid`${numberOfRows} row`,
        `${numberOfRows} rows`,
        numberOfRows,
      ),
    cannotDeleteAllRows: c('sheets_2025:Spreadsheet editor').t`Cannot delete all rows`,
    cannotDeleteAllColumns: c('sheets_2025:Spreadsheet editor').t`Cannot delete all columns`,
    spreadsheet: {
      syncingInconsistency: c('Error')
        .t`This spreadsheet detected a local syncing inconsistency. Editing has been disabled to prevent data loss. Please file a report and if you are okay with sharing the contents, download and include the debug information from below.`,
      'Importing Excel file...': c('Info').t`Importing Excel file...`,
      'Importing ODS file...': c('Info').t`Importing ODS file...`,
    },
    bottomBar: {
      'New sheet': c('sheets_2025:Bottom bar').t`New sheet`,
      'All sheets': c('sheets_2025:Bottom bar').t`All sheets`,
      Delete: c('sheets_2025:Sheet tab options').t`Delete`,
      Duplicate: c('sheets_2025:Sheet tab options').t`Duplicate`,
      Rename: c('sheets_2025:Sheet tab options').t`Rename`,
      'Change color': c('sheets_2025:Sheet tab options').t`Change color`,
      'Move left': c('sheets_2025:Sheet tab options').t`Move left`,
      'Move right': c('sheets_2025:Sheet tab options').t`Move right`,
      'Hide sheet': c('sheets_2025:Sheet tab options').t`Hide sheet`,
      'A sheet with this name already exists': c('sheets_2025:Sheet tab rename')
        .t`A sheet with this name already exists`,
      "Sheet names can't be longer than 31 characters": c('sheets_2025:Sheet tab rename')
        .t`Sheet names can't be longer than 31 characters`,
      "Sheet names can't contain \\ / ? * [ ] or :": c('sheets_2025:Sheet tab rename')
        .t`Sheet names can't contain \\ / ? * [ ] or :`,
      "Sheet names can't start or end with an apostrophe": c('sheets_2025:Sheet tab rename')
        .t`Sheet names can't start or end with an apostrophe`,
      "History is a reserved name and can't be used for a sheet": c('sheets_2025:Sheet tab rename')
        .t`History is a reserved name and can't be used for a sheet`,
      'No title': c('Info').t`No title`,
    },
    sheetStatus: {
      Summary: c('sheets_2025:Spreadsheet sheet status bar').t`Summary`,
      'Selection summary': c('sheets_2025:Spreadsheet sheet status bar').t`Selection summary`,
      Average: c('sheets_2025:Spreadsheet sheet status bar').t`Average`,
      Count: c('sheets_2025:Spreadsheet sheet status bar').t`Count`,
      'Count numbers': c('sheets_2025:Spreadsheet sheet status bar').t`Count numbers`,
      Min: c('sheets_2025:Spreadsheet sheet status bar').t`Min`,
      Max: c('sheets_2025:Spreadsheet sheet status bar').t`Max`,
      Sum: c('sheets_2025:Spreadsheet sheet status bar').t`Sum`,
      Copy: c('sheets_2025:Spreadsheet sheet status bar').t`Copy`,
      'Copy value': c('sheets_2025:Spreadsheet sheet status bar').t`Copy value`,
      'Copy formula': c('sheets_2025:Spreadsheet sheet status bar').t`Copy formula`,
      'Detach from selection': c('sheets_2025:Spreadsheet sheet status bar').t`Detach from selection`,
      'Pin by the selection': c('sheets_2025:Spreadsheet sheet status bar').t`Pin by the selection`,
      'Unpin from selection': c('sheets_2025:Spreadsheet sheet status bar').t`Unpin from selection`,
      '${label}, not applicable': (label: string) =>
        c('sheets_2025:Spreadsheet sheet status bar').t`${label}, not applicable`,
      '${label}, ${value}. Show in the status bar': (label: string, value: string) =>
        c('sheets_2025:Spreadsheet sheet status bar').t`${label}, ${value}. Show in the status bar`,
    },
    circleLoader: {
      Loading: c('Info').t`Loading`,
    },
    deleteSheet: {
      'Delete sheet': c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete sheet`,
      'Are you sure you want to delete ${sheetName}?': (sheetName: string) =>
        c('sheets_2025:Spreadsheet delete sheet dialog').t`Are you sure you want to delete ${sheetName}?`,
      Cancel: c('sheets_2025:Spreadsheet delete sheet dialog').t`Cancel`,
      Delete: c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete`,
    },
    insertLink: {
      'Insert link': c('sheets_2025:Spreadsheet insert link dialog').t`Insert link`,
      'Paste link': c('sheets_2025:Spreadsheet insert link dialog').t`Paste link`,
      Apply: c('sheets_2025:Spreadsheet insert link dialog').t`Apply`,
      Cancel: c('sheets_2025:Spreadsheet insert link dialog').t`Cancel`,
    },
    resizeDimensionEditorDialog: {
      resizeColumns: (title: string) => c('sheets_2025:Spreadsheet resize dimension dialog').t`Resize column ${title}`,
      resizeRows: (title: string) => c('sheets_2025:Spreadsheet resize dimension dialog').t`Resize row ${title}`,
      specifyColumnWidth: c('sheets_2025:Spreadsheet resize dimension dialog').t`Specify column width (px)`,
      specifyRowHeight: c('sheets_2025:Spreadsheet resize dimension dialog').t`Specify row height (px)`,
      defaultSize: (size: number) => c('sheets_2025:Spreadsheet resize dimension dialog').t`Default ${size}`,
      OK: c('sheets_2025:Spreadsheet resize dimension dialog').t`OK`,
      Cancel: c('sheets_2025:Spreadsheet resize dimension dialog').t`Cancel`,
    },
    sheetSearch: {
      'Go to next': c('sheets_2025:Spreadsheet editor search dialog').t`Go to next`,
      'Go to previous': c('sheets_2025:Spreadsheet editor search dialog').t`Go to previous`,
      Close: c('sheets_2025:Spreadsheet editor search dialog').t`Close`,
      'Find in sheet': c('sheets_2025:Spreadsheet editor').t`Find in sheet`,

      resultPosition: (current: number, total: number) =>
        c('sheets_2025:Spreadsheet editor search dialog').t`${current} of ${total}`,
    },
    spreadsheetSettingsDialog: {
      'Settings for this spreadsheet': c('sheets_2025:Spreadsheet editor spreadsheet settings dialog')
        .t`Settings for this spreadsheet`,
      'This affects formatting details such as functions, dates and currency': c(
        'sheets_2025:Spreadsheet editor spreadsheet settings dialog',
      ).t`This affects formatting details such as functions, dates and currency`,
      Locale: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Locale`,
      // translator: This is the "automatic" option in the locale selection input, and is followed by the locale that will be applied if selected, e.g. "Auto (American English)"
      Auto: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Auto`,
      Cancel: c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Cancel`,
      'Save and reload': c('sheets_2025:Spreadsheet editor spreadsheet settings dialog').t`Save and reload`,
    },
    state: {
      'This spreadsheet is incompatible with the current client version. Please try reloading the client. If the error persists, please contact support.': c(
        'Error',
      )
        .t`This spreadsheet is incompatible with the current client version. Please try reloading the client. If the error persists, please contact support.`,
    },
    gridFooter: {
      Add: c('sheets_2025:Spreadsheet gridFooter').t`Add`,
      'more rows at the bottom': c('sheets_2025:Spreadsheet gridFooter').t`more rows at the bottom`,
    },
    cellTooltip: {
      'Copy link': c('sheets_2025:Spreadsheet link tooltip').t`Copy link`,
      Copied: c('sheets_2025:Spreadsheet link tooltip').t`Link copied to clipboard`,
      'Edit link': c('sheets_2025:Spreadsheet link tooltip').t`Edit link`,
      'Remove link': c('sheets_2025:Spreadsheet link tooltip').t`Remove link`,
      Removed: c('sheets_2025:Spreadsheet link tooltip').t`Link removed`,
      Note: c('sheets_2025:Spreadsheet cell tooltip').t`Note`,
      Error: c('sheets_2025:Spreadsheet cell tooltip').t`Error`,
      Invalid: c('sheets_2025:Spreadsheet cell tooltip').t`Invalid`,
    },
    editingDisabledButton: {
      'Mobile Editing Coming Soon': c('sheets_2025:Spreadsheet editing disabled dialog').t`Mobile Editing Coming Soon`,
      Info: c('sheets_2025:Spreadsheet editing disabled dialog')
        .t`We’re working on bringing this feature to you soon. For now, sheets can only be edited on desktop`,

      Edit: c('sheets_2025:Spreadsheet editingDisabledButton').t`Edit`,
    },
    editingDisabledDialog: {
      'Screen too small for editing': c('sheets_2025:Spreadsheet editing disabled dialog')
        .t`Screen too small for editing`,
      Info: c('sheets_2025:Spreadsheet editing disabled dialog')
        .t`Your screen is too small to edit this spreadsheet. You’re in view-only mode. To make changes, please open this spreadsheet on a larger screen or expand your browser window.`,
    },
    imageSources: {
      pasteDropped: c('sheets_2025:Spreadsheet image paste')
        .t`Some images couldn't be pasted. Copy the image itself, or download it and paste the file.`,
    },
  }
}
