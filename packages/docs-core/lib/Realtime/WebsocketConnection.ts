import type { LoggerInterface } from '@proton/utils/logs'
import { ConnectionCloseReason, SERVER_HEARTBEAT_INTERVAL } from '@proton/docs-proto'
import type { WebsocketCallbacks } from './WebsocketCallbacks'
import type { WebsocketConnectionInterface } from '@proton/docs-shared'
import type { WebsocketStateInterface } from './WebsocketState'
import { WebsocketState } from './WebsocketState'
import metrics from '@proton/metrics'
import { isLocalEnvironment } from '../Util/isDevOrBlack'
import { ApiResult } from '../Domain/Result/ApiResult'
import { ConnectionCloseMetrics } from './ConnectionCloseMetrics'
import { getWebSocketServerURL } from './getWebSocketServerURL'

/**
 * The heartbeat mechanism is temporarily disabled due to the fact that we cannot renew our heartbeat when receiving
 * a "ping" from the client as these messages are not exposed to our app—they are handled transparently by the browser.
 * The solution is to transition to a manual ping/pong mechanism.
 * See DRVDOC-535
 */
const HeartbeatEnabled: false = false

/**
 * We will automatically close the connection if the document's visibility state goes to hidden and this amount of time elapses.
 */
export const TIME_TO_WAIT_BEFORE_CLOSING_CONNECTION_AFTER_DOCUMENT_HIDES = 60_000 * 60

export const DebugConnection = {
  enabled: isLocalEnvironment() && false,
  url: 'ws://localhost:4000/websockets',
}

export class WebsocketConnection implements WebsocketConnectionInterface {
  socket?: WebSocket
  readonly state: WebsocketStateInterface = new WebsocketState()
  private pingTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  reconnectTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  private destroyed = false

  private didReceiveReadyMessageFromRTS = false
  closeConnectionDueToGoingAwayTimer: ReturnType<typeof setTimeout> | undefined = undefined

  constructor(
    readonly callbacks: WebsocketCallbacks,
    private logger: LoggerInterface,
    private appVersion: string,
  ) {
    window.addEventListener('offline', this.handleWindowWentOfflineEvent)
    window.addEventListener('online', this.handleWindowCameOnlineEvent)

    document.addEventListener('visibilitychange', this.handleVisibilityChangeEvent)
  }

  handleVisibilityChangeEvent = (): void => {
    this.logger.info('Document visibility changed:', document.visibilityState)

    if (document.visibilityState === 'visible') {
      if (this.closeConnectionDueToGoingAwayTimer) {
        clearTimeout(this.closeConnectionDueToGoingAwayTimer)
        this.closeConnectionDueToGoingAwayTimer = undefined
      }

      if (!this.socket) {
        this.logger.info('Document became visible, reconnecting')
        this.queueReconnection({ skipDelay: true })
      }
    } else if (document.visibilityState === 'hidden') {
      this.closeConnectionDueToGoingAwayTimer = setTimeout(() => {
        this.logger.info('Closing connection due to user being away for too long')
        this.disconnect(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
      }, TIME_TO_WAIT_BEFORE_CLOSING_CONNECTION_AFTER_DOCUMENT_HIDES)

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = undefined
      }
    }
  }

  handleWindowWentOfflineEvent = (): void => {
    this.disconnect(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
  }

  handleWindowCameOnlineEvent = (): void => {
    this.queueReconnection({ skipDelay: true })
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
      this.socket?.close(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
    }, SERVER_HEARTBEAT_INTERVAL + 2_500)
  }

  destroy(): void {
    this.destroyed = true
    this.state.destroy()

    clearTimeout(this.pingTimeout)
    clearTimeout(this.reconnectTimeout)

    window.removeEventListener('offline', this.handleWindowWentOfflineEvent)
    window.removeEventListener('online', this.handleWindowCameOnlineEvent)
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeEvent)

    this.disconnect(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
  }

