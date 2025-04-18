import type { DocumentType } from '@proton/drive-store/store/_documents'
import type { DocsConversionType } from '@proton/shared/lib/docs/constants'

/** Types of data which can be converted to a document or a sheet */
export type ConvertibleDataType = {
  docType: DocumentType
  dataType: DocsConversionType
}
