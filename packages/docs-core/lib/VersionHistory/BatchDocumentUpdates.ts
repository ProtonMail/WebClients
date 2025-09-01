import type { VersionHistoryUpdate, VersionHistoryBatch } from './VersionHistoryBatch'
import { Result } from '@proton/docs-shared'
import type { SyncUseCaseInterface } from '../Domain/UseCase/SyncUseCaseInterface'

/**
 * BatchDocumentUpdates takes a list of DecryptedMessages and creates batches of them
 * based on the threshold provided.
 * For example, if the threshold is 100, and there are 200 updates, the result will be
 * two batches of 100 updates each.
 */
export class BatchDocumentUpdates implements SyncUseCaseInterface<VersionHistoryBatch[]> {
  execute(updates: VersionHistoryUpdate[], batchThreshold: number): Result<VersionHistoryBatch[]> {
    if (!updates.length) {
      return Result.ok([])
    }

    const numberOfBatches = Math.round(updates.length / batchThreshold)
    const batches: VersionHistoryBatch[] = []

    for (let batchIndex = 0; batchIndex <= numberOfBatches; batchIndex++) {
      const start = batchIndex * batchThreshold
      const nextIndex = batchIndex + 1
      const end = nextIndex * batchThreshold
      const batch = updates.slice(start, end)
      if (batch.length > 0) {
        batches.push(batch)
      }
      if (batch.length < batchThreshold) {
        break
      }
    }
    return Result.ok(batches)
  }
}
