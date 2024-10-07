import type { CommentInterface } from './CommentInterface'
import type { CommentThreadInterface } from './CommentThreadInterface'
import type { InternalEventBusInterface } from './Events/InternalEventBusInterface'
import type { SuggestionThreadStateAction } from './SuggestionThreadStateAction'
import type { SuggestionSummaryType } from './SuggestionType'

export interface CommentControllerInterface {
  userDisplayName: string
  readonly eventBus: InternalEventBusInterface
  fetchAllComments(): void

  getAllThreads(): CommentThreadInterface[]

  createCommentThread(
    commentContent: string,
    markID?: string,
    createMarkNode?: boolean,
  ): Promise<CommentThreadInterface | undefined>

  createSuggestionThread(
    suggestionID: string,
    commentContent: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<CommentThreadInterface | undefined>

  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>

  createSuggestionSummaryComment(content: string, threadID: string): Promise<CommentInterface | undefined>

  editComment(threadID: string, commentID: string, content: string): Promise<boolean>

  deleteComment(threadID: string, commentID: string): Promise<boolean>

  deleteThread(id: string): Promise<boolean>

  resolveThread(threadId: string): Promise<boolean>

  changeSuggestionThreadState(threadId: string, action: SuggestionThreadStateAction): Promise<boolean>

  unresolveThread(threadId: string): Promise<boolean>

  markThreadAsRead(id: string): void

  getTypersExcludingSelf(threadId: string): string[]
  beganTypingInThread(threadID: string): void
  stoppedTypingInThread(threadID: string): void
}
