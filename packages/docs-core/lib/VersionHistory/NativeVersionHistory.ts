import { BatchDocumentUpdates } from './BatchDocumentUpdates'
import { mergeUpdates } from 'yjs'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import { VersionHistoryBatch } from './VersionHistoryBatch'

export class NativeVersionHistory {
  private versionHistoryBatches: VersionHistoryBatch[] = []
  private _batchDocumentUpdates = new BatchDocumentUpdates()
  private batchThreshold = 100

  constructor(commit: DecryptedCommit) {
    this.versionHistoryBatches = this._batchDocumentUpdates.execute(commit.updates, this.batchThreshold).getValue()
  }

  get batches() {
    return this.versionHistoryBatches
  }

  public getTimestampForBatch(batch: VersionHistoryBatch) {
    const lastUpdate = batch[batch.length - 1]
    return lastUpdate.timestamp
  }

  public getFormattedDateAndTimeForBatch(batch: VersionHistoryBatch) {
    const timestamp = this.getTimestampForBatch(batch)
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  public getMergedUpdateForBatchIndex(index: number): Uint8Array {
    const flattenedBatches = this.versionHistoryBatches.slice(0, index + 1).flat()
    const updates = flattenedBatches.map((du) => du.content)
    const merged = mergeUpdates(updates)
    return merged
  }
}
