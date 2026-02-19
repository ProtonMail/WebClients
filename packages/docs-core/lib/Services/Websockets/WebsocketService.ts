import { utf8StringToUint8Array, uint8ArrayToUtf8String } from '@proton/crypto/lib/utils'
import type { DocumentKeys, NodeMeta, PublicNodeMeta, PublicDocumentKeys } from '@proton/drive-store'
import type { EncryptMessage } from '../../UseCase/EncryptMessage'
import type { AnonymousEncryptionMetadata, EncryptionMetadata } from '../../Types/EncryptionMetadata'
import type { LoggerInterface } from '@proton/utils/logs'
import { WebsocketConnection } from '../../Realtime/WebsocketConnection'
import type { InternalEventBusInterface, WebsocketConnectionInterface, WebsocketCallbacks } from '@proton/docs-shared'
import {
  BroadcastSource,
  ProcessedIncomingRealtimeEventMessage,
  assertUnreachableAndLog,
  GenerateUUID,
  ConnectionType,
} from '@proton/docs-shared'
import type { FetchRealtimeToken } from '../../UseCase/FetchRealtimeToken'
import type { WebsocketServiceInterface } from './WebsocketServiceInterface'
import metrics from '@proton/metrics'
import type {
  ServerMessageWithEvents,
  ServerMessageWithDocumentUpdates,
  ServerMessageWithMessageAcks,
  ConnectionReadyPayload,
} from '@proton/docs-proto'
import {
  CreateDocumentUpdate,
  DocumentUpdate,
  ClientMessage,
  ServerMessage,
  ServerMessageType,
  EventTypeEnum,
  EventType,
  CreateClientEventMessage,
  ClientEventVersion,
  CreateDocumentUpdateMessage,
  DocumentUpdateVersion,
  ConnectionCloseReason,
  DecryptedValue,
} from '@proton/docs-proto'
import { c } from 'ttag'
import type { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { AckLedger } from './AckLedger/AckLedger'
import type { AckLedgerInterface } from './AckLedger/AckLedgerInterface'
import type { WebsocketConnectionEventPayloads } from '../../Realtime/WebsocketEvent/WebsocketConnectionEventPayloads'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import { UpdateDebouncerEventType } from './Debouncer/UpdateDebouncerEventType'
import { DocumentDebounceMode } from './Debouncer/DocumentDebounceMode'
import { ApplicationEvent, PostApplicationError } from '../../Application/ApplicationEvent'
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
import type { DocSizeTracker } from '../../SizeTracker/SizeTracker'
import { tmpConvertOldDocTypeToNew } from '../../utils/convert-doc-type'
import { traceError } from '@proton/shared/lib/helpers/sentry'
import { seconds_to_ms } from '../../Util/time-utils'
import type { APP_NAMES } from '@proton/shared/lib/constants'

type LinkID = string

const MAX_MS_TO_WAIT_FOR_RTS_READY_MESSAGE = 5_000
const MAX_ATTEMPTS_TO_RECEIVE_RTS_READY_MESSAGE = 3

export class WebsocketService implements WebsocketServiceInterface {
  private connections: Record<LinkID, DocumentConnectionRecord> = {}
  readonly ledger: AckLedgerInterface = new AckLedger(this.logger, this.handleLedgerStatusChangeCallback.bind(this))

  readonly knownUpdateUUIDs: Set<string> = new Set()
  private knownUpdatesSkipped = 0

  documentType: DocumentType = 'doc'
  setDocumentType(type: DocumentType): void {
    this.documentType = type
  }

  destroyed = false

  connectionReadyTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  connectionNotReadyRetryTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  attemptsAfterFailingToReceiveReadyMessage = 0

  constructor(
    private _createRealtimeValetToken: FetchRealtimeToken,
    private _encryptMessage: EncryptMessage,
    private _decryptMessage: DecryptMessage,
    private logger: LoggerInterface,
    private eventBus: InternalEventBusInterface,
    private metricService: MetricService,
    private appName: APP_NAMES,
    private appVersion: string,
    private unleashClient: UnleashClient,
    readonly sizeTracker: DocSizeTracker,
    readonly visibility: 'public' | 'private',
  ) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  destroy(): void {
    window.removeEventListener('beforeunload', this.handleWindowUnload)
    this.ledger.destroy()

    this.eventBus.publish({
      type: WebsocketConnectionEvent.Destroyed,
      payload: undefined,
    })

    for (const { debouncer, connection } of Object.values(this.connections)) {
      debouncer.destroy()
      connection.destroy()
    }

    this.connections = {}
    this.destroyed = true
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

  publishSavingEvent(document: NodeMeta | PublicNodeMeta): void {
    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.Saving]>({
      type: WebsocketConnectionEvent.Saving,
      payload: {
        document,
      },
    })
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

      onOpen: (connectionType) => {
        this.eventBus.publish<
          WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady]
        >({
          type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
          payload: {
            document: nodeMeta,
          },
        })

        this.connectionReadyTimeout = setTimeout(() => {
          const timeoutType =
            connectionType === ConnectionType.RetryDueToNotReceivingReadyMessage ? 'retry-timeout' : 'first-timeout'
          this.logger.warn(
            `Connection established but no ready message received from RTS in a reasonable time (${timeoutType})`,
          )
          metrics.docs_connection_ready_total.increment({
            type: timeoutType,
            visibility: this.visibility,
            docType: tmpConvertOldDocTypeToNew(this.documentType),
          })
          traceError('Did not receive RTS ready message in time', {
            extra: {
              docType: tmpConvertOldDocTypeToNew(this.documentType),
              docVisibility: this.visibility,
            },
          })

          if (this.attemptsAfterFailingToReceiveReadyMessage >= MAX_ATTEMPTS_TO_RECEIVE_RTS_READY_MESSAGE) {
            this.logger.error('Max attempts to receive RTS ready message reached, closing connection')
            this.closeConnection(nodeMeta, undefined, true)
            return
          }

          this.attemptsAfterFailingToReceiveReadyMessage++
          clearTimeout(this.connectionNotReadyRetryTimeout)

          this.closeConnection(nodeMeta, undefined, true)
          const reconnectDelay = Math.min(
            Math.pow(2, this.attemptsAfterFailingToReceiveReadyMessage) * 1000,
            seconds_to_ms(32),
          )
          const MinimumJitterFactor = 1
          const MaximumJitterFactor = 1.5
          const jitterFactor = Math.random() * (MaximumJitterFactor - MinimumJitterFactor) + MinimumJitterFactor
          const reconnectDelayWithJitterFactor = reconnectDelay * jitterFactor
          this.logger.info(`Retrying connection in ${reconnectDelayWithJitterFactor}ms`)
          this.connectionNotReadyRetryTimeout = setTimeout(() => {
            void this.connectToDocument(nodeMeta, {
              invalidateTokenCache: false,
              connectionType: ConnectionType.RetryDueToNotReceivingReadyMessage,
            })
          }, reconnectDelayWithJitterFactor)
        }, MAX_MS_TO_WAIT_FOR_RTS_READY_MESSAGE)
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
        if (reason.props.code === ConnectionCloseReason.CODES.READ_ONLY_MODE_REQUIRED) {
          this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.NeedsToBeInReadonlyMode]>({
            type: WebsocketConnectionEvent.NeedsToBeInReadonlyMode,
            payload: {
              document: nodeMeta,
            },
          })
        }
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
        } else if (errorCode === DocsApiErrorCode.NeedsReadonlyMode) {
          this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.NeedsToBeInReadonlyMode]>({
            type: WebsocketConnectionEvent.NeedsToBeInReadonlyMode,
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
      this.appName,
      this.appVersion,
    )

    const debouncer = new UpdateDebouncer(nodeMeta, this.logger, (event) => {
      if (event.type === UpdateDebouncerEventType.DidFlush) {
        void this.prepareAndBroadcastDocumentUpdate(nodeMeta, event.mergedUpdate, async (_, content, metadata) => {
          await this.createAndBroadcastDocumentUpdateMessage(nodeMeta, content, metadata)
        })
      } else if (event.type === UpdateDebouncerEventType.WillFlush) {
        this.publishSavingEvent(nodeMeta)
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

  onDocumentConnectionReadyToBroadcast(record: DocumentConnectionRecord, content: Uint8Array<ArrayBuffer>): void {
    this.logger.info('Received ready to broadcast message from RTS')

    if (this.connectionReadyTimeout) {
      clearTimeout(this.connectionReadyTimeout)
      this.connectionReadyTimeout = undefined
    }
    if (this.connectionNotReadyRetryTimeout) {
      clearTimeout(this.connectionNotReadyRetryTimeout)
      this.connectionNotReadyRetryTimeout = undefined
    }

    record.connection.markAsReadyToAcceptMessages()
    record.debouncer.markAsReadyToFlush()

    let readinessInformation: ConnectionReadyPayload | undefined
    try {
      const parsed = JSON.parse(uint8ArrayToUtf8String(content))
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

    const successType =
      record.connection.connectionType === ConnectionType.RetryDueToNotReceivingReadyMessage
        ? 'retry-success'
        : 'first-success'
    this.logger.info(`Connection ready (${successType})`)
    metrics.docs_connection_ready_total.increment({
      type: successType,
      visibility: this.visibility,
      docType: tmpConvertOldDocTypeToNew(this.documentType),
    })

    this.attemptsAfterFailingToReceiveReadyMessage = 0

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

    for (const update of failedUpdates) {
      const message = CreateDocumentUpdateMessage(update)

      const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })

      const binary = messageWrapper.serializeBinary() as Uint8Array<ArrayBuffer>

      this.logger.info(`Broadcasting failed document update of size: ${binary.byteLength} bytes`)

      void record.connection.broadcastMessage(binary, BroadcastSource.RetryingMessagesAfterReconnect)

      metrics.docs_document_updates_total.increment({})
    }
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

  async connectToDocument(
    nodeMeta: NodeMeta | PublicNodeMeta,
    options: { invalidateTokenCache: boolean; connectionType?: ConnectionType },
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    await record.connection.connect(undefined, options)
  }

  async createAndBroadcastDocumentUpdateMessage(
    nodeMeta: NodeMeta | PublicNodeMeta,
    content: Uint8Array<ArrayBuffer>,
    metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    const uuid = GenerateUUID()

    const documentUpdate = CreateDocumentUpdate({
      content: content,
      uuid: uuid,
      ...metadata,
    })

    /* What's committed to actual DB is an array of `DocumentUpdate`s, so we only track the size of this
    instead of the message wrapper  */
    const size = documentUpdate.serializeBinary().byteLength
    this.sizeTracker.incrementSize(size)
    this.knownUpdateUUIDs.add(uuid)

    if (!this.sizeTracker.canPostUpdateOfSize(size)) {
      return
    }

    const message = CreateDocumentUpdateMessage(documentUpdate)

    const messageWrapper = new ClientMessage({ documentUpdatesMessage: message })
    const binary = messageWrapper.serializeBinary() as Uint8Array<ArrayBuffer>

    this.logger.info(`Broadcasting document update message for ${uuid} of size: ${binary.byteLength} bytes`)

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
    updateContentBeforeCompressionAndChunking: Uint8Array<ArrayBuffer>,
    broadcastUpdate: (
      isChunk: boolean,
      content: Uint8Array<ArrayBuffer>,
      metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
    ) => Promise<void>,
    source?: BroadcastSource,
  ): Promise<void> {
    let update = updateContentBeforeCompressionAndChunking
    if (isDocumentUpdateCompressionEnabled(this.unleashClient, this.documentType)) {
      update = compressDocumentUpdate(updateContentBeforeCompressionAndChunking)
      this.logger.info(
        `Compressed merged update from ${updateContentBeforeCompressionAndChunking.byteLength} bytes to ${update.byteLength} bytes`,
      )
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

    this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.WillPublishDocumentUpdate]>({
      type: WebsocketConnectionEvent.WillPublishDocumentUpdate,
      payload: {
        document: nodeMeta,
        content: updateContentBeforeCompressionAndChunking, // We don't compressed content here as this will be stored locally for version history + debug purposes
        timestamp: metadata.timestamp,
        authorAddress: metadata.authorAddress ?? '',
      },
    })

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
        if (source === BroadcastSource.SheetsImport) {
          this.eventBus.publish({
            type: ApplicationEvent.SheetsImportErrorOccurred,
            payload: undefined,
          })
          return
        }
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
        await broadcastUpdate(true, chunk, metadata)
      }
    } else {
      await broadcastUpdate(false, encryptedContent, metadata)
    }

    metrics.docs_document_updates_total.increment({})
  }

  async handleInitialConversionContent(
    document: NodeMeta | PublicNodeMeta,
    content: Uint8Array<ArrayBuffer>,
    createInitialCommit: (content: DocumentUpdate) => void,
  ): Promise<void> {
    void this.prepareAndBroadcastDocumentUpdate(document, content, async (isChunk, encryptedContent, metadata) => {
      if (isChunk) {
        await this.createAndBroadcastDocumentUpdateMessage(document, encryptedContent, metadata)
      } else {
        const uuid = GenerateUUID()
        const documentUpdate = CreateDocumentUpdate({
          content: encryptedContent,
          uuid: uuid,
          ...metadata,
        })
        createInitialCommit(documentUpdate)
      }
    })
  }

  async sendDocumentUpdateMessage(
    nodeMeta: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array<ArrayBuffer>,
    source: BroadcastSource,
    uuid?: string,
  ): Promise<void> {
    const record = this.getConnectionRecord(nodeMeta.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    // In Sheets, debouncing and merging updates before sending causes issues
    // with recalculating formulas, so we send updates immediately.
    if (this.documentType === 'sheet') {
      this.publishSavingEvent(nodeMeta)
      void this.prepareAndBroadcastDocumentUpdate(
        nodeMeta,
        rawContent,
        async (_, content, metadata) => {
          await this.createAndBroadcastDocumentUpdateMessage(nodeMeta, content, metadata)
          if (uuid) {
            this.eventBus.publish<WebsocketConnectionEventPayloads[WebsocketConnectionEvent.ImportUpdateSuccessful]>({
              type: WebsocketConnectionEvent.ImportUpdateSuccessful,
              payload: {
                document: nodeMeta,
                uuid: uuid,
              },
            })
          }
        },
        source,
      )
      return
    }

    record.debouncer.addUpdates([new DecryptedValue(rawContent)])
  }

  async sendEventMessage(
    nodeMeta: NodeMeta | PublicNodeMeta,
    rawContent: Uint8Array<ArrayBuffer>,
    type: EventTypeEnum,
    source: BroadcastSource,
  ): Promise<void> {
    if (this.destroyed) {
      return
    }

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
    const binary = messageWrapper.serializeBinary() as Uint8Array<ArrayBuffer>

    this.logger.info(
      `Broadcasting event message of type: ${EventTypeEnum[type]} from source: ${source} size: ${binary.byteLength} bytes`,
    )

    void connection.broadcastMessage(binary, source)
  }

  async encryptMessage(
    content: Uint8Array<ArrayBuffer>,
    metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
    document: NodeMeta | PublicNodeMeta,
    keys: DocumentKeys | PublicDocumentKeys,
    source: BroadcastSource,
  ): Promise<Uint8Array<ArrayBuffer>> {
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

  async handleConnectionMessage(document: NodeMeta | PublicNodeMeta, data: Uint8Array<ArrayBuffer>): Promise<void> {
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

      const updateSize = update.serializeBinary().byteLength
      if (this.knownUpdateUUIDs.has(update.uuid)) {
        this.knownUpdatesSkipped += 1
        this.logger.info(
          `Skipping duplicate update of size ${updateSize} bytes. Total updates skipped: ${this.knownUpdatesSkipped}`,
        )
        continue
      }

      const content = update.encryptedContent as Uint8Array<ArrayBuffer>
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

      this.knownUpdateUUIDs.add(update.uuid)
      this.sizeTracker.incrementSize(updateSize)
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
          this.onDocumentConnectionReadyToBroadcast(record, event.content as Uint8Array<ArrayBuffer>)
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
              content: event.content as Uint8Array<ArrayBuffer>,
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

    const content = utf8StringToUint8Array(JSON.stringify({ authorAddress: keys.userOwnAddress }))

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
    preventAutoReconnectOnClose: boolean = false,
  ): void {
    this.logger.info('Closing connection')

    const record = this.getConnectionRecord(document.linkId)
    if (!record) {
      throw new Error('Connection not found')
    }

    if (preventAutoReconnectOnClose) {
      record.connection.preventAutoReconnectOnClose()
    }

    record.connection.disconnect(code)
  }
}
