import type {
  EditorToClientReplyMessage,
  ClientRequiresEditorMethods,
  ParamsExcludingFunctions,
  ClientToEditorInvokationMessage,
  PendingMessage,
  RtsMessagePayload,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRoleType,
  EditorInitializationConfig,
  YjsState,
  SyncedEditorStateValues,
  SyncedEditorEvent,
  SheetImportData,
} from '@proton/docs-shared'
import { EditorBridgeMessageType, BridgeOriginProvider, GenerateUUID } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import type { SerializedEditorState } from 'lexical'
import type { UserSettings } from '@proton/shared/lib/interfaces'

/** Allows the client to invoke methods on the editor */
export class EditorInvoker implements ClientRequiresEditorMethods {
  private pendingMessages: PendingMessage[] = []

  constructor(
    private editorFrame: HTMLIFrameElement,
    private readonly logger: LoggerInterface,
  ) {}

  async syncProperty(
    property: keyof SyncedEditorStateValues,
    value: SyncedEditorStateValues[keyof SyncedEditorStateValues],
  ): Promise<void> {
    return this.invokeEditorMethod('syncProperty', [property, value])
  }

  async syncEvent(event: SyncedEditorEvent): Promise<void> {
    return this.invokeEditorMethod('syncEvent', [event])
  }

  async loadUserSettings(settings: UserSettings): Promise<void> {
    return this.invokeEditorMethod('loadUserSettings', [settings])
  }

  async getClientId(): Promise<number> {
    return this.invokeEditorMethod('getClientId', [])
  }

  async showEditor(): Promise<void> {
    return this.invokeEditorMethod('showEditor', [])
  }

  async performOpeningCeremony(): Promise<void> {
    return this.invokeEditorMethod('performOpeningCeremony', [])
  }

  async performClosingCeremony(): Promise<void> {
    return this.invokeEditorMethod('performClosingCeremony', [])
  }

  async receiveMessage(message: RtsMessagePayload): Promise<void> {
    return this.invokeEditorMethod('receiveMessage', [message])
  }

  async getDocumentState(): Promise<YjsState> {
    return this.invokeEditorMethod('getDocumentState', [])
  }

  async replaceEditorState(state: SerializedEditorState): Promise<void> {
    return this.invokeEditorMethod('replaceEditorState', [state])
  }

  async handleCommentsChange(): Promise<void> {
    return this.invokeEditorMethod('handleCommentsChange', [])
  }

  async handleTypingStatusChange(threadId: string): Promise<void> {
    return this.invokeEditorMethod('handleTypingStatusChange', [threadId])
  }

  async handleCreateCommentMarkNode(markID: string): Promise<void> {
    return this.invokeEditorMethod('handleCreateCommentMarkNode', [markID])
  }

  async handleRemoveCommentMarkNode(markID: string): Promise<void> {
    return this.invokeEditorMethod('handleRemoveCommentMarkNode', [markID])
  }

  async handleResolveCommentMarkNode(markID: string): Promise<void> {
    return this.invokeEditorMethod('handleResolveCommentMarkNode', [markID])
  }

  async handleUnresolveCommentMarkNode(markID: string): Promise<void> {
    return this.invokeEditorMethod('handleUnresolveCommentMarkNode', [markID])
  }

  async changeLockedState(locked: boolean): Promise<void> {
    return this.invokeEditorMethod('changeLockedState', [locked])
  }

  async broadcastPresenceState(): Promise<void> {
    return this.invokeEditorMethod('broadcastPresenceState', [])
  }

  async showCommentsPanel(): Promise<void> {
    return this.invokeEditorMethod('showCommentsPanel', [])
  }

  async exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array<ArrayBuffer>> {
    return this.invokeEditorMethod('exportData', [format])
  }

  async copyCurrentSelection(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    return this.invokeEditorMethod('copyCurrentSelection', [format])
  }

  async printAsPDF(): Promise<void> {
    return this.invokeEditorMethod('printAsPDF', [])
  }

  async getCurrentEditorState(): Promise<SerializedEditorState | undefined> {
    return this.invokeEditorMethod('getCurrentEditorState', [])
  }

  async toggleDebugTreeView(): Promise<void> {
    return this.invokeEditorMethod('toggleDebugTreeView', [])
  }

  async getLocalSpreadsheetStateJSON(): Promise<unknown> {
    return this.invokeEditorMethod('getLocalSpreadsheetStateJSON', [])
  }

  async replaceLocalSpreadsheetState(state: object, broadcastPatches: boolean): Promise<void> {
    return this.invokeEditorMethod('replaceLocalSpreadsheetState', [state, broadcastPatches])
  }

  async getYDocAsJSON(): Promise<unknown> {
    return this.invokeEditorMethod('getYDocAsJSON', [])
  }

  async importDataIntoSheet(data: SheetImportData): Promise<void> {
    return this.invokeEditorMethod('importDataIntoSheet', [data])
  }

  async focusSpreadsheet(): Promise<void> {
    return this.invokeEditorMethod('focusSpreadsheet', [])
  }

  async markImportUpdateAsSuccessful(uuid: string): Promise<void> {
    return this.invokeEditorMethod('markImportUpdateAsSuccessful', [uuid])
  }

  async initializeEditor(
    documentId: string,
    userAddress: string,
    documentRole: DocumentRoleType,
    isPublicMode: boolean,
    appVersion: string,
    editorInitializationConfig?: EditorInitializationConfig,
  ): Promise<void> {
    return this.invokeEditorMethod('initializeEditor', [
      documentId,
      userAddress,
      documentRole,
      isPublicMode,
      appVersion,
      editorInitializationConfig,
    ])
  }

  public handleReplyFromEditor(message: EditorToClientReplyMessage): void {
    const pendingMessage = this.pendingMessages.find((m) => m.messageId === message.messageId)
    if (pendingMessage) {
      pendingMessage.resolve(message.returnValue)
      this.pendingMessages = this.pendingMessages.filter((m) => m !== pendingMessage)
    }
  }

  private async invokeEditorMethod<K extends keyof ClientRequiresEditorMethods>(
    functionName: K,
    args: ParamsExcludingFunctions<Parameters<ClientRequiresEditorMethods[K]>>,
  ): Promise<ReturnType<ClientRequiresEditorMethods[K]>> {
    if (!this.editorFrame.contentWindow) {
      throw new Error(`Attempting to invoke ${functionName} before editor contentWindow is ready`)
    }

    const messageId = GenerateUUID()

    const message: ClientToEditorInvokationMessage<K> = {
      type: EditorBridgeMessageType.ClientToEditorInvokation,
      functionName,
      args,
      messageId,
    }

    this.logger.debug('Sending message to editor', message)

    this.editorFrame.contentWindow.postMessage(message, BridgeOriginProvider.GetEditorOrigin())

    return new Promise<ReturnType<ClientRequiresEditorMethods[K]>>((resolve) => {
      this.pendingMessages.push({
        messageId,
        resolve,
      })
    })
  }
}
