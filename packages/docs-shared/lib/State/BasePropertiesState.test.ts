import { BasePropertiesState } from './BasePropertiesState'
import type { BaseEvent } from './BasePropertiesStateInterface'

interface TestProperties {
  stringProp: string
  numberProp: number
  boolProp: boolean
}

interface TestEvent extends BaseEvent {
  name: 'testEvent' | 'otherEvent'
  payload: string
}

const DEFAULT_VALUES: TestProperties = {
  stringProp: '',
  numberProp: 0,
  boolProp: false,
}

class TestPropertiesState extends BasePropertiesState<TestProperties, TestEvent> {
  constructor() {
    super(DEFAULT_VALUES)
  }
}

describe('BasePropertiesState', () => {
  let state: TestPropertiesState

  beforeEach(() => {
    console.error = jest.fn()
    state = new TestPropertiesState()
  })

  describe('getProperty', () => {
    it('should return current value for property', () => {
      state.setProperty('numberProp', 42)
      expect(state.getProperty('numberProp')).toBe(42)
    })
  })

  describe('getState', () => {
    it('should return current state', () => {
      state.setProperty('stringProp', 'test')
      state.setProperty('boolProp', true)

      const currentState = state.getState()
      expect(currentState.stringProp).toBe('test')
      expect(currentState.boolProp).toBe(true)
    })

    it('should return new object instance each time', () => {
      const state1 = state.getState()
      const state2 = state.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  describe('subscribeToAnyProperty', () => {
    it('should call subscriber immediately with all properties', () => {
      const callback = jest.fn()
      state.subscribeToAnyProperty(callback)

      expect(callback).toHaveBeenCalledTimes(Object.keys(DEFAULT_VALUES).length)
      expect(callback).toHaveBeenCalledWith('stringProp', '')
      expect(callback).toHaveBeenCalledWith('numberProp', 0)
      expect(callback).toHaveBeenCalledWith('boolProp', false)
    })

    it('should notify subscriber when any property changes', () => {
      const callback = jest.fn()
      state.subscribeToAnyProperty(callback)
      callback.mockClear()

      state.setProperty('stringProp', 'new value')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('stringProp', 'new value')
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = state.subscribeToAnyProperty(callback)
      callback.mockClear()

      unsubscribe()
      state.setProperty('numberProp', 42)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple any property subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      state.subscribeToAnyProperty(callback1)
      state.subscribeToAnyProperty(callback2)
      callback1.mockClear()
      callback2.mockClear()

      state.setProperty('boolProp', true)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('subscribeToAnyEvent', () => {
    it('should notify subscriber when any event is emitted', () => {
      const callback = jest.fn()
      state.subscribeToAnyEvent(callback)

      const event = {
        name: 'testEvent' as const,
        payload: 'test payload',
      }
      state.emitEvent(event)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(event)
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = state.subscribeToAnyEvent(callback)

      unsubscribe()

      const event = {
        name: 'testEvent' as const,
        payload: 'test payload',
      }
      state.emitEvent(event)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple any event subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      state.subscribeToAnyEvent(callback1)
      state.subscribeToAnyEvent(callback2)

      const event = {
        name: 'testEvent' as const,
        payload: 'test payload',
      }
      state.emitEvent(event)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback1).toHaveBeenCalledWith(event)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledWith(event)
    })

    it('should notify subscribers for different event types', () => {
      const callback = jest.fn()
      state.subscribeToAnyEvent(callback)

      const event1 = {
        name: 'testEvent' as const,
        payload: 'test payload 1',
      }
      const event2 = {
        name: 'otherEvent' as const,
        payload: 'test payload 2',
      }

      state.emitEvent(event1)
      state.emitEvent(event2)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, event1)
      expect(callback).toHaveBeenNthCalledWith(2, event2)
    })

    it('should handle errors in any event subscribers gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Subscriber error')
      })
      const normalCallback = jest.fn()

      state.subscribeToAnyEvent(errorCallback)
      state.subscribeToAnyEvent(normalCallback)

      const event = {
        name: 'testEvent' as const,
        payload: 'test payload',
      }
      state.emitEvent(event)

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(normalCallback).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith(
        'Error in any event subscriber for [object Object]:',
        expect.any(Error),
      )
    })

    it('should notify both specific and any event subscribers', () => {
      const specificCallback = jest.fn()
      const anyCallback = jest.fn()

      state.subscribeToEvent('testEvent', specificCallback)
      state.subscribeToAnyEvent(anyCallback)

      const event = {
        name: 'testEvent' as const,
        payload: 'test payload',
      }
      state.emitEvent(event)

      expect(specificCallback).toHaveBeenCalledTimes(1)
      expect(specificCallback).toHaveBeenCalledWith('test payload')
      expect(anyCallback).toHaveBeenCalledTimes(1)
      expect(anyCallback).toHaveBeenCalledWith(event)
    })
  })
})
