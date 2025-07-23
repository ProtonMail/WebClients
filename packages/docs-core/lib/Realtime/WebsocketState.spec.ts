import { WebsocketState } from './WebsocketState'

describe('WebsocketState', () => {
  let state: WebsocketState

  beforeEach(() => {
    state = new WebsocketState()
  })

  afterEach(() => {
    state.destroy()
  })

  describe('attempt count', () => {
    it('should increment attempts on close', () => {
      state.didClose()

      expect(state.attemptCount).toBe(1)

      state.didClose()

      expect(state.attemptCount).toBe(2)
    })

    it('should increment attempts on fail to fetch token', () => {
      state.didFailToFetchToken()

      expect(state.attemptCount).toBe(1)

      state.didFailToFetchToken()

      expect(state.attemptCount).toBe(2)
    })
  })

  describe('connection', () => {
    it('should not be connected initially', () => {
      expect(state.isConnected).toBe(false)
    })

    it('should set connected on open', () => {
      state.didOpen()

      expect(state.isConnected).toBe(true)
    })
  })

  describe('reconnection delay', () => {
    it('should be 0 if explicitly skipping delay', () => {
      expect(state.getReconnectDelayWithoutJitter(true)).toBe(0)
    })

    it('should have minimum 2 second backoff if no attempts', () => {
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(2000)
    })

    it('should return backoff time and limit to max backoff time', () => {
      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(2000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(4000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(8000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(16000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(32000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(32000)
    })

    it('should reset attempts', () => {
      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(2000)

      state.didClose()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(4000)

      state.resetAttempts()
      expect(state.getReconnectDelayWithoutJitter(false)).toBe(2000)
    })

    it('should get backoff with jitter', () => {
      state.getJitterFactor = jest.fn().mockReturnValue(1)

      state.didClose()
      expect(state.getReconnectDelay()).toBe(2000)

      state.getJitterFactor = jest.fn().mockReturnValue(1.5)

      state.didClose()
      expect(state.getReconnectDelay()).toBe(6000)
    })
  })
})
