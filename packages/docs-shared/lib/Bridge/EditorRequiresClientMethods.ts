import { type ErrorInfo } from 'react'
import { UserState } from '@lexical/yjs'
import { CommentInterface } from '../CommentInterface'
import { CommentThreadInterface } from '../CommentThreadInterface'
import { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import { BroadcastSources } from './BroadcastSources'

export interface EditorRequiresClientMethods {
  editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSources,
  ): Promise<void>

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

  reportError(error: Error, errorInfo?: ErrorInfo): Promise<void>
}
