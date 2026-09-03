import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'

export type DataTypesThatDocumentCanBeExportedAs =
  'docx' | 'odt' | 'html' | 'txt' | 'md' | 'yjs' | 'xlsx' | 'csv' | 'tsv' | 'ods'

export const DocumentExportMimeTypes = {
  docx: SupportedProtonDocsMimeTypes.docx,
  odt: SupportedProtonDocsMimeTypes.odt,
  html: SupportedProtonDocsMimeTypes.html,
  txt: SupportedProtonDocsMimeTypes.txt,
  md: SupportedProtonDocsMimeTypes.md,
  xlsx: SupportedProtonDocsMimeTypes.xlsx,
  ods: SupportedProtonDocsMimeTypes.ods,
  csv: SupportedProtonDocsMimeTypes.csv,
  tsv: SupportedProtonDocsMimeTypes.tsv,
  yjs: 'application/octet-stream',
} as const
