import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { traceErrorSDK } from './traceErrorSDK'
import type { ErrorTracking } from '../utils/errorTracking'

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

export function reportTrashError(errorTracking: ErrorTracking, error: unknown) {
  traceErrorSDK(errorTracking, error, 'DocsTrashWithDriveSDK')
}
