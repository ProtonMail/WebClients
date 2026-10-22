import type { DocumentNodeMeta } from '@proton/docs-shared/CryptoTypes'
import type { DocumentMetaInterface } from '@proton/docs-shared/DocumentMetaInterface'
import type { FileToDocPendingConversion } from '@proton/docs-shared/FileToDocPendingConversion'

export type FileToDocConversionResult = {
  newDocMeta: DocumentMetaInterface
  newShell: DocumentNodeMeta
  dataToConvert: FileToDocPendingConversion
}
