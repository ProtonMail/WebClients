import type { UserState } from '@lexical/yjs'
import type {
  CommentInterface,
  CommentThreadInterface,
  ClientRequiresEditorMethods,
  RtsMessagePayload,
  DocumentMetaInterface,
  BroadcastSource,
  DocumentRole,
  DataTypesThatDocumentCanBeExportedAs,
} from '@proton/docs-shared'

export interface EditorOrchestratorInterface {
  username: string
  docMeta: DocumentMetaInterface
  role: DocumentRole

  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  provideEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  editorReportingError(error: string, extraInfo: { irrecoverable?: boolean; lockEditor?: boolean }): void

  getTypersExcludingSelf(threadId: string): string[]
  createComment(content: string, threadID: string): Promise<CommentInterface | undefined>
  beganTypingInThread(threadID: string): void
  stoppedTypingInThread(threadID: string): void
  unresolveThread(threadId: string): Promise<boolean>
  editComment(threadID: string, commentID: string, content: string): Promise<boolean>
  deleteComment(threadID: string, commentID: string): Promise<boolean>

  getAllThreads(): CommentThreadInterface[]
  createThread(commentContent: string): Promise<CommentThreadInterface | undefined>
  resolveThread(threadId: string): Promise<boolean>
  deleteThread(id: string): Promise<boolean>
  markThreadAsRead(id: string): Promise<void>

  handleAwarenessStateUpdate(states: UserState[]): Promise<void>

  fetchExternalImageAsBase64(url: string): Promise<string | undefined>
}
