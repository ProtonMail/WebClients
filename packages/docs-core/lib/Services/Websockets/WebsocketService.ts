import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { WebsocketCallbacks } from '../../Realtime/WebsocketCallbacks'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import { LoggerInterface } from '@proton/utils/logs'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import {
  InternalEventBusInterface,
  WebsocketConnectionInterface,
  RealtimeUrlAndToken,
  BroadcastSource,
  assertUnreachable,
  ProcessedIncomingRealtimeEventMessage,
} from '@proton/docs-shared'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { WebsocketServiceInterface } from './WebsocketServiceInterface'
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
  ServerMessageWithEvents,
  ServerMessageWithDocumentUpdates,
  CreateClientMessageWithDocumentUpdates,
} from '@proton/docs-proto'
import { c } from 'ttag'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { DocumentUpdateBuffer } from './Buffer/DocumentUpdateBuffer'
import { GenerateUUID } from '../../Util/GenerateUuid'
import { AckLedger } from './AckLedger/AckLedger'
import { AckLedgerInterface } from './AckLedger/AckLedgerInterface'
import { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { ApiResult } from '../../Domain/Result/ApiResult'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'

type LinkID = string

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<LinkID, DocumentConnectionRecord> = {}
  private stressTestorCache: {
    lastToken?: RealtimeUrlAndToken
    lastKeys?: DocumentKeys
    lastDocument?: NodeMeta
  } = {}
  readonly ledger: AckLedgerInterface = new AckLedger(this.logger, this.handleLedgerStatusChangeCallback.bind(this))

  constructor(
    private _createRealtimeValetToken: GetRealtimeUrlAndToken,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
  ) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  handleLedgerStatusChangeCallback(): void {
    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.AckStatusChange]>({
      type: WebsocketConnectionEvent.AckStatusChange,
      payload: {
        ledger: this.ledger,
      },
    })
  }

  handleWindowUnload = (event: BeforeUnloadEvent): void => {
    const connections = Object.values(this.connections)

    for (const { buffer } of connections) {
      if (buffer.hasPendingUpdates()) {
        buffer.flush()
        event.preventDefault()
        event.returnValue = c('Info').t`Recent changes are still being saved. Do not leave this page yet.`
      }
    }
  }

  flushPendingUpdates(): void {
    const connections = Object.values(this.connections)

    for (const { buffer } of connections) {
      if (buffer.hasPendingUpdates()) {
        buffer.flush()
      }
    }
  }

  destroy(): void {
    window.removeEventListener('beforeunload', this.handleWindowUnload)
    this.ledger.destroy()

    for (const { buffer } of Object.values(this.connections)) {
      buffer.destroy()
    }
  }

  createConnection(
    document: NodeMeta,
    keys: DocumentKeys,
    options: { commitId: () => string | undefined; isStressTestor?: boolean },
  ): WebsocketConnectionInterface {
    this.logger.info(`Creating connection for document ${document.linkId} isStressTestor: ${options.isStressTestor}`)

    const callbacks: WebsocketCallbacks = {
      onConnecting: () => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Connecting]>({
            type: WebsocketConnectionEvent.Connecting,
            payload: {
              document: document,
            },
          })
        }
      },

      onFailToConnect: (reason) => {
        if (!options.isStressTestor) {
          this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]>({
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
          this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]>({
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
          this.onDocumentConnectionOpened(document)
        }
      },

      onMessage: (message) => {
        if (!options.isStressTestor) {
          void this.handleConnectionMessage(document, message)
        }
      },

      onEncryptionError: (error) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EncryptionError]>({
          type: WebsocketConnectionEvent.EncryptionError,
          payload: {
            document,
            error,
          },
        })
      },

      onFailToGetToken: (errorCode) => {
        if (errorCode === DocsApiErrorCode.CommitIdOutOfSync) {
          this.eventBus.publish<
            WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync]
          >({
            type: WebsocketConnectionEvent.FailedToGetTokenCommitIdOutOfSync,
            payload: {
              document,
            },
          })
        } else {
          this.logger.error(`Failed to get token: ${errorCode}`)
        }
      },

      getUrlAndToken: async () => {
        if (options.isStressTestor && this.stressTestorCache.lastToken) {
          return ApiResult.ok(this.stressTestorCache.lastToken)
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

    const buffer = new DocumentUpdateBuffer(document, this.logger, (mergedUpdate) => {
      void this.handleDocumentUpdateBufferFlush(document, mergedUpdate)
    })

    this.connections[document.linkId] = {
      document,
      connection,
      keys,
      buffer,
    }

    this.stressTestorCache.lastKeys = keys
    this.stressTestorCache.lastDocument = document

    return connection
  }

  onDocumentConnectionOpened(document: NodeMeta): void {
    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Connected]>({
      type: WebsocketConnectionEvent.Connected,
      payload: {
        document: document,
      },
    })

    this.retryAllFailedDocumentUpdates(document)
  }

  retryAllFailedDocumentUpdates(document: NodeMeta): void {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const failedUpdates = this.ledger.getUnacknowledgedUpdates()
    if (failedUpdates.length === 0) {
      return
    }

    this.logger.info(`Retrying ${failedUpdates.length} failed document updates ${failedUpdates.map((u) => u.uuid)}`)

    const message = CreateClientMessageWithDocumentUpdates({
      updates: failedUpdates,
    })

    const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })

    const binary = messageWrapper.serializeBinary()

    this.logger.info(`Broadcasting failed document update of size: ${binary.byteLength} bytes`)

    void record.connection.broadcastMessage(binary, BroadcastSource.RetryingMessagesAfterReconnect)
  }

  getConnectionRecord(linkId: LinkID): DocumentConnectionRecord | undefined {
    return this.connections[linkId]
  }

  async reconnectToDocumentWithoutDelay(document: NodeMeta): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    this.logger.info(`Reconnecting to document without delay`)

    await record.connection.connect()
  }

  async handleDocumentUpdateBufferFlush(document: NodeMeta, mergedUpdate: Uint8Array): Promise<void> {
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

    const encryptedContent = await this.encryptMessage(
      mergedUpdate,
      metadata,
      document,
      keys,
      BroadcastSource.DocumentBufferFlush,
    )

    const uuid = GenerateUUID()

    const message = CreateDocumentUpdateMessage({
      content: encryptedContent,
      uuid: uuid,
      ...metadata,
    })

    const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })
    const binary = messageWrapper.serializeBinary()

    this.logger.info(`Broadcasting document update ${uuid} of size: ${binary.byteLength} bytes`)

    this.ledger.messagePosted(message)

    void connection.broadcastMessage(binary, BroadcastSource.DocumentBufferFlush)
  }

  async sendDocumentUpdateMessage(document: NodeMeta, rawContent: Uint8Array): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { buffer } = record

    buffer.addUpdate(rawContent)
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

    const { keys, connection, buffer } = record

    if (buffer.isBufferEnabled) {
      const eventsThatShouldNotBeSentIfNotInRealtimeMode: EventTypeEnum[] = [
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        EventTypeEnum.ClientHasSentACommentMessage,
      ]

      if (eventsThatShouldNotBeSentIfNotInRealtimeMode.includes(type)) {
        this.logger.info('Not in real time mode. Not sending event:', EventTypeEnum[type])
        return
      }
    }

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

    this.logger.info(
      `Broadcasting event message of type: ${EventTypeEnum[type]} from source: ${source} size: ${binary.byteLength} bytes`,
    )

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

      this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EncryptionError]>({
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

  async handleConnectionMessage(document: NodeMeta, data: Uint8Array): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const message = ServerMessage.deserializeBinary(data)
    const type = ServerMessageType.create(message.type)

    if (type.hasDocumentUpdates()) {
      await this.handleIncomingDocumentUpdatesMessage(record, message.documentUpdatesMessage)
    } else if (type.hasEvents()) {
      await this.handleIncomingEventsMessage(record, message.eventsMessage)
    } else if (type.isMessageAck()) {
      this.ledger.messageAcknowledgementReceived(message.acksMessage)
    } else {
      throw new Error('Unknown message type')
    }
  }

  async handleIncomingDocumentUpdatesMessage(
    record: DocumentConnectionRecord,
    message: ServerMessageWithDocumentUpdates,
  ): Promise<void> {
    if (message.updates.documentUpdates.length === 0) {
      return
    }

    this.logger.info(
      `Received ${message.updates.documentUpdates.length} document updates with ids ${message.updates.documentUpdates.map((u) => u.uuid)}`,
    )

    const { keys, buffer, document } = record

    for (const update of message.updates.documentUpdates) {
      if (update.authorAddress !== keys.userOwnAddress) {
        this.switchToRealtimeMode(buffer)
      }

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

      this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.DocumentUpdateMessage]>({
        type: WebsocketConnectionEvent.DocumentUpdateMessage,
        payload: {
          document,
          message: decrypted,
        },
      })
    }
  }

  switchToRealtimeMode(buffer: DocumentUpdateBuffer): void {
    if (!buffer.isBufferEnabled) {
      return
    }

    this.logger.info('Switching to realtime mode')

    buffer.flush()
    buffer.setBufferEnabled(false)
  }

  async handleIncomingEventsMessage(record: DocumentConnectionRecord, message: ServerMessageWithEvents): Promise<void> {
    const { keys, buffer, document } = record

    const processedMessages: ProcessedIncomingRealtimeEventMessage[] = []

    const eventsThatTakeUsIntoRealtimeMode: EventTypeEnum[] = [
      EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState,
      EventTypeEnum.ClientIsBroadcastingItsPresenceState,
    ]

    for (const event of message.events) {
      if (eventsThatTakeUsIntoRealtimeMode.includes(event.type)) {
        this.switchToRealtimeMode(buffer)
      }

      const type = EventType.create(event.type)

      this.logger.info('Handling event from RTS:', EventTypeEnum[event.type])

      switch (type.value) {
        case EventTypeEnum.ServerIsDisconnectingAllClientsFromTheStream:
        case EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive:
        case EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit:
          break
        case EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState:
        case EventTypeEnum.ServerIsRequestingClientToBroadcastItsState:
        case EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas:
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

    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EventMessage]>({
      type: WebsocketConnectionEvent.EventMessage,
      payload: {
        document,
        message: processedMessages,
      },
    })
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

    const content = stringToUtf8Array(JSON.stringify({ authorAddress: keys.userOwnAddress }))

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
