import type { FileToDocPendingConversion } from './FileToDocPendingConversion'

export type EditorInitializationConfig =
  | {
      mode: 'creation'
    }
  | ({
      mode: 'conversion'
    } & FileToDocPendingConversion)
