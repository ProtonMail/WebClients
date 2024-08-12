import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { createContext, useContext } from 'react'
import type { NodeKey } from 'lexical'
import type { UserState } from '@lexical/yjs'
import type { CommentThreadMarkNode } from './CommentThreadMarkNode'

type CommentsContextValue = {
  username: string
  controller: EditorRequiresClientMethods
  removeMarkNode: (id: string) => void
  activeIDs: string[]
  setActiveIDs: (ids: string[]) => void
  markNodeMap: Map<string, Set<NodeKey>>
  getMarkNodes: (id: string) => CommentThreadMarkNode[] | null
  threadToFocus: string | null
  setThreadToFocus: (id: string | null) => void
  awarenessStates: UserState[]
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
