import type {
  CommentInterface,
  CommentThreadInterface,
  CommentControllerInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  BroadcastSource,
  DataTypesThatDocumentCanBeExportedAs,
  InternalEventBusInterface,
  SuggestionSummaryType,
  EditorEventData,
  EditorEvent,
} from '@proton/docs-shared'
import type { EditorOrchestratorInterface } from './EditorOrchestratorInterface'
import type { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import type { UserState } from '@lexical/yjs'
import type { DocsApi } from '../../Api/DocsApi'
import { PostApplicationError } from '../../Application/ApplicationEvent'
import type { PublicDocControllerInterface } from '../../Controller/Document/PublicDocControllerInterface'
import { isPrivateDocController } from '../../Controller/Document/isPrivateDocController'
import type { EditorControllerInterface } from '../../Controller/Document/EditorController'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'

/**
 * Exposes a unified interface for interacting with a document to the editor bridge,
 * without exposing access to the direct services/controllers.
 */
export class EditorOrchestrator implements EditorOrchestratorInterface {
  constructor(
    private readonly comments: CommentControllerInterface | undefined,
    private readonly docs: DocControllerInterface | PublicDocControllerInterface,
    private readonly docsApi: DocsApi,
    private readonly eventBus: InternalEventBusInterface,
    private readonly editor: EditorControllerInterface,
    private readonly documentState: DocumentState | PublicDocumentState,
  ) {}

  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    if (!this.editor) {
      throw new Error('Editor not initialized')
    }

    return this.editor.exportAndDownload(format)
  }

  get username(): string {
    if (!isPrivateDocController(this.docs)) {
      return 'Public Viewer'
    }

    if (!this.docs.userAddress) {
      throw new Error('User address not yet available')
    }

    return this.docs.userAddress
  }

  editorReportingError(error: string, extraInfo: { irrecoverable?: boolean; lockEditor?: boolean }): void {
    PostApplicationError(this.eventBus, {
      translatedError: error,
      irrecoverable: extraInfo.irrecoverable,
    })

    if (extraInfo.lockEditor) {
      this.documentState.setProperty('editorHasRenderingIssue', true)
    }
  }

  async editorRequestsPropagationOfUpdate(message: RtsMessagePayload, updateSource: BroadcastSource): Promise<void> {
    this.documentState.emitEvent({
      name: 'EditorRequestsPropagationOfUpdate',
      payload: {
        message,
        debugSource: updateSource,
      },
    })
  }

  async editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void> {
    this.eventBus.publish({
      type: event,
      payload: data,
    })
  }

  public provideEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void {
    this.editor.receiveEditor(editorInvoker)
  }

  getTypersExcludingSelf(threadId: string): string[] {
    if (!this.comments) {
      return []
    }

    return this.comments.getTypersExcludingSelf(threadId)
  }

  async createComment(content: string, threadID: string): Promise<CommentInterface | undefined> {
    if (!this.comments) {
      return undefined
    }

    return this.comments.createComment(content, threadID)
  }

  beganTypingInThread(threadID: string): void {
    if (!this.comments) {
      return
    }

    return this.comments.beganTypingInThread(threadID)
  }

  stoppedTypingInThread(threadID: string): void {
    if (!this.comments) {
      return
    }

    return this.comments.stoppedTypingInThread(threadID)
  }

  async unresolveThread(threadId: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.unresolveThread(threadId)
  }

  async markThreadAsRead(id: string): Promise<void> {
    if (!this.comments) {
      return
    }

    return this.comments.markThreadAsRead(id)
  }

  async editComment(threadID: string, commentID: string, content: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.editComment(threadID, commentID, content)
  }

  async deleteComment(threadID: string, commentID: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.deleteComment(threadID, commentID)
  }

  getAllThreads(): CommentThreadInterface[] {
    if (!this.comments) {
      return []
    }

    return this.comments.getAllThreads()
  }

  async createCommentThread(
    commentContent: string,
    markID?: string,
    createMarkNode?: boolean,
  ): Promise<CommentThreadInterface | undefined> {
    if (!this.comments) {
      return undefined
    }

    return this.comments.createCommentThread(commentContent, markID, createMarkNode)
  }

  async createSuggestionThread(
    suggestionID: string,
    commentContent: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<CommentThreadInterface | undefined> {
    if (!this.comments) {
      return undefined
    }

    return this.comments.createSuggestionThread(suggestionID, commentContent, suggestionType)
  }

  async resolveThread(threadId: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.resolveThread(threadId)
  }

  async acceptSuggestion(threadId: string, summary: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.changeSuggestionThreadState(threadId, 'accept', summary)
  }

  async rejectSuggestion(threadId: string, summary?: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.changeSuggestionThreadState(threadId, 'reject', summary)
  }

  async reopenSuggestion(threadId: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.changeSuggestionThreadState(threadId, 'reopen')
  }

  async deleteThread(id: string): Promise<boolean> {
    if (!this.comments) {
      return false
    }

    return this.comments.deleteThread(id)
  }

  handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    if (!isPrivateDocController(this.docs)) {
      throw new Error('Attempting to use function only available to private doc controller')
    }

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
