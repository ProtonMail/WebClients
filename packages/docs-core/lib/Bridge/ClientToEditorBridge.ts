import type {
  EditorToClientGenericMessage,
  EditorToClientInvokationMessage,
  EditorToClientReplyMessage,
  ClientToEditorReplyMessage,
  EditorRequiresClientMethods,
  InternalEventBusInterface,
} from '@proton/docs-shared'
import { EditorBridgeMessageType, BridgeOriginProvider, DOCS_EDITOR_DEBUG_KEY } from '@proton/docs-shared'
import { EditorInvoker } from './EditorInvoker'
import { EditorToClientRequestHandler } from './EditorToClientRequestHandler'
import { Logger } from '@proton/utils/logs'
import type { EditorOrchestratorInterface } from '../Services/Orchestrator/EditorOrchestratorInterface'

export class ClientToEditorBridge {
  private logger = new Logger('DocsClient', DOCS_EDITOR_DEBUG_KEY)
  public readonly editorInvoker = new EditorInvoker(this.editorFrame, this.logger)
  private editorRequestHandler: EditorToClientRequestHandler

  constructor(
    private editorFrame: HTMLIFrameElement,
    private readonly editorController: EditorOrchestratorInterface,
    private readonly eventBus: InternalEventBusInterface,
  ) {
    this.editorRequestHandler = new EditorToClientRequestHandler(this.editorFrame, this.editorController, this.eventBus)

    window.addEventListener('message', (event) => {
      if (event.source !== this.editorFrame.contentWindow) {
        this.logger.info('Client ignoring message from unknown source', event.data)
        return
      }

      const message = event.data as EditorToClientGenericMessage

      this.logger.debug('Received message data from editor', message)

      if (message.type === EditorBridgeMessageType.EditorToClientInvokation) {
        void this.handleEditorRequestingClientMethod(
          message as EditorToClientInvokationMessage<keyof EditorRequiresClientMethods>,
        )
      } else if (message.type === EditorBridgeMessageType.EditorToClientReply) {
        this.editorInvoker.handleReplyFromEditor(message as EditorToClientReplyMessage)
      }
    })

    editorController.provideEditorInvoker(this.editorInvoker)
  }

  private async handleEditorRequestingClientMethod(
    message: EditorToClientInvokationMessage<keyof EditorRequiresClientMethods>,
  ) {
    const func = this.editorRequestHandler[message.functionName].bind(this.editorRequestHandler)

    try {
      // @ts-ignore
      const returnValue = await func(...message.args)

      const reply: ClientToEditorReplyMessage = {
        messageId: message.messageId,
        returnValue,
        type: EditorBridgeMessageType.ClientToEditorReply,
      }

      this.editorFrame.contentWindow?.postMessage(reply, BridgeOriginProvider.GetEditorOrigin())
    } catch (error) {
      this.logger.error('Error while handling editor request', 'message:', message, 'error:', String(error))
    }
  }
}
