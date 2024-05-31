import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { WebsocketCallbacks } from '../../Realtime/WebsocketCallbacks'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { LoggerInterface } from '@standardnotes/utils'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import {
  InternalEventBusInterface,
  WebsocketConnectionEvent,
  WebsocketConnectionInterface,
  WebsocketConnectedPayload,
  BaseWebsocketPayload,
  WebsocketDisconnectedPayload,
  WebsocketMessagePayload,
  RealtimeUrlAndToken,
  WebsocketFailedToConnectPayload,
} from '@proton/docs-shared'
import { ClientMessageWithDocumentUpdates, ClientMessageWithEvents } from '@proton/docs-proto'
import { DebugSendCommitCommandToRTS } from '../../UseCase/SendCommitCommandToRTS'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { Result } from '@standardnotes/domain-core'
import { WebsocketServiceInterface } from './WebsocketServiceInterface'

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<string, WebsocketConnectionInterface> = {}
  private stressTestorCache: {
    lastToken?: RealtimeUrlAndToken
    lastKeys?: DocumentKeys
    lastDocument?: NodeMeta
  } = {}

  constructor(
    private _createRealtimeValetToken: GetRealtimeUrlAndToken,
    private _encryptMessage: EncryptMessage,
    private _sendCommitCommandToRTS: DebugSendCommitCommandToRTS,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
  ) {}

  createConnection(
    document: NodeMeta,
    keys: DocumentKeys,
    options: { commitId?: string; isStressTestor?: boolean },
  ): WebsocketConnectionInterface {
    this.logger.debug(`Creating connection for document ${document.linkId} isStressTestor: ${options.isStressTestor}`)

    const callbacks: WebsocketCallbacks = {
      onConnecting: () => {
        if (!options.isStressTestor) {
          this.eventBus.publish<BaseWebsocketPayload>({
            type: WebsocketConnectionEvent.Connecting,
            payload: {
              document: document,
            },
          })
        }
      },

      onFailToConnect: (reason) => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketFailedToConnectPayload>({
            type: WebsocketConnectionEvent.FailedToConnect,
            payload: {
              document: document,
              serverReason: reason,
            },
          })
        }
      },

      onClose: (reason) => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketDisconnectedPayload>({
            type: WebsocketConnectionEvent.Disconnected,
            payload: {
              document: document,
              serverReason: reason,
            },
          })
        }
      },

      onOpen: () => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketConnectedPayload>({
            type: WebsocketConnectionEvent.Connected,
            payload: {
              document: document,
            },
          })
        }
      },

      onMessage: (message) => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketMessagePayload>({
            type: WebsocketConnectionEvent.Message,
            payload: {
              document,
              message: message,
            },
          })
        }
      },

      getUrlAndToken: async () => {
        if (options.isStressTestor && this.stressTestorCache.lastToken) {
          return Result.ok(this.stressTestorCache.lastToken)
        }
        const result = await this._createRealtimeValetToken.execute(document, options.commitId)
        if (!result.isFailed()) {
          this.stressTestorCache.lastToken = result.getValue()
        }
        return result
      },

      getLatestCommitId: () => options.commitId,
    }

    const connection = new WebsocketConnection(keys, callbacks, this._encryptMessage, this.logger)

    this.connections[document.linkId] = connection

    this.stressTestorCache.lastKeys = keys
    this.stressTestorCache.lastDocument = document

    return connection
  }

  sendMessageToDocument(
    document: NodeMeta,
    message: ClientMessageWithDocumentUpdates | ClientMessageWithEvents,
    source: string,
  ): void {
    const connection = this.connections[document.linkId]
    if (!connection) {
      throw new Error('Connection not found')
    }

    void connection.broadcastMessage(message, source)
  }

  public async debugSendCommitCommandToRTS(document: NodeMeta, keys: DocumentKeys): Promise<void> {
    this.logger.info('Sending commit command to RTS')

    const connection = this.connections[document.linkId]

    if (!connection) {
      throw new Error('Connection not found')
    }

    await this._sendCommitCommandToRTS.execute(connection, keys.userOwnAddress)
  }

  public createStressTestConnections(count: number): void {
    this.logger.debug(`Creating ${count} stress test connections`)

    for (let i = 0; i < count; i++) {
      const connection = this.createConnection(this.stressTestorCache.lastDocument!, this.stressTestorCache.lastKeys!, {
        isStressTestor: true,
      })

      void connection.connect()
    }
  }
}
