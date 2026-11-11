// Copy of packages/shared/lib/helpers/mimetype.ts

export const PROTON_DOCS_DOCUMENT_MIMETYPE = 'application/vnd.proton.doc'
export const PROTON_DOCS_SPREADSHEET_MIMETYPE = 'application/vnd.proton.sheet'

export const isProtonDocsDocument = (mimeType: string) => mimeType === PROTON_DOCS_DOCUMENT_MIMETYPE
export const isProtonDocsSpreadsheet = (mimeType: string) => mimeType === PROTON_DOCS_SPREADSHEET_MIMETYPE

export type ProtonDocumentType = 'document' | 'spreadsheet'

export function mimeTypeToProtonDocumentType(mimeType?: string): ProtonDocumentType | undefined {
  if (!mimeType) {
    return
  }
  if (isProtonDocsDocument(mimeType)) {
    return 'document'
  }
  if (isProtonDocsSpreadsheet(mimeType)) {
    return 'spreadsheet'
  }
}
