import type { LoggerInterface } from '@proton/utils/logs'
import type {
  EditorToClientInvokationMessage,
  ClientToEditorReplyMessage,
  EditorRequiresClientMethods,
  PendingMessage,
  CommentInterface,
  CommentThreadInterface,
  ParamsExcludingFunctions,
  RtsMessagePayload,
  BroadcastSource,
} from '@proton/docs-shared'
import { EditorBridgeMessageType, BridgeOriginProvider } from '@proton/docs-shared'
import type { UserState } from '@lexical/yjs'
import { GenerateUUID } from '@proton/docs-core'
import type { ErrorInfo } from 'react'
import type { WordCountInfoCollection } from '@proton/docs-shared'

/** Allows the editor to invoke methods on the client */
export class ClientInvoker implements EditorRequiresClientMethods {
  private pendingMessages: PendingMessage[] = []

  constructor(
    private clientFrame: Window,
    private readonly logger: LoggerInterface,
  ) {}

  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void> {
    return this.invokeClientMethod('editorRequestsPropagationOfUpdate', [message, debugSource])
  }

  async getTypersExcludingSelf(threadId: string): Promise<string[]> {
    return this.invokeClientMethod('getTypersExcludingSelf', [threadId])
  }

  async createComment(content: string, threadID: string): Promise<CommentInterface | undefined> {
    return this.invokeClientMethod('createComment', [content, threadID])
  }

  async beganTypingInThread(threadID: string): Promise<void> {
    return this.invokeClientMethod('beganTypingInThread', [threadID])
  }

  async stoppedTypingInThread(threadID: string): Promise<void> {
    return this.invokeClientMethod('stoppedTypingInThread', [threadID])
  }

  async unresolveThread(threadId: string): Promise<boolean> {
    return this.invokeClientMethod('unresolveThread', [threadId])
  }

  async editComment(threadID: string, commentID: string, content: string): Promise<boolean> {
    return this.invokeClientMethod('editComment', [threadID, commentID, content])
  }

  async deleteComment(threadID: string, commentID: string): Promise<boolean> {
    return this.invokeClientMethod('deleteComment', [threadID, commentID])
  }

  async getAllThreads(): Promise<CommentThreadInterface[]> {
    return this.invokeClientMethod('getAllThreads', [])
  }

  async createThread(commentContent: string): Promise<CommentThreadInterface | undefined> {
    return this.invokeClientMethod('createThread', [commentContent])
  }

  async resolveThread(threadId: string): Promise<boolean> {
    return this.invokeClientMethod('resolveThread', [threadId])
  }

  async deleteThread(id: string): Promise<boolean> {
    return this.invokeClientMethod('deleteThread', [id])
  }

  async markThreadAsRead(id: string): Promise<void> {
    return this.invokeClientMethod('markThreadAsRead', [id])
  }

  async handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    return this.invokeClientMethod('handleAwarenessStateUpdate', [states])
  }

  async openLink(url: string): Promise<void> {
    return this.invokeClientMethod('openLink', [url])
  }

  async reportError(
    error: Error,
    audience: 'user-and-devops' | 'devops-only' | 'user-only',
    extraInfo: { irrecoverable?: boolean; errorInfo?: ErrorInfo; lockEditor?: boolean },
  ): Promise<void> {
    return this.invokeClientMethod('reportError', [error, audience, extraInfo])
  }

  async reportWordCount(wordCountInfo: WordCountInfoCollection): Promise<void> {
    return this.invokeClientMethod('reportWordCount', [wordCountInfo])
  }

  async updateFrameSize(size: number): Promise<void> {
    return this.invokeClientMethod('updateFrameSize', [size])
  }

  async showGenericAlertModal(message: string): Promise<void> {
    return this.invokeClientMethod('showGenericAlertModal', [message])
  }

  async fetchExternalImageAsBase64(url: string): Promise<string | undefined> {
    return this.invokeClientMethod('fetchExternalImageAsBase64', [url])
  }

  public handleReplyFromClient(message: ClientToEditorReplyMessage): void {
    const pendingMessage = this.pendingMessages.find((m) => m.messageId === message.messageId)
    if (pendingMessage) {
      pendingMessage.resolve(message.returnValue)
      this.pendingMessages = this.pendingMessages.filter((m) => m !== pendingMessage)
    }
  }

  private async invokeClientMethod<K extends keyof EditorRequiresClientMethods>(
    functionName: K,
    args: ParamsExcludingFunctions<Parameters<EditorRequiresClientMethods[K]>>,
  ): Promise<Awaited<ReturnType<EditorRequiresClientMethods[K]>>> {
    const messageId = GenerateUUID()

    const message: EditorToClientInvokationMessage<K> = {
      type: EditorBridgeMessageType.EditorToClientInvokation,
      functionName,
      args,
      messageId,
    }

    this.logger.debug('Sending message to client', message)

    this.clientFrame.postMessage(message, BridgeOriginProvider.GetClientOrigin())

    return new Promise<Awaited<ReturnType<EditorRequiresClientMethods[K]>>>((resolve) => {
      this.pendingMessages.push({
        messageId,
        resolve,
      })
    })
  }
}
