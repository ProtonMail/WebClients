import { ConvertibleDataType } from '../ConvertibleDataType'
import { RtsMessagePayload } from '../Doc/RtsMessagePayload'
import { WebsocketConnectionEventStatusChange } from '../Realtime/WebsocketConnectionEvent'

export interface ClientRequiresEditorMethods {
  receiveMessage(message: RtsMessagePayload): Promise<void>
  performOpeningCeremony(): Promise<void>
  performClosingCeremony(): Promise<void>
  getDocumentState(): Promise<Uint8Array>
  getClientId(): Promise<number>
  receiveThemeChanges(theme: string): Promise<void>
  showEditor(): Promise<void>
  showCommentsPanel(): Promise<void>
  initializeEditor(
    documentId: string,
    username: string,
    initialData?: Uint8Array,
    initialDataType?: ConvertibleDataType,
  ): Promise<void>
  handleCommentsChange(): Promise<void>
  handleTypingStatusChange(threadId: string): Promise<void>
  handleCreateCommentMarkNode(markID: string): Promise<void>
  handleRemoveCommentMarkNode(markID: string): Promise<void>
  handleResolveCommentMarkNode(markID: string): Promise<void>
  handleUnresolveCommentMarkNode(markID: string): Promise<void>
  handleWSConnectionStatusChange(status: WebsocketConnectionEventStatusChange): Promise<void>
  broadcastPresenceState(): Promise<void>
}
