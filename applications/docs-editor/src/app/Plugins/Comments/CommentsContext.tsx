import type { EditorRequiresClientMethods, SafeDocsUserState } from '@proton/docs-shared'
import { createContext, useContext } from 'react'
import type { LexicalNode, NodeKey, RangeSelection } from 'lexical'
import type { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'

type CommentsContextValue = {
  userAddress: string
  controller: EditorRequiresClientMethods
  removeMarkNode: (id: string) => void
  activeIDs: string[]
  markNodeMap: Map<string, Set<NodeKey>>
  getMarkNodes: (id: string) => LexicalNode[] | null
  threadToFocus: string | null
  setThreadToFocus: (id: string | null) => void
  awarenessStates: SafeDocsUserState[]
  showConfirmModal: ReturnType<typeof useConfirmActionModal>[1]

  commentInputSelection: RangeSelection | undefined
  cancelAddComment: () => void
  setCurrentCommentDraft: (draft: string | undefined) => void
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

export const useCommentsContext = () => {
  const context = useContext(CommentsContext)
  if (!context) {
    throw new Error('useCommentsContext must be used within a CommentsProvider')
  }
  return context
}

export const CommentsProvider = CommentsContext.Provider
