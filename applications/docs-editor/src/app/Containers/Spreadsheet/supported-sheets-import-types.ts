const SUPPORTED_SHEETS_IMPORT_TYPES = ['csv', 'ods', 'tsv', 'xlsx'] as const

type SupportedSheetsImportType = (typeof SUPPORTED_SHEETS_IMPORT_TYPES)[number]

const MIME_TYPES_BY_SHEETS_IMPORT_TYPE: Record<SupportedSheetsImportType, string> = {
  csv: 'text/csv',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  tsv: 'text/tab-separated-values',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export function canSheetsConvertType(dataType: string): dataType is SupportedSheetsImportType {
  return SUPPORTED_SHEETS_IMPORT_TYPES.some((supportedType) => supportedType === dataType)
}

export function getSheetsImportMimeType(dataType: SupportedSheetsImportType): string {
  return MIME_TYPES_BY_SHEETS_IMPORT_TYPE[dataType]
}
