import type { LoggerInterface } from '@proton/utils/logs'
import { ConnectionCloseReason, SERVER_HEARTBEAT_INTERVAL } from '@proton/docs-proto'
import { ApiResult, type WebsocketConnectionInterface, type WebsocketCallbacks } from '@proton/docs-shared'
import type { WebsocketStateInterface } from './WebsocketState'
import { WebsocketState } from './WebsocketState'
import metrics from '@proton/metrics'
import { isLocalEnvironment } from '../Util/isDevOrBlack'
import { getWebSocketServerURL } from './getWebSocketServerURL'
import type { MetricService } from '../Services/Metrics/MetricService'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import type { PublicDocumentState } from '../State/DocumentState'
import type { DocumentState } from '../State/DocumentState'
import type { FetchRealtimeToken } from '../UseCase/FetchRealtimeToken'
import type { UserState } from '../State/UserState'

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

  lastCommitId: string | undefined = undefined
  realtimeToken: { token: string; commitId: string | undefined; initializedAt: number } | undefined = undefined

  constructor(
    readonly documentState: DocumentState | PublicDocumentState,
    readonly userState: UserState,
    readonly callbacks: WebsocketCallbacks,
    private _fetchRealtimeToken: FetchRealtimeToken,
    readonly metricService: MetricService,
    private logger: LoggerInterface,
    private appVersion: string,
  ) {
    window.addEventListener('offline', this.handleWindowWentOfflineEvent)
    window.addEventListener('online', this.handleWindowCameOnlineEvent)
    document.addEventListener('visibilitychange', this.handleVisibilityChangeEvent)

    this.lastCommitId = this.documentState.getProperty('currentCommitId')

    /**
     * On app initialization, the load document flow will fetch a conenction token for us so it can do it much earlier
     * then the constructor of this function is called. If it's available we use it. Otherwise, the token will be fetched
     * during the connect execution, and can be refetched multiple times if we disconnect and reconnect.
     */
    this.documentState.subscribeToProperty('realtimeConnectionToken', (token) => {
      if (token) {
        this.realtimeToken = { token, commitId: this.lastCommitId, initializedAt: Date.now() }
      }
    })

    this.documentState.subscribeToProperty('currentCommitId', (commitId) => {
      if (commitId !== this.lastCommitId) {
        this.lastCommitId = commitId
        this.clearTokenCache()
      }
    })
  }

  clearTokenCache(): void {
    this.realtimeToken = undefined
  }

  /**
   * A cached in memory token that we'll use if it's available.
   * The cached token comes from outside our class during app init.
   */
  getCachedToken(): string | undefined {
    /** If we retrieve a token, we'll treat it as valid for this long. When the commit id changes, we'll invalidate the cached token */
    const TokenCacheValidityPeriodMS = 60_000

    if (!this.realtimeToken) {
      return undefined
    }

    return Date.now() - this.realtimeToken.initializedAt < TokenCacheValidityPeriodMS
      ? this.realtimeToken.token
      : undefined
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
    const cachedToken = this.getCachedToken()
    if (cachedToken) {
      this.logger.info('Using cached realtime token')
      return ApiResult.ok({ token: cachedToken })
    }

    const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta
    const urlAndTokenResult = await this._fetchRealtimeToken.execute(nodeMeta, this.lastCommitId)

    if (!urlAndTokenResult.isFailed()) {
      this.userState.setProperty(
        'currentDocumentEmailDocTitleEnabled',
        urlAndTokenResult.getValue().preferences.includeDocumentNameInEmails,
      )

      this.documentState.setProperty('realtimeConnectionToken', urlAndTokenResult.getValue().token)

      return ApiResult.ok(urlAndTokenResult.getValue())
    }

    this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getError())
    this.state.didFailToFetchToken()

    this.callbacks.onFailToGetToken(urlAndTokenResult.getError().code)

    this.queueReconnection()

    return ApiResult.fail(urlAndTokenResult.getError())
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

    LoadLogger.logEventRelativeToLoadTime('Fetching token for websocket connection')

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

    LoadLogger.logEventRelativeToLoadTime('Opening websocket connection')

    this.socket = new WebSocket(connectionUrl, [this.appVersion])
    this.socket.binaryType = 'arraybuffer'

    this.callbacks.onConnecting()

    this.socket.onopen = () => {
      this.logger.info(
        `Websocket connection opened; readyState: ${this.socket?.readyState} bufferAmount: ${this.socket?.bufferedAmount}`,
      )

      this.clearTokenCache()

      this.heartbeat()

      this.state.didOpen()

      this.callbacks.onOpen()

      LoadLogger.logEventRelativeToLoadTime('Websocket connection opened')
    }

    this.socket.onmessage = async (event) => {
      this.heartbeat()
      this.callbacks.onMessage(new Uint8Array(event.data))
    }

    this.socket.onerror = (event) => {
      /** socket errors are completely opaque and convey no info. So we do not log an error here as to not pollute Sentry */
      this.logger.info('Websocket error:', event)

      this.clearTokenCache()

      this.handleSocketClose(ConnectionCloseReason.CODES.INTERNAL_ERROR, 'Websocket error')
    }

    this.socket.onclose = (event) => {
      this.logger.info('Websocket closed:', event.code, event.reason)

      this.clearTokenCache()

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

    this.metricService.reportRealtimeDisconnect(reason)

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
