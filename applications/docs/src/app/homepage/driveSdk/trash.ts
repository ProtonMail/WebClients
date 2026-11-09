import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { traceErrorSDK } from './traceErrorSDK'

export async function trashDocument(drive: ProtonDriveClient, nodeUid: string) {
  for await (const result of drive.trashNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export async function restoreDocument(drive: ProtonDriveClient, nodeUid: string) {
  for await (const result of drive.restoreNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export async function deleteDocument(drive: ProtonDriveClient, nodeUid: string) {
  for await (const result of drive.deleteNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export function reportTrashError(error: unknown) {
  traceErrorSDK(error, 'DocsTrashWithDriveSDK')
}
