import NotificationButton from '@proton/components/containers/notifications/NotificationButton'
import type { NotificationType } from '@proton/app-context/notifications/interfaces'
import { c } from 'ttag'
import type { ReactNode } from 'react'
import { trashDocument, restoreDocument, reportTrashError } from '@proton/docs-core/lib/DriveSDK/trash'

type CreateNotification = ({ type, text }: { type: NotificationType; text: ReactNode }) => void

export function handleRestoreError(createNotification: CreateNotification, error: any) {
  if (error.message.includes('Insufficient permissions')) {
    createNotification({
      type: 'error',
      text: c('Notification').t`Because this document was in a shared folder, only the folder owner can restore it`,
    })
  } else {
    createNotification({ type: 'error', text: c('Notification').t`Failed to restore document` })
    reportTrashError(error)
  }
}

export async function trashAndNotify(
  createNotification: CreateNotification,
  nodeUid: string,
  emitRestored: () => void,
) {
  await trashDocument(nodeUid)

  async function undo() {
    try {
      await restoreDocument(nodeUid)
    } catch (error: any) {
      handleRestoreError(createNotification, error)
      return
    }
    createNotification({ type: 'success', text: c('Notification').t`Document restored from trash` })
    emitRestored()
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

export async function restoreAndNotify(
  createNotification: CreateNotification,
  nodeUid: string,
  emitTrashed: () => void,
) {
  await restoreDocument(nodeUid)

  async function undo() {
    try {
      await trashDocument(nodeUid)
    } catch (error) {
      reportTrashError(error)
      createNotification({ type: 'error', text: c('Notification').t`Failed to trash document` })
      return
    }
    createNotification({ type: 'success', text: c('Notification').t`Document moved to trash` })
    emitTrashed()
  }

  createNotification({
    type: 'success',
    text: (
      <>
        <span>{c('Notification').t`Document restored from trash`}</span>
        <NotificationButton onClick={undo}>{c('Action').t`Undo`}</NotificationButton>
      </>
    ),
  })
}
