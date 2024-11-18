export interface VersionHistoryUpdate {
  content: Uint8Array
  timestamp: number
}

export type VersionHistoryBatch = VersionHistoryUpdate[]
