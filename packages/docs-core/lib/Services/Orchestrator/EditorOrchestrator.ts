import {
  CommentInterface,
  CommentThreadInterface,
  CommentServiceInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  BroadcastSource,
  DocumentRole,
  DataTypesThatDocumentCanBeExportedAs,
} from '@proton/docs-shared'
import { EditorOrchestratorInterface } from './EditorOrchestratorInterface'
import { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import { UserState } from '@lexical/yjs'
import { DocsApi } from '../../Api/DocsApi'

/**
 * Exposes a unified interface for interacting with a document to the editor bridge,
 * without exposing access to the direct services/controllers.
 */
export class EditorOrchestrator implements EditorOrchestratorInterface {
  constructor(
    private readonly comments: CommentServiceInterface,
    private readonly docs: DocControllerInterface,
    private readonly docsApi: DocsApi,
  ) {}

  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    return this.docs.exportAndDownload(format)
  }

  get username(): string {
    if (!this.docs.userAddress) {
      throw new Error('User address not yet available')
    }

    return this.docs.userAddress
  }

  get docMeta(): DocumentMetaInterface {
    return this.docs.getSureDocument()
  }

  get role(): DocumentRole {
    return this.docs.role
  }

  async editorRequestsPropagationOfUpdate(message: RtsMessagePayload, updateSource: BroadcastSource): Promise<void> {
    return this.docs.editorRequestsPropagationOfUpdate(message, updateSource)
  }

  public provideEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void {
    void this.docs.editorIsReadyToReceiveInvocations(editorInvoker)
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

  async fetchExternalImageAsBase64(url: string): Promise<string | undefined> {
    const result = await this.docsApi.fetchExternalImageAsBase64(url)

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }
}
