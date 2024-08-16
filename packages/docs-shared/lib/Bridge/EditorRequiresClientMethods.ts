import { type ErrorInfo } from 'react'
import type { UserState } from '@lexical/yjs'
import type { CommentInterface } from '../CommentInterface'
import type { CommentThreadInterface } from '../CommentThreadInterface'
import type { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import type { BroadcastSource } from './BroadcastSource'

export interface EditorRequiresClientMethods {
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>

  getTypersExcludingSelf(threadId: string): Promise<string[]>
  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>
  beganTypingInThread(threadID: string): Promise<void>
  stoppedTypingInThread(threadID: string): Promise<void>
  unresolveThread(threadId: string): Promise<boolean>
  editComment(threadID: string, commentID: string, content: string): Promise<boolean>
  deleteComment(threadID: string, commentID: string): Promise<boolean>

  getAllThreads(): Promise<CommentThreadInterface[]>
  createThread(commentContent: string): Promise<CommentThreadInterface | undefined>
  resolveThread(threadId: string): Promise<boolean>
  deleteThread(id: string): Promise<boolean>
  markThreadAsRead(id: string): Promise<void>

  handleAwarenessStateUpdate(states: UserState[]): Promise<void>

  openLink(url: string): Promise<void>

  /**
   * @param audience If devops-only, will only be reported to error reporting tool.
   *                 If user-and-devops, will show a generic alert and report to error reporting tool.
   *                 If user-only, will show an alert but not report to reporting tool.
   * @param extraInfo
   *  - irrecoverable: If true, will destroy the application instance entirely and display a blocking modal.
   *                   Otherwise, will show a modal that can be dismissed.
   */
  reportError(
    error: Error,
    audience: 'user-and-devops' | 'devops-only' | 'user-only',
    extraInfo?: { irrecoverable?: boolean; errorInfo?: ErrorInfo; lockEditor?: boolean },
  ): Promise<void>
  updateFrameSize(size: number): void
  showGenericAlertModal(message: string): void

  fetchExternalImageAsBase64(url: string): Promise<string | undefined>
}
