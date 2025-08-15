import type { ConvertibleDataType } from './ConvertibleDataType'

export type FileToDocPendingConversion = {
  data: Uint8Array<ArrayBuffer>
  type: ConvertibleDataType
}
