import type { LoggerInterface } from '@proton/utils/logs'
import type { DriveEvent, ProtonDriveClient } from '@proton/drive'
import type { EventScheduler } from '@protontech/drive-sdk'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'

export type SDKEventListener = (event: DriveEvent) => Promise<void>

export function manageEventsSubscription() {
  let eventScheduler: EventScheduler | undefined
  let subscribedScope: string | undefined
  // key: tree event scope; value: last processed event
  const lastEventPerScope: Record<string, string> = {}

  return function subscribeToEvents(
    drive: ProtonDriveClient,
    subscriptionScope: string,
    logger: LoggerInterface,
    listeners: SDKEventListener[],
  ) {
    let shouldAbort = false

    drive
      .getEventScheduler(async (treeEventScopeId) => {
        if (shouldAbort) {
          // Cleaning up, ignore events
          return
        }

        const lastEventId = lastEventPerScope[treeEventScopeId]
        try {
          for await (const event of drive.iterateEvents(treeEventScopeId, lastEventId)) {
            logger.debug(`[EventsSubscription][scope=${treeEventScopeId}][event=${event.eventId}]`, event)

            // Marks this event as consumed before listeners - in case of failure we can continue
            lastEventPerScope[treeEventScopeId] = event.eventId

            await Promise.all(listeners.map((listener) => listener(event)))
          }
        } catch (error: any) {
          logger.debug('[EventsSubscription] Failed to process SDK event', error)
          traceError(error, {
            tags: {
              initiative: SentryRealtimeInitiatives.SDK_SWITCH,
              feature: 'EventsSubscription',
            },
          })
        }
      })
      .then((scheduler) => {
        if (shouldAbort) {
          // We don't want this subscription actually
          return
        }

        eventScheduler = scheduler
        subscribedScope = subscriptionScope
        // eslint-disable-next-line compat/compat
        scheduler.addScope(subscriptionScope)
      })
      .catch((error) => {
        logger.debug('[EventsSubscription] Failed to get SDK event scheduler')
        traceError(error, {
          tags: {
            initiative: SentryRealtimeInitiatives.SDK_SWITCH,
            feature: 'EventsSubscription',
          },
        })
      })

    // To be used in React's useEffect as clean-up
    return function onUnmount() {
      shouldAbort = true
      if (eventScheduler && subscribedScope) {
        eventScheduler.removeScope(subscribedScope)
        eventScheduler = undefined
        subscribedScope = undefined
      }
    }
  }
}
