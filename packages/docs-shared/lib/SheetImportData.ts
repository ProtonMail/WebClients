export enum SheetImportDestination {
  InsertAsNewSheet = 0,
  ReplaceAtSelectedCell = 1,
  ReplaceCurrentSheet = 2,
  ReplaceSpreadsheet = 3,
}

export enum SheetImportSeparatorType {
  DetectAutomatically = 0,
}

export type SheetImportData = {
  file: File
  shouldConvertCellContents: boolean
  destination: SheetImportDestination
  separatorType: SheetImportSeparatorType
}

export const SheetImportEvent = 'SheetImportEvent'
