import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import type { DocumentType } from '@proton/drive-store/store/_documents'

// TODO: we will rename the values in `DocumentType` to 'document' and 'spreadsheet' soon, but for now
// we just convert the new names to the old ones to support both naming patterns to keep changes small.
export function tmpConvertOldDocTypeToNew(type: DocumentType | ProtonDocumentType): ProtonDocumentType {
  switch (type) {
    case 'doc':
      return 'document'
    case 'sheet':
      return 'spreadsheet'
    default:
      return type
  }
}
