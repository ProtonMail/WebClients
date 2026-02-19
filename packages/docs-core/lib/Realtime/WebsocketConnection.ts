import type { LoggerInterface } from '@proton/utils/logs'
import { ConnectionCloseReason, SERVER_HEARTBEAT_INTERVAL } from '@proton/docs-proto'
import {
  ApiResult,
  type WebsocketConnectionInterface,
  type WebsocketCallbacks,
  isLocalEnvironment,
  ConnectionType,
} from '@proton/docs-shared'
import { WebsocketState } from './WebsocketState'
import metrics from '@proton/metrics'
import { getWebSocketServerURL } from './getWebSocketServerURL'
import type { MetricService } from '../Services/Metrics/MetricService'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import type { PublicDocumentState, DocumentState } from '../State/DocumentState'
import type { FetchRealtimeToken } from '../UseCase/FetchRealtimeToken'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { hours_to_ms, seconds_to_ms } from '../Util/time-utils'
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers'
import { getClientID } from '@proton/shared/lib/apps/helper'
import type { APP_NAMES } from '@proton/shared/lib/constants'

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
export const TIME_TO_WAIT_BEFORE_CLOSING_CONNECTION_AFTER_DOCUMENT_HIDES = hours_to_ms(1)

export const DebugConnection = {
  enabled: isLocalEnvironment() && false,
  url: 'ws://localhost:4000/websockets',
}

export enum ReconnectionStopReason {
  NeedsReadonlyMode = 'needs-readonly-mode',
  DocumentTimeout = 'document-timeout',
}

export class WebsocketConnection implements WebsocketConnectionInterface {
  socket?: WebSocket
  readonly state = new WebsocketState()
  private pingTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  reconnectTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  private destroyed = false

  reconnectionStopped: ReconnectionStopReason | undefined = undefined

  private didReceiveReadyMessageFromRTS = false
  closeConnectionDueToGoingAwayTimer: ReturnType<typeof setTimeout> | undefined = undefined

  realtimeToken: { token: string; commitId: string | undefined; initializedAt: number } | undefined = undefined

  connectionType = ConnectionType.Normal

  shouldPreventAutoReconnectOnClose = false

  constructor(
    readonly documentState: DocumentState | PublicDocumentState,
    readonly callbacks: WebsocketCallbacks,
    private _fetchRealtimeToken: FetchRealtimeToken,
    readonly metricService: MetricService,
    private logger: LoggerInterface,
    private appName: APP_NAMES,
    private appVersion: string,
  ) {
    window.addEventListener('offline', this.handleWindowWentOfflineEvent)
    window.addEventListener('online', this.handleWindowCameOnlineEvent)
    document.addEventListener('visibilitychange', this.handleVisibilityChangeEvent)

    /**
     * On app initialization, the load document flow will fetch a conenction token for us so it can do it much earlier
     * then the constructor of this function is called. If it's available we use it. Otherwise, the token will be fetched
     * during the connect execution, and can be refetched multiple times if we disconnect and reconnect.
     */
    this.documentState.subscribeToProperty('realtimeConnectionToken', (token) => {
      if (token) {
        this.realtimeToken = {
          token,
          commitId: this.documentState.getProperty('currentCommitId'),
          initializedAt: Date.now(),
        }
      }
    })

    this.documentState.subscribeToProperty('currentCommitId', (commitId, oldCommitId) => {
      if (commitId !== oldCommitId) {
        this.clearTokenCache()
      }
    })
  }

  clearTokenCache(): void {
    this.logger.info('Clearing websocket token cache')
    this.realtimeToken = undefined
  }

  /**
   * A cached in memory token that we'll use if it's available.
   * The cached token comes from outside our class during app init.
   */
  getCachedToken(): string | undefined {
    /** If we retrieve a token, we'll treat it as valid for this long. When the commit id changes, we'll invalidate the cached token */
    const TokenCacheValidityPeriodMS = seconds_to_ms(60)

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

      this.logger.info('Document became visible, reconnecting')
      this.queueReconnection({ skipDelay: true })
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

    this.pingTimeout = setTimeout(
      () => {
        this.logger.info('Closing connection due to heartbeat timeout')
        this.socket?.close(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
      },
      SERVER_HEARTBEAT_INTERVAL + seconds_to_ms(2.5),
    )
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
    const appVersion = getAppVersionStr(getClientID(this.appName), this.appVersion)
    const url = `${DebugConnection.enabled ? DebugConnection.url : params.serverUrl}/?token=${params.token}&appversion=${appVersion}`

    return url
  }

  async getTokenOrFailConnection(): Promise<ApiResult<{ token: string }>> {
    const cachedToken = this.getCachedToken()
    if (cachedToken) {
      this.logger.info('Using cached realtime token')
      return ApiResult.ok({ token: cachedToken })
    }

    const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta
    const currentCommitId = this.documentState.getProperty('currentCommitId')

    this.logger.info(`Fetching realtime token from network using commit id ${currentCommitId}`)
    const urlAndTokenResult = await this._fetchRealtimeToken.execute(nodeMeta, currentCommitId)

    if (!urlAndTokenResult.isFailed()) {
      this.documentState.setProperty(
        'currentDocumentEmailDocTitleEnabled',
        urlAndTokenResult.getValue().preferences.includeDocumentNameInEmails,
      )

      this.documentState.setProperty('realtimeConnectionToken', urlAndTokenResult.getValue().token)

      return ApiResult.ok(urlAndTokenResult.getValue())
    } else {
      const errorCode = urlAndTokenResult.getErrorObject().code
      if (errorCode === DocsApiErrorCode.CommitIdOutOfSync) {
        this.logger.info('Failed to get realtime URL and token:', urlAndTokenResult.getErrorMessage())
      } else {
        this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getErrorMessage())
      }

      this.state.didFailToFetchToken()

      this.callbacks.onFailToGetToken(errorCode)

      if (errorCode === DocsApiErrorCode.NeedsReadonlyMode) {
        this.logger.info('Should be shown in readonly mode, not queueing reconnection')
        this.stopReconnectionDueToReadonlyMode()
      } else {
        this.queueReconnection()
      }

      return ApiResult.fail(urlAndTokenResult.getErrorObject())
    }
  }

