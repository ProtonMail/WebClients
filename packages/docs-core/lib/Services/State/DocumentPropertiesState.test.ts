import { DocumentPropertiesState } from './DocumentPropertiesState'

describe('DocumentPropertiesState', () => {
  let documentPropertiesState: DocumentPropertiesState

  beforeEach(() => {
    documentPropertiesState = new DocumentPropertiesState()
  })

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const state = documentPropertiesState.getState()
      expect(state).toEqual(
        expect.objectContaining({
          userAccountEmailDocTitleEnabled: false,
          userAccountEmailNotificationsEnabled: false,
        }),
      )
    })
  })

  describe('subscribe', () => {
    it('should call subscriber immediately with current state', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          userAccountEmailDocTitleEnabled: false,
          userAccountEmailNotificationsEnabled: false,
        }),
      )
    })

    it('should return unsubscribe function', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribe(callback)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should not call subscriber after unsubscribe', () => {
      const callback = jest.fn()
      const unsubscribe = documentPropertiesState.subscribe(callback)

      callback.mockClear()

      unsubscribe()
      documentPropertiesState.setProperty('userAccountEmailDocTitleEnabled', true)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should notify multiple subscribers', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      documentPropertiesState.subscribe(callback1)
      documentPropertiesState.subscribe(callback2)

      callback1.mockClear()
      callback2.mockClear()

      documentPropertiesState.setProperty('userAccountEmailDocTitleEnabled', true)

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('notifyChanged', () => {
    it('should update state and notify subscribers', () => {
      const callback = jest.fn()
      documentPropertiesState.subscribe(callback)

      callback.mockClear()

      documentPropertiesState.setProperty('userAccountEmailDocTitleEnabled', true)

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          userAccountEmailDocTitleEnabled: true,
          userAccountEmailNotificationsEnabled: false,
        }),
      )
    })

    it('should not modify previous state objects', () => {
      const previousState = documentPropertiesState.getState()
      documentPropertiesState.setProperty('userAccountEmailDocTitleEnabled', true)

      expect(previousState.userAccountEmailDocTitleEnabled).toBe(false)
    })
  })

  describe('getState', () => {
    it('should return current state', () => {
      documentPropertiesState.setProperty('userAccountEmailDocTitleEnabled', true)
      documentPropertiesState.setProperty('userAccountEmailNotificationsEnabled', true)

      expect(documentPropertiesState.getState()).toEqual(
        expect.objectContaining({
          userAccountEmailDocTitleEnabled: true,
          userAccountEmailNotificationsEnabled: true,
        }),
      )
    })

    it('should return new object instance each time', () => {
      const state1 = documentPropertiesState.getState()
      const state2 = documentPropertiesState.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })
})
