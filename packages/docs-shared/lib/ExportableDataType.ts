export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'html' | 'txt' | 'md'

export const DocumentExportMimeTypes = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt: 'text/plain',
  md: 'text/markdown',
} as const
