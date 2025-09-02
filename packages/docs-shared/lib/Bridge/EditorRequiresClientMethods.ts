import type { ErrorInfo } from 'react'
import type { CommentInterface } from '../CommentInterface'
import type { CommentThreadInterface } from '../CommentThreadInterface'
import type { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import type { BroadcastSource } from './BroadcastSource'
import type { WordCountInfoCollection } from '../WordCount/WordCountTypes'
import type { SuggestionSummaryType } from '../SuggestionType'
import type { EditorEvent, EditorEventData } from './EditorEvent'
import type { SafeDocsUserState } from '../Doc/DocsAwareness'

export interface EditorRequiresClientMethods {
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void>

  getTypersExcludingSelf(threadId: string): Promise<string[]>
  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>
  beganTypingInThread(threadID: string): Promise<void>
  stoppedTypingInThread(threadID: string): Promise<void>
  editComment(threadID: string, commentID: string, content: string): Promise<boolean>
  deleteComment(threadID: string, commentID: string): Promise<boolean>

  getAllThreads(): Promise<CommentThreadInterface[]>
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

  resolveThread(threadId: string): Promise<boolean>
  unresolveThread(threadId: string): Promise<boolean>

  acceptSuggestion(threadId: string, summary: string): Promise<boolean>
  rejectSuggestion(threadId: string, summary?: string): Promise<boolean>
  reopenSuggestion(threadId: string): Promise<boolean>

  deleteThread(id: string): Promise<boolean>
  markThreadAsRead(id: string): Promise<void>

  handleAwarenessStateUpdate(states: SafeDocsUserState[]): Promise<void>

  openLink(url: string): Promise<void>

  /**
   * @param extraInfo
   *  - irrecoverable: If true, will destroy the application instance entirely and display a blocking modal.
   *                   Otherwise, will show a modal that can be dismissed.
   */
  reportUserInterfaceError(
    error: Error,
    extraInfo?: { irrecoverable?: boolean; errorInfo?: ErrorInfo; lockEditor?: boolean },
  ): Promise<void>
  reportWordCount(wordCountInfo: WordCountInfoCollection): Promise<void>
  updateFrameSize(size: number): void
  showGenericAlertModal(message: string): void

  fetchExternalImageAsBase64(url: string): Promise<string | undefined>
}
