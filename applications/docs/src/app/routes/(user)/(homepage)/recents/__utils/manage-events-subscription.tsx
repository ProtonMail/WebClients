import type { LoggerInterface } from '@proton/utils/logs'
import type { EventSubscription, ProtonDriveClient, DriveListener } from '@protontech/drive-sdk'

export function manageEventsSubscription() {
  let subscription: EventSubscription | undefined

  function dispose() {
    if (subscription) {
      subscription.dispose()
      subscription = undefined
    }
  }

  return function subscribeToEvents(
    drive: ProtonDriveClient,
    treeEventScopeId: string,
    logger: LoggerInterface,
    recentsListener: DriveListener,
    trashedListener: DriveListener,
  ) {
    // In case useEffect calls cleanup (onUnmount) this should prevent multiple subscriptions
    let shouldAbort = false

    drive
      .subscribeToTreeEvents(treeEventScopeId, async (event) => {
        try {
          await recentsListener(event)
          await trashedListener(event)
        } catch (error: any) {
          logger.error('Failed to handle SDK event', error)
        }
      })
      .then((newSubscription) => {
        if (shouldAbort) {
          newSubscription.dispose()
        } else {
          subscription = newSubscription
        }
      })
      .catch((error) => logger.error('Failed to subscribe to SDK events', error))

    return function onUnmount() {
      shouldAbort = true
      dispose()
    }
  }
}
