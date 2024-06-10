import {
  CommentInterface,
  CommentThreadInterface,
  CommentServiceInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  BroadcastSources,
} from '@proton/docs-shared'
import { EditorOrchestratorInterface } from './EditorOrchestratorInterface'
import { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import { UserState } from '@lexical/yjs'

/**
 * Exposes a unified interface for interacting with a document to the editor bridge,
 * without exposing access to the direct services/controllers.
 */
export class EditorOrchestrator implements EditorOrchestratorInterface {
  constructor(
    private readonly comments: CommentServiceInterface,
    private readonly docs: DocControllerInterface,
  ) {}

  get username(): string {
    return this.docs.username
  }

  get docMeta(): DocumentMetaInterface {
    return this.docs.getSureDocument()
  }

  async editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    origin: string,
    updateSource: BroadcastSources,
  ): Promise<void> {
    return this.docs.editorRequestsPropagationOfUpdate(message, origin, updateSource)
  }

  public passEditorInvokerToDocController(editorInvoker: ClientRequiresEditorMethods): void {
    this.docs.setEditorInvoker(editorInvoker)
  }

  getTypersExcludingSelf(threadId: string): string[] {
    return this.comments.getTypersExcludingSelf(threadId)
  }

  createComment(content: string, threadID: string): Promise<CommentInterface | undefined> {
    return this.comments.createComment(content, threadID)
  }

  beganTypingInThread(threadID: string): void {
    return this.comments.beganTypingInThread(threadID)
  }

  stoppedTypingInThread(threadID: string): void {
    return this.comments.stoppedTypingInThread(threadID)
  }

  unresolveThread(threadId: string): Promise<boolean> {
    return this.comments.unresolveThread(threadId)
  }

  async markThreadAsRead(id: string): Promise<void> {
    return this.comments.markThreadAsRead(id)
  }

  editComment(threadID: string, commentID: string, content: string): Promise<boolean> {
    return this.comments.editComment(threadID, commentID, content)
  }

  deleteComment(threadID: string, commentID: string): Promise<boolean> {
    return this.comments.deleteComment(threadID, commentID)
  }

  getAllThreads(): CommentThreadInterface[] {
    return this.comments.getAllThreads()
  }

  createThread(commentContent: string): Promise<CommentThreadInterface | undefined> {
    return this.comments.createThread(commentContent)
  }

  resolveThread(threadId: string): Promise<boolean> {
    return this.comments.resolveThread(threadId)
  }

  deleteThread(id: string): Promise<boolean> {
    return this.comments.deleteThread(id)
  }

  handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    return this.docs.handleAwarenessStateUpdate(states)
  }
}
