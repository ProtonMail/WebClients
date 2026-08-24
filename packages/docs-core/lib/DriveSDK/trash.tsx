import NotificationButton from '@proton/components/containers/notifications/NotificationButton'
import type { NotificationType } from '@proton/app-context/notifications/interfaces'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import { getDrive } from '@proton/drive'
import { c } from 'ttag'
import type { ReactNode } from 'react'

type CreateNotification = ({ type, text }: { type: NotificationType; text: ReactNode }) => void

export async function trashAndNotify(createNotification: CreateNotification, nodeUid: string) {
  await trashDocument(nodeUid)

  async function undo() {
    try {
      await restoreDocument(nodeUid)
      createNotification({ type: 'success', text: c('Notification').t`Document restored from trash` })
    } catch (error: any) {
      handleRestoreError(createNotification, error)
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

export async function restoreAndNotify(createNotification: CreateNotification, nodeUid: string) {
  await restoreDocument(nodeUid)

  async function undo() {
    try {
      await trashDocument(nodeUid)
      createNotification({ type: 'success', text: c('Notification').t`Document moved to trash` })
    } catch (error) {
      reportTrashError(error)
      createNotification({ type: 'error', text: c('Notification').t`Failed to trash document` })
    }
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
