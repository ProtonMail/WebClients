export type SpreadsheetImportDestination =
  'insert-as-new-sheet' | 'replace-at-selected-cell' | 'replace-current-sheet' | 'replace-spreadsheet'

export type SpreadsheetImportRequest = {
  file: File
  shouldConvertCellContents: boolean
  destination: SpreadsheetImportDestination
}
