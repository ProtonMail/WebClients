import { DebugConnection, WebsocketConnection, getWebSocketServerURL } from './WebsocketConnection'
import { WebsocketCallbacks } from './WebsocketCallbacks'
import { LoggerInterface } from '@proton/utils/logs'
import { Result } from '../Domain/Result/Result'

const setWindowLocationHref = (href: string) => {
  delete (window as any).location
  ;(window as any).location = new URL(href)
}

describe('WebsocketConnection', () => {
  let connection: WebsocketConnection

  beforeEach(() => {
    connection = new WebsocketConnection(
      {
        onFailToGetToken: jest.fn(),
      } as unknown as WebsocketCallbacks,
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

  it('should correctly format url', () => {
    const expectedResult = 'wss://docs-rts.darwin.proton.black/websockets/?token=123'

    const result = connection.buildConnectionUrl({
      serverUrl: 'wss://docs-rts.darwin.proton.black/websockets',
      token: '123',
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
    it('should call callbacks.onFailToGetToken if it fails', async () => {
      connection.destroy()

      const onFailToGetToken = jest.fn()

      connection = new WebsocketConnection(
        {
          getUrlAndToken: () => Result.fail('error'),
          onFailToGetToken: onFailToGetToken,
        } as unknown as WebsocketCallbacks,
        {
          error: jest.fn(),
          info: jest.fn(),
        } as unknown as LoggerInterface,
      )

      await connection.getTokenOrFailConnection()

      expect(onFailToGetToken).toHaveBeenCalled()

      connection.destroy()
    })
  })

  describe('getWebSocketServerURL', () => {
    test('should add docs-rts subdomain if there is no subdomain', () => {
      setWindowLocationHref('https://proton.me')
      expect(getWebSocketServerURL()).toBe('wss://docs-rts.proton.me/websockets')
    })

    test('should replace first subdomain with docs-rts', () => {
      setWindowLocationHref('https://docs-editor.proton.me')
      expect(getWebSocketServerURL()).toBe('wss://docs-rts.proton.me/websockets')
    })

    test('should replace first subdomain with docs-rts for multiple subdomains', () => {
      setWindowLocationHref('https://docs.hutton.proton.black')
      expect(getWebSocketServerURL()).toBe('wss://docs-rts.hutton.proton.black/websockets')
    })
  })
})
