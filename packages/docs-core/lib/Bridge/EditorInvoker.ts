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
} from '@proton/docs-shared'
import { EditorBridgeMessageType, BridgeOriginProvider } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import { GenerateUUID } from '../Util/GenerateUuid'
import type { SerializedEditorState } from 'lexical'
import type { UserSettings } from '@proton/shared/lib/interfaces'

/** Allows the client to invoke methods on the editor */
export class EditorInvoker implements ClientRequiresEditorMethods {
  private pendingMessages: PendingMessage[] = []

  constructor(
    private editorFrame: HTMLIFrameElement,
    private readonly logger: LoggerInterface,
  ) {}

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

  async getDocumentState(): Promise<Uint8Array> {
    return this.invokeEditorMethod('getDocumentState', [])
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

  async exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array> {
    return this.invokeEditorMethod('exportData', [format])
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

  async initializeEditor(
    documentId: string,
    username: string,
    documentRole: DocumentRoleType,
    editorInitializationConfig?: EditorInitializationConfig,
  ): Promise<void> {
    return this.invokeEditorMethod('initializeEditor', [documentId, username, documentRole, editorInitializationConfig])
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
      throw new Error('Editor frame contentWindow is not ready')
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
