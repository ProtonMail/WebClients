import { ConvertibleDataType } from '../ConvertibleDataType'
import { DocumentRoleType } from '../Doc/DocumentRole'
import { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import { DataTypesThatDocumentCanBeExportedAs } from '../ExportableDataType'

export interface ClientRequiresEditorMethods {
  receiveMessage(message: RtsMessagePayload): Promise<void>
  performOpeningCeremony(): Promise<void>
  performClosingCeremony(): Promise<void>
  getDocumentState(): Promise<Uint8Array>
  getClientId(): Promise<number>
  showEditor(): Promise<void>
  showCommentsPanel(): Promise<void>
  initializeEditor(
    documentId: string,
    username: string,
    role: DocumentRoleType,
    initialData?: Uint8Array,
    initialDataType?: ConvertibleDataType,
  ): Promise<void>
  handleCommentsChange(): Promise<void>
  handleTypingStatusChange(threadId: string): Promise<void>
  handleCreateCommentMarkNode(markID: string): Promise<void>
  handleRemoveCommentMarkNode(markID: string): Promise<void>
  handleResolveCommentMarkNode(markID: string): Promise<void>
  handleUnresolveCommentMarkNode(markID: string): Promise<void>
  changeLockedState(locked: boolean): Promise<void>
  broadcastPresenceState(): Promise<void>
  exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array | Blob>
  printAsPDF(): Promise<void>
}
