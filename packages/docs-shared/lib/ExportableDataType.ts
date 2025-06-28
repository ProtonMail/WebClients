import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'

export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'html' | 'txt' | 'md' | 'yjs' | 'xlsx' | 'csv' | 'tsv'

export const DocumentExportMimeTypes = {
  docx: SupportedProtonDocsMimeTypes.docx,
  html: SupportedProtonDocsMimeTypes.html,
  txt: SupportedProtonDocsMimeTypes.txt,
  md: SupportedProtonDocsMimeTypes.md,
  xlsx: SupportedProtonDocsMimeTypes.xlsx,
  csv: SupportedProtonDocsMimeTypes.csv,
  tsv: SupportedProtonDocsMimeTypes.tsv,
  yjs: 'application/octet-stream',
} as const
