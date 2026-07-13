import type { LoggerInterface } from '@proton/utils/logs'
import type { DriveEvent, ProtonDriveClient } from '@proton/drive'

export type SDKEventListener = (event: DriveEvent) => Promise<void>

export function manageEventsSubscription() {
  let subscription: { dispose: () => void } | undefined

  function dispose() {
    if (subscription) {
      subscription.dispose()
      subscription = undefined
    }
  }

  /**
   * @param listeners an array of callbacks that CANNOT throw (no error handling here)
   */
  return function subscribeToEvents(
    drive: ProtonDriveClient,
    treeEventScopeId: string,
    logger: LoggerInterface,
    listeners: SDKEventListener[],
  ) {
    let shouldAbort = false

    drive
      .subscribeToTreeEvents(treeEventScopeId, async (event) => {
        for (const listener of listeners) {
          await listener(event)
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
