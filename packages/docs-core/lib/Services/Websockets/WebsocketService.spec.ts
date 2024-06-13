import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import {
  ClientMessageWithDocumentUpdates,
  ClientMessageWithEvents,
  DocumentUpdate,
  DocumentUpdateArray,
  Event,
} from '@proton/docs-proto'
import { LoggerInterface } from '@proton/utils/logs'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { WebsocketService } from './WebsocketService'
import { BroadcastSources, InternalEventBusInterface, WebsocketConnectionEvent } from '@proton/docs-shared'
import { Result } from '../../Domain/Result/Result'

describe('WebsocketService', () => {
  let service: WebsocketService
  let eventBus: InternalEventBusInterface
  let encryptMessage: EncryptMessage

  beforeEach(() => {
    eventBus = {} as jest.Mocked<InternalEventBusInterface>
    encryptMessage = {} as jest.Mocked<EncryptMessage>

    service = new WebsocketService(
      {} as jest.Mocked<GetRealtimeUrlAndToken>,
      encryptMessage,
      {} as jest.Mocked<DecryptMessage>,
      {} as jest.Mocked<LoggerInterface>,
      eventBus,
    )

    service.getConnectionRecord = jest.fn().mockReturnValue({
      connection: {
        broadcastMessage: jest.fn(),
      },
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('sendMessageToDocument', () => {
    it('should encrypt document update message', async () => {
      const message = new ClientMessageWithDocumentUpdates({
        updates: new DocumentUpdateArray({
          documentUpdates: [new DocumentUpdate()],
        }),
      })

      const encryptMock = (service.encryptMessage = jest.fn())

      await service.sendMessageToDocument({} as NodeMeta, message, BroadcastSources.AwarenessUpdateHandler)

      expect(encryptMock).toHaveBeenCalled()
    })

    it('should encrypt event message', async () => {
      const message = new ClientMessageWithEvents({
        events: [new Event()],
      })

      const encryptMock = (service.encryptMessage = jest.fn())

      await service.sendMessageToDocument({} as NodeMeta, message, BroadcastSources.AwarenessUpdateHandler)

      expect(encryptMock).toHaveBeenCalled()
    })
  })

  describe('encryptMessage', () => {
    it('should publish encryption error event if failed to encrypt', async () => {
      const message = new DocumentUpdate()
      const document = {} as NodeMeta

      encryptMessage.execute = jest.fn().mockReturnValue(Result.fail('error'))

      const spy = (eventBus.publish = jest.fn())

      try {
        await service.encryptMessage(message, document, {} as DocumentKeys)
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
