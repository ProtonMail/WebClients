import { BridgeOriginProvider } from '@proton/docs-shared/Bridge/BridgeOriginProvider'
import type { ClientToEditorReplyMessage } from '@proton/docs-shared/Bridge/ClientToEditorMessage'
import { EditorBridgeMessageType } from '@proton/docs-shared/Bridge/EditorBridgeMessageType'
import type { EditorRequiresClientMethods } from '@proton/docs-shared/Bridge/EditorRequiresClientMethods'
import type {
  EditorToClientGenericMessage,
  EditorToClientInvokationMessage,
  EditorToClientReplyMessage,
} from '@proton/docs-shared/Bridge/EditorToClientMessage'
import type { LoggerInterface } from '@proton/shared/lib/logs'

import { EditorInvoker } from './EditorInvoker'
import type { ClientHandler } from './createClientHandler'

/**
 * Adapted from `packages/docs-core/lib/Bridge/ClientToEditorBridge.ts`, which doc2 must not import: the client side of
 * the bridge to the editor iframe. Replies from the editor go to the invoker, and calls from the editor to the client
 * handler. A call the handler has no method for, or whose method throws, gets no reply.
 */
export class ClientEditorBridge {
  readonly editorInvoker: EditorInvoker

  constructor(
    private readonly editorFrame: HTMLIFrameElement,
    private readonly clientHandler: ClientHandler,
    private readonly logger: LoggerInterface,
  ) {
    this.editorInvoker = new EditorInvoker(editorFrame)
    window.addEventListener('message', this.handleMessage)
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage)
  }

  private handleMessage = (event: MessageEvent) => {
    if (event.source !== this.editorFrame.contentWindow || typeof event.data !== 'object' || event.data === null) {
      return
    }

    const message = event.data as EditorToClientGenericMessage

    if (message.type === EditorBridgeMessageType.EditorToClientReply) {
      this.editorInvoker.handleReplyFromEditor(message as EditorToClientReplyMessage)
    } else if (message.type === EditorBridgeMessageType.EditorToClientInvokation) {
      void this.handleEditorRequestingClientMethod(
        message as EditorToClientInvokationMessage<keyof EditorRequiresClientMethods>,
      )
    }
  }

  private async handleEditorRequestingClientMethod({
    functionName,
    args,
    messageId,
  }: EditorToClientInvokationMessage<keyof EditorRequiresClientMethods>) {
    const method = Object.hasOwn(this.clientHandler, functionName)
      ? (this.clientHandler[functionName] as (...args: unknown[]) => unknown)
      : undefined
    if (!method || !Array.isArray(args)) {
      this.logger.debug('Editor called a client method doc2 does not handle', { functionName })
      return
    }

    try {
      const reply: ClientToEditorReplyMessage = {
        messageId,
        returnValue: await method(...args),
        type: EditorBridgeMessageType.ClientToEditorReply,
      }
      this.editorFrame.contentWindow?.postMessage(reply, BridgeOriginProvider.GetEditorOrigin())
    } catch (error) {
      this.logger.error('Error while handling editor request', { functionName, error })
    }
  }
}
