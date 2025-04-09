import { useAuthentication } from '@proton/components'
import { type RecentDocumentsItem } from '@proton/docs-core'
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
}

export const DocumentActionsContext = createContext<DocumentActionsContextValue | undefined>(undefined)

export type DocumentActionsProviderProps = {
  children: ReactNode
}

export function DocumentActionsProvider({ children }: DocumentActionsProviderProps) {
  const application = useApplication()
  const driveCompat = application.compatWrapper.getUserCompat()
  const [renamingDocument, setRenamingDocument] = useState<RecentDocumentsItem>()
  const [isRenameSaving, setRenameSaving] = useState(false)
  const { getLocalID } = useAuthentication()

  const open = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    const to = `/doc?mode=open&volumeId=${volumeId}&linkId=${linkId}`
    window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
  })

  const share = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    driveCompat.openDocumentSharingModal({ linkId, volumeId })
  })

  const move = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    void driveCompat.openMoveToFolderModal({ linkId, volumeId })
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
  })

  const trash = useEvent(async (document: RecentDocumentsItem) =>
    application.recentDocumentsService.trashDocument(document),
  )

  const value = useMemo(
    () => ({ open, share, move, openParent, startRename, cancelRename, rename, isRenaming, isRenameSaving, trash }),
    [open, share, move, openParent, startRename, cancelRename, rename, isRenaming, isRenameSaving, trash],
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
