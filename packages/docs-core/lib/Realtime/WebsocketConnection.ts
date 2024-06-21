import { LoggerInterface } from '@proton/utils/logs'
import { ConnectionCloseReason, SERVER_HEARTBEAT_INTERVAL } from '@proton/docs-proto'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { WebsocketConnectionInterface } from '@proton/docs-shared'
import { WebsocketState, WebsocketStateInterface } from './WebsocketState'
import metrics from '@proton/metrics'
import { isLocalEnvironment } from '../Util/isDevOrBlack'
import { ApiResult } from '../Domain/Result/ApiResult'
import { ConnectionCloseMetrics } from './ConnectionCloseMetrics'

const DebugDisableSockets = false

/**
 * The heartbeat mechanism is temporarily disabled due to the fact that we cannot renew our heartbeat when receiving
 * a "ping" from the client as these messages are not exposed to our app—they are handled transparently by the browser.
 * The solution is to transition to a manual ping/pong mechanism.
 * See DRVDOC-535
 */
const HeartbeatEnabled: false = false

export const DebugConnection = {
  enabled: isLocalEnvironment() && false,
  url: 'ws://localhost:4000/websockets',
}

const WebSocketServerSubdomain = 'docs-rts'
export const getWebSocketServerURL = () => {
  const url = new URL(window.location.href)
  const hostnameParts = url.hostname.split('.')

  if (hostnameParts.length === 2) {
    hostnameParts.unshift(WebSocketServerSubdomain)
  } else {
    hostnameParts[0] = WebSocketServerSubdomain
  }

  const newHostname = hostnameParts.join('.')
  return `wss://${newHostname}/websockets`
}

export class WebsocketConnection implements WebsocketConnectionInterface {
  private socket?: WebSocket
  readonly state: WebsocketStateInterface = new WebsocketState()
  private pingTimeout: NodeJS.Timeout | undefined = undefined
  private reconnectTimeout: NodeJS.Timeout | undefined = undefined
  private destroyed = false

  constructor(
    private callbacks: WebsocketCallbacks,
    private logger: LoggerInterface,
  ) {
    window.addEventListener('offline', this.handleOfflineConnectionEvent)
    window.addEventListener('online', this.handleOnlineConnectionEvent)
  }

  handleOfflineConnectionEvent = (): void => {
    this.disconnect()
  }

  handleOnlineConnectionEvent = (): void => {
    const reconnectDelay = this.state.getBackoff()
    clearTimeout(this.reconnectTimeout)
    this.reconnectTimeout = setTimeout(() => this.connect(), reconnectDelay)
  }

  /**
   * In some cases, a client may lose their connection to the websocket without even realizing it.
   * The heartbeat explicitely closes the connection if we do not receive any message from the server,
   * including a "ping" message.
   * https://github.com/websockets/ws?tab=readme-ov-file#how-to-detect-and-close-broken-connections
   * */
  private heartbeat(): void {
    if (!HeartbeatEnabled) {
      return
    }

    clearTimeout(this.pingTimeout)

    this.pingTimeout = setTimeout(() => {
      this.logger.info('Closing connection due to heartbeat timeout')
      this.socket?.close()
    }, SERVER_HEARTBEAT_INTERVAL + 2_500)
  }

  destroy(): void {
    this.destroyed = true
    clearInterval(this.pingTimeout)
    clearTimeout(this.reconnectTimeout)
    window.removeEventListener('offline', this.handleOfflineConnectionEvent)
    window.removeEventListener('online', this.handleOnlineConnectionEvent)
    this.disconnect()
  }

  disconnect(): void {
    this.socket?.close()
  }

  buildConnectionUrl(params: { serverUrl: string; token: string; commitId: string | undefined }): string {
    let url = `${DebugConnection.enabled ? DebugConnection.url : params.serverUrl}/?token=${params.token}`
    if (params.commitId) {
      url += `&commitId=${params.commitId}`
    }
    return url
  }

  async getTokenOrFailConnection(): Promise<ApiResult<{ token: string }>> {
    const urlAndTokenResult = await this.callbacks.getUrlAndToken()

    if (urlAndTokenResult.isFailed()) {
      this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getError())
      this.state.didFailToFetchToken()

      this.callbacks.onFailToGetToken(urlAndTokenResult.getError().code)

      const reconnectDelay = this.state.getBackoff()
      this.logger.info(`Reconnecting in ${reconnectDelay}ms`)

      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = setTimeout(() => this.connect(), reconnectDelay)

      return ApiResult.fail(urlAndTokenResult.getError())
    }

