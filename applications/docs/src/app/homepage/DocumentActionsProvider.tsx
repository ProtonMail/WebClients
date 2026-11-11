import useAuthentication from '@proton/components/hooks/useAuthentication'
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import type { RecentDocumentsItem } from './recentDocumentsItem'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { constructDriveFolderUrl } from './driveFolderUrl'
import { useEvent } from './utils/useEvent'
import { generateNodeUid, type ProtonDriveClient } from '@protontech/drive-sdk'
import { c } from 'ttag'
import { deleteDocument, reportTrashError } from './driveSdk/trash'
import { DocumentActionsContext } from './documentActionsContext'
import { trashAndNotify, restoreAndNotify, handleRestoreError } from './driveSdk/trashRestoreNotify'
import { traceErrorSDK } from './driveSdk/traceErrorSDK'
import { useHomepageView } from './homepageViewContext'
import { useBulkTrash } from './driveSdk/useBulkTrash'
import { useBulkMove, type UseMoveItemsModal } from './driveSdk/useBulkMove'
import { TelemetryEvent } from './utils/telemetry'

type UseSharingModal = () => {
  sharingModal: ReactNode
  showSharingModal: (props: { drive: ProtonDriveClient; nodeUid: string }) => void
}

export type DocumentActionsProviderProps = {
  children: ReactNode
  drive: ProtonDriveClient
  useSharingModal: UseSharingModal
  useMoveItemsModal: UseMoveItemsModal
}

const TRASHED_LISTENERS = new Set<(id: string) => void>()
const RESTORED_LISTENERS = new Set<(id: string) => void>()

