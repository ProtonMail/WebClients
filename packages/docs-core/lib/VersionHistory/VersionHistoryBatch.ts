export interface VersionHistoryUpdate {
  content: Uint8Array<ArrayBuffer>
  timestamp: number
}

export type VersionHistoryBatch = VersionHistoryUpdate[]
