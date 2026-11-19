import type { LoggerInterface } from '@proton/shared/lib/logs'
import { DocState, DocUpdateOrigin, PRESENCE_UPDATE_REPEAT_INTERVAL } from './DocState'
import type { DocStateCallbacks } from './DocStateCallbacks'
import type { UnsafeDocsUserState } from './DocsAwareness'
import { BroadcastSource } from '../Bridge/BroadcastSource'
import { decodeUpdate } from 'yjs'
import type * as Yjs from 'yjs'

const EmptyAwarenessUpdate = {
  added: [],
  updated: [],
  removed: [],
}

vi.mock('yjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Yjs>()),
  decodeUpdate: vi.fn(),
  mergeUpdates: vi.fn(),
}))
vi.mocked(decodeUpdate).mockImplementation(
  () =>
    ({
      structs: [{ id: { clock: 0 } }],
    }) as unknown as ReturnType<typeof decodeUpdate>,
)

describe('DocState', () => {
  let state: DocState

  beforeEach(() => {
    vi.useFakeTimers()
    state = new DocState(
      {
        handleAwarenessStateUpdate: vi.fn(),
        docStateRequestsPropagationOfUpdate: vi.fn(),
      } as unknown as DocStateCallbacks,
      {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as unknown as LoggerInterface,
    )
  })

  afterEach(() => {
    state.destroy()
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  describe('broadcastPresenceInterval', () => {
    it('should broadcast awareness state if it needs an update', () => {
      state.broadcastCurrentAwarenessState = vi.fn()

      state.needsPresenceBroadcast = BroadcastSource.AwarenessInterval

      vi.advanceTimersByTime(PRESENCE_UPDATE_REPEAT_INTERVAL + 1)

      expect(state.broadcastCurrentAwarenessState).toHaveBeenCalled()
    })

    it('should not broadcast awareness state if it needs an update', () => {
      state.broadcastCurrentAwarenessState = vi.fn()

      vi.advanceTimersByTime(PRESENCE_UPDATE_REPEAT_INTERVAL + 1)

      expect(state.broadcastCurrentAwarenessState).not.toHaveBeenCalled()
    })
  })

  describe('consumeIsInConversionFromOtherFormat', () => {
    it('should consume the conversion', () => {
      state.isInConversionFromOtherFormatFlow = true

      const value = state.consumeIsInConversionFromOtherFormat()

      expect(value).toBe(true)
      expect(state.isInConversionFromOtherFormatFlow).toBe(false)
    })
  })

  describe('handleAwarenessUpdateOrChange', () => {
    it('should invoke removeDuplicateClients', () => {
      state.awareness.getStates = vi.fn(
        () => new Map([[1, { name: 'user1', awarenessData: {} } as UnsafeDocsUserState]]),
      )

      const removeDuplicateClientsSpy = vi.spyOn(state.awareness, 'removeDuplicateClients')

      state.handleAwarenessUpdateOrChange(EmptyAwarenessUpdate, {})

      expect(removeDuplicateClientsSpy).toHaveBeenCalled()
    })

    it('should notify callbacks about the change', () => {
      state.awareness.getStates = vi.fn(
        () => new Map([[1, { name: 'user1', awarenessData: {} } as UnsafeDocsUserState]]),
      )

      const callbackSpy = vi.spyOn(state.callbacks, 'handleAwarenessStateUpdate')

      state.handleAwarenessUpdateOrChange(EmptyAwarenessUpdate, {})

      expect(callbackSpy).toHaveBeenCalled()
    })

    it('should not broadcast awareness state if there is no change', () => {
      state.lastEmittedClients = [1]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as UnsafeDocsUserState
      state.doc.clientID = 1

      const broadcastCurrentAwarenessStateSpy = vi.spyOn(state, 'broadcastCurrentAwarenessState')

      state.awareness.getClientIds = vi.fn(() => [1])
      state.awareness.getStates = vi.fn(
        () => new Map([[1, { name: 'user1', awarenessData: {} } as UnsafeDocsUserState]]),
      )
      state.awareness.meta = new Map([[1, { lastUpdated: 0, clock: 0 }]])

      state.handleAwarenessUpdateOrChange(
        {
          added: [],
          updated: [],
          removed: [],
        },
        {},
      )

      expect(broadcastCurrentAwarenessStateSpy).not.toHaveBeenCalled()
    })

    it('should broadcast awareness state if there is a change', () => {
      state.lastEmittedClients = [1, 2]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as UnsafeDocsUserState
      state.doc.clientID = 1

      const spy = vi.spyOn(state, 'setNeedsBroadcastCurrentAwarenessState')

      state.awareness.getClientIds = vi.fn(() => [1, 2])
      state.awareness.getStates = vi.fn(
        () =>
          new Map([
            [
              1,
              {
                name: 'user1',
                awarenessData: {
                  foo: 'bar',
                },
              } as UnsafeDocsUserState,
            ],
            [2, { name: 'user2', awarenessData: {} } as UnsafeDocsUserState],
          ]),
      )
      state.awareness.meta = new Map([
        [1, { lastUpdated: 0, clock: 0 }],
        [2, { lastUpdated: 0, clock: 0 }],
      ])

      state.handleAwarenessUpdateOrChange(
        {
          added: [],
          updated: [1],
          removed: [],
        },
        {},
      )

      expect(spy).toHaveBeenCalled()
    })

    it("should not broadcast awareness state if the change is someone else's", () => {
      state.lastEmittedClients = [1, 2]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as UnsafeDocsUserState
      state.doc.clientID = 1

      const spy = vi.spyOn(state, 'setNeedsBroadcastCurrentAwarenessState')

      state.awareness.getClientIds = vi.fn(() => [1, 2])
      state.awareness.getStates = vi.fn(
        () =>
          new Map([
            [
              1,
              {
                name: 'user1',
                awarenessData: {
                  foo: 'bar',
                },
              } as UnsafeDocsUserState,
            ],
            [2, { name: 'user2', awarenessData: {} } as UnsafeDocsUserState],
          ]),
      )
      state.awareness.meta = new Map([
        [1, { lastUpdated: 0, clock: 0 }],
        [2, { lastUpdated: 0, clock: 0 }],
      ])

      state.handleAwarenessUpdateOrChange(
        {
          added: [],
          updated: [2],
          removed: [],
        },
        {},
      )

      expect(spy).not.toHaveBeenCalled()
    })

    it('should always broadcast if origin is local regardless of whether there are changes', () => {
      state.lastEmittedClients = [1]
      state.lastEmittedMyState = { name: 'user1', awarenessData: {} } as UnsafeDocsUserState
      state.doc.clientID = 1

      const spy = vi.spyOn(state, 'setNeedsBroadcastCurrentAwarenessState')

      state.awareness.getClientIds = vi.fn(() => [1])
      state.awareness.getStates = vi.fn(
        () => new Map([[1, { name: 'user1', awarenessData: {} } as UnsafeDocsUserState]]),
      )
      state.awareness.meta = new Map([[1, { lastUpdated: 0, clock: 0 }]])

      state.handleAwarenessUpdateOrChange(
        {
          added: [],
          updated: [1],
          removed: [],
        },
        'local',
      )

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('setNeedsBroadcastCurrentAwarenessState', () => {
    it('should bypass debouncing if the source is ExternalCallerRequestingUsToBroadcastOurState', () => {
      state.broadcastCurrentAwarenessState = vi.fn()

      state.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.ExternalCallerRequestingUsToBroadcastOurState)

      expect(state.broadcastCurrentAwarenessState).toHaveBeenCalled()
    })

    it('should not bypass debouncing if the source is not ExternalCallerRequestingUsToBroadcastOurState', () => {
      state.broadcastCurrentAwarenessState = vi.fn()

      state.setNeedsBroadcastCurrentAwarenessState(BroadcastSource.AwarenessUpdateHandler)

      expect(state.broadcastCurrentAwarenessState).not.toHaveBeenCalled()
    })
  })

  describe('handleDocBeingUpdatedByLexical', () => {
    /** A self origin indicates the change was made through internal shuffling, rather than by the user editing directly */
    it('should abort if origin is self', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.handleYDocUpdate(new Uint8Array(), state)

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
    })

    /** BaseCommit origin is when the document is initially populated; we don't want to trigger a broadcast event with this data */
    it('should abort if origin is BaseCommit', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.handleYDocUpdate(new Uint8Array(), DocUpdateOrigin.BaseCommit)

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
    })

    it('should hold back editor initialization update and merge with the next update', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.docWasInitializedWithEmptyNode = true
      vi.mocked(decodeUpdate).mockImplementationOnce(
        () =>
          ({
            structs: [{ id: { clock: 0 } }],
          }) as unknown as ReturnType<typeof decodeUpdate>,
      )

      state.handleYDocUpdate(new Uint8Array(), {})

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
      vi.mocked(decodeUpdate).mockImplementationOnce(
        () =>
          ({
            structs: [{ id: { clock: 1 } }],
          }) as unknown as ReturnType<typeof decodeUpdate>,
      )

      state.handleYDocUpdate(new Uint8Array(), {})

      expect(docStateRequestsPropagationOfUpdateSpy).toHaveBeenCalled()
    })

    it('should propagate update as conversion if is in conversion flow', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.isInConversionFromOtherFormatFlow = true

      state.handleYDocUpdate(new Uint8Array(), {})

      expect(docStateRequestsPropagationOfUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: { wrapper: 'conversion' },
        }),
        expect.anything(),
      )
    })

    it('should not propagate update as conversion if is not in conversion flow', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.isInConversionFromOtherFormatFlow = false

      state.handleYDocUpdate(new Uint8Array(), {})

      expect(docStateRequestsPropagationOfUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: { wrapper: 'du' },
        }),
        expect.anything(),
      )
    })

    it('should not propagate update when document update guard blocks it', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')

      state.runWithDocumentUpdateGuard(
        () => false,
        () => {
          state.handleYDocUpdate(new Uint8Array(), 'local')
        },
      )

      expect(docStateRequestsPropagationOfUpdateSpy).not.toHaveBeenCalled()
    })

    it('should restore the previous document update guard after a scoped callback', () => {
      const docStateRequestsPropagationOfUpdateSpy = vi.spyOn(state.callbacks, 'docStateRequestsPropagationOfUpdate')
      const firstGuard = vi.fn(() => true)
      const secondGuard = vi.fn(() => false)

      state.runWithDocumentUpdateGuard(firstGuard, () => {
        state.runWithDocumentUpdateGuard(secondGuard, () => undefined)
        state.handleYDocUpdate(new Uint8Array(), 'local')
      })

      expect(secondGuard).not.toHaveBeenCalled()
      expect(firstGuard).toHaveBeenCalled()
      expect(docStateRequestsPropagationOfUpdateSpy).toHaveBeenCalled()
    })
  })
})
