import { DocumentKeys } from '@proton/drive-store'
import { WebsocketConnection } from './WebsocketConnection'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { EncryptMessage } from '../UseCase/EncryptMessage'
import { LoggerInterface } from '@standardnotes/utils'

describe('WebsocketConnection', () => {
  let connection: WebsocketConnection

  beforeEach(() => {
    connection = new WebsocketConnection(
      {} as DocumentKeys,
      {} as WebsocketCallbacks,
      {} as EncryptMessage,
      {} as LoggerInterface,
    )
  })

  afterEach(() => {
    connection.destroy()
  })

  it('should correctly format url without commit id', () => {
    const expectedResult = 'wss://realtime.darwin.proton.black/websockets/?token=123'

    const result = connection.buildUrl({
      serverUrl: 'wss://realtime.darwin.proton.black/websockets',
      token: '123',
      commitId: undefined,
    })

    expect(result).toEqual(expectedResult)
  })

  it('should correctly format url with commit id', () => {
    const expectedResult = 'wss://realtime.darwin.proton.black/websockets/?token=123&commitId=456'

    const result = connection.buildUrl({
      serverUrl: 'wss://realtime.darwin.proton.black/websockets',
      token: '123',
      commitId: '456',
    })

    expect(result).toEqual(expectedResult)
  })
})
