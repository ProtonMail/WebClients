import { createContext, useContext } from 'react'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'

export type DocumentActionsContextValue = {
  open: (document: RecentDocumentsItem, type?: 'normal' | 'trash') => void
  share: (document: RecentDocumentsItem) => void
  move: (document: RecentDocumentsItem) => void
  openParent: (document: RecentDocumentsItem) => void
  startRename: (document: RecentDocumentsItem) => void
  cancelRename: (force?: boolean) => void
  rename: (document: RecentDocumentsItem, newName: string) => Promise<void>
  isRenaming: (document: RecentDocumentsItem) => boolean
  isRenameSaving: boolean
  trash: (document: RecentDocumentsItem) => Promise<void>
  currentlyTrashingId?: string
  /**
   * Returns a f-n that removes listener on unmount
   */
  subscribeToTrashed: (listener: (id: string) => void) => () => void
  restore: (document: RecentDocumentsItem) => Promise<void>
  currentlyRestoringId?: string
  /**
   * Returns a f-n that removes listener on unmount
   */
  subscribeToRestored: (listener: (id: string) => void) => () => void
  deletePermanently: (document: RecentDocumentsItem) => Promise<void>
  /**
   * Resolves with the documents that failed to trash
   */
  bulkTrash: (documents: RecentDocumentsItem[]) => Promise<RecentDocumentsItem[]>
  isBulkTrashing: boolean
  bulkMove: (documents: RecentDocumentsItem[], onMoved?: (moved: RecentDocumentsItem[]) => void) => void
}

export const DocumentActionsContext = createContext<DocumentActionsContextValue | undefined>(undefined)

export function useDocumentActions() {
  const context = useContext(DocumentActionsContext)
  if (!context) {
    throw new Error('Missing DocumentActionsProvider')
  }
  return context
}
