import type { HomepageMessages } from '../messages/defaultHomepageMessages'
import type { ProtonDriveClient } from '@protontech/drive-sdk'
import { trashDocument, restoreDocument, reportTrashError } from './trash'
import { trashDocuments, restoreDocuments, type BatchResult } from './trashMany'
import type { CreateNotification } from '../utils/notifications'
import type { ErrorTracking } from '../utils/errorTracking'

type TrashMessages = HomepageMessages['trash']

export function handleRestoreError(
  createNotification: CreateNotification,
  errorTracking: ErrorTracking,
  error: any,
  messages: TrashMessages,
) {
  if (isRestorePermissionError(error)) {
    createNotification({
      type: 'error',
      text: messages.restoreNotAllowed,
    })
  } else {
    createNotification({ type: 'error', text: messages.restoreFailed })
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
  messages: TrashMessages,
) {
  await trashDocument(drive, nodeUid)

  async function undo() {
    try {
      await restoreDocument(drive, nodeUid)
    } catch (error: any) {
      handleRestoreError(createNotification, errorTracking, error, messages)
      return
    }
    createNotification({ type: 'success', text: messages.restored })
    emitRestored()
  }

  createNotification({
    type: 'success',
    text: messages.trashed,
    action: canRestore ? undoAction(undo, messages) : undefined,
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
  messages: TrashMessages,
): Promise<BatchResult> {
  const result = await trashDocuments(drive, nodeUids)
  const { succeeded, failed } = result

  async function undo() {
    const restore = await restoreDocuments(drive, succeeded)
    const numberOfItems = restore.succeeded.length
    if (numberOfItems > 0) {
      createNotification({
        type: 'success',
        text: messages.itemsRestored(numberOfItems),
      })
      onRestored()
    }
    if (restore.failed.length > 0) {
      const [first, ...others] = new Set(restore.failed.map((f) => f.error))
      handleRestoreError(createNotification, errorTracking, first, messages)
      others
        .filter((error) => !isRestorePermissionError(error))
        .forEach((error) => reportTrashError(errorTracking, error))
    }
  }

  if (succeeded.length > 0) {
    createNotification({
      type: 'success',
      text: messages.itemsTrashed(succeeded.length),
      action: canRestore ? undoAction(undo, messages) : undefined,
    })
  }

  if (failed.length > 0) {
    createNotification({
      type: 'error',
      text: messages.itemsNotTrashed(failed.length),
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
  messages: TrashMessages,
) {
  await restoreDocument(drive, nodeUid)

  async function undo() {
    try {
      await trashDocument(drive, nodeUid)
    } catch (error) {
      reportTrashError(errorTracking, error)
      createNotification({ type: 'error', text: messages.trashFailed })
      return
    }
    createNotification({ type: 'success', text: messages.trashed })
    emitTrashed()
  }

  createNotification({
    type: 'success',
    text: messages.restored,
    action: undoAction(undo, messages),
  })
}

function undoAction(onClick: () => void, messages: TrashMessages) {
  return { label: messages.undo, onClick }
}

function isRestorePermissionError(error: Error) {
  return error.message.includes('Insufficient permissions')
}
