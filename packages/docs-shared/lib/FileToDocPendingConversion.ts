import { ConvertibleDataType } from './ConvertibleDataType'

export type FileToDocPendingConversion = {
  data: Uint8Array
  type: ConvertibleDataType
}
