import type { Mocked } from 'vitest'
import { utf8StringToUint8Array } from '@protontech/crypto/utils'
import type { NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { DocumentKeys } from '@proton/docs-shared/CryptoTypes'
import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import type { WebsocketConnectionInterface } from '@proton/docs-shared/Realtime/WebsocketConnectionInterface'
import { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import { ConnectionType } from '@proton/docs-shared/Realtime/WebsocketConnectionInterface'
import { Result } from '@proton/docs-shared/Result'
import type {
  ServerMessageWithDocumentUpdates,
  ServerMessageWithEvents,
} from '@proton/docs-proto/Generated/ServerMessage'
import { DecryptedValue } from '@proton/docs-proto/DecryptedValue'
import { EventTypeEnum } from '@proton/docs-proto/Event/EventTypeEnum'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { FetchRealtimeToken } from '../../UseCase/FetchRealtimeToken'
import type { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { EncryptMessage } from '../../UseCase/EncryptMessage'
import { WebsocketService } from './WebsocketService'
import type { AnonymousEncryptionMetadata, EncryptionMetadata } from '../../Types/EncryptionMetadata'
import type { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import { DocumentDebounceMode } from './Debouncer/DocumentDebounceMode'
import type { PrivateKeyReference, SessionKey } from '@protontech/crypto'
import { MetricService } from '../Metrics/MetricService'
import type { DocumentStateValues } from '../../State/DocumentState'
import { DocumentState } from '../../State/DocumentState'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import { DocSizeTracker } from '../../SizeTracker/SizeTracker'

const mockOnReadyContentPayload = new TextEncoder().encode(
  JSON.stringify({ connectionId: '12345678', clientUpgradeRecommended: true, clientUpgradeRequired: true }),
)

describe('WebsocketService', () => {
  let service: WebsocketService
  let eventBus: InternalEventBusInterface
  let encryptMessage: EncryptMessage
  let debouncer: UpdateDebouncer
  let connection: WebsocketConnectionInterface
  let record: DocumentConnectionRecord
  let logger: LoggerInterface
  let document: NodeMeta
  let keys: DocumentKeys
  let metricService: MetricService

  const createService = async (mode: DocumentDebounceMode) => {
    if (service) {
      service.destroy()
    }

    if (debouncer) {
      debouncer.destroy()
    }

    metricService = new MetricService(vi.fn(), 'private')

    document = { linkId: 'link-id-123', volumeId: 'volume-id-456' } as NodeMeta

    keys = {
      documentContentKey: 'key-123' as unknown as SessionKey,
      userAddressPrivateKey: 'private-key-123' as unknown as PrivateKeyReference,
      userOwnAddress: 'foo',
    }

    const entitlements = {
      keys,
      nodeMeta: document,
    } as DocumentEntitlements

    const documentState = new DocumentState({
      ...DocumentState.defaults,
      entitlements,
    } as DocumentStateValues)

    eventBus = {
      publish: vi.fn(),
    } as unknown as Mocked<InternalEventBusInterface>

    encryptMessage = {
      execute: vi.fn().mockReturnValue(Result.ok(utf8StringToUint8Array('123'))),
    } as unknown as Mocked<EncryptMessage>

    logger = {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    } as unknown as Mocked<LoggerInterface>

    service = new WebsocketService(
      {} as Mocked<FetchRealtimeToken>,
      encryptMessage,
      {
        execute: vi.fn().mockReturnValue(
          Result.ok({
            content: new Uint8Array(),
          }),
        ),
      } as unknown as Mocked<DecryptMessage>,
      logger,
      eventBus,
      metricService,
      'proton-docs',
      '0.0.0.0',
      {
        isReady: vi.fn().mockReturnValue(true),
        isEnabled: vi.fn().mockReturnValue(true),
      } as unknown as Mocked<UnleashClient>,
      new DocSizeTracker(logger, eventBus),
      'private',
    )

    service.createConnection(documentState)

    record = service.getConnectionRecord('link-id-123')!

    debouncer = record.debouncer
    debouncer.setMode(mode)
    debouncer.markAsReadyToFlush()

    connection = record.connection
    connection.broadcastMessage = vi.fn()
    connection.canBroadcastMessages = vi.fn().mockReturnValue(true)
  }

  beforeEach(async () => {
    await createService(DocumentDebounceMode.Realtime)
  })

  afterEach(() => {
    vi.resetAllMocks()

    service.destroy()

    debouncer.destroy()
  })

  describe('createConnection', () => {
    it('should post ConnectionEstablishedButNotYetReady when connection is opened', async () => {
      connection.callbacks.onOpen(ConnectionType.Normal)

      expect(eventBus.publish).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.ConnectionEstablishedButNotYetReady,
        payload: {
          document: record.document,
        },
      })

      expect(service.connectionReadyTimeout).toBeDefined()
      clearTimeout(service.connectionReadyTimeout)
    })
  })

  describe('sendDocumentUpdateMessage', () => {
    it('should add to buffer', async () => {
      debouncer.addUpdates = vi.fn()

      await service.sendDocumentUpdateMessage(
        document,
        new Uint8Array(),
        BroadcastSource.HandleDocBeingUpdatedByLexical,
      )
      expect(debouncer.addUpdates).toHaveBeenCalled()
    })
  })

  describe('handleDocumentUpdateBufferFlush', () => {
    const broadcastUpdate = async (
      _: boolean,
      content: Uint8Array<ArrayBuffer>,
      metadata: EncryptionMetadata | AnonymousEncryptionMetadata,
    ) => {
      await service.createAndBroadcastDocumentUpdateMessage(document, content, metadata)
    }

    it('should encrypt updates', async () => {
      const encryptMock = (service.encryptMessage = vi.fn().mockResolvedValueOnce(new Uint8Array()))

      await service.prepareAndBroadcastDocumentUpdate(document, new Uint8Array(), broadcastUpdate)

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should broadcast message', async () => {
      await service.prepareAndBroadcastDocumentUpdate(document, new Uint8Array(), broadcastUpdate)

      expect(connection.broadcastMessage).toHaveBeenCalled()
    })

    it('should track size', async () => {
      const incrementSize = vi.spyOn(service.sizeTracker, 'incrementSize')

      await service.prepareAndBroadcastDocumentUpdate(document, new Uint8Array(), broadcastUpdate)

      expect(incrementSize).toHaveBeenCalled()
    })

    it('should track known update UUIDs', async () => {
      const knownUpdatesSize = service.knownUpdateUUIDs.size

      await service.prepareAndBroadcastDocumentUpdate(document, new Uint8Array(), broadcastUpdate)

      expect(service.knownUpdateUUIDs.size).toBeGreaterThan(knownUpdatesSize)
    })

    it('should add message to ack ledger', async () => {
      service.ledger.messagePosted = vi.fn()

      await service.prepareAndBroadcastDocumentUpdate(document, new Uint8Array(), broadcastUpdate)

      expect(service.ledger.messagePosted).toHaveBeenCalled()
    })
  })

  describe('onDocumentConnectionOpened', () => {
    it('should retry failed messages', async () => {
      service.retryFailedDocumentUpdatesForDoc = vi.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(service.retryFailedDocumentUpdatesForDoc).toHaveBeenCalled()
    })
  })

  describe('onDocumentConnectionReadyToBroadcast', () => {
    it('should mark connection as ready to broadcast', async () => {
      connection.markAsReadyToAcceptMessages = vi.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(connection.markAsReadyToAcceptMessages).toHaveBeenCalled()
    })

    it('should mark debouncer as ready to flush', () => {
      debouncer.markAsReadyToFlush = vi.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(debouncer.markAsReadyToFlush).toHaveBeenCalled()
    })

    it('should retry failed document updates', () => {
      service.retryFailedDocumentUpdatesForDoc = vi.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(service.retryFailedDocumentUpdatesForDoc).toHaveBeenCalled()
    })

    it('should pass readiness information to eventBus', () => {
      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)
      expect(eventBus.publish).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.ConnectedAndReady,
        payload: {
          document: record.document,
          readinessInformation: {
            connectionId: '12345678',
            clientUpgradeRecommended: true,
            clientUpgradeRequired: true,
          },
        },
      })
    })

    it('should log error and call eventBus if content is not parsable', () => {
      service.onDocumentConnectionReadyToBroadcast(record, new TextEncoder().encode('not parsable'))
      expect(logger.error).toHaveBeenCalledWith('Unable to parse content from ConnectionReady message')
      expect(eventBus.publish).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.ConnectedAndReady,
        payload: {
          document: record.document,
          readinessInformation: undefined,
        },
      })
    })
  })

  describe('retryAllFailedDocumentUpdates', () => {
    it('should get ledger unacknowledged updates', async () => {
      service.ledger.getUnacknowledgedUpdates = vi.fn().mockReturnValue([])

      service.retryFailedDocumentUpdatesForDoc(document)

      expect(service.ledger.getUnacknowledgedUpdates).toHaveBeenCalled()
    })
  })

  describe('handleWindowUnload', () => {
    it('should not prevent leaving if no unsaved changes', async () => {
      const event = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should prevent leaving if unsaved changes', async () => {
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      const event = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should immediately flush a buffer that has pending changes', async () => {
      debouncer.flush = vi.fn()

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      const event = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(debouncer.flush).toHaveBeenCalled()
    })

    it('should prevent leaving if unacked changes', async () => {
      const event = { preventDefault: vi.fn() } as unknown as BeforeUnloadEvent

      service.ledger.hasConcerningMessages = vi.fn().mockReturnValue(true)

      service.handleWindowUnload(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('flushPendingUpdates', () => {
    it('should immediately flush a buffer that has pending changes', async () => {
      debouncer.flush = vi.fn()

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      service.flushPendingUpdates()

      expect(debouncer.flush).toHaveBeenCalled()
    })
  })

  describe('sendEventMessage', () => {
    it('should encrypt event message', async () => {
      const encryptMock = (service.encryptMessage = vi.fn().mockReturnValue(utf8StringToUint8Array('123')))

      await service.sendEventMessage(
        document,
        utf8StringToUint8Array('123'),
        EventTypeEnum.ClientHasSentACommentMessage,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should ignore sending ClientIsBroadcastingItsPresenceState event if not in realtime mode', async () => {
      debouncer.getMode = vi.fn().mockReturnValue(DocumentDebounceMode.SinglePlayer)

      await service.sendEventMessage(
        document,
        utf8StringToUint8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })

    it('should ignore sending ClientHasSentACommentMessage event if not in realtime mode', async () => {
      debouncer.getMode = vi.fn().mockReturnValue(DocumentDebounceMode.SinglePlayer)

      await service.sendEventMessage(
        document,
        utf8StringToUint8Array('123'),
        EventTypeEnum.ClientHasSentACommentMessage,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })

    it('should send ClientIsBroadcastingItsPresenceState event if in realtime mode', async () => {
      Object.defineProperty(debouncer, 'isBufferEnabled', { value: false })

      await service.sendEventMessage(
        document,
        utf8StringToUint8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).toHaveBeenCalled()
    })

    it('should not broadcast if connection cannot send messages', async () => {
      connection.canBroadcastMessages = vi.fn().mockReturnValue(false)

      await service.sendEventMessage(
        document,
        utf8StringToUint8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })
  })

  describe('handleIncomingDocumentUpdatesMessage', () => {
    it('should put us into realtime mode if message is not ours', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = vi.fn())

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              encryptedContent: new Uint8Array(),
              authorAddress: 'bar',
              serializeBinary: vi.fn().mockReturnValue(new Uint8Array()),
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should not put us into realtime mode if message is ours', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = vi.fn())

      const incrementSize = vi.spyOn(service.sizeTracker, 'incrementSize')

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              encryptedContent: new Uint8Array(),
              authorAddress: 'foo',
              serializeBinary: vi.fn().mockReturnValue(new Uint8Array()),
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)
      expect(incrementSize).toHaveBeenCalledWith(new Uint8Array().byteLength)

      expect(switchToRealtimeMode).not.toHaveBeenCalled()
    })

    it('should not process updates with known UUIDs', async () => {
      const decryptAndPublishDocumentUpdate = vi.spyOn(service, 'decryptAndPublishDocumentUpdate')

      const incrementSize = vi.spyOn(service.sizeTracker, 'incrementSize')

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              encryptedContent: new Uint8Array(),
              authorAddress: 'foo',
              serializeBinary: vi.fn().mockReturnValue(new Uint8Array()),
              uuid: 'foo',
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)

      expect(service.knownUpdateUUIDs.has('foo')).toBe(true)

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              encryptedContent: new Uint8Array(),
              authorAddress: 'foo',
              serializeBinary: vi.fn().mockReturnValue(new Uint8Array()),
              uuid: 'foo',
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)

      expect(incrementSize).toHaveBeenCalledTimes(1)
      expect(decryptAndPublishDocumentUpdate).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleIncomingEventsMessage', () => {
    it('should switch to realtime mode if event includes ClientIsRequestingOtherClientsToBroadcastTheirState', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = vi.fn())

      const events = {
        events: [{ type: EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState }],
      } as unknown as ServerMessageWithEvents

      await service.handleIncomingEventsMessage(record, events)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should switch to realtime mode if event includes ClientIsBroadcastingItsPresenceState', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = vi.fn())

      const events = {
        events: [{ type: EventTypeEnum.ClientIsBroadcastingItsPresenceState }],
      } as unknown as ServerMessageWithEvents

      await service.handleIncomingEventsMessage(record, events)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should not switch to realtime mode for all other event types', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = vi.fn())

      const events = {
        events: [
          { type: EventTypeEnum.ServerIsRequestingClientToBroadcastItsState },
          { type: EventTypeEnum.ServerHasMoreOrLessGivenTheClientEverythingItHas },
          { type: EventTypeEnum.ServerIsPlacingEmptyActivityIndicatorInStreamToIndicateTheStreamIsStillActive },
          { type: EventTypeEnum.ClientIsDebugRequestingServerToPerformCommit },
          { type: EventTypeEnum.ClientHasSentACommentMessage },
          { type: EventTypeEnum.ServerIsInformingClientThatTheDocumentCommitHasBeenUpdated },
        ],
      } as unknown as ServerMessageWithEvents

      await service.handleIncomingEventsMessage(record, events)

      expect(switchToRealtimeMode).not.toHaveBeenCalled()
    })

    it('should markAsReadyToAcceptMessages on ServerIsReadyToAcceptClientMessages', async () => {
      const events = {
        events: [{ type: EventTypeEnum.ServerIsReadyToAcceptClientMessages }],
      } as unknown as ServerMessageWithEvents

      connection.markAsReadyToAcceptMessages = vi.fn()

      await service.handleIncomingEventsMessage(record, events)

      expect(connection.markAsReadyToAcceptMessages).toHaveBeenCalled()
    })
  })

  describe('handleLedgerStatusChangeCallback', () => {
    it('should post AckStatusChange event', () => {
      service.handleLedgerStatusChangeCallback()

      expect(eventBus.publish).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.AckStatusChange,
        payload: expect.anything(),
      })
    })
  })

  describe('encryptMessage', () => {
    it('should publish encryption error event if failed to encrypt', async () => {
      encryptMessage.execute = vi.fn().mockReturnValue(Result.fail('error'))

      const spy = (eventBus.publish = vi.fn())

      try {
        await service.encryptMessage(
          utf8StringToUint8Array('123'),
          {} as EncryptionMetadata,
          document,
          keys,
          BroadcastSource.AwarenessUpdateHandler,
        )
      } catch (error) {}

      expect(spy).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.EncryptionError,
        payload: {
          document,
          error: expect.any(String),
        },
      })
    })
  })
})