export function DocumentActionsProvider({
  children,
  drive,
  useSharingModal,
  useMoveItemsModal,
}: DocumentActionsProviderProps) {
  const [renamingDocument, setRenamingDocument] = useState<RecentDocumentsItem>()
  const [isRenameSaving, setRenameSaving] = useState(false)
  const [currentlyTrashingId, setCurrentlyTrashingId] = useState<string | undefined>(undefined)
  const [currentlyRestoringId, setCurrentlyRestoringId] = useState<string | undefined>(undefined)
  const { getLocalID } = useAuthentication()

  const { showSharingModal, sharingModal } = useSharingModal()
  const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal()
  const { updateMovedDocuments, reportTelemetry, createNotification } = useHomepageView()
  const [confirmDeleteModal, showConfirmDeleteModal] = useConfirmActionModal()
  const { trash: bulkTrash, isTrashing: isBulkTrashing } = useBulkTrash({ drive })
  const { move: bulkMove, moveItemsModal: bulkMoveItemsModal } = useBulkMove({ useMoveItemsModal })

  const open = useEvent(({ type, volumeId, linkId }: RecentDocumentsItem, source = 'normal') => {
    const pathname = type === 'spreadsheet' ? 'sheet' : 'doc'
    const to = `/${pathname}?mode=open&volumeId=${volumeId}&linkId=${linkId}`
    window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
    reportTelemetry(source === 'trash' ? TelemetryEvent.document_opened_in_trash : TelemetryEvent.document_opened)
  })

  const share = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    showSharingModal({
      drive,
      nodeUid: generateNodeUid(volumeId, linkId),
    })
    reportTelemetry(TelemetryEvent.document_shared)
  })

  const move = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    showMoveItemsModal({
      nodeUids: [generateNodeUid(volumeId, linkId)],
      onMoved: ({ movedUids }) => {
        void updateMovedDocuments?.(movedUids)
      },
    })
    reportTelemetry(TelemetryEvent.document_moved)
  })

  const startRename = useEvent((document: RecentDocumentsItem) => {
    if (isRenameSaving) {
      return
    }
    setRenamingDocument(document)
  })

  const cancelRename = useEvent((force = false) => {
    if (!force && isRenameSaving) {
      return
    }
    setRenamingDocument(undefined)
  })

  const rename = useEvent(async (document: RecentDocumentsItem, newName: string) => {
    setRenameSaving(true)
    try {
      try {
        await drive.renameNode(generateNodeUid(document.volumeId, document.linkId), newName)
        const successNotificationText = c('Notification').jt`"${newName}" renamed successfully`
        createNotification({
          text: <span className="text-pre-wrap">{successNotificationText}</span>,
        })
      } catch (error) {
        traceErrorSDK(error, 'DocsRenameWithDriveSDK')
        throw error
      }
    } finally {
      cancelRename(true)
      setRenameSaving(false)
    }
    reportTelemetry(TelemetryEvent.document_renamed)
  })

  const isRenaming = useCallback(
    (document: RecentDocumentsItem) => {
      return renamingDocument?.linkId === document.linkId && renamingDocument?.volumeId === document.volumeId
    },
    [renamingDocument?.linkId, renamingDocument?.volumeId],
  )

  const openParent = useEvent(({ parentLinkId, shareId, isSharedWithMe }: RecentDocumentsItem) => {
    const to = constructDriveFolderUrl(parentLinkId, shareId, isSharedWithMe)
    window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()))
    reportTelemetry(TelemetryEvent.document_source_opened)
  })

  const trash = useEvent(async (document: RecentDocumentsItem) => {
    setCurrentlyTrashingId(document.uniqueId())

    const emitRestored = () => RESTORED_LISTENERS.forEach((listener) => listener(document.uniqueId()))

    try {
      const nodeUid = generateNodeUid(document.volumeId, document.linkId)
      await trashAndNotify(drive, createNotification, nodeUid, emitRestored)
    } catch (error) {
      reportTrashError(error)
      createNotification({
        type: 'error',
        text: c('Error').t`Failed to trash document`,
      })
      setCurrentlyTrashingId(undefined)
      return
    }

    setCurrentlyTrashingId(undefined)
    TRASHED_LISTENERS.forEach((listener) => listener(document.uniqueId()))
    reportTelemetry(TelemetryEvent.document_trashed)
  })

  const subscribeToTrashed = useEvent((listener: (id: string) => void) => {
    TRASHED_LISTENERS.add(listener)
    return () => {
      TRASHED_LISTENERS.delete(listener)
    }
  })

  const restore = useEvent(async (document: RecentDocumentsItem) => {
    setCurrentlyRestoringId(document.uniqueId())

    const emitTrashed = () => TRASHED_LISTENERS.forEach((listener) => listener(document.uniqueId()))

    try {
      const nodeUid = generateNodeUid(document.volumeId, document.linkId)
      await restoreAndNotify(drive, createNotification, nodeUid, emitTrashed)
    } catch (error: any) {
      handleRestoreError(createNotification, error)
      setCurrentlyRestoringId(undefined)
      return
    }

    setCurrentlyRestoringId(undefined)
    RESTORED_LISTENERS.forEach((listener) => listener(document.uniqueId()))
    reportTelemetry(TelemetryEvent.document_restored)
  })

  const subscribeToRestored = useEvent((listener: (id: string) => void) => {
    RESTORED_LISTENERS.add(listener)
    return () => {
      RESTORED_LISTENERS.delete(listener)
    }
  })

  const deletePermanently = useEvent(async (document: RecentDocumentsItem) => {
    const itemName = document.name
    showConfirmDeleteModal({
      title: c('Title').t`Delete permanently`,
      submitText: c('Action').t`Delete permanently`,
      message: c('Info').t`Are you sure you want to permanently delete "${itemName}" from trash?`,
      onSubmit: async () => {
        try {
          const nodeUid = generateNodeUid(document.volumeId, document.linkId)
          await deleteDocument(drive, nodeUid)
        } catch (error) {
          reportTrashError(error)
          createNotification({
            type: 'error',
            text: c('Notification').t`Failed to delete document`,
          })
          return
        }
        createNotification({
          type: 'success',
          text: c('Notification').t`"Document deleted permanently`,
        })
        reportTelemetry(TelemetryEvent.document_permanently_deleted)
      },
    })
  })

  const value = useMemo(
    () => ({
      open,
      share,
      move,
      openParent,
      startRename,
      cancelRename,
      rename,
      isRenaming,
      isRenameSaving,
      trash,
      currentlyTrashingId,
      subscribeToTrashed,
      restore,
      currentlyRestoringId,
      subscribeToRestored,
      deletePermanently,
      bulkTrash,
      isBulkTrashing,
      bulkMove,
    }),
    [
      open,
      share,
      move,
      openParent,
      startRename,
      cancelRename,
      rename,
      isRenaming,
      isRenameSaving,
      trash,
      currentlyTrashingId,
      subscribeToTrashed,
      restore,
      currentlyRestoringId,
      subscribeToRestored,
      deletePermanently,
      bulkTrash,
      isBulkTrashing,
      bulkMove,
    ],
  )
  return (
    <DocumentActionsContext.Provider value={value}>
      {children}
      {sharingModal}
      {moveItemsModal}
      {bulkMoveItemsModal}
      {confirmDeleteModal}
    </DocumentActionsContext.Provider>
  )
}
