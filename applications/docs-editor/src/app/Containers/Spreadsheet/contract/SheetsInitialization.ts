export type SheetsImportDataType = 'csv' | 'ods' | 'tsv' | 'xlsx'

/** Describes how the spreadsheet starts its lifecycle. */
export type SheetsInitialization =
  | {
      mode: 'existing'
    }
  | {
      mode: 'creation'
    }
  | {
      mode: 'conversion'
      data: Uint8Array<ArrayBuffer>
      dataType: SheetsImportDataType
    }
