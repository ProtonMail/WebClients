export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'html' | 'txt' | 'md' | 'yjs'

export const DocumentExportMimeTypes = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt: 'text/plain',
  md: 'text/markdown',
  yjs: 'application/octet-stream',
} as const
