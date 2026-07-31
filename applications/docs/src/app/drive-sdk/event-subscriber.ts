import { getDrive } from '@proton/drive'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import type { DriveEvent, EventScheduler, ProtonDriveClient } from '@protontech/drive-sdk'

export type SDKEventListener = (event: DriveEvent) => Promise<void>

/**
 * Registers listeners with Drive SDK to recieve events.
 * Each event belongs to a scope. By default we recieve events for files that user created.
 * Additionaly we listen to events for files shared with the user (listed when you call "initialize").
 * There is only one EventSubscriber instance per app. Each re-initialization requies a reset first.
 */
export class EventSubscriber {
  private drive: ProtonDriveClient
  // Construct one scheduler with one callback to avoid race conditions
  private eventScheduler: EventScheduler | undefined
  private rootScope: string | undefined
  // key: eventScope, value: nodeUid
  private sharedDocumentScopes: Map<string, string>
  // key: tree event scope; value: last processed event
  private lastEventPerScope: Record<string, string | undefined>
  private listeners: SDKEventListener[] | undefined
  private handleRemoveDocument: ((nodeUid: string) => void) | undefined
  private abort: AbortController | undefined
  private canInitialize: boolean

  constructor() {
    this.drive = getDrive()
    this.sharedDocumentScopes = new Map()
    this.lastEventPerScope = {}
    this.canInitialize = true
  }

  async initialize(rootScope: string, listeners: SDKEventListener[], handleRemoveDocument?: (nodeUid: string) => void) {
    if (!this.canInitialize) {
      // We can replace this with call to "reset", but for now let's see when/why it throws
      throw new Error('Already subscribed. Reset the subscription first!')
    }
    this.canInitialize = false // Prevent concurrent calls (since method is async)

    this.rootScope = rootScope
    this.listeners = listeners
    this.handleRemoveDocument = handleRemoveDocument
    // Keep reference in case of fast init->reset->init calls (mid-flight cancellation)
    const abort = new AbortController()
    this.abort = abort

    if (!this.eventScheduler) {
      this.eventScheduler = await this.drive.getEventScheduler(this.handleEvent.bind(this))
    }

    if (abort.signal.aborted) {
      return
    }
    this.eventScheduler.addScope(rootScope)
  }

  reset() {
    try {
      this.abort?.abort()

      if (this.eventScheduler) {
        if (this.rootScope) {
          this.eventScheduler.removeScope(this.rootScope)
        }
        for (const eventScope of this.sharedDocumentScopes.values()) {
          this.eventScheduler.removeScope(eventScope)
        }
      }
    } catch (error) {
      // Cleanup function cannot fail; in rare case that removeScope throws
      EventSubscriber.trace(error)
    }

    this.rootScope = undefined
    this.listeners = undefined
    this.handleRemoveDocument = undefined
    this.sharedDocumentScopes = new Map()
    this.lastEventPerScope = {}
    this.canInitialize = true
  }

  subscribeToSharedDocument(nodeUid: string, eventScope: string) {
    if (this.eventScheduler) {
      if (this.sharedDocumentScopes.has(eventScope)) {
        // Already subscribed
        return
      }

      this.eventScheduler.addScope(eventScope)
      this.sharedDocumentScopes.set(eventScope, nodeUid)
    }
  }

  removeSharedDocumentSubscription(eventScope: string) {
    this.eventScheduler?.removeScope(eventScope)
    this.sharedDocumentScopes.delete(eventScope)
    this.lastEventPerScope[eventScope] = undefined
  }

  private async handleEvent(eventScope: string) {
    const abortSignal = this.abort?.signal // keep reference
    try {
      for await (const event of this.drive.iterateEvents(eventScope, this.lastEventPerScope[eventScope], abortSignal)) {
        if (abortSignal?.aborted) {
          return // We stopped processing events
        }
        if (eventScope !== this.rootScope && !this.sharedDocumentScopes.has(eventScope)) {
          traceError(new Error('Recieved event from scope we are not subscribed to'))
          return
        }
        if (event.eventId === this.lastEventPerScope[eventScope]) {
          continue // Already processed
        }

        // Mark event as consumed before processing - when listener fails we continue
        this.lastEventPerScope[eventScope] = event.eventId

        if (this.listeners) {
          await Promise.all(this.listeners.map((listener) => listener(event)))
        }

        // Shared document deleted
        if (eventScope !== this.rootScope && event.type === 'node_deleted') {
          this.removeSharedDocumentSubscription(eventScope)
        }
      }
    } catch (error) {
      if (eventScope !== this.rootScope && error instanceof Error && error.name === 'ValidationError') {
        // Most probably user lost access to shared document - unsubscribe
        // This should be handled by special event, but SDK does not have it yet
        const nodeUid = this.sharedDocumentScopes.get(eventScope)
        if (this.handleRemoveDocument && nodeUid) {
          this.handleRemoveDocument(nodeUid)
        }
        this.removeSharedDocumentSubscription(eventScope)
        // Not tracing when shared doc error - don't spam Sentry when doc is unshared
        return
      }
      EventSubscriber.trace(error)
    }
  }

  private static trace(error: any) {
    traceError(error, {
      tags: {
        initiative: SentryRealtimeInitiatives.SDK_SWITCH,
        feature: 'EventsSubscription',
      },
    })
  }
}

let subscriber: EventSubscriber
export function getEventSubscriber() {
  if (!subscriber) {
    subscriber = new EventSubscriber()
  }
  return subscriber
}
