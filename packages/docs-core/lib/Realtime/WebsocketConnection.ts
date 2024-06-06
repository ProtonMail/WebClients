import { c } from 'ttag'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { EncryptMessage } from '../UseCase/EncryptMessage'
import { LoggerInterface } from '@proton/utils/logs'
import {
  ClientMessageWithDocumentUpdates,
  ClientMessage,
  ClientMessageWithEvents,
  DocumentUpdate,
  Event,
  ConnectionCloseReason,
  SERVER_HEARTBEAT_INTERVAL,
} from '@proton/docs-proto'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { WebsocketConnectionInterface, BroadcastSources } from '@proton/docs-shared'
import { DocumentKeys } from '@proton/drive-store'
import { WebsocketState, WebsocketStateInterface } from './WebsocketState'
import metrics from '@proton/metrics'

const DebugDisableSockets = false

const DebugConnection = {
  enabled: false,
  url: 'ws://localhost:4000/websockets',
}

export class WebsocketConnection implements WebsocketConnectionInterface {
  private socket?: WebSocket
  private state: WebsocketStateInterface = new WebsocketState()
  private pingTimeout: NodeJS.Timeout | undefined = undefined

  constructor(
    private keys: DocumentKeys,
    private callbacks: WebsocketCallbacks,
    private _encryptMessage: EncryptMessage,
    private logger: LoggerInterface,
  ) {}

  /**
   * In some cases, a client may lose their connection to the websocket without even realizing it.
   * The heartbeat explicitely closes the connection if we do not receive any message from the server,
   * including a "ping" message.
   * https://github.com/websockets/ws?tab=readme-ov-file#how-to-detect-and-close-broken-connections
   * */
  private heartbeat(): void {
    clearTimeout(this.pingTimeout)

    this.pingTimeout = setTimeout(() => {
      this.logger.info('Closing connection due to heartbeat timeout')
      this.socket?.close()
    }, SERVER_HEARTBEAT_INTERVAL + 2_500)
  }

  destroy(): void {
    clearInterval(this.pingTimeout)
    this.disconnect()
  }

  disconnect(): void {
    this.socket?.close()
  }

  buildUrl(params: { serverUrl: string; token: string; commitId: string | undefined }): string {
    let url = `${DebugConnection.enabled ? DebugConnection.url : params.serverUrl}/?token=${params.token}`
    if (params.commitId) {
      url += `&commitId=${params.commitId}`
    }
    return url
  }

  async connect(): Promise<void> {
    if (DebugDisableSockets) {
      this.logger.warn('Websockets are disabled in debug mode')
      return
    }

    if (this.state.isConnected || this.socket) {
      return
    }

    const urlAndTokenResult = await this.callbacks.getUrlAndToken()
    if (urlAndTokenResult.isFailed()) {
      this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getError())

      this.state.didFailToFetchToken()

      const reconnectDelay = this.state.getBackoff()

      this.logger.info(`Reconnecting in ${reconnectDelay}ms`)

      setTimeout(() => this.connect(), reconnectDelay)

      return
    }

    const { token, url: serverUrl } = urlAndTokenResult.getValue()
    const commitId = this.callbacks.getLatestCommitId()
    const url = this.buildUrl({ serverUrl, token, commitId })

    const websocket = new WebSocket(url)
    websocket.binaryType = 'arraybuffer'

    this.socket = websocket

    this.callbacks.onConnecting()

    websocket.onopen = () => {
      this.logger.info('Websocket connection opened')

      this.heartbeat()

      this.state.didOpen()

      this.callbacks.onOpen()
    }

    websocket.onmessage = async (event) => {
      this.heartbeat()

      this.callbacks.onMessage(new Uint8Array(event.data))
    }

    websocket.onerror = (event) => {
      this.logger.error('Websocket error:', event)
      metrics.docs_failed_websocket_connections_total.increment({
        retry: 'false',
        type: 'network_error',
      })
    }

    websocket.onclose = (event) => {
      this.logger.debug('Websocket closed:', event.code, event.reason)

      this.socket = undefined

      const reason = ConnectionCloseReason.create({
        code: event.code,
        message: event.reason,
      })

      if (this.state.isConnected) {
        this.callbacks.onClose(reason)
      } else {
        this.callbacks.onFailToConnect(reason)
      }

      this.state.didClose()

      const reconnectDelay = this.state.getBackoff()

      this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
      if (reason.props.code !== ConnectionCloseReason.CODES.UNAUTHORIZED) {
        setTimeout(() => this.connect(), reconnectDelay)
      }
    }
  }

  async broadcastMessage(
    message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents,
    source: BroadcastSources,
  ): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.state.isConnected) {
      return
    }

    const messageWrapper = new ClientMessage()

    try {
      if (message instanceof ClientMessageWithEvents) {
        for (const event of message.events) {
          event.content = new Uint8Array(await this.encryptMessage(event))
        }
      } else {
        for (const update of message.updates.documentUpdates) {
          update.encryptedContent = new Uint8Array(await this.encryptMessage(update))
        }
      }
    } catch (e: unknown) {
      if (source === BroadcastSources.CommentsController) {
        metrics.docs_comments_error_total.increment({
          reason: 'encryption_error',
        })
      }
      throw e
    }

    if (message instanceof ClientMessageWithDocumentUpdates) {
      messageWrapper.documentUpdatesMessage = message
    } else {
      messageWrapper.eventsMessage = message
    }

    this.logger.debug('Broadcasting message from source:', source)
    this.socket.send(messageWrapper.serializeBinary())
  }

  private async encryptMessage(message: DocumentUpdate | Event): Promise<ArrayBuffer> {
    const content = message instanceof DocumentUpdate ? message.encryptedContent : message.content
    const result = await this._encryptMessage.execute(content, message, this.keys)

    if (result.isFailed()) {
      const message = c('Error')
        .t`A data integrity error has occurred and recent changes cannot be saved. Please refresh the page.`

      this.callbacks.onEncryptionError(message)

      traceError('Unable to encrypt message', {
        extra: {
          errorInfo: {
            message: result.getError(),
          },
        },
      })

      throw new Error(`Unable to encrypt message: ${result.getError()}`)
    }

    return result.getValue()
  }
}
