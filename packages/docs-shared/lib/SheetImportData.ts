export enum SheetImportDestination {
  InsertAsNewSheet,
  ReplaceAtSelectedCell,
  ReplaceCurrentSheet,
}

export enum SheetImportSeparatorType {
  DetectAutomatically,
}

export type SheetImportData = {
  file: File
  shouldConvertCellContents: boolean
  destination: SheetImportDestination
  separatorType: SheetImportSeparatorType
}

export const SheetImportEvent = 'SheetImportEvent'
