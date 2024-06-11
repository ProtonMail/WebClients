import { DocumentKeys } from '@proton/drive-store'
import { WebsocketConnection } from './WebsocketConnection'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { EncryptMessage } from '../UseCase/EncryptMessage'
import { LoggerInterface } from '@proton/utils/logs'

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
    jest.clearAllMocks()
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

  it('should disconnect websocket when offline browser event is triggered', async () => {
    const fn = (connection.disconnect = jest.fn())

    window.dispatchEvent(new Event('offline'))

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (fn.mock.calls.length > 0) {
          clearInterval(interval)
          resolve()
        }
      }, 10)
    })

    expect(connection.disconnect).toHaveBeenCalled()
  })

  it('should connect websocket when online browser event is triggered', async () => {
    const fn = (connection.connect = jest.fn())

    window.dispatchEvent(new Event('online'))

    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (fn.mock.calls.length > 0) {
          clearInterval(interval)
          resolve()
        }
      }, 10)
    })

    expect(connection.connect).toHaveBeenCalled()
  })
})
