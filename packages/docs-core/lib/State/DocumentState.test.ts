import type { DocumentStateValues } from './DocumentState'
import { DocumentState } from './DocumentState'
import { DocumentRole } from '@proton/docs-shared'
import type { ConnectionCloseReason } from '@proton/docs-proto'

describe('DocumentState', () => {
  let documentPropertiesState: DocumentState

  beforeEach(() => {
    console.error = jest.fn()
    documentPropertiesState = new DocumentState({
      ...DocumentState.defaults,
    } as DocumentStateValues)
  })

  describe('property subscription', () => {
    it('should call property subscriber immediately with current value and undefined previous value', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribeToProperty('realtimeEnabled', callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(true, undefined)
    })

    it('should notify property subscribers with new and previous values', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribeToProperty('realtimeEnabled', callback)
      callback.mockClear()

      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(false, true)
    })

    it('should handle multiple property subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      documentPropertiesState.subscribeToProperty('realtimeEnabled', callback1)
      documentPropertiesState.subscribeToProperty('realtimeEnabled', callback2)
      callback1.mockClear()
      callback2.mockClear()

      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback1).toHaveBeenCalledWith(false, true)
      expect(callback2).toHaveBeenCalledWith(false, true)
    })

    it('should not call property subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribeToProperty('realtimeEnabled', callback)
      callback.mockClear()

      unsubscribe()
      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('event handling', () => {
    it('should notify event subscribers with payload', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback)

      documentPropertiesState.emitEvent({
        name: 'RealtimeFailedToConnect',
        payload: undefined,
      })

      expect(callback).not.toHaveBeenCalled() // Different event type
    })

    it('should handle multiple event subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback1)
      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback2)

      documentPropertiesState.emitEvent({
        name: 'RealtimeFailedToConnect',
        payload: undefined,
      })

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })

    it('should not call event subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback)

      unsubscribe()
      documentPropertiesState.emitEvent({
        name: 'RealtimeConnectionClosed',
        payload: {} as ConnectionCloseReason,
      })

      expect(callback).not.toHaveBeenCalled()
    })

    it('should notify event subscribers with correct payload when event matches', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback)

      const payload = { reason: 'test' } as unknown as ConnectionCloseReason
      documentPropertiesState.emitEvent({
        name: 'RealtimeConnectionClosed',
        payload,
      })

      expect(callback).toHaveBeenCalledWith(payload)
    })
  })

  describe('getProperty', () => {
    it('should return current value for property', () => {
      documentPropertiesState.setProperty('userRole', new DocumentRole('Editor'))

      expect(documentPropertiesState.getProperty('userRole').roleType).toBe('Editor')
    })
  })

  describe('getState', () => {
    it('should return current state', () => {
      documentPropertiesState.setProperty('userRole', new DocumentRole('Editor'))
      documentPropertiesState.setProperty('realtimeEnabled', false)

      const state = documentPropertiesState.getState()
      expect(state.userRole.roleType).toBe('Editor')
      expect(state.realtimeEnabled).toBe(false)
    })

    it('should return new object instance each time', () => {
      const state1 = documentPropertiesState.getState()
      const state2 = documentPropertiesState.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  describe('general subscription', () => {
    it('should call subscriber immediately with current state', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(documentPropertiesState.getState())
    })

    it('should notify subscribers when any property changes', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)
      callback.mockClear()

      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          realtimeEnabled: false,
        }),
      )
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribe(callback)
      callback.mockClear()

      unsubscribe()
      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      documentPropertiesState.subscribe(callback1)
      documentPropertiesState.subscribe(callback2)
      callback1.mockClear()
      callback2.mockClear()

      documentPropertiesState.setProperty('realtimeEnabled', false)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('property subscription cleanup', () => {
    it('should remove property from propertySubscribers map when last subscriber is removed', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      const unsubscribe1 = documentPropertiesState.subscribeToProperty('realtimeEnabled', callback1)
      const unsubscribe2 = documentPropertiesState.subscribeToProperty('realtimeEnabled', callback2)

      const propertySubscribers = (documentPropertiesState as any).propertySubscribers

      expect(propertySubscribers.has('realtimeEnabled')).toBe(true)

      unsubscribe1()
      expect(propertySubscribers.has('realtimeEnabled')).toBe(true)

      unsubscribe2()
      expect(propertySubscribers.has('realtimeEnabled')).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle invalid property access gracefully', () => {
      // @ts-expect-error Testing invalid property
      expect(() => documentPropertiesState.getProperty('invalidProperty')).not.toThrow()
    })

    it('should handle subscriber errors without breaking other subscribers', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Subscriber error')
      })
      const normalCallback = jest.fn()

      documentPropertiesState.subscribe(errorCallback)
      documentPropertiesState.subscribe(normalCallback)

      errorCallback.mockClear()
      normalCallback.mockClear()

      expect(() => {
        documentPropertiesState.setProperty('realtimeEnabled', false)
      }).not.toThrow()

      expect(normalCallback).toHaveBeenCalled()
    })

    it('should handle errors in initial property subscriber call', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Initial subscriber error')
      })

      expect(() => {
        documentPropertiesState.subscribeToProperty('realtimeEnabled', errorCallback)
      }).not.toThrow()

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        'Error in initial property subscriber call for realtimeEnabled:',
        expect.any(Error),
      )
    })

    it('should handle errors in property subscriber calls', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Property subscriber error')
      })
      const normalCallback = jest.fn()

      documentPropertiesState.subscribeToProperty('realtimeEnabled', errorCallback)
      documentPropertiesState.subscribeToProperty('realtimeEnabled', normalCallback)

      errorCallback.mockClear()
      normalCallback.mockClear()
      ;(console.error as jest.Mock).mockClear()

      expect(() => {
        documentPropertiesState.setProperty('realtimeEnabled', false)
      }).not.toThrow()

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(normalCallback).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith('Error in property subscriber for realtimeEnabled:', expect.any(Error))
    })

    it('should handle errors in event subscriber calls', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Event subscriber error')
      })
      const normalCallback = jest.fn()

      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', errorCallback)
      documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', normalCallback)

      const payload = { reason: 'test' } as unknown as ConnectionCloseReason
      ;(console.error as jest.Mock).mockClear()

      expect(() => {
        documentPropertiesState.emitEvent({
          name: 'RealtimeConnectionClosed',
          payload,
        })
      }).not.toThrow()

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(normalCallback).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        'Error in event subscriber for RealtimeConnectionClosed:',
        expect.any(Error),
      )
    })
  })

  describe('event subscription cleanup', () => {
    it('should remove event from eventSubscribers map when last subscriber is removed', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      const unsubscribe1 = documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback1)
      const unsubscribe2 = documentPropertiesState.subscribeToEvent('RealtimeConnectionClosed', callback2)

      const eventSubscribers = (documentPropertiesState as any).eventSubscribers
      const subscribers = eventSubscribers.get('RealtimeConnectionClosed')

      expect(subscribers.size).toBe(2)

      unsubscribe1()
      expect(subscribers.size).toBe(1)

      unsubscribe2()
      expect(subscribers.size).toBe(0)
      expect(eventSubscribers.has('RealtimeConnectionClosed')).toBe(false)
    })
  })
})
