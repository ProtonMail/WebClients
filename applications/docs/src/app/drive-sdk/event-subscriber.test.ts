import type * as DriveSdk from '@proton/drive/sdk'
import type { DriveEvent } from '@protontech/drive-sdk'
import type { getEventSubscriber } from './event-subscriber'

jest.mock('@proton/drive/sdk', () => ({
  ...jest.requireActual('@proton/drive/sdk'),
  getDrive: jest.fn(),
}))

jest.mock('@proton/docs-core/DriveSDK/traceErrorSDK')

type EventsByScope = Record<string, DriveEvent[] | Error>

/**
 * Loads a fresh module so each test gets its own singleton subscriber
 */
function setup(eventsByScope: EventsByScope = {}) {
  let modules!: {
    getEventSubscriber: typeof getEventSubscriber
    sdk: typeof DriveSdk
    traceErrorSDK: jest.Mock
  }
  jest.isolateModules(() => {
    modules = {
      getEventSubscriber: require('./event-subscriber').getEventSubscriber,
      sdk: require('@proton/drive/sdk'),
      traceErrorSDK: require('@proton/docs-core/DriveSDK/traceErrorSDK').traceErrorSDK,
    }
  })

  let handleScope!: (eventScope: string) => Promise<void>
  const scheduler = { addScope: jest.fn(), removeScope: jest.fn() }
  const drive = {
    getEventScheduler: jest.fn(async (callback: (eventScope: string) => Promise<void>) => {
      handleScope = callback
      return scheduler
    }),
    iterateEvents: jest.fn(async function* (eventScope: string) {
      const events = eventsByScope[eventScope] ?? []
      if (events instanceof Error) {
        throw events
      }
      yield* events
    }),
  }
  jest.mocked(modules.sdk.getDrive).mockReturnValue(drive as any)

  return {
    subscriber: modules.getEventSubscriber(),
    ValidationError: modules.sdk.ValidationError,
    traceErrorSDK: modules.traceErrorSDK,
    eventsByScope,
    scheduler,
    drive,
    emit: (eventScope: string) => handleScope(eventScope),
  }
}

function createEvent(eventId: string, type = 'node_updated') {
  return { eventId, type, nodeUid: `node-${eventId}` } as unknown as DriveEvent
}

