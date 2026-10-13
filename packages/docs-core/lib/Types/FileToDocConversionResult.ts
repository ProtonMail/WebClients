import type { FileToDocPendingConversion, DocumentMetaInterface, DocumentNodeMeta } from '@proton/docs-shared'

export type FileToDocConversionResult = {
  newDocMeta: DocumentMetaInterface
  newShell: DocumentNodeMeta
  dataToConvert: FileToDocPendingConversion
}
