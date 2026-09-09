import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import { getDrive } from '@proton/drive'

export async function trashDocument(nodeUid: string) {
  const drive = getDrive()
  for await (const result of drive.trashNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export async function restoreDocument(nodeUid: string) {
  const drive = getDrive()
  for await (const result of drive.restoreNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export async function deleteDocument(nodeUid: string) {
  const drive = getDrive()
  for await (const result of drive.deleteNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

export function reportTrashError(error: unknown) {
  traceError(error, {
    tags: {
      initiative: SentryRealtimeInitiatives.SDK_SWITCH,
      feature: 'DocsTrashWithDriveSDK',
    },
  })
}
