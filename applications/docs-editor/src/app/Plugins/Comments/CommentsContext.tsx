import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { createContext, useContext } from 'react'
import type { LexicalNode, NodeKey } from 'lexical'
import type { UserState } from '@lexical/yjs'
import type { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'

type CommentsContextValue = {
  username: string
  controller: EditorRequiresClientMethods
  removeMarkNode: (id: string) => void
  activeIDs: string[]
  markNodeMap: Map<string, Set<NodeKey>>
  getMarkNodes: (id: string) => LexicalNode[] | null
  threadToFocus: string | null
  setThreadToFocus: (id: string | null) => void
  awarenessStates: UserState[]
  showConfirmModal: ReturnType<typeof useConfirmActionModal>[1]
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
