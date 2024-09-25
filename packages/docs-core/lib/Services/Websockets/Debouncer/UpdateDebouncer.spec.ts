import { DecryptedValue } from '@proton/docs-proto'
import type { NodeMeta } from '@proton/drive-store/lib'
import { UpdateDebouncer } from './UpdateDebouncer'
import { DocumentDebounceMode } from './DocumentDebounceMode'
import type { LoggerInterface } from '@proton/utils/logs'

describe('UpdateDebouncer', () => {
  let debouncer: UpdateDebouncer
  let onEvent = jest.fn()

  beforeEach(() => {
    debouncer = new UpdateDebouncer(
      {} as NodeMeta,
      {
        info: jest.fn(),
        debug: jest.fn(),
      } as unknown as LoggerInterface,
      onEvent,
    )

    debouncer.isReadyToFlush = true
  })

  afterEach(() => {
    debouncer.destroy()
    jest.clearAllMocks()
  })

  describe('markAsReadyToFlush', () => {
    it('should set isReadyToFlush to true', () => {
      debouncer.isReadyToFlush = false

      debouncer.markAsReadyToFlush()

      expect(debouncer.isReadyToFlush).toBe(true)
    })

    it('should flush', () => {
      debouncer.flush = jest.fn()

      debouncer.markAsReadyToFlush()

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })
  })

  describe('addUpdate', () => {
    it('should add to buffer regardless of mode', () => {
      debouncer.setMode(DocumentDebounceMode.SinglePlayer)
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      expect(debouncer.buffer.length).toBe(1)

      debouncer.setMode(DocumentDebounceMode.Realtime)
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      expect(debouncer.buffer.length).toBe(2)
    })

    it('should post WillFlush event', () => {
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      expect(onEvent).toHaveBeenCalledTimes(1)
    })

    it('should clear existing single player idle timeout', () => {
      debouncer.setMode(DocumentDebounceMode.SinglePlayer)

      jest.useFakeTimers()

      const previousTimeout = debouncer.singlePlayerIdleTimeout

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      expect(debouncer.singlePlayerIdleTimeout).not.toBe(previousTimeout)
    })

    it('should flush after single player debounce period', () => {
      jest.useFakeTimers()

      debouncer.flush = jest.fn()

      debouncer.setMode(DocumentDebounceMode.SinglePlayer)
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod)

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })

    it('should increment current buffer size', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5])
      debouncer.addUpdates([new DecryptedValue(data)])

      expect(debouncer.currentBufferSize).toBe(data.byteLength)
    })

    it('should not flush if size limit is not exceeded', () => {
      debouncer.flush = jest.fn()

      const maxSize = debouncer.maxSizeBeforeFlush

      debouncer.addUpdates([new DecryptedValue(new Uint8Array(maxSize - 1))])

      expect(debouncer.flush).not.toHaveBeenCalled()
    })

    it('should flush if size limit is exceeded', () => {
      debouncer.flush = jest.fn()

      const maxSize = debouncer.maxSizeBeforeFlush

      debouncer.addUpdates([new DecryptedValue(new Uint8Array(maxSize))])

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })
  })

  describe('hasPendingUpdates', () => {
    it('should return false if buffer is empty', () => {
      expect(debouncer.hasPendingUpdates()).toBe(false)
    })

    it('should return true if buffer has updates', () => {
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      expect(debouncer.hasPendingUpdates()).toBe(true)
    })
  })

  describe('flush', () => {
    it('should do nothing if buffer is empty', () => {
      debouncer.flush()

      expect(onEvent).not.toHaveBeenCalled()
    })

    it('should abort if not ready to flush', () => {
      debouncer.isReadyToFlush = false
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      onEvent = jest.fn()
      debouncer.flush()

      expect(onEvent).not.toHaveBeenCalled()
    })

    it('should reset the current buffer size', () => {
      debouncer.addUpdates([new DecryptedValue(new Uint8Array([1]))])

      expect(debouncer.currentBufferSize).toBeGreaterThan(0)

      debouncer.flush()

      expect(debouncer.currentBufferSize).toBe(0)
    })

    it('should flush buffer', () => {
      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])
      debouncer.flush()

      expect(onEvent).toHaveBeenCalledTimes(2)
      expect(debouncer.buffer.length).toBe(0)
    })
  })

  describe('setMode', () => {
    it('should set realtime mode', () => {
      debouncer.setMode(DocumentDebounceMode.Realtime)

      expect(debouncer.getMode()).toBe(DocumentDebounceMode.Realtime)
    })

    it('should set singleplayer mode', () => {
      debouncer.setMode(DocumentDebounceMode.SinglePlayer)

      expect(debouncer.getMode()).toBe(DocumentDebounceMode.SinglePlayer)
    })

    it('should set realtime streaming interval if realtime mode', () => {
      expect(debouncer.realtimeStreamingInterval).not.toBeTruthy()

      debouncer.setMode(DocumentDebounceMode.Realtime)

      expect(debouncer.realtimeStreamingInterval).toBeTruthy()
    })

    it('should clear realtime streaming interval if not realtime mode', () => {
      debouncer.setMode(DocumentDebounceMode.Realtime)

      expect(debouncer.realtimeStreamingInterval).toBeTruthy()

      debouncer.setMode(DocumentDebounceMode.SinglePlayer)

      expect(debouncer.realtimeStreamingInterval).not.toBeTruthy()
    })
  })

  describe('realtime mode', () => {
    it('should flush after realtime streaming period', () => {
      jest.useFakeTimers()

      debouncer.flush = jest.fn()

      debouncer.setMode(DocumentDebounceMode.Realtime)

      jest.advanceTimersByTime(debouncer.realtimeStreamingPeriod)

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })
  })

  describe('singleplayer mode', () => {
    it('should flush after debounce period', () => {
      jest.useFakeTimers()

      debouncer.flush = jest.fn()

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod)

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })

    it('should not flush if debounce period passes but updates are still being added', () => {
      jest.useFakeTimers()

      debouncer.flush = jest.fn()

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod - 100)

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod - 100)

      expect(debouncer.flush).not.toHaveBeenCalled()
    })

    it('debounce period should reset after adding a new update', () => {
      debouncer.flush = jest.fn()

      jest.useFakeTimers()

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod / 2)

      debouncer.addUpdates([new DecryptedValue(new Uint8Array())])

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod / 2)

      expect(debouncer.flush).not.toHaveBeenCalled()

      jest.advanceTimersByTime(debouncer.singlePlayerDebouncePeriod / 2)

      expect(debouncer.flush).toHaveBeenCalledTimes(1)
    })
  })
})