describe('EventSubscriber', () => {
  test('initialize subscribes to the root scope', async () => {
    const { subscriber, scheduler } = setup()

    await subscriber.initialize('root', [])

    expect(scheduler.addScope).toHaveBeenCalledWith('root')
  })

  test('initialize throws when already initialized', async () => {
    const { subscriber } = setup()
    await subscriber.initialize('root', [])

    await expect(subscriber.initialize('root', [])).rejects.toThrow('Already subscribed')
  })

  test('reset removes root and shared document scopes, and initialize after it reuses the scheduler', async () => {
    const { subscriber, scheduler, drive } = setup()
    await subscriber.initialize('root', [])
    subscriber.subscribeToSharedDocument('node1', 'scope1')

    subscriber.reset()

    expect(scheduler.removeScope.mock.calls).toEqual([['root'], ['scope1']])

    await subscriber.initialize('root2', [])

    expect(drive.getEventScheduler).toHaveBeenCalledTimes(1)
    expect(scheduler.addScope).toHaveBeenLastCalledWith('root2')
  })

  test('reset during initialize does not subscribe to the root scope', async () => {
    const { subscriber, scheduler } = setup()

    const initialized = subscriber.initialize('root', [])
    subscriber.reset()
    await initialized

    expect(scheduler.addScope).not.toHaveBeenCalled()
  })

  test('reset traces removeScope failure and still allows initializing again', async () => {
    const { subscriber, scheduler, traceErrorSDK } = setup()
    await subscriber.initialize('root', [])
    const error = new Error('removeScope failed')
    scheduler.removeScope.mockImplementationOnce(() => {
      throw error
    })

    subscriber.reset()

    expect(traceErrorSDK).toHaveBeenCalledWith(error, 'EventsSubscription')
    await expect(subscriber.initialize('root', [])).resolves.toBeUndefined()
  })

  describe('subscribeToSharedDocument', () => {
    test('does nothing before initialize', () => {
      const { subscriber, scheduler } = setup()

      subscriber.subscribeToSharedDocument('node1', 'scope1')

      expect(scheduler.addScope).not.toHaveBeenCalled()
    })

    test('adds the document scope once', async () => {
      const { subscriber, scheduler } = setup()
      await subscriber.initialize('root', [])

      subscriber.subscribeToSharedDocument('node1', 'scope1')
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      expect(scheduler.addScope.mock.calls).toEqual([['root'], ['scope1']])
    })

    test('subscribes again after the subscription was removed', async () => {
      const { subscriber, scheduler } = setup()
      await subscriber.initialize('root', [])
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      subscriber.removeSharedDocumentSubscription('scope1')
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      expect(scheduler.removeScope).toHaveBeenCalledWith('scope1')
      expect(scheduler.addScope.mock.calls).toEqual([['root'], ['scope1'], ['scope1']])
    })
  })

  describe('events', () => {
    test('passes root and shared document events to every listener', async () => {
      const rootEvent = createEvent('e1')
      const sharedEvent = createEvent('e2')
      const { subscriber, emit } = setup({ root: [rootEvent], scope1: [sharedEvent] })
      const listeners = [jest.fn(async (_event: DriveEvent) => {}), jest.fn(async (_event: DriveEvent) => {})]
      await subscriber.initialize('root', listeners)
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      await emit('root')
      await emit('scope1')

      for (const listener of listeners) {
        expect(listener.mock.calls).toEqual([[rootEvent], [sharedEvent]])
      }
    })

    test('continues from the last processed event and skips it if the SDK returns it again', async () => {
      const { subscriber, emit, drive, eventsByScope } = setup({ root: [createEvent('e1')] })
      const listener = jest.fn(async (_event: DriveEvent) => {})
      await subscriber.initialize('root', [listener])
      await emit('root')

      eventsByScope.root = [createEvent('e1'), createEvent('e2')]
      await emit('root')

      expect(drive.iterateEvents).toHaveBeenLastCalledWith('root', 'e1', expect.any(AbortSignal))
      expect(listener.mock.calls.map(([event]) => event.eventId)).toEqual(['e1', 'e2'])
    })

    test('ignores and traces events from a scope it is not subscribed to', async () => {
      const { subscriber, emit, traceErrorSDK } = setup({ unknown: [createEvent('e1')] })
      const listener = jest.fn(async (_event: DriveEvent) => {})
      await subscriber.initialize('root', [listener])

      await emit('unknown')

      expect(listener).not.toHaveBeenCalled()
      expect(traceErrorSDK).toHaveBeenCalledWith(
        new Error('Recieved event from scope we are not subscribed to'),
        'EventsSubscription',
      )
    })

    test('ignores events after reset', async () => {
      const { subscriber, emit } = setup({ root: [createEvent('e1')] })
      const listener = jest.fn(async (_event: DriveEvent) => {})
      await subscriber.initialize('root', [listener])

      subscriber.reset()
      await emit('root')

      expect(listener).not.toHaveBeenCalled()
    })

    test('traces failed listeners except ValidationError, and still calls the other listeners', async () => {
      const { subscriber, emit, traceErrorSDK, ValidationError } = setup({ root: [createEvent('e1')] })
      const error = new Error('Listener failed')
      const listener = jest.fn(async (_event: DriveEvent) => {})
      await subscriber.initialize('root', [
        jest.fn(async () => {
          throw error
        }),
        jest.fn(async () => {
          throw new ValidationError('No access')
        }),
        listener,
      ])

      await emit('root')

      expect(listener).toHaveBeenCalledTimes(1)
      expect(traceErrorSDK).toHaveBeenCalledTimes(1)
      expect(traceErrorSDK).toHaveBeenCalledWith(error, 'EventsSubscription')
    })

    test('unsubscribes from a shared document when it is deleted', async () => {
      const deleted = createEvent('e1', 'node_deleted')
      const { subscriber, emit, scheduler } = setup({ scope1: [deleted] })
      const listener = jest.fn(async (_event: DriveEvent) => {})
      await subscriber.initialize('root', [listener])
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      await emit('scope1')

      expect(listener).toHaveBeenCalledWith(deleted)
      expect(scheduler.removeScope).toHaveBeenCalledWith('scope1')
    })

    test('stays subscribed to the root scope when a node in it is deleted', async () => {
      const { subscriber, emit, scheduler } = setup({ root: [createEvent('e1', 'node_deleted')] })
      await subscriber.initialize('root', [])

      await emit('root')

      expect(scheduler.removeScope).not.toHaveBeenCalled()
    })

    test('removes a shared document and unsubscribes without tracing when its scope fails with ValidationError', async () => {
      const { subscriber, emit, scheduler, traceErrorSDK, ValidationError, eventsByScope } = setup()
      eventsByScope.scope1 = new ValidationError('No access')
      const handleRemoveDocument = jest.fn()
      await subscriber.initialize('root', [], handleRemoveDocument)
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      await emit('scope1')

      expect(handleRemoveDocument).toHaveBeenCalledWith('node1')
      expect(scheduler.removeScope).toHaveBeenCalledWith('scope1')
      expect(traceErrorSDK).not.toHaveBeenCalled()
    })

    test.each([
      ['an unexpected error from a shared document scope', 'scope1', new Error('Network down')],
      ['a ValidationError from the root scope', 'root', 'ValidationError'],
    ] as const)('traces %s and stays subscribed', async (_, eventScope, failure) => {
      const { subscriber, emit, scheduler, traceErrorSDK, ValidationError, eventsByScope } = setup()
      const error = failure === 'ValidationError' ? new ValidationError('No access') : failure
      eventsByScope[eventScope] = error
      const handleRemoveDocument = jest.fn()
      await subscriber.initialize('root', [], handleRemoveDocument)
      subscriber.subscribeToSharedDocument('node1', 'scope1')

      await emit(eventScope)

      expect(traceErrorSDK).toHaveBeenCalledWith(error, 'EventsSubscription')
      expect(handleRemoveDocument).not.toHaveBeenCalled()
      expect(scheduler.removeScope).not.toHaveBeenCalled()
    })
  })
})
