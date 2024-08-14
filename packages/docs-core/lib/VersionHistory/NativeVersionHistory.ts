import { BatchDocumentUpdates } from './BatchDocumentUpdates'
import { mergeUpdates } from 'yjs'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { VersionHistoryBatch } from './VersionHistoryBatch'
import { DateFormatter } from './DateFormatter'

/**
 * How many DUs should make up a presentable revision in the history viewer. If the threshold is 10 and a
 * document has 100 DUs, the UI will show 10 revisions.
 */
const BatchThreshold = 10

export class NativeVersionHistory {
  private versionHistoryBatches: VersionHistoryBatch[] = []
  private _batchDocumentUpdates = new BatchDocumentUpdates()
  private dateFormatter = new DateFormatter()

  constructor(commit: DecryptedCommit) {
    this.versionHistoryBatches = this._batchDocumentUpdates.execute(commit.updates, BatchThreshold).getValue()
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

  public getFormattedDateForBatch(batch: VersionHistoryBatch) {
    return this.dateFormatter.formatDate(this.getTimestampForBatch(batch))
  }

  public isCurrentBatchIndex(index: number) {
    return index === this.batches.length - 1
  }

  public getFormattedTimeForBatch(batch: VersionHistoryBatch) {
    const timestamp = this.getTimestampForBatch(batch)
    return this.dateFormatter.formatTime(timestamp)
  }

  public getFormattedBatchGroups() {
    const formattedBatchGroups: {
      formattedDate: string
      batchIndexes: { batchIndex: number; formattedTime: string }[]
    }[] = []
    let lastGroupKey = ''
    this.batches.forEach((batch, batchIndex) => {
      const formattedDate = this.getFormattedDateForBatch(batch)
      const formattedTime = this.getFormattedTimeForBatch(batch)

      if (lastGroupKey === formattedDate) {
        formattedBatchGroups[0].batchIndexes.unshift({ batchIndex, formattedTime })
      } else {
        formattedBatchGroups.unshift({ formattedDate, batchIndexes: [{ batchIndex, formattedTime }] })
      }

      lastGroupKey = formattedDate
    })
    return formattedBatchGroups
  }

  public getMergedUpdateForBatchIndex(index: number): Uint8Array {
    const flattenedBatches = this.versionHistoryBatches.slice(0, index + 1).flat()
    const updates = flattenedBatches.map((du) => du.content)
    const merged = mergeUpdates(updates)
    return merged
  }
}
