import { getDrive, type ProtonDriveClient } from '@proton/drive/sdk'

export type BatchResult = { succeeded: string[]; failed: { uid: string; error: Error }[] }

export async function trashDocuments(nodeUids: string[]): Promise<BatchResult> {
  return collectResults(nodeUids, getDrive().trashNodes(nodeUids))
}

export async function restoreDocuments(nodeUids: string[]): Promise<BatchResult> {
  return collectResults(nodeUids, getDrive().restoreNodes(nodeUids))
}

// Never throws: if the SDK throws (e.g. network), all not yet seen uids are marked as failed
async function collectResults(
  nodeUids: string[],
  results: ReturnType<ProtonDriveClient['trashNodes']>,
): Promise<BatchResult> {
  const batch: BatchResult = { succeeded: [], failed: [] }
  const seen = new Set<string>()
  try {
    for await (const result of results) {
      seen.add(result.uid)
      if (result.ok) {
        batch.succeeded.push(result.uid)
      } else {
        batch.failed.push({
          uid: result.uid,
          error: new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`),
        })
      }
    }
  } catch (error) {
    for (const uid of nodeUids.filter((uid) => !seen.has(uid))) {
      batch.failed.push({ uid, error: error as Error })
    }
  }
  return batch
}
