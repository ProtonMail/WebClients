import type { CommentInterface, CommentThreadInterface } from '@proton/docs-shared'
import type { SafeDocsUserState } from './Awareness'
import type { SuggestionSummaryType } from './SuggestionType'

export type DocsCommentEvent =
  | { type: 'changed' }
  | { type: 'create-mark' | 'remove-mark' | 'resolve-mark' | 'unresolve-mark'; markID: string }
  | { type: 'typing'; threadId: string }

/** Comment operations and incoming events supplied by the embedding host. */
export type DocsComments = {
  getAllThreads(): Promise<CommentThreadInterface[]>
  createCommentThread(
    content: string,
    markID?: string,
    createMarkNode?: boolean,
  ): Promise<CommentThreadInterface | undefined>
  createSuggestionThread(
    suggestionID: string,
    content: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<CommentThreadInterface | undefined>
  createComment(content: string, threadId: string): Promise<CommentInterface | undefined>
  editComment(threadId: string, commentId: string, content: string): Promise<boolean>
  deleteComment(threadId: string, commentId: string): Promise<boolean>
  resolveThread(threadId: string): Promise<boolean>
  unresolveThread(threadId: string): Promise<boolean>
  deleteThread(threadId: string): Promise<boolean>
  acceptSuggestion(threadId: string, summary: string): Promise<boolean>
  rejectSuggestion(threadId: string, summary?: string): Promise<boolean>
  reopenSuggestion(threadId: string): Promise<boolean>
  beganTypingInThread(threadId: string): Promise<void>
  stoppedTypingInThread(threadId: string): Promise<void>
  markThreadAsRead(threadId: string): Promise<void>
  getTypersExcludingSelf(threadId: string): Promise<string[]>
  subscribeToEvents(callback: (event: DocsCommentEvent) => void): () => void
  subscribeToAwarenessStates(callback: (states: SafeDocsUserState[]) => void): () => void
}
