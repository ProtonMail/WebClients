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

  describe('general subscription', () => {
    it('should call subscriber immediately with current state', () => {
      const callback = jest.fn()
      state.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(state.getState())
    })

    it('should notify subscribers when any property changes', () => {
      const callback = jest.fn()
      state.subscribe(callback)
      callback.mockClear()

      state.setProperty('boolProp', true)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          boolProp: true,
        }),
      )
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = state.subscribe(callback)
      callback.mockClear()

      unsubscribe()
      state.setProperty('numberProp', 42)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      state.subscribe(callback1)
      state.subscribe(callback2)
      callback1.mockClear()
      callback2.mockClear()

      state.setProperty('stringProp', 'test')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })
})