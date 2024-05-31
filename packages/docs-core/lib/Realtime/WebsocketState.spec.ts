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

  describe('exponential backoff', () => {
    it('should have minimum 2 second backoff if no attempts', () => {
      expect(state.getBackoffWithoutJitter()).toBe(2000)
    })

    it('should return backoff time and limit to max backoff time', () => {
      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(2000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(4000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(8000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(16000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(32000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(32000)
    })

    it('should reset attempts', () => {
      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(2000)

      state.didClose()
      expect(state.getBackoffWithoutJitter()).toBe(4000)

      state.resetAttempts()
      expect(state.getBackoffWithoutJitter()).toBe(2000)
    })

    it('should get backoff with jitter', () => {
      state.getJitterFactor = jest.fn().mockReturnValue(1)

      state.didClose()
      expect(state.getBackoff()).toBe(2000)

      state.getJitterFactor = jest.fn().mockReturnValue(1.5)

      state.didClose()
      expect(state.getBackoff()).toBe(6000)
    })
  })
})
