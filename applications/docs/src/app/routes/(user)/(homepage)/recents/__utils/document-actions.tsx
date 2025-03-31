import { useAuthentication } from '@proton/components'
import { type RecentDocumentsItem } from '@proton/docs-core'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { useApplication } from '~/utils/application-context'
import { useEvent } from '~/utils/misc'

export type DocumentActionsContextValue = {
  open: (document: RecentDocumentsItem) => void
  openParent: (document: RecentDocumentsItem) => void
  trash: (document: RecentDocumentsItem) => void
}

export const DocumentActionsContext = createContext<DocumentActionsContextValue | undefined>(undefined)

export type DocumentActionsProviderProps = {
  children: ReactNode
}

export function DocumentActionsProvider({ children }: DocumentActionsProviderProps) {
  const application = useApplication()
  const { getLocalID } = useAuthentication()

  const open = useEvent(({ volumeId, linkId }: RecentDocumentsItem) => {
    const to = `/doc?mode=open&volumeId=${volumeId}&linkId=${linkId}`
    window.open(getAppHref(to, APPS.PROTONDOCS, getLocalID()))
  })

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

  const trash = useEvent((document: RecentDocumentsItem) => {
    void application.recentDocumentsService.trashDocument(document)
  })

  const value = useMemo(() => ({ open, openParent, trash }), [open, openParent, trash])
  return <DocumentActionsContext.Provider value={value}>{children}</DocumentActionsContext.Provider>
}

export function useDocumentActions() {
  const context = useContext(DocumentActionsContext)
  if (!context) {
    throw new Error('Missing DocumentActions context')
  }
  return context
}
