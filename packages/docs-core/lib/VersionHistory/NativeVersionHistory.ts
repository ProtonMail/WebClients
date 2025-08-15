import { BatchDocumentUpdates } from './BatchDocumentUpdates'
import { mergeUpdates } from 'yjs'
import type { VersionHistoryBatch, VersionHistoryUpdate } from './VersionHistoryBatch'
import { DateFormatter } from './DateFormatter'

/**
 * How many DUs should make up a presentable revision in the history viewer. If the threshold is 10 and a
 * document has 100 DUs, the UI will show 10 revisions.
 */
const DefaultBatchThreshold = 10

export class NativeVersionHistory {
  private versionHistoryBatches: VersionHistoryBatch[] = []
  private _batchDocumentUpdates = new BatchDocumentUpdates()
  private dateFormatter = new DateFormatter()
  private _batchThreshold = DefaultBatchThreshold

  constructor(private updates: VersionHistoryUpdate[]) {
    this.versionHistoryBatches = this._batchDocumentUpdates.execute(updates, this._batchThreshold).getValue()
  }

  get batches() {
    return this.versionHistoryBatches
  }

  get batchThreshold() {
    return this._batchThreshold
  }

  public setBatchThreshold(threshold: number = DefaultBatchThreshold) {
    this._batchThreshold = Math.max(1, threshold)
    this.versionHistoryBatches = this._batchDocumentUpdates.execute(this.updates, this._batchThreshold).getValue()
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

  public getShortFormattedDateAndTimeForBatch(batch: VersionHistoryBatch) {
    const timestamp = this.getTimestampForBatch(batch)
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
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

  public getMergedUpdateForBatchIndex(index: number): Uint8Array<ArrayBuffer> {
    const flattenedBatches = this.versionHistoryBatches.slice(0, index + 1).flat()
    const updates = flattenedBatches.map((du) => du.content)
    const merged = mergeUpdates(updates)
    return merged as Uint8Array<ArrayBuffer>
  }
}
