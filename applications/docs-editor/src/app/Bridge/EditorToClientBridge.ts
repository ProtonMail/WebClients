import { Logger } from '@proton/utils/logs'
import type {
  ClientToEditorGenericMessage,
  ClientToEditorInvokationMessage,
  ClientToEditorReplyMessage,
  ClientRequiresEditorMethods,
  EditorRequiresClientMethods,
  EditorToClientReplyMessage,
} from '@proton/docs-shared'
import {
  EditorBridgeMessageType,
  BridgeOriginProvider,
  DOCS_EDITOR_DEBUG_KEY,
  EDITOR_TAG_INFO_EVENT,
  EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD,
  EDITOR_CONFIRMS_VERSIONS_MATCH,
} from '@proton/docs-shared'

import { ClientInvoker } from './ClientInvoker'
import { updateVersionCookie, versionCookieAtLoad } from '@proton/components/helpers/versionCookie'

export class EditorToClientBridge {
  private logger = new Logger('EditorIframe', DOCS_EDITOR_DEBUG_KEY)
  private readonly clientInvoker = new ClientInvoker(this.clientFrame, this.logger)
  private requestHandler?: ClientRequiresEditorMethods

  constructor(private clientFrame: Window) {
    window.addEventListener('message', (event) => {
      if (event.source !== this.clientFrame) {
        this.logger.info('Editor ignoring message from unknown source', event.data)
        return
      }

      if (event.data.type === EDITOR_TAG_INFO_EVENT) {
        const tag = event.data.versionCookieAtLoad
        if (tag && tag !== versionCookieAtLoad) {
          updateVersionCookie(tag, undefined)
          this.clientFrame.postMessage(EDITOR_REQUESTS_TOTAL_CLIENT_RELOAD, BridgeOriginProvider.GetClientOrigin())
        } else {
          this.clientFrame.postMessage(EDITOR_CONFIRMS_VERSIONS_MATCH, BridgeOriginProvider.GetClientOrigin())
        }
        return
      }

      const message = event.data as ClientToEditorGenericMessage

      this.logger.debug('Received message data from client', message)

      if (message.type === EditorBridgeMessageType.ClientToEditorInvokation) {
        void this.handleClientRequestingEditorMethod(
          message as ClientToEditorInvokationMessage<keyof ClientRequiresEditorMethods>,
        )
      } else if (message.type === EditorBridgeMessageType.ClientToEditorReply) {
        this.clientInvoker.handleReplyFromClient(message as ClientToEditorReplyMessage)
      }
    })
  }

  public setClientRequestHandler(requestHandler: ClientRequiresEditorMethods) {
    this.requestHandler = requestHandler
  }

  public getClientInvoker(): EditorRequiresClientMethods {
    return this.clientInvoker
  }

  private async handleClientRequestingEditorMethod(
    message: ClientToEditorInvokationMessage<keyof ClientRequiresEditorMethods>,
  ) {
    if (!this.requestHandler) {
      throw new Error(`Editor request handler not set; attempting to invoke editor method ${message.functionName}`)
    }

    const funcInstance = this.requestHandler[message.functionName]
    if (!funcInstance) {
      throw new Error(`Function instance for ${message.functionName} not found`)
    }

    const bindedFunction = funcInstance.bind(this.requestHandler)

    // @ts-ignore
    const returnValue = await bindedFunction(...message.args)

    const reply: EditorToClientReplyMessage = {
      messageId: message.messageId,
      returnValue,
      type: EditorBridgeMessageType.EditorToClientReply,
    }

    this.clientFrame.postMessage(reply, BridgeOriginProvider.GetClientOrigin())
  }
}
