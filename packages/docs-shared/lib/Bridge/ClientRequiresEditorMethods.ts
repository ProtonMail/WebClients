import type { DocumentRoleType } from '../Doc/DocumentRole'
import type { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import type { EditorInitializationConfig } from '../EditorInitializationConfig'
import type { DataTypesThatDocumentCanBeExportedAs } from '../ExportableDataType'
import type { SerializedEditorState } from 'lexical'
import type { UserSettings } from '@proton/shared/lib/interfaces'
import type { YjsState } from '../YjsState'
import type { SyncedEditorEvent, SyncedEditorStateValues } from '../State/SyncedEditorState'

export interface ClientRequiresEditorMethods {
  receiveMessage(message: RtsMessagePayload): Promise<void>
  performOpeningCeremony(): Promise<void>
  performClosingCeremony(): Promise<void>
  /** Returns the document Yjs state */
  getDocumentState(): Promise<YjsState>
  /** Returns the Lexical state of the editor, unrelated to the Yjs state */
  getCurrentEditorState(): Promise<SerializedEditorState | undefined>
  /**
   * A destructive operation that replaces the current editor state with the given state,
   * used when restoring a document from history
   */
  replaceEditorState(state: SerializedEditorState): Promise<void>
  getClientId(): Promise<number>
  showEditor(): Promise<void>
  showCommentsPanel(): Promise<void>
  initializeEditor(
    documentId: string,
    userAddress: string,
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
  copyCurrentSelection(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  printAsPDF(): Promise<void>
  loadUserSettings(settings: UserSettings): Promise<void>
  toggleDebugTreeView(): Promise<void>

  syncProperty(
    property: keyof SyncedEditorStateValues,
    value: SyncedEditorStateValues[keyof SyncedEditorStateValues],
  ): Promise<void>
  syncEvent(event: SyncedEditorEvent): Promise<void>
}
