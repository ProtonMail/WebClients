import { NodeMeta } from '@proton/drive-store/lib'
import { DocumentUpdateBuffer } from './DocumentUpdateBuffer'
import { LoggerInterface } from '@proton/utils/logs'

describe('DocumentUpdateBuffer', () => {
  let buffer: DocumentUpdateBuffer
  let onFlush = jest.fn()

  beforeEach(() => {
    buffer = new DocumentUpdateBuffer(
      {} as NodeMeta,
      {
        info: jest.fn(),
        debug: jest.fn(),
      } as unknown as LoggerInterface,
      onFlush,
    )
  })

  afterEach(() => {
    buffer.destroy()
    jest.clearAllMocks()
  })

  describe('addUpdate', () => {
    it('should flush immediately if buffer is disabled', () => {
      buffer.setBufferEnabled(false)
      buffer.addUpdate(new Uint8Array())

      expect(onFlush).toHaveBeenCalledTimes(1)
    })

    it('should add to buffer if enabled', () => {
      buffer.flush = jest.fn()

      buffer.setBufferEnabled(true)
      buffer.addUpdate(new Uint8Array())

      expect(buffer.flush).not.toHaveBeenCalled()
      expect(buffer.buffer.length).toBe(1)
    })
  })

  describe('hasPendingUpdates', () => {
    it('should return false if buffer is empty', () => {
      expect(buffer.hasPendingUpdates()).toBe(false)
    })

    it('should return true if buffer has updates', () => {
      buffer.addUpdate(new Uint8Array())

      expect(buffer.hasPendingUpdates()).toBe(true)
    })
  })

  describe('flush', () => {
    it('should do nothing if buffer is empty', () => {
      buffer.flush()

      expect(onFlush).not.toHaveBeenCalled()
    })

    it('should flush buffer', () => {
      buffer.addUpdate(new Uint8Array())
      buffer.flush()

      expect(onFlush).toHaveBeenCalledTimes(1)
      expect(buffer.buffer.length).toBe(0)
    })
  })

  describe('setBufferEnabled', () => {
    it('should set buffer enabled', () => {
      buffer.setBufferEnabled(false)

      expect(buffer.isBufferEnabled).toBe(false)
    })

    it('should set buffer disabled', () => {
      buffer.setBufferEnabled(true)

      expect(buffer.isBufferEnabled).toBe(true)
    })
  })

  describe('idle flushing', () => {
    it('should flush after idle period', () => {
      jest.useFakeTimers()

      buffer.addUpdate(new Uint8Array())

      jest.advanceTimersByTime(buffer.idlePeriod)

      expect(onFlush).toHaveBeenCalledTimes(1)
    })

    it('should not flush if idle period passes but updates are still being added', () => {
      jest.useFakeTimers()

      buffer.addUpdate(new Uint8Array())

      jest.advanceTimersByTime(buffer.idlePeriod - 100)

      buffer.addUpdate(new Uint8Array())

      jest.advanceTimersByTime(buffer.idlePeriod - 100)

      expect(onFlush).not.toHaveBeenCalled()
    })

    it('idle period should reset after adding a new update', () => {
      buffer.flush = jest.fn()

      jest.useFakeTimers()

      buffer.addUpdate(new Uint8Array())

      jest.advanceTimersByTime(buffer.idlePeriod / 2)

      buffer.addUpdate(new Uint8Array())

      jest.advanceTimersByTime(buffer.idlePeriod / 2)

      expect(buffer.flush).not.toHaveBeenCalled()

      jest.advanceTimersByTime(buffer.idlePeriod / 2)

      expect(buffer.flush).toHaveBeenCalledTimes(1)
    })
  })
})
