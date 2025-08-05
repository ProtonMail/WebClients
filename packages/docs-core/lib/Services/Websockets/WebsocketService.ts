import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils'
import type { DocumentKeys, NodeMeta, PublicNodeMeta, PublicDocumentKeys } from '@proton/drive-store'
import type { EncryptMessage } from '../../UseCase/EncryptMessage'
import type { AnonymousEncryptionMetadata, EncryptionMetadata } from '../../Types/EncryptionMetadata'
import type { LoggerInterface } from '@proton/utils/logs'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import type { InternalEventBusInterface, WebsocketConnectionInterface, WebsocketCallbacks } from '@proton/docs-shared'
import { BroadcastSource, ProcessedIncomingRealtimeEventMessage, assertUnreachableAndLog } from '@proton/docs-shared'
import type { FetchRealtimeToken } from '../../UseCase/FetchRealtimeToken'
import type { WebsocketServiceInterface } from './WebsocketServiceInterface'
import metrics from '@proton/metrics'
import type {
  ServerMessageWithEvents,
  ServerMessageWithDocumentUpdates,
  ServerMessageWithMessageAcks,
  ConnectionReadyPayload,
} from '@proton/docs-proto'
import { DocumentUpdate } from '@proton/docs-proto'
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
import type { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { GenerateUUID } from '@proton/docs-shared'
import { AckLedger } from './AckLedger/AckLedger'
import type { AckLedgerInterface } from './AckLedger/AckLedgerInterface'
import type { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import { UpdateDebouncerEventType } from './Debouncer/UpdateDebouncerEventType'
import { DocumentDebounceMode } from './Debouncer/DocumentDebounceMode'
import { PostApplicationError } from '../../Application/ApplicationEvent'
import type { MetricService } from '../Metrics/MetricService'
import type { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import { doKeysBelongToAuthenticatedUser } from '../../Types/DocumentEntitlements'
import { MAX_UPDATE_CHUNKS, MAX_UPDATE_SIZE } from '../../Models/Constants'
import {
  compressDocumentUpdate,
  decompressDocumentUpdate,
  isCompressedDocumentUpdate,
  isDocumentUpdateCompressionEnabled,
} from '../../utils/document-update-compression'
import {
  canDocumentUpdateBeSplit,
  createDocumentUpdateChunkState,
  isDocumentUpdateChunk,
  isDocumentUpdateChunkingEnabled,
  MAX_CHUNK_CONTENT_SIZE,
  processDocumentUpdateChunk,
  splitDocumentUpdateIntoChunks,
} from '../../utils/document-update-chunking'
import type { UnleashClient } from '@proton/unleash'
import type { DocumentType } from '@proton/drive-store/store/_documents'

type LinkID = string

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<LinkID, DocumentConnectionRecord> = {}
  readonly ledger: AckLedgerInterface = new AckLedger(this.logger, this.handleLedgerStatusChangeCallback.bind(this))

  documentType: DocumentType = 'doc'
  setDocumentType(type: DocumentType): void {
    this.documentType = type
  }

  constructor(
    private _createRealtimeValetToken: FetchRealtimeToken,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
    private metricService: MetricService,
    private appVersion: string,
    private unleashClient: UnleashClient,
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

  createConnection(documentState: DocumentState | PublicDocumentState): WebsocketConnectionInterface {
    const nodeMeta = documentState.nodeMeta
    this.logger.info(`Creating connection for document ${nodeMeta.linkId}`)

    const callbacks: WebsocketCallbacks = {
      onConnecting: () => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Connecting]>({
          type: WebsocketConnectionEvent.Connecting,
          payload: {
            document: nodeMeta,
          },
        })
      },

      onOpen: () => {
        this.eventBus.publish<
          WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady]
        >({
          type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
          payload: {
            document: nodeMeta,
          },
        })
      },

      onFailToConnect: (reason) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.FailedToConnect]>({
          type: WebsocketConnectionEvent.FailedToConnect,
          payload: {
            document: nodeMeta,
            serverReason: reason,
          },
        })
      },

      onClose: (reason) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Disconnected]>({
          type: WebsocketConnectionEvent.Disconnected,
          payload: {
            document: nodeMeta,
            serverReason: reason,
          },
        })
      },

      onMessage: (message) => {
        void this.handleConnectionMessage(nodeMeta, message)
      },

      onEncryptionError: (error) => {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.EncryptionError]>({
          type: WebsocketConnectionEvent.EncryptionError,
          payload: {
            document: nodeMeta,
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
              document: nodeMeta,
            },
          })
        }
      },
    }

    const connection = new WebsocketConnection(
      documentState,
      callbacks,
      this._createRealtimeValetToken,
      this.metricService,
      this.logger,
      this.appVersion,
    )

    const debouncer = new UpdateDebouncer(nodeMeta, this.logger, (event) => {
      if (event.type === UpdateDebouncerEventType.DidFlush) {
        void this.prepareAndBroadcastDocumentUpdate(nodeMeta, event.mergedUpdate)
      } else if (event.type === UpdateDebouncerEventType.WillFlush) {
        this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saving]>({
          type: WebsocketConnectionEvent.Saving,
          payload: {
            document: nodeMeta,
          },
        })
      }
    })

    this.connections[nodeMeta.linkId] = {
      document: nodeMeta,
      connection,
      keys: documentState.getProperty('entitlements').keys,
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

  retryFailedDocumentUpdatesForDoc(document: NodeMeta | PublicNodeMeta): void {
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

  isConnected(nodeMeta: NodeMeta | PublicNodeMeta): boolean {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      return false
    }

    return record.connection.isConnected()
  }

  async reconnectToDocumentWithoutDelay(
    nodeMeta: NodeMeta | PublicNodeMeta,
    options: { invalidateTokenCache: boolean },
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    if (record.connection.isConnected()) {
      this.logger.info(`Connection is already connected`)
      return
    }

    this.logger.info(`Reconnecting to document without delay`)

    await record.connection.connect(undefined, options)
  }

  async createAndBroadcastDocumentUpdateMessage(
    nodeMeta: NodeMeta | PublicNodeMeta,
    content: Uint8Array,
    metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const uuid = GenerateUUID()

    const message = CreateDocumentUpdateMessage({
      content,
      uuid: uuid,
      ...metadata,
    })

    const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })
    const binary = messageWrapper.serializeBinary()

    this.logger.info(`Broadcasting document update ${uuid} of size: ${binary.byteLength} bytes`)

    this.ledger.messagePosted(message)

    void record.connection.broadcastMessage(binary, BroadcastSource.DocumentBufferFlush)
  }

  /**
   * Prepares and broadcasts a document update message.
   * 1. Compresses the update, if compression is enabled.
   * 2. Encrypts the update
   * 3. Splits the update into chunks if it exceeds the maximum size, if chunking is enabled.
   * 4. Broadcasts the update message to the document's connection.
   */
  async prepareAndBroadcastDocumentUpdate(
    nodeMeta: NodeMeta | PublicNodeMeta,
    mergedUpdate: Uint8Array,
  ): Promise<void> {
    let update = mergedUpdate
    if (isDocumentUpdateCompressionEnabled(this.unleashClient, this.documentType)) {
      update = compressDocumentUpdate(mergedUpdate)
      this.logger.info(`Compressed merged update from ${mergedUpdate.byteLength} bytes to ${update.byteLength} bytes`)
    }

    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const { keys } = record

    const metadata: EncryptionMetadata | AnonymousEncryptionMetadata = {
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
      version: DocumentUpdateVersion.V1,
    }

    const encryptedContent = await this.encryptMessage(
      update,
      metadata,
      nodeMeta,
      keys,
      BroadcastSource.DocumentBufferFlush,
    )

    const shouldSplitIntoChunks = isDocumentUpdateChunkingEnabled(this.unleashClient, this.documentType)
      ? encryptedContent.byteLength > MAX_UPDATE_SIZE
      : false
    if (shouldSplitIntoChunks) {
      this.logger.info(`Splitting merged update of size ${encryptedContent.byteLength} bytes into multiple chunks`)
      const canBeSplit = canDocumentUpdateBeSplit(encryptedContent, {
        maxChunkSize: MAX_CHUNK_CONTENT_SIZE,
        maxChunks: MAX_UPDATE_CHUNKS,
      })
      if (!canBeSplit) {
        PostApplicationError(this.eventBus, {
          translatedErrorTitle: c('Error').t`Update Too Large`,
          translatedError: c('Error')
            .t`The last update you made to the document is either too large, or would exceed the total document size limit. Editing has been temporarily disabled. Your change will not be saved. Please export a copy of your document and reload the page.`,
        })
        return
      }
      const chunks = splitDocumentUpdateIntoChunks(encryptedContent, {
        maxChunkSize: MAX_CHUNK_CONTENT_SIZE,
      })
      this.logger.info(`Created ${chunks.length} chunks from update`)
      for (const chunk of chunks) {
        await this.createAndBroadcastDocumentUpdateMessage(nodeMeta, chunk, metadata)
      }
    } else {
      await this.createAndBroadcastDocumentUpdateMessage(nodeMeta, encryptedContent, metadata)
    }

    metrics.docs_document_updates_total.increment({})
  }

  async sendDocumentUpdateMessage(nodeMeta: NodeMeta | PublicNodeMeta, rawContent: Uint8Array): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    // In Sheets, debouncing and merging updates before sending causes issues
    // with recalculating formulas, so we send updates immediately.
    if (this.documentType === 'sheet') {
      void this.prepareAndBroadcastDocumentUpdate(nodeMeta, rawContent)
      return
    }

    record.debouncer.addUpdates([new DecryptedValue(rawContent)])
  }

  async sendEventMessage(
    nodeMeta: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
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

    const metadata: EncryptionMetadata | AnonymousEncryptionMetadata = {
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
      version: ClientEventVersion.V1,
    }

    const encryptedContent = await this.encryptMessage(rawContent, metadata, nodeMeta, keys, source)
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
    metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
    document: NodeMeta | PublicNodeMeta,
    keys: DocumentKeys | PublicDocumentKeys,
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

      this.logger.error('Unable to encrypt realtime message', result.getError())

      PostApplicationError(this.eventBus, {
        translatedError: message,
        translatedErrorTitle: message,
        irrecoverable: true,
      })

      throw new Error(`Unable to encrypt message: ${result.getError()}`)
    }

    return new Uint8Array(result.getValue())
  }

  async handleConnectionMessage(document: NodeMeta | PublicNodeMeta, data: Uint8Array): Promise<void> {
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

  private documentUpdateChunkState = createDocumentUpdateChunkState()

  async decryptAndPublishDocumentUpdate(
    update: DocumentUpdate,
    keys: DocumentKeys | PublicDocumentKeys,
    document: NodeMeta | PublicNodeMeta,
  ) {
    const decryptionResult = await this._decryptMessage.execute({
      message: update,
      documentContentKey: keys.documentContentKey,
      verify: false,
    })
    if (decryptionResult.isFailed()) {
      metrics.docs_document_updates_decryption_error_total.increment({
        source: 'realtime',
      })
      throw new Error(`Failed to decrypt document update: ${decryptionResult.getError()}`)
    }

    const decrypted = decryptionResult.getValue()

    if (isCompressedDocumentUpdate(decrypted.content)) {
      this.logger.info('Decompressing document update')
      const decompressedContent = decompressDocumentUpdate(decrypted.content)
      decrypted.content = decompressedContent
    }

    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.DocumentUpdateMessage]>({
      type: WebsocketConnectionEvent.DocumentUpdateMessage,
      payload: {
        document,
        message: decrypted,
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
      const isReceivedUpdateFromOtherUser =
        doKeysBelongToAuthenticatedUser(keys) && update.authorAddress !== keys.userOwnAddress
      const isReceivedUpdateFromAnonymousUser = doKeysBelongToAuthenticatedUser(keys) && !update.authorAddress
      if (isReceivedUpdateFromOtherUser || isReceivedUpdateFromAnonymousUser) {
        this.switchToRealtimeMode(debouncer, 'receiving DU from other user')
      }

      const content = update.encryptedContent
      if (isDocumentUpdateChunk(content)) {
        await processDocumentUpdateChunk(content, {
          state: this.documentUpdateChunkState,
          onDocumentUpdateResolved: async ({ documentUpdate: updateContent }) => {
            const documentUpdate = new DocumentUpdate({
              encryptedContent: updateContent,
              version: update.version,
              timestamp: update.timestamp,
              authorAddress: update.authorAddress,
              uuid: update.uuid,
            })
            await this.decryptAndPublishDocumentUpdate(documentUpdate, keys, document)
          },
        })
      } else {
        await this.decryptAndPublishDocumentUpdate(update, keys, document)
      }
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
        case EventTypeEnum.ServerIsRequestingOtherServersToBroadcastParticipants:
        case EventTypeEnum.ServerIsInformingOtherServersOfTheParticipants:
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
          const decryptionResult = await this._decryptMessage.execute({
            message: event,
            documentContentKey: keys.documentContentKey,
            verify: false,
          })
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

  public closeConnection(
    document: { linkId: string },
    code: number = ConnectionCloseReason.CODES.NORMAL_CLOSURE,
  ): void {
    this.logger.info('Closing connection')

    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    void record.connection.disconnect(code)
  }
}
