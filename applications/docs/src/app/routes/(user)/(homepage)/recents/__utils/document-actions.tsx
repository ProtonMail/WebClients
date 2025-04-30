import { useAuthentication } from '@proton/components'
import { type RecentDocumentsItem } from '@proton/docs-core'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'

export type DocumentActionsContextValue = {
  open: (document: RecentDocumentsItem) => void
  share: (document: RecentDocumentsItem) => void
  move: (document: RecentDocumentsItem) => void
  openParent: (document: RecentDocumentsItem) => void
  // TODO: all rename-related stuff but `rename` probably belongs somewhere else,
  // since this "document actions" context shouldn't hold UI state.
  // Just something to keep in mind if this is refactored in the future.
  startRename: (document: RecentDocumentsItem) => void
  cancelRename: () => void
  rename: (document: RecentDocumentsItem, newName: string) => Promise<void>
  isRenaming: (document: RecentDocumentsItem) => boolean
  isRenameSaving: boolean
  trash: (document: RecentDocumentsItem) => Promise<void>
  currentlyTrashingId?: string
  onTrashed: (listener: (id: string) => void) => void
}

export const DocumentActionsContext = createContext<DocumentActionsContextValue | undefined>(undefined)

export type DocumentActionsProviderProps = {
  children: ReactNode
}

const TRASHED_LISTENERS = new Set<(id: string) => void>()

export function DocumentActionsProvider({ children }: DocumentActionsProviderProps) {
  const application = useApplication()
  const driveCompat = application.compatWrapper.getUserCompat()
  const [renamingDocument, setRenamingDocument] = useState<RecentDocumentsItem>()
  const [isRenameSaving, setRenameSaving] = useState(false)
  const [currentlyTrashingId, setCurrentlyTrashingId] = useState<string | undefined>(undefined)
  const { getLocalID } = useAuthentication()

  const open = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    const to = `/doc?mode=open&volumeId=${volumeId}&linkId=${linkId}`
    window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_opened)
  })

  const share = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    driveCompat.openDocumentSharingModal({ linkId, volumeId })
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_shared)
  })

  const move = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    void driveCompat.openMoveToFolderModal({ linkId, volumeId })
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_moved)
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
    await driveCompat.renameDocument(document, newName)
    cancelRename(true)
    setRenameSaving(false)
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_renamed)
  })

  const isRenaming = useCallback(
    (document: RecentDocumentsItem) => {
      return renamingDocument?.linkId === document.linkId && renamingDocument?.volumeId === document.volumeId
    },
    [renamingDocument?.linkId, renamingDocument?.volumeId],
  )

  const openParent = useEvent(({ parentLinkId, shareId, isSharedWithMe }: RecentDocumentsItem) => {
    let to = '/'
    if (parentLinkId) {
      to = `/${shareId}/folder/${parentLinkId}`
    }
    if (isSharedWithMe) {
      to = `/shared-with-me`
    }
    window.open(getAppHref(to, APPS.PROTONDRIVE, getLocalID()))
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_source_opened)
  })

  const trash = useEvent(async (document: RecentDocumentsItem) => {
    setCurrentlyTrashingId(document.uniqueId())
    await application.recentDocumentsService.trashDocument(document)
    setCurrentlyTrashingId(undefined)
    TRASHED_LISTENERS.forEach((listener) => listener(document.uniqueId()))
    application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_trashed)
  })

  const onTrashed = useEvent((listener: (id: string) => void) => {
    TRASHED_LISTENERS.add(listener)
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
      onTrashed,
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
      onTrashed,
    ],
  )
  return <DocumentActionsContext.Provider value={value}>{children}</DocumentActionsContext.Provider>
}

export function useDocumentActions() {
  const context = useContext(DocumentActionsContext)
  if (!context) {
    throw new Error('Missing DocumentActions context')
  }
  return context
}
