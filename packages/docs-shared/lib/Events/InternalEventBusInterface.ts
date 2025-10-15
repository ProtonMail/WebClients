import type { InternalEventType } from './InternalEventType'
import type { InternalEventHandlerInterface } from './InternalEventHandlerInterface'
import type { InternalEventInterface } from './InternalEventInterface'
import type { InternalEventPublishStrategy } from './InternalEventPublishStrategy'

export interface InternalEventBusInterface {
  /**
   * Associate an event handler with a certain event type
   * @param handler event handler instance
   * @param eventType event type to associate with
   */
  addEventHandler(handler: InternalEventHandlerInterface, eventType: InternalEventType): void

  addEventCallback<Data = unknown>(callback: (data: Data) => void | Promise<void>, eventType: string): () => void

  removeEventHandler(handler: InternalEventHandlerInterface, eventType: string): void

  /**
   * Asynchronously publish an event for handling
   * @param event internal event object
   */
  publish<Payload = unknown>(event: InternalEventInterface<Payload>): void
  /**
   * Synchronously publish an event for handling.
   * This will await for all handlers to finish processing the event.
   * @param event internal event object
   * @param strategy strategy with which the handlers will process the event.
   * Either all handlers will start at once or they will do it sequentially.
   */
  publishSync(event: InternalEventInterface, strategy: InternalEventPublishStrategy): Promise<void>

  deinit(): void
}
