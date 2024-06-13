import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { EventTypeEnum } from '@proton/docs-proto'
import { LoggerInterface } from '@proton/utils/logs'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { WebsocketService } from './WebsocketService'
import { BroadcastSource, InternalEventBusInterface, WebsocketConnectionEvent } from '@proton/docs-shared'
import { Result } from '../../Domain/Result/Result'
import { EncryptionMetadata } from '../../Types/EncryptionMetadata'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'

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
      keys: {
        userOwnAddress: 'foo',
      },
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('sendDocumentUpdateMessage', () => {
    it('should encrypt document update message', async () => {
      const encryptMock = (service.encryptMessage = jest.fn())

      await service.sendDocumentUpdateMessage({} as NodeMeta, new Uint8Array(), BroadcastSource.AwarenessUpdateHandler)

      expect(encryptMock).toHaveBeenCalled()
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
