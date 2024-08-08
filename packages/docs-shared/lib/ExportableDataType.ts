export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'html' | 'txt' | 'md' | 'pdf' | 'yjs'

export const DocumentExportMimeTypes = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt: 'text/plain',
  md: 'text/markdown',
  pdf: 'application/pdf',
  yjs: 'application/octet-stream',
} as const
