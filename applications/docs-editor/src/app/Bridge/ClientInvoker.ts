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
  SuggestionSummaryType,
  SafeDocsUserState,
  FileMenuAction,
  AppPlatform,
} from '@proton/docs-shared'
import {
  GenerateUUID,
  EditorBridgeMessageType,
  BridgeOriginProvider,
  type WordCountInfoCollection,
  type EditorEvent,
  type EditorEventData,
} from '@proton/docs-shared'
import type { ErrorInfo } from 'react'
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags'

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

  async editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void> {
    return this.invokeClientMethod('editorReportingEvent', [event, data])
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

  async createCommentThread(
    commentContent: string,
    markID?: string,
    createMarkNode?: boolean,
  ): Promise<CommentThreadInterface | undefined> {
    return this.invokeClientMethod('createCommentThread', [commentContent, markID, createMarkNode])
  }

  async createSuggestionThread(
    suggestionID: string,
    commentContent: string,
    suggestionType: SuggestionSummaryType,
  ): Promise<CommentThreadInterface | undefined> {
    return this.invokeClientMethod('createSuggestionThread', [suggestionID, commentContent, suggestionType])
  }

  async resolveThread(threadId: string): Promise<boolean> {
    return this.invokeClientMethod('resolveThread', [threadId])
  }

  async acceptSuggestion(threadId: string, summary: string): Promise<boolean> {
    return this.invokeClientMethod('acceptSuggestion', [threadId, summary])
  }

  async rejectSuggestion(threadId: string, summary?: string): Promise<boolean> {
    return this.invokeClientMethod('rejectSuggestion', [threadId, summary])
  }

  async reopenSuggestion(threadId: string): Promise<boolean> {
    return this.invokeClientMethod('reopenSuggestion', [threadId])
  }

  async deleteThread(id: string): Promise<boolean> {
    return this.invokeClientMethod('deleteThread', [id])
  }

  async markThreadAsRead(id: string): Promise<void> {
    return this.invokeClientMethod('markThreadAsRead', [id])
  }

  async handleAwarenessStateUpdate(states: SafeDocsUserState[]): Promise<void> {
    return this.invokeClientMethod('handleAwarenessStateUpdate', [states])
  }

  async openLink(url: string): Promise<void> {
    return this.invokeClientMethod('openLink', [url])
  }

  async reportUserInterfaceError(
    error: Error,
    extraInfo: { irrecoverable?: boolean; errorInfo?: ErrorInfo; lockEditor?: boolean },
  ): Promise<void> {
    return this.invokeClientMethod('reportUserInterfaceError', [error, extraInfo])
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

  async showGenericInfoModal(props: { title: string; translatedMessage: string }): Promise<void> {
    return this.invokeClientMethod('showGenericInfoModal', [props])
  }

  async fetchExternalImageAsBase64(url: string): Promise<string | undefined> {
    return this.invokeClientMethod('fetchExternalImageAsBase64', [url])
  }

  async handleFileMenuAction(action: FileMenuAction): Promise<void> {
    return this.invokeClientMethod('handleFileMenuAction', [action])
  }

  async checkIfFeatureFlagIsEnabled(featureFlag: FeatureFlag): Promise<boolean> {
    return this.invokeClientMethod('checkIfFeatureFlagIsEnabled', [featureFlag])
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

  async getAppPlatform(): Promise<AppPlatform> {
    return this.invokeClientMethod('getAppPlatform', [])
  }
}
