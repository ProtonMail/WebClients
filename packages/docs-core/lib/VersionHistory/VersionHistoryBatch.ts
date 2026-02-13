import type { DecryptedCommit } from '../Models/DecryptedCommit'
import { decompressDocumentUpdate, isCompressedDocumentUpdate } from '../utils/document-update-compression'

export interface VersionHistoryUpdate {
  content: Uint8Array<ArrayBuffer>
  timestamp: number
  authorAddress: string
}

export type VersionHistoryBatch = VersionHistoryUpdate[]

export function getVersionHistoryUpdatesFromCommit(commit: DecryptedCommit): VersionHistoryUpdate[] {
  const updates: VersionHistoryUpdate[] = []
  for (const message of commit.messages) {
    const content = message.content
    if (isCompressedDocumentUpdate(content)) {
      const decompressed = decompressDocumentUpdate(content)
      updates.push({
        content: decompressed,
        timestamp: message.timestamp,
        authorAddress: message.authorAddress,
      })
    } else {
      updates.push({
        content,
        timestamp: message.timestamp,
        authorAddress: message.authorAddress,
      })
    }
  }
  return updates
}
