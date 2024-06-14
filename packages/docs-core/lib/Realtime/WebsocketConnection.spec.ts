import { DebugConnection, WebsocketConnection } from './WebsocketConnection'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { LoggerInterface } from '@proton/utils/logs'
import { Result } from '../Domain/Result/Result'

describe('WebsocketConnection', () => {
  let connection: WebsocketConnection

  beforeEach(() => {
    connection = new WebsocketConnection(
      {} as WebsocketCallbacks,
      {
        error: jest.fn(),
      } as unknown as LoggerInterface,
    )
  })

  afterEach(() => {
    connection.destroy()
    jest.clearAllMocks()
  })

  describe('DebugConnection', () => {
    it('should not be enabled', () => {
      expect(DebugConnection.enabled).toBe(false)
    })
  })

  it('should correctly format url without commit id', () => {
    const expectedResult = 'wss://realtime.darwin.proton.black/websockets/?token=123'

    const result = connection.buildConnectionUrl({
      serverUrl: 'wss://realtime.darwin.proton.black/websockets',
      token: '123',
      commitId: undefined,
    })

    expect(result).toEqual(expectedResult)
  })

  it('should correctly format url with commit id', () => {
    const expectedResult = 'wss://realtime.darwin.proton.black/websockets/?token=123&commitId=456'

    const result = connection.buildConnectionUrl({
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

    connection.state.getBackoff = jest.fn().mockReturnValue(0)

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

  describe('getTokenOrFailConnection', () => {
    it('should call callbacks.onFailToConnect if it fails', async () => {
      connection.destroy()

      const failToConnect = jest.fn()

      connection = new WebsocketConnection(
        {
          getUrlAndToken: () => Result.fail('error'),
          onFailToConnect: failToConnect,
        } as unknown as WebsocketCallbacks,
        {
          error: jest.fn(),
          info: jest.fn(),
        } as unknown as LoggerInterface,
      )

      await connection.getTokenOrFailConnection()

      expect(failToConnect).toHaveBeenCalled()

      connection.destroy()
    })
  })
})
