import type { CommentInterface, CommentThreadInterface, SafeDocsUserState } from '@proton/docs-shared'
import { createContext, useContext } from 'react'
import type { LexicalNode, NodeKey, RangeSelection } from 'lexical'
import type { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import type { LoggerInterface } from '@proton/utils/logs'

type CommentsContextValue = {
  userName: string
  userAddress: string
  canEdit: boolean
  canComment: boolean
  suggestionsEnabled: boolean
  languageCode: Intl.LocalesArgument
  logger: LoggerInterface
  getDisplayNameForEmail: (email: string | undefined) => string
  openLink: (url: string) => void

  activeIDs: string[]
  markNodeMap: Map<string, Set<NodeKey>>
  getMarkNodes: (id: string) => LexicalNode[] | null
  removeMarkNode: (id: string) => void

  threadToFocus: string | null
  setThreadToFocus: (id: string | null) => void
  createCommentThread: (
    content: string,
    markID?: string,
    createMarkNode?: boolean,
  ) => Promise<CommentThreadInterface | undefined>
  resolveThread: (threadId: string) => Promise<boolean>
  unresolveThread: (threadId: string) => Promise<boolean>
  deleteThread(id: string): Promise<boolean>
  beganTypingInThread(threadID: string): Promise<void>
  stoppedTypingInThread(threadID: string): Promise<void>
  markThreadAsRead(threadId: string): Promise<void>
  getTypersExcludingSelf(threadId: string): Promise<string[]>

  awarenessStates: SafeDocsUserState[]

  showConfirmModal: ReturnType<typeof useConfirmActionModal>[1]

  commentInputSelection: RangeSelection | undefined
  cancelAddComment: () => void
  setCurrentCommentDraft: (draft: string | undefined) => void
  createComment: (content: string, threadID: string) => Promise<CommentInterface | undefined>
  editComment: (threadId: string, commentId: string, content: string) => Promise<boolean>
  deleteComment: (threadId: string, commentId: string) => Promise<boolean>

  acceptSuggestion: (threadId: string, summary: string) => Promise<boolean>
  rejectSuggestion: (threadId: string, summary: string) => Promise<boolean>
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