  disconnect(code: number): void {
    this.socket?.close(code)

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = undefined
    }
  }

  buildConnectionUrl(params: { serverUrl: string; token: string }): string {
    const url = `${DebugConnection.enabled ? DebugConnection.url : params.serverUrl}/?token=${params.token}`

    return url
  }

  async getTokenOrFailConnection(): Promise<ApiResult<{ token: string }>> {
    const urlAndTokenResult = await this.callbacks.getUrlAndToken()

    if (urlAndTokenResult.isFailed()) {
      this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getError())
      this.state.didFailToFetchToken()

      this.callbacks.onFailToGetToken(urlAndTokenResult.getError().code)

      this.queueReconnection()

      return ApiResult.fail(urlAndTokenResult.getError())
    }

    return ApiResult.ok(urlAndTokenResult.getValue())
  }

  async connect(abortSignal?: () => boolean): Promise<void> {
    if (this.destroyed) {
      throw new Error('Attempted to connect to a destroyed WebsocketConnection')
    }

    if (document.visibilityState !== 'visible') {
      this.logger.warn('Attempting to connect socket while document is not visible')
      return
    }

    if (this.state.isConnected || this.socket) {
      this.logger.warn('Attempted to connect while already connected')
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
    })

    if (abortSignal && abortSignal()) {
      this.logger.info('Aborting connection attempt due to abort signal')
      return
    }

    this.logger.info('Opening websocket connection')

    this.socket = new WebSocket(connectionUrl, [this.appVersion])
    this.socket.binaryType = 'arraybuffer'

    this.callbacks.onConnecting()

    this.socket.onopen = () => {
      this.logger.info(
        `Websocket connection opened; readyState: ${this.socket?.readyState} bufferAmount: ${this.socket?.bufferedAmount}`,
      )

      this.heartbeat()

      this.state.didOpen()
    }

    this.socket.onmessage = async (event) => {
      this.heartbeat()
      this.callbacks.onMessage(new Uint8Array(event.data))
    }

    this.socket.onerror = (event) => {
      /** socket errors are completely opaque and convey no info. So we do not log an error here as to not pollute Sentry */
      this.logger.info('Websocket error:', event)

      this.handleSocketClose(ConnectionCloseReason.CODES.INTERNAL_ERROR, 'Websocket error')
    }

    this.socket.onclose = (event) => {
      this.logger.info('Websocket closed:', event.code, event.reason)

      this.handleSocketClose(event.code, event.reason)
    }
  }

  handleSocketClose(code: number, message: string): void {
    this.socket = undefined
    this.state.didClose()

    const reason = ConnectionCloseReason.create({
      code,
      message,
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

    if (reason.props.code !== ConnectionCloseReason.CODES.UNAUTHORIZED && !this.destroyed) {
      this.queueReconnection()
    }
  }

  queueReconnection(options: { skipDelay: boolean } = { skipDelay: false }): void {
    if (document.visibilityState !== 'visible') {
      this.logger.info('Not queueing reconnection because document is not visible')
      return
    }

    const reconnectDelay = options.skipDelay ? 0 : this.state.getBackoff()
    this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
    clearTimeout(this.reconnectTimeout)

    this.reconnectTimeout = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        void this.connect()
      }
    }, reconnectDelay)
  }

  markAsReadyToAcceptMessages() {
    this.didReceiveReadyMessageFromRTS = true
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

  public canBroadcastMessages(): boolean {
    if (
      !this.didReceiveReadyMessageFromRTS ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN ||
      !this.state.isConnected
    ) {
      return false
    }

    return true
  }

  public isConnected(): boolean {
    return this.state.isConnected && this.socket?.readyState === WebSocket.OPEN
  }

  async broadcastMessage(data: Uint8Array): Promise<void> {
    if (!this.didReceiveReadyMessageFromRTS) {
      this.logger.error('Cannot send message, RTS is not ready to accept messages')
      return
    }

    if (!this.canBroadcastMessages()) {
      this.logger.error('Cannot send message, socket is not open')
      return
    }

    this.socket?.send(data)
  }
}
