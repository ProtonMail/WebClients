export type DataTypesThatDocumentCanBeExportedAs = 'docx' | 'html' | 'txt' | 'md' | 'pdf'

export const DocumentExportMimeTypes = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  html: 'text/html',
  txt: 'text/plain',
  md: 'text/markdown',
  pdf: 'application/pdf',
} as const
