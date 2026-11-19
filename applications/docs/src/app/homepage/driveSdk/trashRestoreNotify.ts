import { createTrashMessages } from '../messages/trash'
import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { trashDocument, restoreDocument, reportTrashError } from './trash'
import { trashDocuments, restoreDocuments, type BatchResult } from './trashMany'
import type { CreateNotification } from '../utils/notifications'
import type { ErrorTracking } from '../utils/errorTracking'

export function handleRestoreError(createNotification: CreateNotification, errorTracking: ErrorTracking, error: any) {
  if (isRestorePermissionError(error)) {
    createNotification({
      type: 'error',
      text: createTrashMessages().trash.restoreNotAllowed,
    })
  } else {
    createNotification({ type: 'error', text: createTrashMessages().trash.restoreFailed })
    reportTrashError(errorTracking, error)
  }
}

export async function trashAndNotify(
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  nodeUid: string,
  emitRestored: () => void,
  /** Only the owner restores: Drive refuses a document shared with the user, however it was shared */
  canRestore: boolean,
) {
  await trashDocument(drive, nodeUid)

  async function undo() {
    try {
      await restoreDocument(drive, nodeUid)
    } catch (error: any) {
      handleRestoreError(createNotification, errorTracking, error)
      return
    }
    createNotification({ type: 'success', text: createTrashMessages().trash.restored })
    emitRestored()
  }

  createNotification({
    type: 'success',
    text: createTrashMessages().trash.trashed,
    action: canRestore ? undoAction(undo) : undefined,
  })
}

export async function trashManyAndNotify(
  drive: ProtonDriveClient,
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  nodeUids: string[],
  onRestored: () => void,
  /** Whether every document is the user's own, as `trashAndNotify`'s `canRestore` */
  canRestore: boolean,
): Promise<BatchResult> {
  const result = await trashDocuments(drive, nodeUids)
  const { succeeded, failed } = result

  async function undo() {
    const restore = await restoreDocuments(drive, succeeded)
    const numberOfItems = restore.succeeded.length
    if (numberOfItems > 0) {
      createNotification({
        type: 'success',
        text: createTrashMessages().trash.itemsRestored(numberOfItems),
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
    createNotification({
      type: 'success',
      text: createTrashMessages().trash.itemsTrashed(succeeded.length),
      action: canRestore ? undoAction(undo) : undefined,
    })
  }

  if (failed.length > 0) {
    createNotification({
      type: 'error',
      text: createTrashMessages().trash.itemsNotTrashed(failed.length),
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
      createNotification({ type: 'error', text: createTrashMessages().trash.trashFailed })
      return
    }
    createNotification({ type: 'success', text: createTrashMessages().trash.trashed })
    emitTrashed()
  }

  createNotification({
    type: 'success',
    text: createTrashMessages().trash.restored,
    action: undoAction(undo),
  })
}

function undoAction(onClick: () => void) {
  return { label: createTrashMessages().trash.undo, onClick }
}

function isRestorePermissionError(error: Error) {
  return error.message.includes('Insufficient permissions')
}
