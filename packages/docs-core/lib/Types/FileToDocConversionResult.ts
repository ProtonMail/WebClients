import { DocumentNodeMeta } from '@proton/drive-store'
import { FileToDocPendingConversion, DocumentMetaInterface } from '@proton/docs-shared'

export type FileToDocConversionResult = {
  newDocMeta: DocumentMetaInterface
  newShell: DocumentNodeMeta
  dataToConvert: FileToDocPendingConversion
}
