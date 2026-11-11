import NotificationButton from '@proton/components/containers/notifications/NotificationButton'
import { c, msgid } from 'ttag'
import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { trashDocument, restoreDocument, reportTrashError } from './trash'
import { trashDocuments, restoreDocuments, type BatchResult } from './trashMany'
import type { CreateNotification } from '../utils/notifications'
import type { ErrorTracking } from '../utils/errorTracking'

export function handleRestoreError(createNotification: CreateNotification, errorTracking: ErrorTracking, error: any) {
  if (isRestorePermissionError(error)) {
    createNotification({
      type: 'error',
      text: c('Notification').t`Because this document was in a shared folder, only the folder owner can restore it`,
    })
  } else {
    createNotification({ type: 'error', text: c('Notification').t`Failed to restore document` })
    reportTrashError(errorTracking, error)
  }
}

export async function trashAndNotify(
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  nodeUid: string,
  emitRestored: () => void,
) {
  await trashDocument(drive, nodeUid)

  async function undo() {
    try {
      await restoreDocument(drive, nodeUid)
    } catch (error: any) {
      handleRestoreError(createNotification, errorTracking, error)
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
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  nodeUids: string[],
  onRestored: () => void,
): Promise<BatchResult> {
  const result = await trashDocuments(drive, nodeUids)
  const { succeeded, failed } = result

  async function undo() {
    const restore = await restoreDocuments(drive, succeeded)
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
      handleRestoreError(createNotification, errorTracking, first)
      others
        .filter((error) => !isRestorePermissionError(error))
        .forEach((error) => reportTrashError(errorTracking, error))
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
    new Set(failed.map((f) => f.error)).forEach((error) => reportTrashError(errorTracking, error))
  }

  return result
}

export async function restoreAndNotify(
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  nodeUid: string,
  emitTrashed: () => void,
) {
  await restoreDocument(drive, nodeUid)

  async function undo() {
    try {
      await trashDocument(drive, nodeUid)
    } catch (error) {
      reportTrashError(errorTracking, error)
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
