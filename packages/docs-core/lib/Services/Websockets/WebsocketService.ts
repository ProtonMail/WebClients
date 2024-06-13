import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { WebsocketCallbacks } from '../../Realtime/WebsocketCallbacks'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import { LoggerInterface } from '@proton/utils/logs'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import {
  InternalEventBusInterface,
  WebsocketConnectionEvent,
  WebsocketConnectionInterface,
  WebsocketConnectedPayload,
  BaseWebsocketPayload,
  WebsocketDisconnectedPayload,
  RealtimeUrlAndToken,
  WebsocketFailedToConnectPayload,
  WebsocketEncryptionErrorPayload,
  BroadcastSource,
  assertUnreachable,
  ProcessedIncomingRealtimeEventMessage,
  WebsocketDocumentUpdateMessagePayload,
  WebsocketEventMessagePayload,
  WebsocketCollaborationMode,
} from '@proton/docs-shared'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { WebsocketServiceInterface } from './WebsocketServiceInterface'
import { Result } from '../../Domain/Result/Result'
import metrics from '@proton/metrics'
import {
  ClientMessage,
  ServerMessage,
  ServerMessageType,
  EventTypeEnum,
  EventType,
  CreateClientEventMessage,
  ClientEventVersion,
  CreateDocumentUpdateMessage,
  DocumentUpdateVersion,
} from '@proton/docs-proto'
import { c } from 'ttag'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'

type DocumentConnectionRecord = {
  connection: WebsocketConnectionInterface
  keys: DocumentKeys
  mode: WebsocketCollaborationMode
}

