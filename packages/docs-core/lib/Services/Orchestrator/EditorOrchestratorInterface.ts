import type {
  CommentInterface,
  CommentThreadInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  BroadcastSource,
  DataTypesThatDocumentCanBeExportedAs,
  SuggestionSummaryType,
  EditorEvent,
  EditorEventData,
  SafeDocsUserState,
} from '@proton/docs-shared'

export interface EditorOrchestratorInterface {
  userAddress: string

  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  provideEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  editorReportingError(error: string, extraInfo: { irrecoverable?: boolean; lockEditor?: boolean }): void
  editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void>
  getTypersExcludingSelf(threadId: string): string[]
  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>
  beganTypingInThread(threadID: string): void
  stoppedTypingInThread(threadID: string): void
  editComment(threadID: string, commentID: string, content: string): Promise<boolean>
  deleteComment(threadID: string, commentID: string): Promise<boolean>

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
  resolveThread(threadId: string): Promise<boolean>
  unresolveThread(threadId: string): Promise<boolean>
  acceptSuggestion(threadId: string, summary: string): Promise<boolean>
  rejectSuggestion(threadId: string, summary?: string): Promise<boolean>
  reopenSuggestion(threadId: string): Promise<boolean>
  deleteThread(id: string): Promise<boolean>
  markThreadAsRead(id: string): Promise<void>

  handleAwarenessStateUpdate(states: SafeDocsUserState[]): Promise<void>

  fetchExternalImageAsBase64(url: string): Promise<string | undefined>
}
