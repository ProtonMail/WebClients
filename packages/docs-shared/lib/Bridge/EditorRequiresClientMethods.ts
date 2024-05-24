import { UserState } from '@lexical/yjs'
import { CommentInterface } from '../CommentInterface'
import { CommentThreadInterface } from '../CommentThreadInterface'
import { RtsMessagePayload } from '../Doc/RtsMessagePayload'

export interface EditorRequiresClientMethods {
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, originator: string, debugSource: string): Promise<void>

  getTypersExcludingSelf(threadId: string): Promise<string[]>
  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>
  beganTypingInThread(threadID: string): Promise<void>
  stoppedTypingInThread(threadID: string): Promise<void>
  unresolveThread(threadId: string): Promise<boolean>
  editComment(threadID: string, commentID: string, content: string): Promise<boolean>
  deleteComment(threadID: string, commentID: string): Promise<boolean>

  onEditorReady(): Promise<void>

  getAllThreads(): Promise<CommentThreadInterface[]>
  createThread(commentContent: string): Promise<CommentThreadInterface | undefined>
  resolveThread(threadId: string): Promise<boolean>
  deleteThread(id: string): Promise<boolean>

  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
}