  async connect(
    abortSignal?: () => boolean,
    options?: { invalidateTokenCache: boolean; connectionType?: ConnectionType },
  ): Promise<void> {
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

    if (options?.invalidateTokenCache) {
      this.clearTokenCache()
    }

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

    if (options?.connectionType) {
      this.logger.info(`Setting connection type to ${options.connectionType}`)
      this.connectionType = options.connectionType
    }

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

      this.callbacks.onOpen(this.connectionType)

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

  preventAutoReconnectOnClose(): void {
    this.shouldPreventAutoReconnectOnClose = true
  }

  handleSocketClose(code: number, message: string): void {
    const isConnectedBeforeClose = this.state.isConnected

    this.socket = undefined
    this.state.didClose()

    const reason = ConnectionCloseReason.create({
      code,
      message,
    })

    this.metricService.reportRealtimeDisconnect(reason)

    if (isConnectedBeforeClose) {
      this.callbacks.onClose(reason)
    } else {
      this.callbacks.onFailToConnect(reason)
    }

    this.logDisconnectMetric(reason)

    if (reason.props.code === ConnectionCloseReason.CODES.UNAUTHORIZED || this.destroyed) {
      this.logger.info('Not queueing reconnection due to unauthorized or destroyed state')
      return
    }

    if (reason.props.code === ConnectionCloseReason.CODES.DOCUMENT_TIMEOUT) {
      this.logger.info('Connection closed due to document timeout, not queueing reconnection until user activity')
      this.stopReconnectionUntilActivity()
      return
    }

    if (reason.props.code === ConnectionCloseReason.CODES.READ_ONLY_MODE_REQUIRED) {
      this.logger.info('Connection closed due to needing readonly mode, not queueing reconnection')
      this.stopReconnectionDueToReadonlyMode()
      return
    }

    if (this.shouldPreventAutoReconnectOnClose) {
      this.logger.info('Preventing auto reconnection on socket close for this instance')
      this.shouldPreventAutoReconnectOnClose = false
      return
    }

    this.queueReconnection()
  }

  stopReconnectionDueToReadonlyMode() {
    this.reconnectionStopped = ReconnectionStopReason.NeedsReadonlyMode
  }

  stopReconnectionUntilActivity() {
    this.reconnectionStopped = ReconnectionStopReason.DocumentTimeout

    const reconnect = () => {
      if (document.visibilityState !== 'visible') {
        return
      }
      this.logger.info('User activity detected, resuming reconnection attempts')
      this.reconnectionStopped = undefined
      this.queueReconnection({ skipDelay: true })
      document.removeEventListener('mousemove', reconnect)
      document.removeEventListener('keydown', reconnect)
      document.removeEventListener('visibilitychange', reconnect)
    }

    document.addEventListener('mousemove', reconnect)
    document.addEventListener('keydown', reconnect)
    document.addEventListener('visibilitychange', reconnect)
  }

  queueReconnection(options: { skipDelay: boolean } = { skipDelay: false }): void {
    if (document.visibilityState !== 'visible') {
      this.logger.info('Not queueing reconnection because document is not visible')
      return
    }

    if (this.reconnectionStopped) {
      this.logger.info('Not queueing reconnection because reconnection is stopped', this.reconnectionStopped)
      return
    }

    if (this.state.didReachMaxRetryAttempts) {
      this.logger.info('Not queueing reconnection because max retry attempts reached')
      return
    }

    const reconnectDelay = this.state.getReconnectDelay(options.skipDelay)
    this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
    clearTimeout(this.reconnectTimeout)

    this.reconnectTimeout = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        void this.connect()
      } else {
        this.logger.info('Did not connect because document is not visible')
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

  async broadcastMessage(data: Uint8Array<ArrayBuffer>): Promise<void> {
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
