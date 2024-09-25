import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { EncryptMessage } from '../../UseCase/EncryptMessage'
import type { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import type { LoggerInterface } from '@proton/utils/logs'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import type { InternalEventBusInterface, WebsocketConnectionInterface, WebsocketCallbacks } from '@proton/docs-shared'
import { BroadcastSource, ProcessedIncomingRealtimeEventMessage, assertUnreachableAndLog } from '@proton/docs-shared'
import type { GetRealtimeUrlAndToken } from '../../UseCase/CreateRealtimeValetToken'
import type { WebsocketServiceInterface } from './WebsocketServiceInterface'
import metrics from '@proton/metrics'
import type {
  ServerMessageWithEvents,
  ServerMessageWithDocumentUpdates,
  ServerMessageWithMessageAcks,
  ConnectionReadyPayload,
} from '@proton/docs-proto'
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
  CreateClientMessageWithDocumentUpdates,
  ConnectionCloseReason,
  DecryptedValue,
} from '@proton/docs-proto'
import { c } from 'ttag'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import type { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { GenerateUUID } from '../../Util/GenerateUuid'
import { AckLedger } from './AckLedger/AckLedger'
import type { AckLedgerInterface } from './AckLedger/AckLedgerInterface'
import type { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import { UpdateDebouncerEventType } from './Debouncer/UpdateDebouncerEventType'
import { DocumentDebounceMode } from './Debouncer/DocumentDebounceMode'

type LinkID = string

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<LinkID, DocumentConnectionRecord> = {}
  readonly ledger: AckLedgerInterface = new AckLedger(this.logger, this.handleLedgerStatusChangeCallback.bind(this))

  constructor(
    private _createRealtimeValetToken: GetRealtimeUrlAndToken,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
    private appVersion: string,
  ) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  destroy(): void {
    window.removeEventListener('beforeunload', this.handleWindowUnload)
    this.ledger.destroy()

    for (const { debouncer, connection } of Object.values(this.connections)) {
      debouncer.destroy()
      connection.destroy()
    }

    this.connections = {}
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

    for (const { debouncer } of connections) {
      if (debouncer.hasPendingUpdates()) {
        debouncer.flush()
        event.preventDefault()
      }
    }

    if (this.ledger.hasConcerningMessages() || this.ledger.hasErroredMessages()) {
      this.retryAllFailedDocumentUpdates()
      event.preventDefault()
    }
  }

  flushPendingUpdates(): void {
    const connections = Object.values(this.connections)

    for (const { debouncer } of connections) {
      if (debouncer.hasPendingUpdates()) {
        debouncer.flush()
      }
    }
  }

  createConnection(
    document: NodeMeta,
    keys: DocumentKeys,
    options: { commitId: () => string | undefined },
  ): WebsocketConnectionInterface {
    this.logger.info(`Creating connection for document ${document.linkId}`)

    const callbacks: WebsocketCallbacks = {
      onConnecting: () => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Connecting]>({
          type: WebsocketConnectionEvent.Connecting,
          payload: {
            document: document,
          },
        })
      },

      onOpen: () => {
        this.eventBus.publish<
          WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady]
        >({
          type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
          payload: {
            document: document,
          },
        })
      },

      onFailToConnect: (reason) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]>({
          type: WebsocketConnectionEvent.FailedToConnect,
          payload: {
            document: document,
            serverReason: reason,
          },
        })
      },

      onClose: (reason) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]>({
          type: WebsocketConnectionEvent.Disconnected,
          payload: {
            document: document,
            serverReason: reason,
          },
        })
      },

      onMessage: (message) => {
        void this.handleConnectionMessage(document, message)
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
        const result = await this._createRealtimeValetToken.execute(document, options.commitId())
        return result
      },
    }

    const connection = new WebsocketConnection(callbacks, this.logger, this.appVersion)

    const debouncer = new UpdateDebouncer(document, this.logger, (event) => {
      if (event.type === UpdateDebouncerEventType.DidFlush) {
        void this.handleDocumentUpdateDebouncerFlush(document, event.mergedUpdate)
      } else if (event.type === UpdateDebouncerEventType.WillFlush) {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saving]>({
          type: WebsocketConnectionEvent.Saving,
          payload: {
            document,
          },
        })
      }
    })

    this.connections[document.linkId] = {
      document,
      connection,
      keys,
      debouncer,
    }

    return connection
  }

  isConnectionReadyPayload(obj: any): obj is ConnectionReadyPayload {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof obj.clientUpgradeRecommended === 'boolean' &&
      typeof obj.clientUpgradeRequired === 'boolean'
    )
  }

  onDocumentConnectionReadyToBroadcast(record: DocumentConnectionRecord, content: Uint8Array): void {
    this.logger.info('Received ready to broadcast message from RTS')

    record.connection.markAsReadyToAcceptMessages()
    record.debouncer.markAsReadyToFlush()

    let readinessInformation: ConnectionReadyPayload | undefined
    try {
      const parsed = JSON.parse(utf8ArrayToString(content))
      if (this.isConnectionReadyPayload(parsed)) {
        readinessInformation = parsed
      }
    } catch {
      this.logger.error('Unable to parse content from ConnectionReady message')
    }

    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ConnectedAndReady]>({
      type: WebsocketConnectionEvent.ConnectedAndReady,
      payload: {
        document: record.document,
        readinessInformation: readinessInformation,
      },
    })

    this.retryFailedDocumentUpdatesForDoc(record.document)
  }

  retryAllFailedDocumentUpdates(): void {
    this.logger.info('Retrying all failed document updates')

    for (const record of Object.values(this.connections)) {
      this.retryFailedDocumentUpdatesForDoc(record.document)
    }
  }

  retryFailedDocumentUpdatesForDoc(document: NodeMeta): void {
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

    metrics.docs_document_updates_total.increment({})
  }

  getConnectionRecord(linkId: LinkID): DocumentConnectionRecord | undefined {
    return this.connections[linkId]
  }

  async reconnectToDocumentWithoutDelay(document: NodeMeta): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    if (record.connection.isConnected()) {
      this.logger.info(`Connection is already connected`)
      return
    }

    this.logger.info(`Reconnecting to document without delay`)

    await record.connection.connect()
  }

  async handleDocumentUpdateDebouncerFlush(document: NodeMeta, mergedUpdate: Uint8Array): Promise<void> {
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

    metrics.docs_document_updates_total.increment({})
  }

  async sendDocumentUpdateMessage(document: NodeMeta, rawContent: Uint8Array | Uint8Array[]): Promise<void> {
    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { debouncer } = record

    debouncer.addUpdates(
      Array.isArray(rawContent) ? rawContent.map((c) => new DecryptedValue(c)) : [new DecryptedValue(rawContent)],
    )
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

    const { keys, connection, debouncer } = record

    if (debouncer.getMode() === DocumentDebounceMode.SinglePlayer) {
      const eventsThatShouldNotBeSentIfInSinglePlayerMode: EventTypeEnum[] = [
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        EventTypeEnum.ClientHasSentACommentMessage,
      ]

      if (eventsThatShouldNotBeSentIfInSinglePlayerMode.includes(type)) {
        this.logger.info('Not in real time mode. Not sending event:', EventTypeEnum[type])
        return
      }
    }

    if (!record.connection.canBroadcastMessages()) {
      this.logger.info(`Not sending event ${EventTypeEnum[type]} because connection is not ready`)
      return
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
      const message = c('Error').t`We are having trouble saving recent edits. Please refresh the page.`

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
      await this.handleAckMessage(record, message.acksMessage)
    } else {
      throw new Error('Unknown message type')
    }
  }

  async handleAckMessage(record: DocumentConnectionRecord, message: ServerMessageWithMessageAcks): Promise<void> {
    this.ledger.messageAcknowledgementReceived(message)
    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saved]>({
      type: WebsocketConnectionEvent.Saved,
      payload: {
        document: record.document,
      },
    })
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

    const { keys, debouncer, document } = record

    for (const update of message.updates.documentUpdates) {
      if (update.authorAddress !== keys.userOwnAddress) {
        this.switchToRealtimeMode(debouncer, 'receiving DU from other user')
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

  switchToRealtimeMode(debouncer: UpdateDebouncer, reason: string): void {
    if (debouncer.getMode() === DocumentDebounceMode.Realtime) {
      return
    }

    this.logger.info('Switching to realtime mode due to', reason)

    debouncer.flush()
    debouncer.setMode(DocumentDebounceMode.Realtime)
  }

  async handleIncomingEventsMessage(record: DocumentConnectionRecord, message: ServerMessageWithEvents): Promise<void> {
    const { keys, debouncer, document } = record

    const processedMessages: ProcessedIncomingRealtimeEventMessage[] = []

    const eventsThatTakeUsIntoRealtimeMode: EventTypeEnum[] = [
      EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState,
      EventTypeEnum.ClientIsBroadcastingItsPresenceState,
    ]

    for (const event of message.events) {
      if (eventsThatTakeUsIntoRealtimeMode.includes(event.type)) {
        this.switchToRealtimeMode(debouncer, `receiving event ${EventTypeEnum[event.type]}`)
      }

      const type = EventType.create(event.type)

      this.logger.info('Handling event from RTS:', EventTypeEnum[event.type])

      switch (type.value) {
        case EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive:
        case EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit:
        case EventTypeEnum.ServerIsNotifyingOtherServersToDisconnectAllClientsFromTheStream:
          break
        case EventTypeEnum.ServerIsReadyToAcceptClientMessages:
          this.onDocumentConnectionReadyToBroadcast(record, event.content)
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
          assertUnreachableAndLog(type.value)
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

  public closeConnection(document: { linkId: string }): void {
    this.logger.info('Closing connection')

    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    void record.connection.disconnect(ConnectionCloseReason.CODES.NORMAL_CLOSURE)
  }
}
