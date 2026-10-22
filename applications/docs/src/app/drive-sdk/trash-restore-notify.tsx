import NotificationButton from '@proton/components/containers/notifications/NotificationButton'
import type { NotificationType } from '@proton/app-context/notifications/interfaces'
import { c, msgid } from 'ttag'
import type { ReactNode } from 'react'
import { trashDocument, restoreDocument, reportTrashError } from '@proton/docs-core/DriveSDK/trash'
import { trashDocuments, restoreDocuments, type BatchResult } from './trashMany'

type CreateNotification = ({ type, text }: { type: NotificationType; text: ReactNode }) => void

export function handleRestoreError(createNotification: CreateNotification, error: any) {
  if (isRestorePermissionError(error)) {
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

export async function trashManyAndNotify(
  createNotification: CreateNotification,
  nodeUids: string[],
  onRestored: () => void,
): Promise<BatchResult> {
  const result = await trashDocuments(nodeUids)
  const { succeeded, failed } = result

  async function undo() {
    const restore = await restoreDocuments(succeeded)
    const numberOfItems = restore.succeeded.length
    if (numberOfItems > 0) {
      createNotification({
        type: 'success',
        text: c('Notification').ngettext(
          msgid`${numberOfItems} item restored from trash`,
          `${numberOfItems} items restored from trash`,
          numberOfItems,
        ),
      })
      onRestored()
    }
    if (restore.failed.length > 0) {
      const [first, ...others] = new Set(restore.failed.map((f) => f.error))
      handleRestoreError(createNotification, first)
      others.filter((error) => !isRestorePermissionError(error)).forEach(reportTrashError)
    }
  }

  if (succeeded.length > 0) {
    const numberOfItems = succeeded.length
    createNotification({
      type: 'success',
      text: (
        <>
          <span>
            {c('Notification').ngettext(
              msgid`${numberOfItems} item moved to trash`,
              `${numberOfItems} items moved to trash`,
              numberOfItems,
            )}
          </span>
          <NotificationButton onClick={undo}>{c('Action').t`Undo`}</NotificationButton>
        </>
      ),
    })
  }

  if (failed.length > 0) {
    const count = failed.length
    createNotification({
      type: 'error',
      text: c('Notification').ngettext(
        msgid`${count} item could not be moved to trash`,
        `${count} items could not be moved to trash`,
        count,
      ),
    })
    new Set(failed.map((f) => f.error)).forEach(reportTrashError)
  }

  return result
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

function isRestorePermissionError(error: Error) {
  return error.message.includes('Insufficient permissions')
}