type LinkID = string

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<LinkID, DocumentConnectionRecord> = {}
  private stressTestorCache: {
    lastToken?: RealtimeUrlAndToken
    lastKeys?: DocumentKeys
    lastDocument?: NodeMeta
  } = {}

  constructor(
    private _createRealtimeValetToken: GetRealtimeUrlAndToken,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
  ) {}

  createConnection(
    document: NodeMeta,
    keys: DocumentKeys,
    options: { commitId: () => string | undefined; isStressTestor?: boolean },
  ): WebsocketConnectionInterface {
    this.logger.info(`Creating connection for document ${document.linkId} isStressTestor: ${options.isStressTestor}`)

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
          void this.handleConnectionMessage(document, message)
        }
      },

      onEncryptionError: (error) => {
        this.eventBus.publish<WebsocketEncryptionErrorPayload>({
          type: WebsocketConnectionEvent.EncryptionError,
          payload: {
            document,
            error,
          },
        })
      },

      getUrlAndToken: async () => {
        if (options.isStressTestor && this.stressTestorCache.lastToken) {
          return Result.ok(this.stressTestorCache.lastToken)
        }

        const result = await this._createRealtimeValetToken.execute(document, options.commitId())
        if (!result.isFailed()) {
          this.stressTestorCache.lastToken = result.getValue()
        }
        return result
      },

      getLatestCommitId: options.commitId,
    }

    const connection = new WebsocketConnection(callbacks, this.logger)

    this.connections[document.linkId] = {
      connection,
      keys,
      mode: WebsocketCollaborationMode.Buffered,
    }

    this.stressTestorCache.lastKeys = keys
    this.stressTestorCache.lastDocument = document

    return connection
  }

  getConnectionRecord(linkId: LinkID): DocumentConnectionRecord | undefined {
    return this.connections[linkId]
  }

  async sendDocumentUpdateMessage(document: NodeMeta, rawContent: Uint8Array, source: BroadcastSource): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { keys, connection } = record

    const metadata: EncryptionMetadata = {
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
      version: DocumentUpdateVersion.V1,
    }

    const encryptedContent = await this.encryptMessage(rawContent, metadata, document, keys, source)

    const message = CreateDocumentUpdateMessage({
      content: encryptedContent,
      ...metadata,
    })

    const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })
    const binary = messageWrapper.serializeBinary()

    void connection.broadcastMessage(binary, source)
  }

  async sendEventMessage(
    document: NodeMeta,
    rawContent: Uint8Array,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { keys, connection } = record

    const metadata: EncryptionMetadata = {
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
      version: ClientEventVersion.V1,
    }

    const encryptedContent = await this.encryptMessage(rawContent, metadata, document, keys, source)
    const message = CreateClientEventMessage({
      content: encryptedContent,
      type: type,
      ...metadata,
    })

    const messageWrapper = new ClientMessage({ eventsMessage: message })
    const binary = messageWrapper.serializeBinary()

    void connection.broadcastMessage(binary, source)
  }

  async encryptMessage(
    content: Uint8Array,
    metadata: EncryptionMetadata,
    document: NodeMeta,
    keys: DocumentKeys,
    source: BroadcastSource,
  ): Promise<Uint8Array> {
    const result = await this._encryptMessage.execute(content, metadata, keys)

    if (result.isFailed()) {
      const message = c('Error')
        .t`A data integrity error has occurred and recent changes cannot be saved. Please refresh the page.`

      this.eventBus.publish<WebsocketEncryptionErrorPayload>({
        type: WebsocketConnectionEvent.EncryptionError,
        payload: {
          document,
          error: message,
        },
      })

      if (source === BroadcastSource.CommentsController) {
        metrics.docs_comments_error_total.increment({
          reason: 'encryption_error',
        })
      }

      traceError('Unable to encrypt message', {
        extra: {
          errorInfo: {
            message: result.getError(),
          },
        },
      })

      throw new Error(`Unable to encrypt message: ${result.getError()}`)
    }

    return new Uint8Array(result.getValue())
  }

  private async handleConnectionMessage(document: NodeMeta, data: Uint8Array): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { keys } = record

    const message = ServerMessage.deserializeBinary(data)
    const type = ServerMessageType.create(message.type)

    if (type.hasDocumentUpdates()) {
      for (const update of message.documentUpdatesMessage.updates.documentUpdates) {
        const decryptionResult = await this._decryptMessage.execute({
          message: update,
          keys: keys,
          verify: false,
        })
        if (decryptionResult.isFailed()) {
          metrics.docs_document_updates_decryption_error_total.increment({
            source: 'realtime',
          })
          throw new Error(`Failed to decrypt document update: ${decryptionResult.getError()}`)
        }

        const decrypted = decryptionResult.getValue()

        this.eventBus.publish<WebsocketDocumentUpdateMessagePayload>({
          type: WebsocketConnectionEvent.DocumentUpdateMessage,
          payload: {
            document,
            message: decrypted,
          },
        })
      }
    } else if (type.hasEvents()) {
      const processedMessages: ProcessedIncomingRealtimeEventMessage[] = []

      for (const event of message.eventsMessage.events) {
        const type = EventType.create(event.type)

        this.logger.info('Handling event from RTS:', EventTypeEnum[event.type])

        switch (type.value) {
          case EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState:
          case EventTypeEnum.ServerIsRequestingClientToBroadcastItsState:
          case EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas:
          case EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive:
          case EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit:
            processedMessages.push(
              new ProcessedIncomingRealtimeEventMessage({
                type: type.value,
              }),
            )
            break
          case EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated:
            processedMessages.push(
              new ProcessedIncomingRealtimeEventMessage({
                type: type.value,
                content: event.content,
              }),
            )
            break
          case EventTypeEnum.ClientHasSentACommentMessage:
          case EventTypeEnum.ClientIsBroadcastingItsPresenceState: {
            const decryptionResult = await this._decryptMessage.execute({ message: event, keys: keys, verify: false })
            if (decryptionResult.isFailed()) {
              this.logger.error(`Failed to decrypt event: ${decryptionResult.getError()}`)
              return undefined
            }

            const decrypted = decryptionResult.getValue()
            if (decrypted) {
              processedMessages.push(
                new ProcessedIncomingRealtimeEventMessage({
                  type: type.value,
                  content: decrypted.content,
                }),
              )
            }
            break
          }
          default:
            assertUnreachable(type.value)
        }
      }

      this.eventBus.publish<WebsocketEventMessagePayload>({
        type: WebsocketConnectionEvent.EventMessage,
        payload: {
          document,
          message: processedMessages,
        },
      })
    } else {
      throw new Error('Unknown message type')
    }
  }

  /**
   * This is a debug utility exposed in development by the Debug menu and allows the client to force the RTS to commit immediately
   * (rather than waiting for the next scheduled commit cycle)
   */
  public async debugSendCommitCommandToRTS(document: NodeMeta, keys: DocumentKeys): Promise<void> {
    this.logger.info('Sending commit command to RTS')

    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const content = new Uint8Array(stringToUint8Array(JSON.stringify({ authorAddress: keys.userOwnAddress })))

    void this.sendEventMessage(
      document,
      content,
      EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit,
      BroadcastSource.CommitDocumentUseCase,
    )
  }

  public debugCloseConnection(document: { linkId: string }): void {
    this.logger.info('Closing connection')

    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    void record.connection.disconnect()
  }

  public createStressTestConnections(count: number): void {
    this.logger.debug(`Creating ${count} stress test connections`)

    for (let i = 0; i < count; i++) {
      const connection = this.createConnection(this.stressTestorCache.lastDocument!, this.stressTestorCache.lastKeys!, {
        commitId: () => undefined,
        isStressTestor: true,
      })

      void connection.connect()
    }
  }
}
