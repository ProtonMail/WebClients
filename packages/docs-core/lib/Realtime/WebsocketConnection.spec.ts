import {
  DebugConnection,
  ReconnectionStopReason,
  TIME_TO_WAIT_BEFORE_CLOSING_CONNECTION_AFTER_DOCUMENT_HIDES,
  WebsocketConnection,
} from './WebsocketConnection'
import { getWebSocketServerURL } from './getWebSocketServerURL'
import type { LoggerInterface } from '@proton/utils/logs'
import type { WebsocketCallbacks } from '@proton/docs-shared'
import { ApiResult, Result } from '@proton/docs-shared'
import { MetricService } from '../Services/Metrics/MetricService'
import type { Api } from '@proton/shared/lib/interfaces'
import type { DocumentStateValues } from '../State/DocumentState'
import { DocumentState } from '../State/DocumentState'
import type { FetchRealtimeToken } from '../UseCase/FetchRealtimeToken'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'

const setWindowLocationHref = (href: string) => {
  delete (window as any).location
  ;(window as any).location = new URL(href)
}

describe('WebsocketConnection', () => {
  let connection: WebsocketConnection
  let metricService: MetricService
  let documentState: DocumentState

  beforeEach(() => {
    jest.spyOn(LoadLogger, 'logEventRelativeToLoadTime').mockImplementation(jest.fn())

    metricService = new MetricService({} as Api, 'private')
    documentState = new DocumentState({
      entitlements: {} as DocumentEntitlements,
    } as DocumentStateValues)

    connection = new WebsocketConnection(
      documentState,
      {
        onFailToGetToken: jest.fn(),
        onConnecting: jest.fn(),
      } as unknown as WebsocketCallbacks,
      {
        execute: jest.fn().mockResolvedValue(ApiResult.ok({ token: '123' })),
        docsApi: {} as Api,
      } as unknown as FetchRealtimeToken,
      metricService,
      {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      } as unknown as LoggerInterface,
      'proton-docs',
      '0.0.0.0',
    )

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    })
  })

  afterEach(() => {
    connection.destroy()
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('DebugConnection', () => {
    it('should not be enabled', () => {
      expect(DebugConnection.enabled).toBe(false)
    })
  })

  describe('handleVisibilityChangeEvent', () => {
    it('should queue reconnection with no delay if visibility state is visible', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      })

      const reconnect = (connection.queueReconnection = jest.fn())

      connection.handleVisibilityChangeEvent()

      expect(reconnect).toHaveBeenCalledWith({ skipDelay: true })
    })

    it('should queue disconnect if visibility state is hidden and socket is open', () => {
      jest.useFakeTimers()

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })

      const disconnect = (connection.disconnect = jest.fn())

      connection.handleVisibilityChangeEvent()

      jest.advanceTimersByTime(TIME_TO_WAIT_BEFORE_CLOSING_CONNECTION_AFTER_DOCUMENT_HIDES + 1)

      expect(disconnect).toHaveBeenCalled()
    })

    it('should cancel queued disconnect if visibility state is visible', () => {
      jest.useFakeTimers()

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })

      connection.handleVisibilityChangeEvent()

      expect(connection.closeConnectionDueToGoingAwayTimer).not.toBeUndefined()

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      })

      connection.handleVisibilityChangeEvent()

      expect(connection.closeConnectionDueToGoingAwayTimer).toBeUndefined()
    })

    it('should cancel reconnection timeout if present', () => {
      jest.useFakeTimers()

      connection.reconnectTimeout = setTimeout(() => {}, 1000)

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })

      connection.handleVisibilityChangeEvent()

      expect(connection.reconnectTimeout).toBeUndefined()
    })
  })

  describe('disconnect', () => {
    it('should cancel reconnection timeout if present', () => {
      jest.useFakeTimers()

      connection.reconnectTimeout = setTimeout(() => {}, 1000)

      connection.disconnect(1)

      expect(connection.reconnectTimeout).toBeUndefined()
    })

    describe('should not queue reconnection if last disconnect reason is document timeout until there is user activity', () => {
      beforeEach(() => {
        jest.useFakeTimers()

        connection.reconnectionStopped = ReconnectionStopReason.DocumentTimeout

        connection.queueReconnection = jest.fn()
        connection.callbacks.onFailToConnect = jest.fn()
        connection.handleSocketClose(3005, 'Document timeout')
      })

      it('should not queue reconnection immediately', () => {
        expect(connection.reconnectionStopped).toBe(ReconnectionStopReason.DocumentTimeout)
        expect(connection.queueReconnection).not.toHaveBeenCalled()
      })

      it('should not queue reconnection after some time', () => {
        jest.advanceTimersByTime(3000) // slightly more than 2 seconds, which is the base reconnection delay
        expect(connection.reconnectionStopped).toBe(ReconnectionStopReason.DocumentTimeout)
        expect(connection.queueReconnection).not.toHaveBeenCalled()
      })

      it('should queue reconnection on mouse move', () => {
        document.dispatchEvent(new Event('mousemove'))
        expect(connection.reconnectionStopped).toBe(undefined)
        expect(connection.queueReconnection).toHaveBeenCalledWith({ skipDelay: true })
      })

      it('should queue reconnection on key down', () => {
        connection.handleSocketClose(3005, 'Document timeout')
        jest.advanceTimersByTime(3000)
        expect(connection.reconnectionStopped).toBe(ReconnectionStopReason.DocumentTimeout)
        expect(connection.queueReconnection).not.toHaveBeenCalled()
        document.dispatchEvent(new Event('keydown'))
        expect(connection.reconnectionStopped).toBe(undefined)
        expect(connection.queueReconnection).toHaveBeenCalledWith({ skipDelay: true })
      })

      it('should queue reconnection on visibility change to visible', () => {
        connection.handleSocketClose(3005, 'Document timeout')
        jest.advanceTimersByTime(3000)
        expect(connection.reconnectionStopped).toBe(ReconnectionStopReason.DocumentTimeout)
        expect(connection.queueReconnection).not.toHaveBeenCalled()

        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
        })
        document.dispatchEvent(new Event('visibilitychange'))
        expect(connection.reconnectionStopped).toBe(ReconnectionStopReason.DocumentTimeout)
        expect(connection.queueReconnection).not.toHaveBeenCalled()

        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
        })
        document.dispatchEvent(new Event('visibilitychange'))
        expect(connection.reconnectionStopped).toBe(undefined)
        expect(connection.queueReconnection).toHaveBeenCalledWith({ skipDelay: true })
      })
    })

    describe('should queue reconnection normally if last disconnect reason is not document timeout', () => {
      beforeEach(() => {
        jest.useFakeTimers()

        connection.reconnectionStopped = undefined

        connection.queueReconnection = jest.fn()
        connection.callbacks.onFailToConnect = jest.fn()
        connection.handleSocketClose(1000, 'Some other error')
      })

      it('should queue reconnection normally', () => {
        expect(connection.reconnectionStopped).toBe(undefined)
        expect(connection.queueReconnection).toHaveBeenCalled()
      })
    })
  })

  describe('handleWindowCameOnlineEvent', () => {
    it('should reconnect without delay', () => {
      const reconnect = (connection.queueReconnection = jest.fn())

      connection.handleWindowCameOnlineEvent()

      expect(reconnect).toHaveBeenCalledWith({ skipDelay: true })
    })
  })

  describe('connect', () => {
    it('should not proceed if last visibility state is hidden', () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      })

      const getToken = (connection.getTokenOrFailConnection = jest.fn())

      void connection.connect()

      expect(getToken).not.toHaveBeenCalled()
    })

    it('should abort if abort signal returns true', async () => {
      const abortSignal = () => true

      connection.getTokenOrFailConnection = jest.fn().mockReturnValue(Result.ok({ token: '123' }))

      await connection.connect(abortSignal)

      expect(connection.callbacks.onConnecting).not.toHaveBeenCalled()
    })
  })

  describe('queueReconnection', () => {
    it('should reconnect with delay if skipDelay is not set', () => {
      jest.useFakeTimers()

      const connect = (connection.connect = jest.fn())

      connection.state.getReconnectDelay = jest.fn().mockReturnValue(1000)

      connection.queueReconnection()

      jest.advanceTimersByTime(500)

      expect(connect).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1000)

      expect(connect).toHaveBeenCalled()
    })

    it('should reconnect without delay if skipDelay is set', () => {
      jest.useFakeTimers()

      const connect = (connection.connect = jest.fn())

      connection.queueReconnection({ skipDelay: true })

      jest.advanceTimersByTime(1)

      expect(connect).toHaveBeenCalled()
    })
  })

  it('should correctly format url', () => {
    const expectedResult = 'wss://docs-rts.darwin.proton.black/websockets/?token=123&appversion=web-docs@0.0.0.0-dev'

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

    connection.state.getReconnectDelay = jest.fn().mockReturnValue(0)

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
        documentState,
        {
          getUrlAndToken: () => Result.fail('error'),
          onFailToGetToken: onFailToGetToken,
        } as unknown as WebsocketCallbacks,
        {
          execute: jest.fn().mockResolvedValue(
            ApiResult.fail({
              code: DocsApiErrorCode.CommitIdOutOfSync,
              message: 'error',
            }),
          ),
          docsApi: {} as Api,
        } as unknown as FetchRealtimeToken,
        metricService,
        {
          error: jest.fn(),
          info: jest.fn(),
        } as unknown as LoggerInterface,
        'proton-docs',
        '0.0.0.0',
      )

      await connection.getTokenOrFailConnection()

      expect(onFailToGetToken).toHaveBeenCalled()

      connection.destroy()
    })
  })

  describe('canBroadcastMessages', () => {
    it('should return false if connection is not ready to accept messages', () => {
      expect(connection.canBroadcastMessages()).toBe(false)
    })

    it('should return true if socket is fully ready', () => {
      connection.markAsReadyToAcceptMessages()

      connection.socket = {
        readyState: 1,
        close: jest.fn(),
      } as unknown as WebSocket

      connection.state.didOpen()

      expect(connection.canBroadcastMessages()).toBe(true)
    })
  })

  describe('isConnected', () => {
    it('should return false if socket is not open', () => {
      connection.socket = {
        readyState: 0,
        close: jest.fn(),
      } as unknown as WebSocket

      connection.state.didOpen()

      expect(connection.isConnected()).toBe(false)
    })

    it('should return true if socket is open', () => {
      connection.socket = {
        readyState: 1,
        close: jest.fn(),
      } as unknown as WebSocket

      connection.state.didOpen()

      expect(connection.isConnected()).toBe(true)
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
