import { DocState, DocUpdateOrigin } from './DocState'
import { DocStateCallbacks } from './DocStateCallbacks'
import { DocsUserState } from './DocsAwareness'

describe('DocState', () => {
  let state: DocState

  beforeEach(() => {
    state = new DocState({
      handleAwarenessStateUpdate: jest.fn(),
      docStateRequestsPropagationOfUpdate: jest.fn(),
    } as unknown as DocStateCallbacks)
  })

  afterEach(() => {
    state.destroy()
  })

  describe('handleAwarenessUpdateOrChange', () => {
    it('should invoke removeDuplicateClients', () => {
      const removeDuplicateClientsSpy = jest.spyOn(state.awareness, 'removeDuplicateClients')

      state.handleAwarenessUpdateOrChange({}, {})

      expect(removeDuplicateClientsSpy).toHaveBeenCalled()
    })

    it('should notify callbacks about the change', () => {
      const callbackSpy = jest.spyOn(state.callbacks, 'handleAwarenessStateUpdate')

      state.handleAwarenessUpdateOrChange({}, {})

      expect(callbackSpy).toHaveBeenCalled()
    })

    it('should not broadcast awareness state if there is no change', () => {
      state.lastEmittedClients = [1]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as DocsUserState
      state.doc.clientID = 1

      const broadcastCurrentAwarenessStateSpy = jest.spyOn(state, 'broadcastCurrentAwarenessState')

      state.awareness.getClientIds = jest.fn(() => [1])
      state.awareness.getStates = jest.fn(() => new Map([[1, { name: 'user1', awarenessData: {} } as DocsUserState]]))
      state.awareness.meta = new Map([[1, { lastUpdated: 0, clock: 0 }]])

      state.handleAwarenessUpdateOrChange({}, {})

      expect(broadcastCurrentAwarenessStateSpy).not.toHaveBeenCalled()
    })

    it('should broadcast awareness state if there is a change', () => {
      state.lastEmittedClients = [1, 2]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as DocsUserState
      state.doc.clientID = 1

      const broadcastCurrentAwarenessStateSpy = jest.spyOn(state, 'broadcastCurrentAwarenessState')

      state.awareness.getClientIds = jest.fn(() => [1, 2])
      state.awareness.getStates = jest.fn(
        () =>
          new Map([
            [
              1,
              {
                name: 'user1',
                awarenessData: {
                  foo: 'bar',
                },
              } as DocsUserState,
            ],
            [2, { name: 'user2', awarenessData: {} } as DocsUserState],
          ]),
      )
      state.awareness.meta = new Map([
        [1, { lastUpdated: 0, clock: 0 }],
        [2, { lastUpdated: 0, clock: 0 }],
      ])

      state.handleAwarenessUpdateOrChange({}, {})

      expect(broadcastCurrentAwarenessStateSpy).toHaveBeenCalled()
    })

    it('should always broadcast if origin is local regardless of whether there are changes', () => {
      state.lastEmittedClients = [1]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as DocsUserState
      state.doc.clientID = 1

      const broadcastCurrentAwarenessStateSpy = jest.spyOn(state, 'broadcastCurrentAwarenessState')

      state.awareness.getClientIds = jest.fn(() => [1])
      state.awareness.getStates = jest.fn(() => new Map([[1, { name: 'user1', awarenessData: {} } as DocsUserState]]))
      state.awareness.meta = new Map([[1, { lastUpdated: 0, clock: 0 }]])

      state.handleAwarenessUpdateOrChange({}, 'local')

      expect(broadcastCurrentAwarenessStateSpy).toHaveBeenCalled()
    })
  })

  describe('handleDocBeingUpdatedByLexical', () => {
    /** A self origin indicates the change was made through internal shuffling, rather than by the user editing directly */
    it('should abort if origin is self', () => {
      const docStateRequestsPropagationOfUpdateSpy = jest.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.handleDocBeingUpdatedByLexical(new Uint8Array(), state)

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
    })

    /** InitialLoad origin is when the document is initially populated; we don't want to trigger a broadcast event with this data */
    it('should abort if origin is InitialLoad', () => {
      const docStateRequestsPropagationOfUpdateSpy = jest.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.handleDocBeingUpdatedByLexical(new Uint8Array(), DocUpdateOrigin.InitialLoad)

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
    })
  })
})
