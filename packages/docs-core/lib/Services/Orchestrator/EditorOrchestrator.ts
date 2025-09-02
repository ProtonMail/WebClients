import type { SafeDocsUserState } from '@proton/docs-shared'
import {
  type CommentInterface,
  type CommentThreadInterface,
  type CommentControllerInterface,
  type ClientRequiresEditorMethods,
  type RtsMessagePayload,
  type BroadcastSource,
  type DataTypesThatDocumentCanBeExportedAs,
  type InternalEventBusInterface,
  type SuggestionSummaryType,
  type EditorEventData,
  type EditorEvent,
  type DocsAwarenessStateChangeData,
  DocAwarenessEvent,
  AnonymousUserEmail,
} from '@proton/docs-shared'
import type { EditorOrchestratorInterface } from './EditorOrchestratorInterface'
import type { DocsApi } from '../../Api/DocsApi'
import { PostApplicationError } from '../../Application/ApplicationEvent'
import type { EditorControllerInterface } from '../../EditorController/EditorController'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import { DocParticipantTracker } from '../../ParticipantTracker/DocParticipantTracker'

/**
 * Exposes a unified interface for interacting with a document to the editor bridge,
 * without exposing access to the direct services/controllers.
 */
export class EditorOrchestrator implements EditorOrchestratorInterface {
  readonly participantTracker = new DocParticipantTracker(this.documentState)

  public userAddress = this.documentState.getProperty('entitlements').keys.userOwnAddress ?? AnonymousUserEmail

  constructor(
    private readonly comments: CommentControllerInterface | undefined,
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

  async handleAwarenessStateUpdate(states: SafeDocsUserState[]): Promise<void> {
    this.participantTracker.updateParticipantsFromUserStates(states)

    this.eventBus.publish<DocsAwarenessStateChangeData>({
      type: DocAwarenessEvent.AwarenessStateChange,
      payload: {
        states,
      },
    })
  }

  async fetchExternalImageAsBase64(url: string): Promise<string | undefined> {
    const result = await this.docsApi.fetchExternalImageAsBase64(url)

    if (result.isFailed()) {
      return undefined
    }

    return result.getValue()
  }
}
