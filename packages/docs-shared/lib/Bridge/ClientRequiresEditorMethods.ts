import type { DocumentRoleType } from '../Doc/DocumentRole'
import type { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import type { EditorInitializationConfig } from '../EditorInitializationConfig'
import type { DataTypesThatDocumentCanBeExportedAs } from '../ExportableDataType'
import type { SerializedEditorState } from 'lexical'
import type { UserSettings } from '@proton/shared/lib/interfaces'

export interface ClientRequiresEditorMethods {
  receiveMessage(message: RtsMessagePayload): Promise<void>
  performOpeningCeremony(): Promise<void>
  performClosingCeremony(): Promise<void>
  /** Returns the document Yjs state */
  getDocumentState(): Promise<Uint8Array>
  /** Returns the Lexical state of the editor, unrelated to the Yjs state */
  getCurrentEditorState(): Promise<SerializedEditorState | undefined>
  getClientId(): Promise<number>
  showEditor(): Promise<void>
  showCommentsPanel(): Promise<void>
  initializeEditor(
    documentId: string,
    username: string,
    role: DocumentRoleType,
    editorInitializationConfig?: EditorInitializationConfig,
  ): Promise<void>
  handleCommentsChange(): Promise<void>
  handleTypingStatusChange(threadId: string): Promise<void>
  handleCreateCommentMarkNode(markID: string): Promise<void>
  handleRemoveCommentMarkNode(markID: string): Promise<void>
  handleResolveCommentMarkNode(markID: string): Promise<void>
  handleUnresolveCommentMarkNode(markID: string): Promise<void>
  changeLockedState(locked: boolean): Promise<void>
  broadcastPresenceState(): Promise<void>
  exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array>
  printAsPDF(): Promise<void>
  loadUserSettings(settings: UserSettings): Promise<void>
  toggleDebugTreeView(): Promise<void>
  handleIsSuggestionsFeatureEnabled(enabled: boolean): Promise<void>
}
