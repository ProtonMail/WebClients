import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { ServerMessageWithDocumentUpdates, ServerMessageWithEvents } from '@proton/docs-proto'
import { EventTypeEnum } from '@proton/docs-proto'
import type { LoggerInterface } from '@proton/utils/logs'
import type { GetRealtimeUrlAndToken } from '../../UseCase/CreateRealtimeValetToken'
import type { DecryptMessage } from '../../UseCase/DecryptMessage'
import type { EncryptMessage } from '../../UseCase/EncryptMessage'
import { WebsocketService } from './WebsocketService'
import type { InternalEventBusInterface, WebsocketConnectionInterface } from '@proton/docs-shared'
import { BroadcastSource } from '@proton/docs-shared'
import { Result } from '../../Domain/Result/Result'
import type { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import type { DocumentConnectionRecord } from './DocumentConnectionRecord'
import { WebsocketConnectionEvent } from '../../Realtime/WebsocketEvent/WebsocketConnectionEvent'
import type { UpdateDebouncer } from './Debouncer/UpdateDebouncer'
import { DocumentDebounceMode } from './Debouncer/DocumentDebounceMode'

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

  const createService = () => {
    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<InternalEventBusInterface>

    encryptMessage = {
      execute: jest.fn().mockReturnValue(Result.ok(stringToUtf8Array('123'))),
    } as unknown as jest.Mocked<EncryptMessage>

    logger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerInterface>

    service = new WebsocketService(
      {} as jest.Mocked<GetRealtimeUrlAndToken>,
      encryptMessage,
      {
        execute: jest.fn().mockReturnValue(Result.ok(stringToUtf8Array('123'))),
      } as unknown as jest.Mocked<DecryptMessage>,
      logger,
      eventBus,
      '0.0.0.0',
    )
  }

  beforeEach(() => {
    createService()

    connection = {
      broadcastMessage: jest.fn(),
      markAsReadyToAcceptMessages: jest.fn(),
      canBroadcastMessages: jest.fn().mockReturnValue(true),
    } as unknown as WebsocketConnectionInterface

    debouncer = {
      addUpdate: jest.fn(),
      getMode: jest.fn(),
      markAsReadyToFlush: jest.fn(),
    } as unknown as UpdateDebouncer

    record = {
      connection,
      keys: {
        userOwnAddress: 'foo',
      } as DocumentKeys,
      debouncer: debouncer,
      document: {} as NodeMeta,
    }

    service.getConnectionRecord = jest.fn().mockReturnValue(record)
  })

  afterEach(() => {
    jest.resetAllMocks()

    service.destroy()
  })

  describe('sendDocumentUpdateMessage', () => {
    it('should add to buffer', async () => {
      await service.sendDocumentUpdateMessage({} as NodeMeta, new Uint8Array())

      expect(debouncer.addUpdate).toHaveBeenCalled()
    })
  })

  describe('handleDocumentUpdateBufferFlush', () => {
    it('should encrypt updates', async () => {
      const encryptMock = (service.encryptMessage = jest.fn())

      await service.handleDocumentUpdateDebouncerFlush({} as NodeMeta, new Uint8Array())

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should broadcast message', async () => {
      await service.handleDocumentUpdateDebouncerFlush({} as NodeMeta, new Uint8Array())

      expect(connection.broadcastMessage).toHaveBeenCalled()
    })

    it('should add message to ack ledger', async () => {
      service.ledger.messagePosted = jest.fn()

      await service.handleDocumentUpdateDebouncerFlush({} as NodeMeta, new Uint8Array())

      expect(service.ledger.messagePosted).toHaveBeenCalled()
    })
  })

  describe('onDocumentConnectionOpened', () => {
    it('should retry failed messages', async () => {
      service.retryFailedDocumentUpdatesForDoc = jest.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(service.retryFailedDocumentUpdatesForDoc).toHaveBeenCalled()
    })
  })

  describe('onDocumentConnectionReadyToBroadcast', () => {
    it('should mark connection as ready to broadcast', async () => {
      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(connection.markAsReadyToAcceptMessages).toHaveBeenCalled()
    })

    it('should mark debouncer as ready to flush', () => {
      debouncer.markAsReadyToFlush = jest.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(debouncer.markAsReadyToFlush).toHaveBeenCalled()
    })

    it('should retry failed document updates', () => {
      service.retryFailedDocumentUpdatesForDoc = jest.fn()

      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)

      expect(service.retryFailedDocumentUpdatesForDoc).toHaveBeenCalled()
    })

    it('should pass readiness information to eventBus', () => {
      service.onDocumentConnectionReadyToBroadcast(record, mockOnReadyContentPayload)
      expect(eventBus.publish).toHaveBeenCalledWith({
        type: WebsocketConnectionEvent.Connected,
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
        type: WebsocketConnectionEvent.Connected,
        payload: {
          document: record.document,
          readinessInformation: undefined,
        },
      })
    })
  })

  describe('retryAllFailedDocumentUpdates', () => {
    it('should get ledger unacknowledged updates', async () => {
      service.ledger.getUnacknowledgedUpdates = jest.fn().mockReturnValue([])

      service.retryFailedDocumentUpdatesForDoc({ linkId: '123' } as NodeMeta)

      expect(service.ledger.getUnacknowledgedUpdates).toHaveBeenCalled()
    })
  })

  describe('handleWindowUnload', () => {
    beforeEach(() => {
      service.destroy()

      createService()

      service.createConnection({ linkId: '123' } as NodeMeta, {} as DocumentKeys, { commitId: () => undefined })

      debouncer = service.getConnectionRecord('123')!.debouncer
    })

    it('should not prevent leaving if no unsaved changes', async () => {
      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should prevent leaving if unsaved changes', async () => {
      debouncer.addUpdate(new Uint8Array())

      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should immediately flush a buffer that has pending changes', async () => {
      debouncer.flush = jest.fn()

      debouncer.addUpdate(new Uint8Array())

      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(debouncer.flush).toHaveBeenCalled()
    })

    it('should prevent leaving if unacked changes', async () => {
      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.ledger.hasConcerningMessages = jest.fn().mockReturnValue(true)

      service.handleWindowUnload(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('flushPendingUpdates', () => {
    beforeEach(() => {
      service.destroy()

      createService()

      service.createConnection({ linkId: '123' } as NodeMeta, {} as DocumentKeys, { commitId: () => undefined })

      debouncer = service.getConnectionRecord('123')!.debouncer
    })

    it('should immediately flush a buffer that has pending changes', async () => {
      debouncer.flush = jest.fn()

      debouncer.addUpdate(new Uint8Array())

      service.flushPendingUpdates()

      expect(debouncer.flush).toHaveBeenCalled()
    })
  })

  describe('sendEventMessage', () => {
    it('should encrypt event message', async () => {
      const encryptMock = (service.encryptMessage = jest.fn().mockReturnValue(stringToUtf8Array('123')))

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUtf8Array('123'),
        EventTypeEnum.ClientHasSentACommentMessage,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should ignore sending ClientIsBroadcastingItsPresenceState event if not in realtime mode', async () => {
      debouncer.getMode = jest.fn().mockReturnValue(DocumentDebounceMode.SinglePlayer)

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUtf8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })

    it('should ignore sending ClientHasSentACommentMessage event if not in realtime mode', async () => {
      debouncer.getMode = jest.fn().mockReturnValue(DocumentDebounceMode.SinglePlayer)

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUtf8Array('123'),
        EventTypeEnum.ClientHasSentACommentMessage,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })

    it('should send ClientIsBroadcastingItsPresenceState event if in realtime mode', async () => {
      Object.defineProperty(debouncer, 'isBufferEnabled', { value: false })

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUtf8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).toHaveBeenCalled()
    })

    it('should not broadcast if connection cannot send messages', async () => {
      connection.canBroadcastMessages = jest.fn().mockReturnValue(false)

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUtf8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })
  })

  describe('handleIncomingDocumentUpdatesMessage', () => {
    it('should put us into realtime mode if message is not ours', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = jest.fn())

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              authorAddress: 'bar',
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should not put us into realtime mode if message is ours', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = jest.fn())

      await service.handleIncomingDocumentUpdatesMessage(record, {
        updates: {
          documentUpdates: [
            {
              authorAddress: 'foo',
            },
          ],
        },
      } as unknown as ServerMessageWithDocumentUpdates)

      expect(switchToRealtimeMode).not.toHaveBeenCalled()
    })
  })

  describe('handleIncomingEventsMessage', () => {
    it('should switch to realtime mode if event includes ClientIsRequestingOtherClientsToBroadcastTheirState', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = jest.fn())

      const events = {
        events: [{ type: EventTypeEnum.ClientIsRequestingOtherClientsToBroadcastTheirState }],
      } as unknown as ServerMessageWithEvents

      await service.handleIncomingEventsMessage(record, events)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should switch to realtime mode if event includes ClientIsBroadcastingItsPresenceState', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = jest.fn())

      const events = {
        events: [{ type: EventTypeEnum.ClientIsBroadcastingItsPresenceState }],
      } as unknown as ServerMessageWithEvents

      await service.handleIncomingEventsMessage(record, events)

      expect(switchToRealtimeMode).toHaveBeenCalled()
    })

    it('should not switch to realtime mode for all other event types', async () => {
      const switchToRealtimeMode = (service.switchToRealtimeMode = jest.fn())

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
      const document = {} as NodeMeta

      encryptMessage.execute = jest.fn().mockReturnValue(Result.fail('error'))

      const spy = (eventBus.publish = jest.fn())

      try {
        await service.encryptMessage(
          stringToUtf8Array('123'),
          {} as EncryptionMetadata,
          document,
          {} as DocumentKeys,
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
