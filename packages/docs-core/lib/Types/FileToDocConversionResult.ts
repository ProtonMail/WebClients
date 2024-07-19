import type { DocumentNodeMeta } from '@proton/drive-store'
import type { FileToDocPendingConversion, DocumentMetaInterface } from '@proton/docs-shared'

export type FileToDocConversionResult = {
  newDocMeta: DocumentMetaInterface
  newShell: DocumentNodeMeta
  dataToConvert: FileToDocPendingConversion
}
