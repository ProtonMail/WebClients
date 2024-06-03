import {
  EditorToClientReplyMessage,
  ClientRequiresEditorMethods,
  ParamsExcludingFunctions,
  ClientToEditorInvokationMessage,
  PendingMessage,
  EditorBridgeMessageType,
  ConvertibleDataType,
  WebsocketConnectionEventStatusChange,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { LoggerInterface } from '@standardnotes/utils'
import { GenerateUUID } from '../Util/GenerateUuid'

/** Allows the client to invoke methods on the editor */
export class EditorInvoker implements ClientRequiresEditorMethods {
  private pendingMessages: PendingMessage[] = []

  constructor(
    private editorFrame: HTMLIFrameElement,
    private readonly logger: LoggerInterface,
  ) {}

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

  async receiveThemeChanges(theme: string): Promise<void> {
    return this.invokeEditorMethod('receiveThemeChanges', [theme])
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

  async handleWSConnectionStatusChange(status: WebsocketConnectionEventStatusChange): Promise<void> {
    return this.invokeEditorMethod('handleWSConnectionStatusChange', [status])
  }

  async broadcastPresenceState(): Promise<void> {
    return this.invokeEditorMethod('broadcastPresenceState', [])
  }

  async initializeEditor(
    documentId: string,
    username: string,
    initialData?: Uint8Array,
    initialDataType?: ConvertibleDataType,
  ): Promise<void> {
    return this.invokeEditorMethod('initializeEditor', [documentId, username, initialData, initialDataType])
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
    const messageId = GenerateUUID()

    const message: ClientToEditorInvokationMessage<K> = {
      type: EditorBridgeMessageType.ClientToEditorInvokation,
      functionName,
      args,
      messageId,
    }

    this.logger.info('Sending message to editor', message)

    this.editorFrame.contentWindow?.postMessage(message, '*')

    return new Promise<ReturnType<ClientRequiresEditorMethods[K]>>((resolve) => {
      this.pendingMessages.push({
        messageId,
        resolve,
      })
    })
  }
}
