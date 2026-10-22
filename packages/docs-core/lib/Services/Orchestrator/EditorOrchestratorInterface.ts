import type { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import type { ClientRequiresEditorMethods } from '@proton/docs-shared/Bridge/ClientRequiresEditorMethods'
import type { EditorEvent, EditorEventData } from '@proton/docs-shared/Bridge/EditorEvent'
import type { FileMenuAction } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type { CommentInterface } from '@proton/docs-shared/CommentInterface'
import type { CommentThreadInterface } from '@proton/docs-shared/CommentThreadInterface'
import type { SafeDocsUserState } from '@proton/docs-shared/Doc/DocsAwareness'
import type { RtsMessagePayload } from '@proton/docs-shared/Doc/RtsMessagePayload'
import type { DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared/ExportableDataType'
import type { SuggestionSummaryType } from '@proton/docs-shared/SuggestionType'
import type { FeatureFlag } from '@proton/unleash/Flags'
import type { SheetsPatchesType } from '../../Database/SheetsDBSchema'
import type { SheetsActionType } from '@proton/docs-shared/SheetsActionType'
import type { TelemetryDocsEditorEvents } from '@proton/shared/lib/api/telemetry'

export interface EditorOrchestratorInterface {
  userAddress: string

  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  provideEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  editorReportingError(error: string, extraInfo: { irrecoverable?: boolean; lockEditor?: boolean }): void
  editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void>
  editorReportingTelemetry(event: TelemetryDocsEditorEvents): Promise<void>
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

  handleFileMenuAction(action: FileMenuAction): Promise<void>
  checkIfFeatureFlagIsEnabled(featureFlag: FeatureFlag): Promise<boolean>

  storeSpreadsheetPatches(patches: unknown, updateHash: string, type?: SheetsPatchesType): Promise<void>
  storeSpreadsheetAction(type: SheetsActionType, content: unknown): Promise<void>
  hasBasePatches(): Promise<boolean>

  reportSheetsYjsDriftDetected(reason: 'local-differs-from-yjs' | 'local-change-not-observed-by-yjs' | 'both'): void
  showYjsDriftDetectedErrorModal(driftLogDetails: Record<string, unknown>): void
}
