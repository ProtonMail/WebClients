import * as time from 'lib0/time'

import { EncryptMessage } from '../UseCase/EncryptMessage'
import { LoggerInterface } from '@standardnotes/utils'
import {
  ClientMessageWithDocumentUpdates,
  ClientMessage,
  ClientMessageWithEvents,
  DocumentUpdate,
  Event,
  ConnectionCloseReason,
} from '@proton/docs-proto'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { WebsocketConnectionInterface, Broadcaster } from '@proton/docs-shared'
import { DocumentKeys } from '@proton/drive-store'
import { ExponentialBackoff } from '../Util/ExponentialBackoff'

const DebugDisableSockets = false

/** If a message is not received within this many ms, the websocket connection is closed. */
const DisconnectWebsocketAfterInactivityTimeout = 300_000

const DebugConnection = {
  enabled: false,
  url: 'ws://localhost:4000/websockets',
}

export class WebsocketConnection implements WebsocketConnectionInterface, Broadcaster {
  private connected: boolean = false

  private ws?: WebSocket
  private wsLastMessageReceived = 0
  private checkInterval: NodeJS.Timeout

  private exponentialBackoff = new ExponentialBackoff()

  constructor(
    private keys: DocumentKeys,
    private callbacks: WebsocketCallbacks,
    private _encryptMessage: EncryptMessage,
    private logger: LoggerInterface,
  ) {
    this.checkInterval = setInterval(() => {
      if (
        this.connected &&
        DisconnectWebsocketAfterInactivityTimeout < time.getUnixTime() - this.wsLastMessageReceived
      ) {
        this.ws?.close()
      }
    }, DisconnectWebsocketAfterInactivityTimeout / 10)
  }

  destroy(): void {
    clearInterval(this.checkInterval)
    this.disconnect()
  }

  disconnect(): void {
    this.ws?.close()
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

    if (this.connected || this.ws) {
      return
    }

    const urlAndTokenResult = await this.callbacks.getUrlAndToken()
    if (urlAndTokenResult.isFailed()) {
      this.logger.error('Failed to get realtime URL and token:', urlAndTokenResult.getError())
      this.exponentialBackoff.incrementAttempts()
      const reconnectDelay = this.exponentialBackoff.getBackoffWithJitter()
      this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
      setTimeout(() => this.connect(), reconnectDelay)
      return
    }

    const { token, url: serverUrl } = urlAndTokenResult.getValue()
    const commitId = this.callbacks.getLatestCommitId()
    const url = this.buildUrl({ serverUrl, token, commitId })

    const websocket = new WebSocket(url) as WebSocket
    websocket.binaryType = 'arraybuffer'
    this.ws = websocket
    this.callbacks.onConnectionConnecting()
    this.connected = false

    websocket.onmessage = async (event) => {
      this.wsLastMessageReceived = time.getUnixTime()
      this.callbacks.onConnectionMessage(new Uint8Array(event.data))
    }

    websocket.onerror = (event) => {
      this.logger.error('Websocket error:', event)
    }

    websocket.onclose = (event) => {
      this.logger.debug('Websocket closed:', event.reason)
      this.ws = undefined
      const reason = ConnectionCloseReason.create({
        code: event.code,
        message: event.reason,
      })
      if (this.connected) {
        this.connected = false
        this.callbacks.onConnectionClose(reason)
      }
      this.exponentialBackoff.incrementAttempts()
      const reconnectDelay = this.exponentialBackoff.getBackoffWithJitter()
      this.logger.info(`Reconnecting in ${reconnectDelay}ms`)
      if (reason.props.code !== ConnectionCloseReason.CODES.UNAUTHORIZED) {
        setTimeout(() => this.connect(), reconnectDelay)
      }
    }

    websocket.onopen = () => {
      this.logger.info('Websocket connection opened')
      this.wsLastMessageReceived = time.getUnixTime()
      this.connected = true
      this.exponentialBackoff.resetAttempts()
      this.callbacks.onConnectionOpen()
    }
  }

  async broadcastMessage(
    message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents,
    originator: any,
    source: string,
  ): Promise<void> {
    const messageWrapper = new ClientMessage()

    if (message instanceof ClientMessageWithEvents) {
      for (const event of message.events) {
        event.content = new Uint8Array(await this.encryptMessage(event))
      }
    } else {
      for (const update of message.updates.documentUpdates) {
        update.encryptedContent = new Uint8Array(await this.encryptMessage(update))
      }
    }

    if (message instanceof ClientMessageWithDocumentUpdates) {
      messageWrapper.documentUpdatesMessage = message
    } else {
      messageWrapper.eventsMessage = message
    }

    const ws = this.ws

    this.logger.debug('Broadcasting message from source:', source, messageWrapper)

    if (this.connected && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(messageWrapper.serializeBinary())
    }
  }

  private async encryptMessage(message: DocumentUpdate | Event): Promise<ArrayBuffer> {
    const content = message instanceof DocumentUpdate ? message.encryptedContent : message.content
    const result = await this._encryptMessage.execute(content, message, this.keys)
    if (result.isFailed()) {
      throw new Error(`Unable to encrypt message: ${result.getError()}`)
    }

    return result.getValue()
  }
}
