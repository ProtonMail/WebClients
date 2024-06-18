import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { EventTypeEnum, ServerMessageWithDocumentUpdates, ServerMessageWithEvents } from '@proton/docs-proto'
import { LoggerInterface } from '@proton/utils/logs'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { WebsocketService } from './WebsocketService'
import {
  BroadcastSource,
  InternalEventBusInterface,
  WebsocketConnectionEvent,
  WebsocketConnectionInterface,
} from '@proton/docs-shared'
import { DocumentUpdateBuffer } from './DocumentUpdateBuffer'
import { Result } from '../../Domain/Result/Result'
import { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
import { DocumentConnectionRecord } from './DocumentConnectionRecord'

describe('WebsocketService', () => {
  let service: WebsocketService
  let eventBus: InternalEventBusInterface
  let encryptMessage: EncryptMessage
  let buffer: DocumentUpdateBuffer
  let connection: WebsocketConnectionInterface
  let record: DocumentConnectionRecord

  const createService = () => {
    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<InternalEventBusInterface>

    encryptMessage = {
      execute: jest.fn().mockReturnValue(Result.ok(stringToUint8Array('123'))),
    } as unknown as jest.Mocked<EncryptMessage>

    service = new WebsocketService(
      {} as jest.Mocked<GetRealtimeUrlAndToken>,
      encryptMessage,
      {
        execute: jest.fn().mockReturnValue(Result.ok(stringToUint8Array('123'))),
      } as unknown as jest.Mocked<DecryptMessage>,
      {
        info: jest.fn(),
      } as unknown as jest.Mocked<LoggerInterface>,
      eventBus,
    )
  }

  beforeEach(() => {
    createService()

    connection = {
      broadcastMessage: jest.fn(),
    } as unknown as WebsocketConnectionInterface

    buffer = {
      addUpdate: jest.fn(),
    } as unknown as DocumentUpdateBuffer

    record = {
      connection,
      keys: {
        userOwnAddress: 'foo',
      } as DocumentKeys,
      buffer,
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

      expect(buffer.addUpdate).toHaveBeenCalled()
    })
  })

  describe('handleDocumentUpdateBufferFlush', () => {
    it('should encrypt updates', async () => {
      const encryptMock = (service.encryptMessage = jest.fn())

      await service.handleDocumentUpdateBufferFlush({} as NodeMeta, new Uint8Array())

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should broadcast message', async () => {
      await service.handleDocumentUpdateBufferFlush({} as NodeMeta, new Uint8Array())

      expect(connection.broadcastMessage).toHaveBeenCalled()
    })
  })

  describe('handleWindowUnload', () => {
    beforeEach(() => {
      service.destroy()

      createService()

      service.createConnection({ linkId: '123' } as NodeMeta, {} as DocumentKeys, { commitId: () => undefined })

      buffer = service.getConnectionRecord('123')!.buffer
    })

    it('should not prevent leaving if no unsaved changes', async () => {
      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('should prevent leaving if unsaved changes', async () => {
      buffer.addUpdate(new Uint8Array())

      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it('should immediately flush a buffer that has pending changes', async () => {
      buffer.flush = jest.fn()

      buffer.addUpdate(new Uint8Array())

      const event = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent

      service.handleWindowUnload(event)

      expect(buffer.flush).toHaveBeenCalled()
    })
  })

  describe('flushPendingUpdates', () => {
    beforeEach(() => {
      service.destroy()

      createService()

      service.createConnection({ linkId: '123' } as NodeMeta, {} as DocumentKeys, { commitId: () => undefined })

      buffer = service.getConnectionRecord('123')!.buffer
    })

    it('should immediately flush a buffer that has pending changes', async () => {
      buffer.flush = jest.fn()

      buffer.addUpdate(new Uint8Array())

      service.flushPendingUpdates()

      expect(buffer.flush).toHaveBeenCalled()
    })
  })

  describe('sendEventMessage', () => {
    it('should encrypt event message', async () => {
      const encryptMock = (service.encryptMessage = jest.fn().mockReturnValue(stringToUint8Array('123')))

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUint8Array('123'),
        EventTypeEnum.ClientHasSentACommentMessage,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should ignore sending ClientIsBroadcastingItsPresenceState event if not in realtime mode', async () => {
      Object.defineProperty(buffer, 'isBufferEnabled', { value: true })

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUint8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).not.toHaveBeenCalled()
    })

    it('should send ClientIsBroadcastingItsPresenceState event if in realtime mode', async () => {
      Object.defineProperty(buffer, 'isBufferEnabled', { value: false })

      await service.sendEventMessage(
        {} as NodeMeta,
        stringToUint8Array('123'),
        EventTypeEnum.ClientIsBroadcastingItsPresenceState,
        BroadcastSource.AwarenessUpdateHandler,
      )

      expect(connection.broadcastMessage).toHaveBeenCalled()
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
  })

  describe('encryptMessage', () => {
    it('should publish encryption error event if failed to encrypt', async () => {
      const document = {} as NodeMeta

      encryptMessage.execute = jest.fn().mockReturnValue(Result.fail('error'))

      const spy = (eventBus.publish = jest.fn())

      try {
        await service.encryptMessage(
          stringToUint8Array('123'),
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
