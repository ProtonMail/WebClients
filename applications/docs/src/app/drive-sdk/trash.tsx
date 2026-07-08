import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import type { ProtonDriveClient } from '@proton/drive'
import { NotificationButton } from '@proton/components'
import { c } from 'ttag'

export async function trashAndNotify(
  drive: ProtonDriveClient,
  createNotification: Function,
  nodeUid: string,
  onUndo?: () => void,
) {
  await trashDocument(drive, nodeUid)

  async function undo() {
    try {
      await restoreDocument(drive, nodeUid)
      onUndo?.()
      createNotification({ type: 'success', text: c('Notification').t`Document restored from trash` })
    } catch (error) {
      reportTrashError(error)
      createNotification({ type: 'error', text: c('Notification').t`Document failed to be restored from trash` })
    }
  }

  createNotification({
    type: 'success',
    text: (
      <>
        <span>{c('Notification').t`Document moved to trash`}</span>
        <NotificationButton onClick={undo}>{c('Action').t`Undo`}</NotificationButton>
      </>
    ),
  })
}

async function trashDocument(drive: ProtonDriveClient, nodeUid: string) {
  for await (const result of drive.trashNodes([nodeUid])) {
    if (!result.ok) {
      throw new Error(`${result.error.name}: ${result.error.message}; UID=${result.uid}`)
    }
  }
}

async function restoreDocument(drive: ProtonDriveClient, nodeUid: string) {
  for await (const result of drive.restoreNodes([nodeUid])) {
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
