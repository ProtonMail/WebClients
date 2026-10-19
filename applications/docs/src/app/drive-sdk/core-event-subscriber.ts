import useEventManager from '@proton/components/hooks/useEventManager'
import { getDrive } from '@proton/drive'
import { traceErrorSDK } from '@proton/docs-core/lib/DriveSDK/traceErrorSDK'
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager'
import type { CoreApiEvent, ProtonDriveClient } from '@protontech/drive-sdk'
import { useEffect } from 'react'
import { useInvitationsSdkEnabled, useLoadRecentsWithSdkEnabled } from '~/utils/flags'

type CoreEventListener = () => void

/**
 * Passes core events to Drive SDK and calls listeners.
 * There is only one CoreEventSubscriber instance per app. Each re-initialization requires a reset first.
 */
class CoreEventSubscriber {
  private drive: ProtonDriveClient
  // Registered by mounted components
  private listeners: Set<CoreEventListener>
  private unsubscribe: (() => void) | undefined

  constructor() {
    this.drive = getDrive()
    this.listeners = new Set()
  }

  initialize(eventManager: EventManager<unknown>) {
    if (this.unsubscribe) {
      throw new Error('Already subscribed. Reset the subscription first!')
    }

    this.unsubscribe = eventManager.subscribe(this.handleEvent.bind(this))
  }

  reset() {
    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  /**
   * @returns function that removes the listener
   */
  addListener(listener: CoreEventListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private async handleEvent(rawEvent: unknown) {
    try {
      const events = await this.drive.experimental.processCoreEvent(rawEvent as CoreApiEvent)
      if (events.some((event) => event.type === 'shared_with_me_updated')) {
        this.listeners.forEach((listener) => listener())
      }
    } catch (error) {
      CoreEventSubscriber.trace(error)
    }
  }

  private static trace(error: any) {
    traceErrorSDK(error, 'CoreEventsSubscription')
  }
}

let subscriber: CoreEventSubscriber
export function getCoreEventSubscriber() {
  if (!subscriber) {
    subscriber = new CoreEventSubscriber()
  }
  return subscriber
}

/**
 * Mount ONCE in the app. Subscribes only when a feature using core events has its SDK flag on.
 */
export function useCoreEventSubscription() {
  const coreEventManager = useEventManager()
  const invitationsSdk = useInvitationsSdkEnabled()
  const recentsSdk = useLoadRecentsWithSdkEnabled()

  useEffect(() => {
    if (!invitationsSdk && !recentsSdk) {
      return
    }

    const coreEventSubscriber = getCoreEventSubscriber()
    coreEventSubscriber.initialize(coreEventManager)
    return () => coreEventSubscriber.reset()
  }, [coreEventManager, invitationsSdk, recentsSdk])
}