    return ApiResult.ok(urlAndTokenResult.getValue())
  }

  async connect(): Promise<void> {
    if (this.destroyed) {
      throw new Error('Attempted to connect to a destroyed WebsocketConnection')
    }

    if (DebugDisableSockets) {
      this.logger.warn('Websockets are disabled in debug mode')
      return
    }

    if (this.state.isConnected || this.socket) {
      this.logger.error('Attempted to connect while already connected')
      return
    }

    clearTimeout(this.reconnectTimeout)

    this.logger.info('Fetching url and token for websocket connection')

    const urlAndTokenResult = await this.getTokenOrFailConnection()
    if (urlAndTokenResult.isFailed()) {
      return
    }

    const { token } = urlAndTokenResult.getValue()
    const url = getWebSocketServerURL()
    const connectionUrl = this.buildConnectionUrl({
      serverUrl: url,
      token,
      commitId: this.callbacks.getLatestCommitId(),
    })

    this.logger.info('Opening websocket connection')

    this.socket = new WebSocket(connectionUrl)
    this.socket.binaryType = 'arraybuffer'

    this.callbacks.onConnecting()

    this.socket.onopen = () => {
      this.logger.info(
        `Websocket connection opened; readyState: ${this.socket?.readyState} bufferAmount: ${this.socket?.bufferedAmount}`,
      )
      this.heartbeat()
      this.state.didOpen()

      /**
       * There is an issue with the current RTS where it needs to do some config before it's ready to receive messages,
       * even though the connection is opened immediately.
       *
       * In the future it will send us a message once it's ready (DRVDOC-559). For now, we do an arbitrary timeout.
       */
      setTimeout(() => {
        this.callbacks.onOpen()
      }, 50)
    }

    this.socket.onmessage = async (event) => {
      this.heartbeat()
      this.callbacks.onMessage(new Uint8Array(event.data))
    }

    this.socket.onerror = (event) => {
      this.logger.error('Websocket error:', event)
    }

    this.socket.onclose = (event) => {
      this.logger.info('Websocket closed:', event.code, event.reason)
      this.socket = undefined
      this.state.didClose()

      const reason = ConnectionCloseReason.create({
        code: event.code,
        message: event.reason,
      })

      metrics.docs_realtime_disconnect_error_total.increment({
        type: ConnectionCloseMetrics[reason.props.code],
      })

      if (this.state.isConnected) {
        this.callbacks.onClose(reason)
      } else {
        this.callbacks.onFailToConnect(reason)
      }

      this.logDisconnectMetric(reason)

      if (reason.props.code !== ConnectionCloseReason.CODES.UNAUTHORIZED) {
        const reconnectDelay = this.state.getBackoff()
        this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = setTimeout(() => this.connect(), reconnectDelay)
      }
    }
  }

  private logDisconnectMetric(reason: ConnectionCloseReason): void {
    if (
      [
        ConnectionCloseReason.CODES.TLS_HANDSHAKE,
        ConnectionCloseReason.CODES.TIMEOUT,
        ConnectionCloseReason.CODES.PROTOCOL_ERROR,
      ].includes(reason.props.code)
    ) {
      metrics.docs_failed_websocket_connections_total.increment({
        retry: 'false',
        type: 'network_error',
      })
    } else if (
      [
        ConnectionCloseReason.CODES.INTERNAL_ERROR,
        ConnectionCloseReason.CODES.UNAUTHORIZED,
        ConnectionCloseReason.CODES.BAD_GATEWAY,
      ].includes(reason.props.code)
    ) {
      metrics.docs_failed_websocket_connections_total.increment({
        retry: 'false',
        type: 'server_error',
      })
    } else {
      metrics.docs_failed_websocket_connections_total.increment({
        retry: 'false',
        type: 'unknown',
      })
    }
  }

  async broadcastMessage(data: Uint8Array): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.state.isConnected) {
      this.logger.error('Cannot send message, socket is not open')
      return
    }

    this.socket.send(data)
  }
}
